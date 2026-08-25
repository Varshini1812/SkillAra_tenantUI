import { useEffect, useRef, useState } from "react";
import { useWebRTCCall } from "../hooks/useWebRTCCall.js";

const PRESENCE_TOAST_MS = 4000;

function PresenceToasts({ events }) {
  const [visible, setVisible] = useState([]);
  const seenRef = useRef(new Set());

  useEffect(() => {
    const fresh = events.filter((e) => !seenRef.current.has(e.id));
    if (fresh.length === 0) return;
    fresh.forEach((e) => seenRef.current.add(e.id));
    setVisible((prev) => [...prev, ...fresh]);
    fresh.forEach((e) => {
      setTimeout(() => {
        setVisible((prev) => prev.filter((v) => v.id !== e.id));
      }, PRESENCE_TOAST_MS);
    });
  }, [events]);

  if (visible.length === 0) return null;

  return (
    <div className="pointer-events-none absolute left-1/2 top-3 z-10 flex -translate-x-1/2 flex-col items-center gap-1.5">
      {visible.map((e) => (
        <div
          key={e.id}
          className={`rounded-full px-3 py-1 text-xs font-medium shadow-sm ${
            e.type === "joined" ? "bg-emerald-600 text-white" : "bg-slate-800 text-white"
          }`}
        >
          {e.type === "joined" ? "Participant joined the call" : "Participant left the call"}
        </div>
      ))}
    </div>
  );
}

function Icon({ name, className = "h-5 w-5" }) {
  const common = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, className };
  const cap = { strokeLinecap: "round", strokeLinejoin: "round" };

  switch (name) {
    case "mic":
      return (
        <svg {...common}>
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" {...cap} />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" {...cap} />
          <path d="M12 19v4M8 23h8" {...cap} />
        </svg>
      );
    case "mic-off":
      return (
        <svg {...common}>
          <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" {...cap} />
          <path d="M17 16.95A7 7 0 0 1 5 12v-2M19 10v2c0 .43-.04.85-.11 1.25" {...cap} />
          <path d="M12 19v4M8 23h8" {...cap} />
          <path d="M1 1l22 22" {...cap} />
        </svg>
      );
    case "video":
      return (
        <svg {...common}>
          <path d="M23 7l-7 5 7 5V7z" {...cap} />
          <rect x="1" y="5" width="15" height="14" rx="2" {...cap} />
        </svg>
      );
    case "video-off":
      return (
        <svg {...common}>
          <path d="M16 16v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2" {...cap} />
          <path d="M9.34 5H14a2 2 0 0 1 2 2v6.34" {...cap} />
          <path d="M23 7l-7 5v-.34" {...cap} />
          <path d="M1 1l22 22" {...cap} />
        </svg>
      );
    case "chat":
      return (
        <svg {...common}>
          <path
            d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
            {...cap}
          />
        </svg>
      );
    case "hangup":
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <path d="M12 9c-2.5 0-4.9.5-7 1.4a1.5 1.5 0 0 0-.9 1.6l.4 2.5a1.5 1.5 0 0 0 1.3 1.2l2.3.3a1.5 1.5 0 0 0 1.4-.7l.6-1a8.9 8.9 0 0 1 3.8 0l.6 1a1.5 1.5 0 0 0 1.4.7l2.3-.3a1.5 1.5 0 0 0 1.3-1.2l.4-2.5a1.5 1.5 0 0 0-.9-1.6A17.9 17.9 0 0 0 12 9z" />
        </svg>
      );
    case "send":
      return (
        <svg {...common}>
          <path d="M22 2 11 13" {...cap} />
          <path d="M22 2 15 22l-4-9-9-4 20-7z" {...cap} />
        </svg>
      );
    default:
      return null;
  }
}

function VideoTile({ stream, muted, label }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream || null;
  }, [stream]);

  return (
    <div className="relative aspect-video overflow-hidden rounded-lg bg-slate-900">
      <video ref={ref} autoPlay playsInline muted={muted} className="h-full w-full object-cover" />
      <span className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-0.5 text-xs text-white">
        {label}
      </span>
    </div>
  );
}

