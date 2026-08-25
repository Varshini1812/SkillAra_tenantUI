import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { getAccessToken } from "../lib/accessTokenMemory.js";
import { fetchTicketMessages } from "../api/mentorshipTickets.js";

/**
 * Real-time chat for a single mentorship ticket, over the server's mentorship-chat
 * Socket.io namespace (services/mentorshipChatSocket.js on the backend) — separate
 * socket from the WebRTC call one used by useWebRTCCall.js. Loads history via REST on
 * mount, then appends messages pushed live over the socket (including the REST-fallback
 * ones the server rebroadcasts).
 *
 * @param {string} ticketId
 */
export function useTicketChat(ticketId) {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("connecting");
  const [error, setError] = useState("");
  const socketRef = useRef(null);

  useEffect(() => {
    if (!ticketId) return undefined;
    let cancelled = false;

    fetchTicketMessages(ticketId)
      .then((history) => {
        if (!cancelled) setMessages(history);
      })
      .catch(() => {});

    const socket = io(window.location.origin, {
      path: "/socket.io/mentorship-chat",
      auth: { token: getAccessToken() },
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-ticket", { ticketId }, (ack) => {
        if (cancelled) return;
        if (!ack?.ok) {
          setError(ack?.error === "FORBIDDEN" ? "You can't access this ticket's chat." : "Could not join the chat.");
          setStatus("failed");
          return;
        }
        setStatus("connected");
      });
    });

    socket.on("connect_error", () => {
      if (!cancelled) {
        setError("Could not reach the chat server.");
        setStatus("failed");
      }
    });

    socket.on("new-message", (message) => {
      if (cancelled) return;
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    });

    return () => {
      cancelled = true;
      socket.emit("leave-ticket");
      socket.disconnect();
    };
  }, [ticketId]);

  const sendMessage = useCallback(
    (body) => {
      const trimmed = body.trim();
      if (!trimmed || !socketRef.current) return;
      socketRef.current.emit("send-message", { ticketId, body: trimmed });
    },
    [ticketId]
  );

  return { messages, status, error, sendMessage };
}
