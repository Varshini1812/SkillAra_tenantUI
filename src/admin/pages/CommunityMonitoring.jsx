import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { fetchAllMockTests } from "../../api/mockTests.js";
import { fetchAllSlots } from "../../api/sessionSlots.js";
import { fetchAllTickets } from "../../api/mentorshipTickets.js";
import { fetchAllLiveSessions } from "../../api/liveSessions.js";
import { fetchQuestions } from "../../api/forum.js";
import { getErrorMessage } from "../../api/client.js";
import Breadcrumb from "../components/ui/Breadcrumb.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import LockedFeature from "../../components/common/LockedFeature.jsx";
import Icon from "../components/ui/Icon.jsx";
import { PageHeader } from "../components/ui/primitives.jsx";

const TABS = [
  { key: "mock-tests", label: "Mock tests" },
  { key: "sessions", label: "Sessions" },
  { key: "mentorship", label: "Support tickets" },
  { key: "live-sessions", label: "Live sessions" },
  { key: "forum", label: "Forum" },
];

function Badge({ status }) {
  const styles = {
    DRAFT: "bg-surface-sunken text-ink-muted",
    PUBLISHED: "bg-success-subtle text-success",
    OPEN: "bg-surface-sunken text-ink-muted",
    BOOKED: "bg-brand-muted text-brand-hover",
    COMPLETED: "bg-success-subtle text-success",
    CANCELLED: "bg-danger-subtle text-danger",
    ASSIGNED: "bg-brand-muted text-brand-hover",
    CLOSED: "bg-success-subtle text-success",
    SCHEDULED: "bg-surface-sunken text-ink-muted",
    LIVE: "bg-success-subtle text-success",
    ENDED: "bg-surface-sunken text-ink-muted",
  };
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${styles[status] || "bg-surface-sunken text-ink-muted"}`}>
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
      <td colSpan={6} className="py-8 text-center text-sm text-ink-subtle">
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

  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (!rows) return <p className="text-sm text-ink-subtle">Loading…</p>;

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-subtle">
          <th className="py-2">Title</th>
          <th className="py-2">Course</th>
          <th className="py-2">Questions</th>
          <th className="py-2">Duration</th>
          <th className="py-2">Published By</th>
          <th className="py-2">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {rows.length === 0 && <EmptyRow>No mock tests yet.</EmptyRow>}
        {rows.map((t) => (
          <tr key={t.id}>
            <td className="py-2 font-medium text-ink">{t.title}</td>
            <td className="py-2 text-ink-subtle">{t.courseId?.title || "—"}</td>
            <td className="py-2 text-ink-subtle">{t.questions?.length ?? "—"}</td>
            <td className="py-2 text-ink-subtle">{t.durationMinutes} min</td>
            <td className="py-2 text-ink-subtle">{t.createdBy?.name || t.createdBy?.email || "—"}</td>
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

  if (error) return <p className="text-sm text-danger">{error}</p>;

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded border border-line-strong px-2 py-1 text-xs"
        >
          <option value="">All types</option>
          <option value="MOCK_INTERVIEW">Mock interview</option>
          <option value="MENTORSHIP">Mentorship</option>
        </select>
      </div>
      {!rows ? (
        <p className="text-sm text-ink-subtle">Loading…</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-subtle">
              <th className="py-2">Type</th>
              <th className="py-2">Title</th>
              <th className="py-2">Host</th>
              <th className="py-2">Student</th>
              <th className="py-2">Start</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length === 0 && <EmptyRow>No sessions yet.</EmptyRow>}
            {rows.map((s) => (
              <tr key={s.id}>
                <td className="py-2 text-ink-subtle">{s.sessionType === "MOCK_INTERVIEW" ? "Interview" : "Mentorship"}</td>
                <td className="py-2 font-medium text-ink">{s.title || "—"}</td>
                <td className="py-2 text-ink-subtle">{s.hostId?.name || s.hostId?.email || "—"}</td>
                <td className="py-2 text-ink-subtle">{s.studentId?.name || s.studentId?.email || "—"}</td>
                <td className="py-2 text-ink-subtle">{fmt(s.startTime)}</td>
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
    fetchAllTickets().then(setRows).catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (!rows) return <p className="text-sm text-ink-subtle">Loading…</p>;

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Link to="/admin/mentorship" className="inline-flex items-center gap-1 text-xs font-medium text-brand transition-colors duration-150 ease-standard hover:text-brand-hover hover:underline underline-offset-2">
          Open ticket dispatch
          <Icon name="chevronRight" size={13} />
        </Link>
      </div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-subtle">
            <th className="py-2">Student</th>
            <th className="py-2">Mentor</th>
            <th className="py-2">Subject</th>
            <th className="py-2">Raised</th>
            <th className="py-2">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.length === 0 && <EmptyRow>No mentorship tickets yet.</EmptyRow>}
          {rows.map((t) => (
            <tr key={t.id}>
              <td className="py-2 font-medium text-ink">{t.studentId?.name || t.studentId?.email}</td>
              <td className="py-2 text-ink-subtle">{t.mentorId?.name || t.mentorId?.email || "—"}</td>
              <td className="max-w-xs truncate py-2 text-ink-subtle">{t.subject}</td>
              <td className="py-2 text-ink-subtle">{fmt(t.created_on)}</td>
              <td className="py-2">
                <Badge status={t.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LiveSessionsTab() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAllLiveSessions().then(setRows).catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (!rows) return <p className="text-sm text-ink-subtle">Loading…</p>;

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-subtle">
          <th className="py-2">Title</th>
          <th className="py-2">Course</th>
          <th className="py-2">Instructor</th>
          <th className="py-2">Scheduled</th>
          <th className="py-2">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {rows.length === 0 && <EmptyRow>No live sessions yet.</EmptyRow>}
        {rows.map((s) => (
          <tr key={s.id}>
            <td className="py-2 font-medium text-ink">{s.title}</td>
            <td className="py-2 text-ink-subtle">{s.courseId?.title || "—"}</td>
            <td className="py-2 text-ink-subtle">{s.instructorId?.name || s.instructorId?.email || "—"}</td>
            <td className="py-2 text-ink-subtle">{fmt(s.scheduledStart)}</td>
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

  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (!rows) return <p className="text-sm text-ink-subtle">Loading…</p>;

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-subtle">
          <th className="py-2">Question</th>
          <th className="py-2">Answers</th>
          <th className="py-2">Votes</th>
          <th className="py-2">Posted</th>
          <th className="py-2">Visibility</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {rows.length === 0 && <EmptyRow>No forum activity yet.</EmptyRow>}
        {rows.map((q) => (
          <tr key={q.id}>
            <td className="py-2 font-medium text-ink">
              <Link to={`/forum/${q.id}`} className="hover:text-brand">
                {q.title}
              </Link>
            </td>
            <td className="py-2 text-ink-subtle">{q.answerCount}</td>
            <td className="py-2 text-ink-subtle">{q.voteScore}</td>
            <td className="py-2 text-ink-subtle">{fmt(q.created_on)}</td>
            <td className="py-2">
              {q.moderation?.isHidden ? (
                <span className="rounded bg-danger-subtle px-2 py-0.5 text-xs font-semibold text-danger">Hidden</span>
              ) : (
                <span className="rounded bg-success-subtle px-2 py-0.5 text-xs font-semibold text-success">Visible</span>
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
  const { tenantInfo } = useAuth();

  return (
    <div>
      <PageHeader
        breadcrumb={<Breadcrumb items={[{ label: "Admin", to: "/admin" }, { label: "Monitoring" }]} />}
        title="Community monitoring"
        description="Mock tests, sessions, mentorship, live classes and the forum — across every instructor and student in the organization."
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-control px-4 py-2 text-sm font-medium ${
              tab === t.key ? "bg-brand text-white" : "border border-line-strong text-ink-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-surface border border-line bg-surface p-4">
        {tab === "mock-tests" && (
          tenantInfo?.planFeatures?.mockInterviewsEnabled === false ? 
          <LockedFeature title="Mock Tests" description="Evaluate learners via interactive mock tests." /> : 
          <MockTestsTab />
        )}
        {tab === "sessions" && (
          tenantInfo?.planFeatures?.mentorshipEnabled === false && tenantInfo?.planFeatures?.mockInterviewsEnabled === false ? 
          <LockedFeature title="Sessions" description="Enable 1-on-1 mentorship and mock interview sessions." /> : 
          <SessionsTab />
        )}
        {tab === "mentorship" && (
          tenantInfo?.planFeatures?.mentorshipEnabled === false ? 
          <LockedFeature title="Support Tickets" description="Provide learners with direct mentorship ticket support." /> : 
          <MentorshipTab />
        )}
        {tab === "live-sessions" && (
          tenantInfo?.planFeatures?.liveClassesEnabled === false ? 
          <LockedFeature title="Live Sessions" description="Host interactive virtual classrooms directly in SkillAra." /> : 
          <LiveSessionsTab />
        )}
        {tab === "forum" && (
          tenantInfo?.planFeatures?.communityEnabled === false ? 
          <LockedFeature title="Community Forum" description="Build an active community by allowing learners and instructors to ask questions." /> : 
          <ForumTab />
        )}
      </div>
    </div>
  );
}
