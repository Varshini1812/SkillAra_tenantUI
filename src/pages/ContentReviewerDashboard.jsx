import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchReviewQueue, fetchCourses } from "../api/courses.js";
import { getErrorMessage } from "../api/client.js";
import { usePermissions } from "../hooks/usePermissions.js";
import Icon from "../admin/components/ui/Icon.jsx";

function ReviewerStat({ label, value, to, tone = "slate", badge }) {
  const tones = {
    slate: "text-ink",
    indigo: "text-brand-hover",
    amber: "text-warning",
    emerald: "text-success",
  };
  const card = (
    <div className="h-full flex flex-col justify-between rounded-surface border border-line bg-surface p-4 transition hover:border-line-strong">
      <div className="flex items-start justify-between gap-1.5 min-h-[1.5rem]">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">{label}</p>
        {badge && (
          <span className="shrink-0 whitespace-nowrap rounded-chip bg-success-subtle px-1.5 py-0.5 text-[10px] font-semibold text-success">
            {badge}
          </span>
        )}
      </div>
      <p className={`mt-2 text-2xl font-bold ${tones[tone]}`}>{value}</p>
    </div>
  );
  return to ? (
    <Link to={to} className="block h-full transition hover:opacity-90">
      {card}
    </Link>
  ) : (
    card
  );
}

export default function ContentReviewerDashboard() {
  const { user } = usePermissions();
  const [pendingQueue, setPendingQueue] = useState([]);
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadDashboard() {
      setLoading(true);
      setError("");
      try {
        const [queueRes, allCoursesRes] = await Promise.all([
          fetchReviewQueue().catch(() => []),
          fetchCourses({ limit: 100 }).catch(() => ({ items: [] })),
        ]);

        if (cancelled) return;

        const queue = Array.isArray(queueRes) ? queueRes : queueRes?.items || [];
        setPendingQueue(queue);

        // Find courses that have review decisions (approved or changes requested)
        const history = (allCoursesRes.items || []).filter(
          (c) => c.review?.status === "APPROVED" || c.review?.status === "CHANGES_REQUESTED"
        );
        setHistoryItems(history);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  const approvedCount = historyItems.filter((c) => c.review?.status === "APPROVED").length;
  const changesCount = historyItems.filter((c) => c.review?.status === "CHANGES_REQUESTED").length;

  if (loading) return <div className="py-12 text-center text-sm text-ink-subtle">Loading Content Reviewer Dashboard…</div>;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-brand-muted px-2 py-0.5 text-xs font-semibold text-brand-hover">
              Content Reviewer Workspace
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl font-bold text-ink">
            My Dashboard{user?.name ? `, ${user.name}` : ""}
          </h1>
          <p className="text-xs text-ink-subtle">
            Manage course review requests, evaluate curriculum quality, and maintain publishing standards.
          </p>
        </div>

        <Link
          to="/review-queue"
          className="rounded-control bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover shadow-sm"
        >
          Open Review Queue ({pendingQueue.length})
        </Link>
      </div>

      {error && <div className="rounded-control bg-danger-subtle p-3 text-sm text-danger">{error}</div>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ReviewerStat
          label="Pending Queue"
          value={pendingQueue.length}
          to="/review-queue?tab=pending"
          tone="indigo"
          badge={pendingQueue.length > 0 ? "Action Required" : "Clear"}
        />
        <ReviewerStat
          label="Approved Courses"
          value={approvedCount}
          to="/review-queue?tab=history"
          tone="emerald"
        />
        <ReviewerStat
          label="Changes Requested"
          value={changesCount}
          to="/review-queue?tab=history"
          tone="amber"
        />
        <ReviewerStat
          label="Queue SLA Target"
          value="< 24 hrs"
          tone="slate"
          badge="On Track"
        />
      </div>

      {/* Active Job Queue */}
      <div className="rounded-surface border border-line bg-surface overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5 bg-surface-sunken">
          <div>
            <h2 className="text-sm font-semibold text-ink">Active Submissions Inbox</h2>
            <p className="text-xs text-ink-subtle">Courses waiting for content review and approval decision</p>
          </div>
          <Link to="/review-queue" className="text-xs font-medium text-brand hover:underline">
            View full queue →
          </Link>
        </div>

        {pendingQueue.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-subtle text-brand-hover">
              <Icon name="clipboardCheck" size={24} />
            </div>
            <p className="mt-3 text-sm font-semibold text-ink">No submissions waiting right now</p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-ink-subtle">
              New course and lesson submissions sent by instructors for review will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {pendingQueue.slice(0, 5).map((course) => (
              <div key={course.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-surface-sunken transition">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-ink">{course.title}</span>
                    <span className="rounded bg-brand-muted px-2 py-0.5 text-[10px] font-semibold text-brand-hover">
                      PENDING REVIEW
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ink-subtle">
                    Submitted by <strong>{course.instructor?.name || course.instructor?.email || "Instructor"}</strong> ·{" "}
                    {course.category || "General"} · {course.stats?.lessonCount || 0} lessons
                  </p>
                  {course.review?.note && (
                    <p className="mt-1.5 line-clamp-1 rounded bg-surface-sunken px-2.5 py-1 text-xs text-ink-muted border border-line">
                      Submission note: "{course.review.note}"
                    </p>
                  )}
                </div>

                <Link
                  to={`/teach/${course.id}`}
                  className="whitespace-nowrap rounded-control bg-brand px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-hover shadow-sm"
                >
                  Review Content →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Decisions History */}
      <div className="rounded-surface border border-line bg-surface overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5 bg-surface-sunken">
          <h2 className="text-sm font-semibold text-ink">Recent Review Decisions</h2>
          <Link to="/review-queue?tab=history" className="text-xs font-medium text-brand hover:underline">
            View history →
          </Link>
        </div>

        {historyItems.length === 0 ? (
          <p className="px-6 py-8 text-center text-xs text-ink-subtle">
            No past review decision history recorded yet.
          </p>
        ) : (
          <div className="divide-y divide-line">
            {historyItems.slice(0, 5).map((course) => {
              const isApproved = course.review?.status === "APPROVED";
              return (
                <div key={course.id} className="flex items-center justify-between p-4 text-xs">
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-ink text-sm block truncate">{course.title}</span>
                    <p className="mt-0.5 text-ink-subtle">
                      Author: {course.instructor?.name || course.instructor?.email || "Instructor"}
                    </p>
                    {course.review?.note && (
                      <p className="mt-1 text-ink-muted italic">"{course.review.note}"</p>
                    )}
                  </div>
                  <span
                    className={`ml-4 shrink-0 rounded px-2.5 py-1 font-semibold ${
                      isApproved ? "bg-success-subtle text-success" : "bg-warning-subtle text-warning"
                    }`}
                  >
                    {isApproved ? "APPROVED" : "CHANGES REQUESTED"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
