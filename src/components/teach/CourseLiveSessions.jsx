import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchCourseLiveSessions,
  createLiveSession,
  joinLiveSession,
  endLiveSession,
  cancelLiveSession,
} from "../../api/liveSessions.js";
import { getErrorMessage } from "../../api/client.js";

const STATUS_STYLE = {
  SCHEDULED: "bg-surface-sunken text-ink-muted",
  LIVE: "bg-success-subtle text-success",
  ENDED: "bg-surface-sunken text-ink-subtle",
  CANCELLED: "bg-danger-subtle text-danger",
};

function toLocalInputValue(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

/** Instructor-facing live class scheduling for one course. */
export default function CourseLiveSessions({ courseId }) {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const inHour = new Date(Date.now() + 60 * 60 * 1000);
  const [title, setTitle] = useState("");
  const [start, setStart] = useState(toLocalInputValue(inHour));
  const [end, setEnd] = useState(toLocalInputValue(new Date(inHour.getTime() + 60 * 60 * 1000)));

  const load = useCallback(() => {
    setLoading(true);
    fetchCourseLiveSessions(courseId)
      .then(setSessions)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await createLiveSession({
        courseId,
        title: title.trim(),
        scheduledStart: new Date(start).toISOString(),
        scheduledEnd: new Date(end).toISOString(),
      });
      setTitle("");
      setCreating(false);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const join = async (id, sessionTitle) => {
    setError("");
    try {
      const data = await joinLiveSession(id);
      navigate(`/call/${data.session.meeting.roomId}`, {
        state: { jitsiFallbackUrl: data.session.meeting.jitsiFallbackUrl, title: sessionTitle, returnTo: `/teach/${courseId}` },
      });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const endSession = async (id) => {
    try {
      await endLiveSession(id);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const cancel = async (id) => {
    if (!window.confirm("Cancel this live session?")) return;
    try {
      await cancelLiveSession(id);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="rounded-surface border border-line bg-surface p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Live sessions</h2>
        {!creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="rounded-control bg-ink px-3 py-1.5 text-sm font-medium text-white hover:bg-ink"
          >
            Schedule
          </button>
        )}
      </div>

      {error && <div className="mt-3 rounded-control bg-danger-subtle p-2 text-sm text-danger">{error}</div>}

      {creating && (
        <form onSubmit={submit} className="mt-3 space-y-3 rounded-control border border-line p-3">
          <label className="block text-xs font-medium text-ink-muted">
            Title
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded border border-line-strong px-2 py-1.5 text-sm"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-ink-muted">
              Start
              <input
                type="datetime-local"
                required
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="mt-1 w-full rounded border border-line-strong px-2 py-1.5 text-sm"
              />
            </label>
            <label className="block text-xs font-medium text-ink-muted">
              End
              <input
                type="datetime-local"
                required
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="mt-1 w-full rounded border border-line-strong px-2 py-1.5 text-sm"
              />
            </label>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setCreating(false)} className="rounded-control border border-line-strong px-3 py-1.5 text-sm hover:bg-surface-sunken">
              Cancel
            </button>
            <button type="submit" className="rounded-control bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-hover">
              Schedule session
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="mt-4 text-sm text-ink-subtle">Loading…</p>
      ) : sessions.length === 0 ? (
        <p className="mt-4 rounded-control border border-dashed border-line-strong p-6 text-center text-sm text-ink-subtle">
          No live sessions scheduled.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {sessions.map((s) => (
            <li key={s.id} className="flex items-center justify-between rounded-control border border-line p-3">
              <div>
                <p className="text-sm font-medium text-ink">{s.title}</p>
                <p className="text-xs text-ink-subtle">
                  {new Date(s.scheduledStart).toLocaleString()} ·{" "}
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[s.status]}`}>
                    {s.status}
                  </span>
                </p>
              </div>
              {(s.status === "SCHEDULED" || s.status === "LIVE") && (
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => join(s.id, s.title)}
                    className="rounded-control bg-success px-3 py-1 text-xs font-medium text-white hover:bg-success"
                  >
                    {s.status === "LIVE" ? "Rejoin" : "Start"}
                  </button>
                  <button type="button" onClick={() => endSession(s.id)} className="rounded-control border border-line-strong px-3 py-1 text-xs hover:bg-surface-sunken">
                    End
                  </button>
                  <button type="button" onClick={() => cancel(s.id)} className="rounded-control border border-danger-border px-3 py-1 text-xs text-danger hover:bg-danger-subtle">
                    Cancel
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
