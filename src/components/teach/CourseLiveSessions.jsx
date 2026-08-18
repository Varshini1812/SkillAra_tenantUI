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
  SCHEDULED: "bg-slate-100 text-slate-600",
  LIVE: "bg-emerald-100 text-emerald-700",
  ENDED: "bg-slate-100 text-slate-500",
  CANCELLED: "bg-rose-100 text-rose-700",
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
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Live sessions</h2>
        {!creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-900"
          >
            Schedule
          </button>
        )}
      </div>

      {error && <div className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-600">{error}</div>}

      {creating && (
        <form onSubmit={submit} className="mt-3 space-y-3 rounded-lg border border-slate-100 p-3">
          <label className="block text-xs font-medium text-slate-600">
            Title
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-slate-600">
              Start
              <input
                type="datetime-local"
                required
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="block text-xs font-medium text-slate-600">
              End
              <input
                type="datetime-local"
                required
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setCreating(false)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">
              Schedule session
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="mt-4 text-sm text-slate-400">Loading…</p>
      ) : sessions.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
          No live sessions scheduled.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {sessions.map((s) => (
            <li key={s.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
              <div>
                <p className="text-sm font-medium text-slate-800">{s.title}</p>
                <p className="text-xs text-slate-400">
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
                    className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                  >
                    {s.status === "LIVE" ? "Rejoin" : "Start"}
                  </button>
                  <button type="button" onClick={() => endSession(s.id)} className="rounded-lg border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50">
                    End
                  </button>
                  <button type="button" onClick={() => cancel(s.id)} className="rounded-lg border border-rose-200 px-3 py-1 text-xs text-rose-600 hover:bg-rose-50">
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
