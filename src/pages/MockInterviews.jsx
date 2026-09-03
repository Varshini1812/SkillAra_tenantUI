import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  fetchOpenSlots,
  fetchMySlots,
  createSlot,
  bookSlot,
  cancelSlot,
  completeSlot,
  deleteSlot,
} from "../api/sessionSlots.js";
import { fetchCourses } from "../api/courses.js";
import { getErrorMessage } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { usePermissions } from "../hooks/usePermissions.js";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import LockedFeature from "../components/common/LockedFeature.jsx";
import Icon from "../admin/components/ui/Icon.jsx";

const STATUS_STYLE = {
  OPEN: "bg-surface-sunken text-ink-muted",
  BOOKED: "bg-brand-muted text-brand-hover",
  COMPLETED: "bg-success-subtle text-success",
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

function NewSlotForm({ courses, onCreated }) {
  const inHour = new Date(Date.now() + 60 * 60 * 1000);
  const inHourHalf = new Date(Date.now() + 90 * 60 * 1000);
  const [courseId, setCourseId] = useState("");
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
      await createSlot({
        sessionType: "MOCK_INTERVIEW",
        courseId: courseId || undefined,
        title: title.trim(),
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
      });
      setTitle("");
      onCreated();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-surface border border-line bg-surface p-4">
      {error && <div className="rounded-control bg-danger-subtle p-2 text-sm text-danger">{error}</div>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-xs font-medium text-ink-muted">
          Course (optional)
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="mt-1 w-full rounded border border-line-strong px-2 py-1.5 text-sm"
          >
            <option value="">None</option>
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
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. React fundamentals mock interview"
            className="mt-1 w-full rounded border border-line-strong px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block text-xs font-medium text-ink-muted">
          Start time
          <input
            type="datetime-local"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="mt-1 w-full rounded border border-line-strong px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block text-xs font-medium text-ink-muted">
          End time
          <input
            type="datetime-local"
            required
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="mt-1 w-full rounded border border-line-strong px-2 py-1.5 text-sm"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={saving}
        className="rounded-control bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50"
      >
        {saving ? "Publishing…" : "Publish availability"}
      </button>
    </form>
  );
}

function SlotCard({ slot, mode, currentUserId, onBook, onCancel, onComplete, onDelete, onJoin }) {
  const isHost = String(slot.hostId?._id || slot.hostId) === String(currentUserId);
  const canJoin = slot.status === "BOOKED" && slot.meeting?.roomId;

  return (
    <li className="rounded-control border border-line p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-ink">{slot.title || "Mock interview"}</span>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[slot.status]}`}>
              {slot.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-subtle">{fmt(slot.startTime)}</p>
          {mode !== "browse" && (
            <p className="mt-0.5 text-xs text-ink-subtle">
              {isHost
                ? `With ${slot.studentId?.name || slot.studentId?.email || "—"}`
                : `Hosted by ${slot.hostId?.name || slot.hostId?.email || "—"}`}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {mode === "browse" && (
            <button
              type="button"
              onClick={() => onBook(slot.id)}
              className="rounded-control bg-brand px-3 py-1 text-xs font-medium text-white hover:bg-brand-hover"
            >
              Book
            </button>
          )}
          {mode === "mine" && canJoin && (
            <button
              type="button"
              onClick={() => onJoin(slot)}
              className="rounded-control bg-success px-3 py-1 text-xs font-medium text-white hover:bg-success"
            >
              Join call
            </button>
          )}
          {mode === "mine" && isHost && slot.status === "BOOKED" && (
            <button
              type="button"
              onClick={() => onComplete(slot.id)}
              className="rounded-control border border-line-strong px-3 py-1 text-xs hover:bg-surface-sunken"
            >
              Mark complete
            </button>
          )}
          {mode === "mine" && isHost && slot.status === "OPEN" && (
            <button
              type="button"
              onClick={() => onDelete(slot.id)}
              className="rounded-control border border-danger-border px-3 py-1 text-xs text-danger hover:bg-danger-subtle"
            >
              Delete
            </button>
          )}
          {mode === "mine" && (slot.status === "OPEN" || slot.status === "BOOKED") && (
            <button
              type="button"
              onClick={() => onCancel(slot.id)}
              className="rounded-control border border-danger-border px-3 py-1 text-xs text-danger hover:bg-danger-subtle"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

function MockInterviewsContent() {
  const { user, can } = usePermissions();
  const { tenantInfo } = useAuth();
  const canHost = can("mentorship", "host");
  const navigate = useNavigate();

  const [tab, setTab] = useState("browse");
  const [openSlots, setOpenSlots] = useState([]);
  const [mySlots, setMySlots] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadAll = useCallback(() => {
    setLoading(true);
    setError("");
    Promise.all([fetchOpenSlots({ sessionType: "MOCK_INTERVIEW" }), fetchMySlots({ sessionType: "MOCK_INTERVIEW" })])
      .then(([open, mine]) => {
        setOpenSlots(open);
        setMySlots(mine);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (canHost) {
      fetchCourses({ mine: true }).then((r) => setCourses(r.items)).catch(() => {});
    }
  }, [canHost]);

  const withNotice = async (fn, message) => {
    setError("");
    setNotice("");
    try {
      await fn();
      setNotice(message);
      loadAll();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleBook = (id) => withNotice(() => bookSlot(id), "Session booked.");
  const handleCancel = (id) => {
    if (!window.confirm("Cancel this session?")) return;
    withNotice(() => cancelSlot(id), "Session cancelled.");
  };
  const handleComplete = (id) => withNotice(() => completeSlot(id), "Marked as complete.");
  const handleDelete = (id) => withNotice(() => deleteSlot(id), "Slot removed.");
  const handleJoin = (slot) => {
    navigate(`/call/${slot.meeting.roomId}`, {
      state: {
        jitsiFallbackUrl: slot.meeting.jitsiFallbackUrl,
        title: slot.title || "Mock interview",
        returnTo: "/mock-interviews",
      },
    });
  };

  if (tenantInfo?.planFeatures && tenantInfo.planFeatures.mockInterviewsEnabled === false && tenantInfo.planFeatures.mentorshipEnabled === false) {
    return (
      <LockedFeature 
        title="Mentorship & Mock Interviews" 
        description="Offer 1-on-1 coaching, track booking requests, and provide direct feedback to learners." 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-ink-subtle hover:text-brand transition mb-1"
        >
          <Icon name="arrowLeft" size={15} /> Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold">Mock Interviews</h1>
        <p className="mt-1 text-sm text-ink-subtle">Book open interview practice time, or publish your own.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {["browse", "mine", ...(canHost ? ["host"] : [])].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-control px-4 py-2 text-sm font-medium ${
              tab === t ? "bg-brand text-white" : "border border-line-strong text-ink-muted"
            }`}
          >
            {t === "browse" ? "Browse" : t === "mine" ? "My sessions" : "Host"}
          </button>
        ))}
      </div>

      {error && <div className="rounded-control bg-danger-subtle p-3 text-sm text-danger">{error}</div>}
      {notice && <div className="rounded-control bg-success-subtle p-3 text-sm text-success">{notice}</div>}

      {tab === "host" && canHost && <NewSlotForm courses={courses} onCreated={() => { setNotice("Slot published."); loadAll(); }} />}

      {tab === "browse" && (
        <div className="rounded-surface border border-line bg-surface p-4">
          <h2 className="mb-3 font-semibold">Open slots</h2>
          {loading ? (
            <p className="text-sm text-ink-subtle">Loading…</p>
          ) : openSlots.length === 0 ? (
            <p className="rounded-control border border-dashed border-line-strong p-6 text-center text-sm text-ink-subtle">
              No open slots right now.
            </p>
          ) : (
            <ul className="space-y-2">
              {openSlots.map((slot) => (
                <SlotCard key={slot.id} slot={slot} mode="browse" currentUserId={user?.id} onBook={handleBook} />
              ))}
            </ul>
          )}
        </div>
      )}

      {(tab === "mine" || tab === "host") && (
        <div className="rounded-surface border border-line bg-surface p-4">
          <h2 className="mb-3 font-semibold">My sessions</h2>
          {loading ? (
            <p className="text-sm text-ink-subtle">Loading…</p>
          ) : mySlots.length === 0 ? (
            <p className="rounded-control border border-dashed border-line-strong p-6 text-center text-sm text-ink-subtle">
              Nothing here yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {mySlots.map((slot) => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  mode="mine"
                  currentUserId={user?.id}
                  onCancel={handleCancel}
                  onComplete={handleComplete}
                  onDelete={handleDelete}
                  onJoin={handleJoin}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default function MockInterviews() {
  return (
    <ProtectedRoute>
      <MockInterviewsContent />
    </ProtectedRoute>
  );
}
