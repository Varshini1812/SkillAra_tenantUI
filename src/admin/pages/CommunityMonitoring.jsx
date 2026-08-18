import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { fetchAllMockTests } from "../../api/mockTests.js";
import { fetchAllSlots } from "../../api/sessionSlots.js";
import { fetchAllMentorshipRequests } from "../../api/mentorship.js";
import { fetchAllLiveSessions } from "../../api/liveSessions.js";
import { fetchQuestions } from "../../api/forum.js";
import { getErrorMessage } from "../../api/client.js";
import Breadcrumb from "../components/ui/Breadcrumb.jsx";

const TABS = [
  { key: "mock-tests", label: "Mock tests" },
  { key: "sessions", label: "Sessions" },
  { key: "mentorship", label: "Mentorship" },
  { key: "live-sessions", label: "Live sessions" },
  { key: "forum", label: "Forum" },
];

function Badge({ status }) {
  const styles = {
    DRAFT: "bg-slate-100 text-slate-600",
    PUBLISHED: "bg-emerald-100 text-emerald-700",
    OPEN: "bg-slate-100 text-slate-600",
    BOOKED: "bg-indigo-100 text-indigo-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
    CANCELLED: "bg-rose-100 text-rose-700",
    PENDING: "bg-amber-100 text-amber-700",
    ACCEPTED: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-rose-100 text-rose-700",
    SCHEDULED: "bg-slate-100 text-slate-600",
    LIVE: "bg-emerald-100 text-emerald-700",
    ENDED: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${styles[status] || "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
}

function fmt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function EmptyRow({ children }) {
  return (
    <tr>
      <td colSpan={6} className="py-8 text-center text-sm text-slate-400">
        {children}
      </td>
    </tr>
  );
}

function MockTestsTab() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAllMockTests().then(setRows).catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!rows) return <p className="text-sm text-slate-400">Loading…</p>;

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
          <th className="py-2">Title</th>
          <th className="py-2">Course</th>
          <th className="py-2">Questions</th>
          <th className="py-2">Duration</th>
          <th className="py-2">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.length === 0 && <EmptyRow>No mock tests yet.</EmptyRow>}
        {rows.map((t) => (
          <tr key={t.id}>
            <td className="py-2 font-medium text-slate-800">{t.title}</td>
            <td className="py-2 text-slate-500">{t.courseId?.title || "—"}</td>
            <td className="py-2 text-slate-500">{t.questions?.length ?? "—"}</td>
            <td className="py-2 text-slate-500">{t.durationMinutes} min</td>
            <td className="py-2">
              <Badge status={t.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SessionsTab() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    fetchAllSlots(typeFilter ? { sessionType: typeFilter } : {})
      .then(setRows)
      .catch((err) => setError(getErrorMessage(err)));
  }, [typeFilter]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div>
      <div className="mb-3 flex justify-end">
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
      {!rows ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
              <th className="py-2">Type</th>
              <th className="py-2">Title</th>
              <th className="py-2">Host</th>
              <th className="py-2">Student</th>
              <th className="py-2">Start</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 && <EmptyRow>No sessions yet.</EmptyRow>}
            {rows.map((s) => (
              <tr key={s.id}>
                <td className="py-2 text-slate-500">{s.sessionType === "MOCK_INTERVIEW" ? "Interview" : "Mentorship"}</td>
                <td className="py-2 font-medium text-slate-800">{s.title || "—"}</td>
                <td className="py-2 text-slate-500">{s.hostId?.name || s.hostId?.email || "—"}</td>
                <td className="py-2 text-slate-500">{s.studentId?.name || s.studentId?.email || "—"}</td>
                <td className="py-2 text-slate-500">{fmt(s.startTime)}</td>
                <td className="py-2">
                  <Badge status={s.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function MentorshipTab() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAllMentorshipRequests().then(setRows).catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!rows) return <p className="text-sm text-slate-400">Loading…</p>;

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
          <th className="py-2">Student</th>
          <th className="py-2">Mentor</th>
          <th className="py-2">Message</th>
          <th className="py-2">Requested</th>
          <th className="py-2">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.length === 0 && <EmptyRow>No mentorship requests yet.</EmptyRow>}
        {rows.map((r) => (
          <tr key={r.id}>
            <td className="py-2 font-medium text-slate-800">{r.studentId?.name || r.studentId?.email}</td>
            <td className="py-2 text-slate-500">{r.mentorId?.name || r.mentorId?.email}</td>
            <td className="max-w-xs truncate py-2 text-slate-500">{r.message || "—"}</td>
            <td className="py-2 text-slate-500">{fmt(r.created_on)}</td>
            <td className="py-2">
              <Badge status={r.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function LiveSessionsTab() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAllLiveSessions().then(setRows).catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!rows) return <p className="text-sm text-slate-400">Loading…</p>;

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
          <th className="py-2">Title</th>
          <th className="py-2">Course</th>
          <th className="py-2">Instructor</th>
          <th className="py-2">Scheduled</th>
          <th className="py-2">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.length === 0 && <EmptyRow>No live sessions yet.</EmptyRow>}
        {rows.map((s) => (
          <tr key={s.id}>
            <td className="py-2 font-medium text-slate-800">{s.title}</td>
            <td className="py-2 text-slate-500">{s.courseId?.title || "—"}</td>
            <td className="py-2 text-slate-500">{s.instructorId?.name || s.instructorId?.email || "—"}</td>
            <td className="py-2 text-slate-500">{fmt(s.scheduledStart)}</td>
            <td className="py-2">
              <Badge status={s.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ForumTab() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchQuestions({ limit: 50 })
      .then((r) => setRows(r.items))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!rows) return <p className="text-sm text-slate-400">Loading…</p>;

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
          <th className="py-2">Question</th>
          <th className="py-2">Answers</th>
          <th className="py-2">Votes</th>
          <th className="py-2">Posted</th>
          <th className="py-2">Visibility</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.length === 0 && <EmptyRow>No forum activity yet.</EmptyRow>}
        {rows.map((q) => (
          <tr key={q.id}>
            <td className="py-2 font-medium text-slate-800">
              <Link to={`/forum/${q.id}`} className="hover:text-indigo-600">
                {q.title}
              </Link>
            </td>
            <td className="py-2 text-slate-500">{q.answerCount}</td>
            <td className="py-2 text-slate-500">{q.voteScore}</td>
            <td className="py-2 text-slate-500">{fmt(q.created_on)}</td>
            <td className="py-2">
              {q.moderation?.isHidden ? (
                <span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">Hidden</span>
              ) : (
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Visible</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Tenant-wide oversight for org admin/owner across every community feature — mock
 * tests, mock-interview & mentorship scheduling, mentorship requests, live classes,
 * and forum activity. All the `fetchAll*` calls behind these tabs are staff-only on
 * the API side; nothing here is a client-side-only restriction.
 */
export default function CommunityMonitoring() {
  const [tab, setTab] = useState("mock-tests");

  return (
    <div>
      <Breadcrumb items={[{ label: "Admin", to: "/admin" }, { label: "Monitoring" }]} />
      <h1 className="text-xl font-semibold text-slate-900">Community monitoring</h1>
      <p className="mt-1 text-sm text-slate-500">
        Everything happening across mock tests, sessions, mentorship, live classes, and the forum
        — for every instructor and student in the organization, not just your own.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              tab === t.key ? "bg-indigo-600 text-white" : "border border-slate-300 text-slate-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white p-4">
        {tab === "mock-tests" && <MockTestsTab />}
        {tab === "sessions" && <SessionsTab />}
        {tab === "mentorship" && <MentorshipTab />}
        {tab === "live-sessions" && <LiveSessionsTab />}
        {tab === "forum" && <ForumTab />}
      </div>
    </div>
  );
}
