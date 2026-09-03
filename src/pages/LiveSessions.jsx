import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchAllLiveSessions,
  createLiveSession,
  joinLiveSession,
  endLiveSession,
  cancelLiveSession,
} from "../api/liveSessions.js";
import { fetchCourses } from "../api/courses.js";
import { getErrorMessage } from "../api/client.js";
import { usePermissions } from "../hooks/usePermissions.js";
import { useAuth } from "../context/AuthContext.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import LockedFeature from "../components/common/LockedFeature.jsx";

const STATUS_STYLE = {
  SCHEDULED: "bg-surface-sunken text-ink-muted",
  LIVE: "bg-success-subtle text-success",
  ENDED: "bg-surface-sunken text-ink-subtle",
  CANCELLED: "bg-danger-subtle text-danger",
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

function NewSessionForm({ courses, onCreated }) {
  const inHour = new Date(Date.now() + 60 * 60 * 1000);
  const [courseId, setCourseId] = useState(courses[0]?.id || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [start, setStart] = useState(toLocalInputValue(inHour));
  const [end, setEnd] = useState(toLocalInputValue(new Date(inHour.getTime() + 60 * 60 * 1000)));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!courseId) {
      setError("Choose a course first.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createLiveSession({
        courseId,
        title: title.trim(),
        description: description.trim(),
        scheduledStart: new Date(start).toISOString(),
        scheduledEnd: new Date(end).toISOString(),
      });
      setTitle("");
      setDescription("");
      onCreated();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (courses.length === 0) {
    return (
      <div className="rounded-surface border border-line bg-surface p-4 text-sm text-ink-subtle">
        You don't have any courses to schedule a live session for yet.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-surface border border-line bg-surface p-4">
      {error && <div className="rounded-control bg-danger-subtle p-2 text-sm text-danger">{error}</div>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-xs font-medium text-ink-muted">
          Course
          <select
            required
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="mt-1 w-full rounded border border-line-strong px-2 py-1.5 text-sm"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-ink-muted">
          Title
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Week 3 live walkthrough"
            className="mt-1 w-full rounded border border-line-strong px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block text-xs font-medium text-ink-muted sm:col-span-2">
          Description <span className="font-normal text-ink-subtle">(optional)</span>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded border border-line-strong px-2 py-1.5 text-sm"
          />
        </label>
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
      <button
        type="submit"
        disabled={saving}
        className="rounded-control bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50"
      >
        {saving ? "Scheduling…" : "Schedule session"}
      </button>
    </form>
  );
}

function LiveSessionsContent() {
  const { user, can } = usePermissions();
  const canAuthor = can("courses", "create");
  const isMentor = can("mentorship", "claim") && !canAuthor;
  const canHost = can("live-sessions", "create") || canAuthor || isMentor;
  const navigate = useNavigate();

  const [tab, setTab] = useState("upcoming");
  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const { tenantInfo } = useAuth();

  const load = useCallback(() => {
    setLoading(true);
    fetchAllLiveSessions()
      .then(setSessions)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (canHost) {
      fetchCourses({ mine: true }).then((r) => setCourses(r.items)).catch(() => {});
    }
  }, [canHost]);

  const join = async (session) => {
    setError("");
    try {
      const data = await joinLiveSession(session.id);
      navigate(`/call/${data.session.meeting.roomId}`, {
        state: {
          jitsiFallbackUrl: data.session.meeting.jitsiFallbackUrl,
          title: session.title,
          returnTo: "/live-sessions",
        },
      });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const withNotice = async (fn, message) => {
    setError("");
    setNotice("");
    try {
      await fn();
      setNotice(message);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const endSession = (id) => withNotice(() => endLiveSession(id), "Session ended.");
  const cancelSession = (id) => {
    if (!window.confirm("Cancel this live session?")) return;
    withNotice(() => cancelLiveSession(id), "Session cancelled.");
  };

  const upcoming = sessions.filter((s) => s.status === "SCHEDULED" || s.status === "LIVE");
  const past = sessions.filter((s) => s.status === "ENDED" || s.status === "CANCELLED");

  if (tenantInfo?.planFeatures && tenantInfo.planFeatures.liveClassesEnabled === false) {
    return (
      <LockedFeature 
        title="Live Sessions" 
        description="Host interactive virtual classrooms directly in SkillAra. Schedule events and manage attendance all in one place." 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Live Sessions</h1>
        <p className="mt-1 text-sm text-ink-subtle">
          {canAuthor
            ? "Schedule and run live classes across all the courses you teach — no need to go into each course."
            : isMentor
            ? "Schedule and host live Q&A sessions, workshops, and mentorship calls for learners across the organization."
            : "Upcoming and past live interactive classes across the course catalog."}
        </p>
      </div>

      {canHost && (
        <div className="flex flex-wrap gap-2">
          {["upcoming", "schedule"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-control px-4 py-2 text-sm font-medium ${
                tab === t ? "bg-brand text-white" : "border border-line-strong text-ink-muted"
              }`}
            >
              {t === "upcoming" ? "Upcoming & past" : "Schedule a session"}
            </button>
          ))}
        </div>
      )}

      {error && <div className="rounded-control bg-danger-subtle p-3 text-sm text-danger">{error}</div>}
      {notice && <div className="rounded-control bg-success-subtle p-3 text-sm text-success">{notice}</div>}

      {tab === "schedule" && canHost && (
        <NewSessionForm courses={courses} onCreated={() => { setNotice("Session scheduled."); setTab("upcoming"); load(); }} />
      )}

      {tab === "upcoming" && (
        <>
          <div className="rounded-surface border border-line bg-surface p-4">
            <h2 className="font-semibold">Upcoming</h2>
            {loading ? (
              <p className="mt-3 text-sm text-ink-subtle">Loading…</p>
            ) : upcoming.length === 0 ? (
              <div className="mt-3 rounded-surface border border-dashed border-line-strong p-8 text-center">
                <p className="text-sm font-medium text-ink-muted">No upcoming live sessions</p>
                <p className="mt-1 text-xs text-ink-subtle max-w-sm mx-auto">
                  {canAuthor
                    ? "Host live lectures, Q&A sessions, or code walkthroughs for students enrolled in your courses."
                    : isMentor
                    ? "Host live Q&A sessions, workshops, or mentorship calls for learners across the organization."
                    : "Live interactive classes hosted by instructors and mentors will appear here."}
                </p>
                {canHost && (
                  <button
                    type="button"
                    onClick={() => setTab("schedule")}
                    className="mt-4 rounded-control bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover shadow-sm"
                  >
                    + Schedule Your First Session
                  </button>
                )}
              </div>
            ) : (
              <ul className="mt-3 space-y-2">
                {upcoming.map((s) => {
                  const isHost = String(s.instructorId?._id || s.instructorId) === String(user?.id);
                  return (
                    <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-line p-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-ink">{s.title}</span>
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[s.status]}`}>
                            {s.status}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-ink-subtle">
                          {s.courseId?.title || "—"} · {fmt(s.scheduledStart)}
                          {!isHost && s.instructorId && ` · ${s.instructorId.name || s.instructorId.email}`}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => join(s)}
                          className="rounded-control bg-success px-3 py-1.5 text-xs font-medium text-white hover:bg-success"
                        >
                          {s.status === "LIVE" ? "Rejoin" : "Join"}
                        </button>
                        {isHost && (
                          <>
                            <button
                              type="button"
                              onClick={() => endSession(s.id)}
                              className="rounded-control border border-line-strong px-3 py-1.5 text-xs hover:bg-surface-sunken"
                            >
                              End
                            </button>
                            <button
                              type="button"
                              onClick={() => cancelSession(s.id)}
                              className="rounded-control border border-danger-border px-3 py-1.5 text-xs text-danger hover:bg-danger-subtle"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="rounded-surface border border-line bg-surface p-4">
            <h2 className="font-semibold">Past</h2>
            {past.length === 0 ? (
              <p className="mt-3 text-sm text-ink-subtle">Nothing here yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {past.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-line p-3 text-sm">
                    <div>
                      <span className="font-medium text-ink-muted">{s.title}</span>
                      <span className="ml-2 text-xs text-ink-subtle">{s.courseId?.title || "—"} · {fmt(s.scheduledStart)}</span>
                    </div>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[s.status]}`}>{s.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function LiveSessions() {
  return (
    <ProtectedRoute>
      <LiveSessionsContent />
    </ProtectedRoute>
  );
}