function IconButton({ variant = "neutral", onClick, label, icon }) {
  const styles = {
    neutral: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    off: "bg-rose-100 text-rose-700 hover:bg-rose-200",
    selected: "bg-indigo-600 text-white hover:bg-indigo-700",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
  };
  const style = styles[variant];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-11 w-11 items-center justify-center rounded-full transition ${style}`}
    >
      <Icon name={icon} />
    </button>
  );
}

function ChatPanel({ messages, onSend, onClose }) {
  const [text, setText] = useState("");
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text);
    setText("");
  };

  return (
    <div className="flex w-full shrink-0 flex-col border-l border-slate-100 sm:w-72">
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
        <span className="text-sm font-semibold text-slate-700">Chat</span>
        <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100" aria-label="Close chat">
          ✕
        </button>
      </div>
      <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto px-3 py-2">
        {messages.length === 0 && <p className="text-xs text-slate-400">No messages yet.</p>}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.self ? "justify-end" : "justify-start"}`}>
            <span
              className={`max-w-[85%] rounded-lg px-2.5 py-1.5 text-sm ${
                m.self ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {m.text}
            </span>
          </div>
        ))}
      </div>
      <form onSubmit={submit} className="flex items-center gap-2 border-t border-slate-100 p-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message…"
          maxLength={2000}
          className="flex-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          aria-label="Send"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40"
        >
          <Icon name="send" className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

/**
 * Self-hosted WebRTC call — no third-party video API key. Falls back to an embedded
 * public meet.jit.si room only if a direct peer connection can't be established even
 * with the TURN relay (e.g. both sides on symmetric NATs that TURN itself can't bridge).
 */
export default function VideoCall({ roomId, jitsiFallbackUrl, title, onLeave }) {
  const {
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
    presenceEvents,
  } = useWebRTCCall(roomId);
  const [useFallback, setUseFallback] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!chatOpen && messages.length > 0 && !messages[messages.length - 1].self) {
      setUnread((n) => n + 1);
    }
  }, [messages, chatOpen]);

  const openChat = () => {
    setChatOpen(true);
    setUnread(0);
  };

  const fallbackUrl = jitsiFallbackUrl || `https://meet.jit.si/SkillAra-${roomId}`;
  const remoteEntries = Object.entries(remoteStreams);

  if (useFallback || status === "failed") {
    return (
      <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <h3 className="font-semibold text-slate-900">{title || "Session"}</h3>
            {status === "failed" && !useFallback && (
              <p className="text-xs text-amber-600">
                Direct connection didn't go through — switched to the backup room.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onLeave}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Leave
          </button>
        </div>
        <iframe
          title="Video call (fallback)"
          src={fallbackUrl}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="h-full min-h-[420px] w-full flex-1 border-0"
        />
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
      <PresenceToasts events={presenceEvents} />
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <h3 className="font-semibold text-slate-900">{title || "Session"}</h3>
          <p className="text-xs text-slate-400">
            {status === "connecting" ? "Connecting…" : `${remoteEntries.length + 1} in the call`}
          </p>
        </div>
      </div>

      {error && <div className="mx-4 mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-600">{error}</div>}

      <div className="flex min-h-0 flex-1">
        <div className="grid flex-1 auto-rows-min grid-cols-1 gap-3 overflow-y-auto p-4 sm:grid-cols-2">
          <VideoTile stream={localStream} muted label="You" />
          {remoteEntries.map(([peerId, stream]) => (
            <VideoTile key={peerId} stream={stream} label="Participant" />
          ))}
          {remoteEntries.length === 0 && status === "connecting" && (
            <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-400">
              Waiting for the other participant to join…
            </div>
          )}
        </div>

        {chatOpen && (
          <ChatPanel messages={messages} onSend={sendChatMessage} onClose={() => setChatOpen(false)} />
        )}
      </div>

      <div className="flex items-center justify-center gap-3 border-t border-slate-100 px-4 py-3">
        <IconButton
          variant={micOn ? "neutral" : "off"}
          onClick={toggleMic}
          label={micOn ? "Mute" : "Unmute"}
          icon={micOn ? "mic" : "mic-off"}
        />
        <IconButton
          variant={camOn ? "neutral" : "off"}
          onClick={toggleCam}
          label={camOn ? "Stop video" : "Start video"}
          icon={camOn ? "video" : "video-off"}
        />
        <div className="relative">
          <IconButton
            variant={chatOpen ? "selected" : "neutral"}
            onClick={() => (chatOpen ? setChatOpen(false) : openChat())}
            label="Chat"
            icon="chat"
          />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-semibold text-white">
              {unread}
            </span>
          )}
        </div>
        <IconButton variant="danger" onClick={onLeave} label="Leave call" icon="hangup" />
        <button
          type="button"
          onClick={() => setUseFallback(true)}
          className="ml-2 text-xs text-slate-400 underline hover:text-slate-600"
        >
          Trouble connecting? Use backup room
        </button>
      </div>
    </div>
  );
}
