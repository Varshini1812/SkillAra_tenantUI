import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { usePermissions } from "../hooks/usePermissions.js";
import ProtectedRoute from "../components/ProtectedRoute.jsx";

const TYPE_LABEL = { MOCK_INTERVIEW: "Mock interview", MENTORSHIP: "Mentorship" };
const STATUS_STYLE = {
  OPEN: "bg-slate-100 text-slate-600",
  BOOKED: "bg-indigo-100 text-indigo-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-rose-100 text-rose-700",
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
  const [sessionType, setSessionType] = useState("MOCK_INTERVIEW");
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
        sessionType,
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
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      {error && <div className="rounded-lg bg-red-50 p-2 text-sm text-red-600">{error}</div>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-xs font-medium text-slate-600">
          Type
          <select
            value={sessionType}
            onChange={(e) => setSessionType(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="MOCK_INTERVIEW">Mock interview</option>
            <option value="MENTORSHIP">Mentorship</option>
          </select>
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Course (optional)
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">None</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-slate-600 sm:col-span-2">
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. React fundamentals mock interview"
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Start time
          <input
            type="datetime-local"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          End time
          <input
            type="datetime-local"
            required
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
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
    <li className="rounded-lg border border-slate-100 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-800">
              {slot.title || TYPE_LABEL[slot.sessionType]}
            </span>
            <span className="rounded bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
              {TYPE_LABEL[slot.sessionType]}
            </span>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[slot.status]}`}>
              {slot.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">{fmt(slot.startTime)}</p>
          {mode !== "browse" && (
            <p className="mt-0.5 text-xs text-slate-400">
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
              className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700"
            >
              Book
            </button>
          )}
          {mode === "mine" && canJoin && (
            <button
              type="button"
              onClick={() => onJoin(slot)}
              className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
            >
              Join call
            </button>
          )}
          {mode === "mine" && isHost && slot.status === "BOOKED" && (
            <button
              type="button"
              onClick={() => onComplete(slot.id)}
              className="rounded-lg border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50"
            >
              Mark complete
            </button>
          )}
          {mode === "mine" && isHost && slot.status === "OPEN" && (
            <button
              type="button"
              onClick={() => onDelete(slot.id)}
              className="rounded-lg border border-rose-200 px-3 py-1 text-xs text-rose-600 hover:bg-rose-50"
            >
              Delete
            </button>
          )}
          {mode === "mine" && (slot.status === "OPEN" || slot.status === "BOOKED") && (
            <button
              type="button"
              onClick={() => onCancel(slot.id)}
              className="rounded-lg border border-rose-200 px-3 py-1 text-xs text-rose-600 hover:bg-rose-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

function SessionsContent() {
  const { isInstructor, isStaff, user } = usePermissions();
  const canHost = isInstructor || isStaff;
  const navigate = useNavigate();

  const [tab, setTab] = useState("browse");
  const [typeFilter, setTypeFilter] = useState("");
  const [openSlots, setOpenSlots] = useState([]);
  const [mySlots, setMySlots] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadAll = useCallback(() => {
    setLoading(true);
    setError("");
    Promise.all([
      fetchOpenSlots(typeFilter ? { sessionType: typeFilter } : {}),
      fetchMySlots(),
    ])
      .then(([open, mine]) => {
        setOpenSlots(open);
        setMySlots(mine);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [typeFilter]);

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
        title: slot.title || TYPE_LABEL[slot.sessionType],
        returnTo: "/sessions",
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sessions</h1>
        <p className="mt-1 text-sm text-slate-500">
          Mock interviews and mentorship — book open time, or publish your own.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {["browse", "mine", ...(canHost ? ["host"] : [])].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              tab === t ? "bg-indigo-600 text-white" : "border border-slate-300 text-slate-600"
            }`}
          >
            {t === "browse" ? "Browse" : t === "mine" ? "My sessions" : "Host"}
          </button>
        ))}
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
      {notice && <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{notice}</div>}

      {tab === "host" && canHost && <NewSlotForm courses={courses} onCreated={() => { setNotice("Slot published."); loadAll(); }} />}

      {tab === "browse" && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Open slots</h2>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded border border-slate-300 px-2 py-1 text-xs"
            >
              <option value="">All types</option>
              <option value="MOCK_INTERVIEW">Mock interview</option>
              <option value="MENTORSHIP">Mentorship</option>
            </select>
          </div>
          {loading ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : openSlots.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
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
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 font-semibold">My sessions</h2>
          {loading ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : mySlots.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
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

export default function Sessions() {
  return (
    <ProtectedRoute>
      <SessionsContent />
    </ProtectedRoute>
  );
}
