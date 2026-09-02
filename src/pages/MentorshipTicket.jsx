import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  fetchTicket,
  closeTicket,
  reopenTicket,
  assignTicket,
  fetchTicketSessions,
  createTicketSession,
} from "../api/mentorshipTickets.js";
import { fetchMentors } from "../api/mentorship.js";
import { getErrorMessage } from "../api/client.js";
import { usePermissions } from "../hooks/usePermissions.js";
import { useTicketChat } from "../hooks/useTicketChat.js";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import Icon from "../admin/components/ui/Icon.jsx";

const STATUS_STYLE = {
  OPEN: "bg-surface-sunken text-ink-muted",
  ASSIGNED: "bg-brand-muted text-brand-hover",
  CLOSED: "bg-success-subtle text-success",
};

function fmt(iso) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toLocalInputValue(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function ChatThread({ ticketId, closed }) {
  const { messages, status, error, sendMessage } = useTicketChat(ticketId);
  const { user } = usePermissions();
  const [draft, setDraft] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const submit = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    sendMessage(draft);
    setDraft("");
  };

  return (
    <div className="flex flex-col rounded-surface border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line p-4">
        <h2 className="font-semibold">Chat</h2>
        <span className="text-xs text-ink-subtle">
          {status === "connected" ? "Live" : status === "failed" ? "Offline" : "Connecting…"}
        </span>
      </div>

      {error && <div className="m-3 rounded-control bg-danger-subtle p-2 text-sm text-danger">{error}</div>}

      <div className="max-h-[28rem] min-h-[10rem] space-y-2 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-ink-subtle">No messages yet — say hello.</p>
        ) : (
          messages.map((m) => {
            const mine = String(m.senderId?._id || m.senderId) === String(user?.id);
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-surface px-3 py-2 text-sm ${
                    mine ? "bg-brand text-white" : "bg-surface-sunken text-ink"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.body}</p>
                  <p className={`mt-1 text-[10px] ${mine ? "text-brand-muted" : "text-ink-subtle"}`}>{fmt(m.created_on)}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {closed ? (
        <p className="border-t border-line p-4 text-sm text-ink-subtle">This ticket is closed — chat is read-only.</p>
      ) : (
        <form onSubmit={submit} className="flex gap-2 border-t border-line p-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a message…"
            className="flex-1 rounded-control border border-line-strong px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-control bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover">
            Send
          </button>
        </form>
      )}
    </div>
  );
}

function ScheduleSessionForm({ ticketId, subject, onScheduled }) {
  const inHour = new Date(Date.now() + 60 * 60 * 1000);
  const inHourHalf = new Date(Date.now() + 90 * 60 * 1000);
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState(toLocalInputValue(inHour));
  const [endTime, setEndTime] = useState(toLocalInputValue(inHourHalf));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await createTicketSession(ticketId, {
        title: title.trim() || subject,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
      });
      setTitle("");
      onScheduled();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2 border-t border-line p-4">
      {error && <div className="rounded-control bg-danger-subtle p-2 text-sm text-danger">{error}</div>}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={subject}
        className="w-full rounded border border-line-strong px-2 py-1.5 text-sm"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="datetime-local"
          required
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="w-full rounded border border-line-strong px-2 py-1.5 text-sm"
        />
        <input
          type="datetime-local"
          required
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="w-full rounded border border-line-strong px-2 py-1.5 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="rounded-control bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-hover disabled:opacity-50"
      >
        {saving ? "Scheduling…" : "Schedule session"}
      </button>
    </form>
  );
}

function SessionsPanel({ ticketId, subject, canSchedule }) {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    fetchTicketSessions(ticketId)
      .then(setSessions)
      .finally(() => setLoading(false));
  }, [ticketId]);

  useEffect(() => {
    load();
  }, [load]);

  const join = (slot) => {
    navigate(`/call/${slot.meeting.roomId}`, {
      state: { jitsiFallbackUrl: slot.meeting.jitsiFallbackUrl, title: slot.title, returnTo: `/mentorship/${ticketId}` },
    });
  };

  return (
    <div className="rounded-surface border border-line bg-surface">
      <h2 className="p-4 pb-0 font-semibold">Sessions</h2>
      <div className="p-4">
        {loading ? (
          <p className="text-sm text-ink-subtle">Loading…</p>
        ) : sessions.length === 0 ? (
          <p className="rounded-control border border-dashed border-line-strong p-4 text-center text-sm text-ink-subtle">
            No sessions scheduled yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {sessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-control border border-line p-3 text-sm">
                <div>
                  <p className="font-medium text-ink">{s.title}</p>
                  <p className="text-xs text-ink-subtle">{fmt(s.startTime)}</p>
                </div>
                {s.status === "BOOKED" && s.meeting?.roomId && (
                  <button
                    type="button"
                    onClick={() => join(s)}
                    className="rounded-control bg-success px-3 py-1 text-xs font-medium text-white hover:bg-success"
                  >
                    Join call
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      {canSchedule && <ScheduleSessionForm ticketId={ticketId} subject={subject} onScheduled={load} />}
    </div>
  );
}

function MentorshipTicketContent() {
  const { id } = useParams();
  const { user, isStaff } = usePermissions();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [mentors, setMentors] = useState([]);
  const [reassignTo, setReassignTo] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetchTicket(id)
      .then((data) => setTicket(data.ticket))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (isStaff) fetchMentors().then(setMentors).catch(() => {});
  }, [isStaff]);

  if (loading) return <p className="text-sm text-ink-subtle">Loading…</p>;
  if (!ticket) return <p className="text-sm text-danger">{error || "Ticket not found"}</p>;

  const isAssignedMentor = ticket.mentorId && String(ticket.mentorId._id || ticket.mentorId) === String(user?.id);
  const isMyTicket = String(ticket.studentId._id || ticket.studentId) === String(user?.id);
  const isLearnerView = isMyTicket && !isAssignedMentor;

  const handleClose = async () => {
    const closeNote = window.prompt("Closing note (optional)?") || "";
    setError("");
    try {
      const updated = await closeTicket(id, closeNote);
      setTicket(updated.ticket);
      setNotice("Ticket closed.");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleReopen = async () => {
    setError("");
    try {
      const updated = await reopenTicket(id);
      setTicket(updated.ticket);
      setNotice("Ticket reopened.");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleReassign = async (e) => {
    e.preventDefault();
    if (!reassignTo) return;
    setError("");
    try {
      const updated = await assignTicket(id, reassignTo);
      setTicket(updated.ticket);
      setNotice("Ticket reassigned.");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <Link to="/mentorship" className="text-sm text-ink-subtle hover:text-brand"><Icon name="arrowLeft" size={15} /> Back to Mentorship
      </Link>

      {error && <div className="rounded-control bg-danger-subtle p-3 text-sm text-danger">{error}</div>}
      {notice && <div className="rounded-control bg-success-subtle p-3 text-sm text-success">{notice}</div>}

      <div className="rounded-surface border border-line bg-surface p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-ink">{ticket.subject}</h1>
            {ticket.description && <p className="mt-2 whitespace-pre-wrap text-sm text-ink-muted">{ticket.description}</p>}
            <p className="mt-3 text-xs text-ink-subtle">
              Student: {ticket.studentId.name || ticket.studentId.email}
              {ticket.mentorId && ` · Mentor: ${ticket.mentorId.name || ticket.mentorId.email}`}
            </p>
            {ticket.topicTags?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {ticket.topicTags.map((tag) => (
                  <span key={tag} className="rounded bg-brand-subtle px-1.5 py-0.5 text-[10px] text-brand-hover">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {ticket.status === "CLOSED" && ticket.closeNote && (
              <p className="mt-3 rounded-control bg-surface-sunken p-2 text-xs text-ink-subtle">Closing note: {ticket.closeNote}</p>
            )}
          </div>
          <span className={`shrink-0 rounded px-2 py-1 text-xs font-semibold ${STATUS_STYLE[ticket.status]}`}>{ticket.status}</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(isAssignedMentor || isStaff) && ticket.status !== "CLOSED" && (
            <button type="button" onClick={handleClose} className="rounded-control border border-line-strong px-3 py-1.5 text-xs hover:bg-surface-sunken">
              Close ticket
            </button>
          )}
          {(isAssignedMentor || isStaff) && ticket.status === "CLOSED" && (
            <button type="button" onClick={handleReopen} className="rounded-control border border-line-strong px-3 py-1.5 text-xs hover:bg-surface-sunken">
              Reopen ticket
            </button>
          )}
        </div>

        {isStaff && ticket.status !== "CLOSED" && (
          <form onSubmit={handleReassign} className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
            <label className="text-xs font-medium text-ink-muted">Reassign to</label>
            <select value={reassignTo} onChange={(e) => setReassignTo(e.target.value)} className="rounded border border-line-strong px-2 py-1 text-xs">
              <option value="">Select a mentor…</option>
              {mentors.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.user?.name || m.user?.email}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded-control bg-brand px-3 py-1 text-xs font-medium text-white hover:bg-brand-hover">
              Assign
            </button>
          </form>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <ChatThread ticketId={id} closed={ticket.status === "CLOSED"} />
        <SessionsPanel
          ticketId={id}
          subject={ticket.subject}
          canSchedule={isAssignedMentor && ticket.status === "ASSIGNED"}
        />
      </div>

      {isLearnerView && ticket.status === "OPEN" && (
        <p className="text-sm text-ink-subtle">Waiting for a mentor to pick this up — you'll be able to chat here once claimed.</p>
      )}
    </div>
  );
}

export default function MentorshipTicket() {
  return (
    <ProtectedRoute>
      <MentorshipTicketContent />
    </ProtectedRoute>
  );
}
