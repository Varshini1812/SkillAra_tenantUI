import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { getAccessToken } from "../lib/accessTokenMemory.js";

// STUN first (no key, just NAT discovery). The TURN entries are Open Relay Project's
// free public relay — no signup, no key — used only when a direct STUN route can't be
// found (symmetric NAT, restrictive corporate firewall). Media/signal content never
// touches Anthropic or any of our own servers here; TURN just relays encrypted packets
// between the two peers when a direct path isn't possible.
const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
  {
    urls: "turn:openrelay.metered.ca:443?transport=tcp",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

// TURN allocation takes longer than a plain STUN handshake, so this is generous —
// only counts as "failed" (and offers the Jitsi fallback) once even a relayed route
// hasn't produced a remote track by this point.
const CONNECT_TIMEOUT_MS = 20000;

/**
 * Own WebRTC signaling over the server's Socket.io endpoint. No third-party video
 * API involved — media flows directly between browsers (or via the TURN relay above)
 * once negotiated here. Also carries in-call text chat over the same socket.
 *
 * @param {string} roomId
 * @returns call state + controls; `status` is "connecting" | "connected" | "failed" | "ended".
 */
export function useWebRTCCall(roomId) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [status, setStatus] = useState("connecting");
  const [error, setError] = useState("");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [messages, setMessages] = useState([]);

  const socketRef = useRef(null);
  const peersRef = useRef({});
  const localStreamRef = useRef(null);
  const timeoutRef = useRef(null);
  const mountedRef = useRef(true);

  const cleanupPeer = useCallback((peerId) => {
    peersRef.current[peerId]?.close();
    delete peersRef.current[peerId];
    setRemoteStreams((prev) => {
      if (!(peerId in prev)) return prev;
      const next = { ...prev };
      delete next[peerId];
      return next;
    });
  }, []);

  const send = useCallback((to, data) => {
    socketRef.current?.emit("signal", { roomId, to, data });
  }, [roomId]);

  const getOrCreatePeer = useCallback(
    (peerId, initiator) => {
      if (peersRef.current[peerId]) return peersRef.current[peerId];

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pc._restarted = false;
      peersRef.current[peerId] = pc;

      localStreamRef.current?.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });

      pc.ontrack = (event) => {
        if (!mountedRef.current) return;
        setRemoteStreams((prev) => ({ ...prev, [peerId]: event.streams[0] }));
        setStatus("connected");
        clearTimeout(timeoutRef.current);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) send(peerId, { type: "ice-candidate", candidate: event.candidate });
      };

      // "disconnected" is often transient (a brief network blip) and self-recovers to
      // "connected" without help — only act once the browser gives up and calls it
      // "failed". Even then, try one ICE restart before tearing the connection down;
      // that alone recovers a lot of cases that used to fall back to Jitsi immediately.
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed") {
          if (!pc._restarted) {
            pc._restarted = true;
            try {
              pc.restartIce();
            } catch {
              cleanupPeer(peerId);
            }
          } else {
            cleanupPeer(peerId);
          }
        } else if (pc.connectionState === "closed") {
          cleanupPeer(peerId);
        }
      };

      if (initiator) {
        pc.onnegotiationneeded = async () => {
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            send(peerId, { type: "offer", sdp: pc.localDescription });
          } catch (err) {
            setError(err.message);
          }
        };
      }

      return pc;
    },
    [send, cleanupPeer]
  );

  // Deterministic tie-break so exactly one side of every pair sends the offer,
  // regardless of which of the two joined the room first.
  const connectToPeer = useCallback(
    (peerId) => {
      const initiator = String(socketRef.current?.id) < String(peerId);
      getOrCreatePeer(peerId, initiator);
    },
    [getOrCreatePeer]
  );

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);
      } catch {
        if (!cancelled) setError("Camera/microphone access is required to join this call.");
        return;
      }

      const socket = io(window.location.origin, {
        path: "/socket.io/webrtc",
        auth: { token: getAccessToken() },
        transports: ["websocket", "polling"],
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        socket.emit("join-room", { roomId }, (ack) => {
          if (cancelled) return;
          if (!ack?.ok) {
            setError(
              ack?.error === "FORBIDDEN"
                ? "You're not authorized to join this session."
                : "Could not join the call room."
            );
            setStatus("failed");
            return;
          }
          (ack.peers || []).forEach(connectToPeer);
        });
      });

      socket.on("connect_error", () => {
        if (!cancelled) {
          setError("Could not reach the signaling server.");
          setStatus("failed");
        }
      });

      socket.on("peer-joined", ({ peerId }) => connectToPeer(peerId));

      socket.on("signal", async ({ from, data }) => {
        try {
          if (data.type === "offer") {
            const pc = getOrCreatePeer(from, false);
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            send(from, { type: "answer", sdp: pc.localDescription });
          } else if (data.type === "answer") {
            const pc = peersRef.current[from];
            if (pc) await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          } else if (data.type === "ice-candidate") {
            const pc = peersRef.current[from];
            if (pc) await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          }
        } catch (err) {
          setError(err.message);
        }
      });

      socket.on("peer-left", ({ peerId }) => cleanupPeer(peerId));

      socket.on("chat-message", ({ from, text, at }) => {
        if (!mountedRef.current) return;
        setMessages((prev) => [...prev, { id: `${from}-${at}`, text, at, self: false }]);
      });

      timeoutRef.current = setTimeout(() => {
        if (!cancelled && mountedRef.current) {
          setStatus((prev) => (prev === "connected" ? prev : "failed"));
        }
      }, CONNECT_TIMEOUT_MS);
    }

    start();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      clearTimeout(timeoutRef.current);
      Object.keys(peersRef.current).forEach(cleanupPeer);
      socketRef.current?.emit("leave-room");
      socketRef.current?.disconnect();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const toggleMic = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  }, []);

  const toggleCam = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCamOn(track.enabled);
  }, []);

  const sendChatMessage = useCallback(
    (text) => {
      const trimmed = text.trim();
      if (!trimmed || !socketRef.current) return;
      const at = Date.now();
      socketRef.current.emit("chat-message", { roomId, text: trimmed });
      setMessages((prev) => [...prev, { id: `me-${at}`, text: trimmed, at, self: true }]);
    },
    [roomId]
  );

  return {
    localStream,
    remoteStreams,
    status,
    error,
    micOn,
    camOn,
    toggleMic,
    toggleCam,
    messages,
    sendChatMessage,
  };
}
