import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { fetchReviewQueue, fetchCourses } from "../../api/courses.js";
import { getErrorMessage } from "../../api/client.js";
import Icon from "../../admin/components/ui/Icon.jsx";

export default function ReviewQueue() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "pending";

  const [pendingCourses, setPendingCourses] = useState([]);
  const [historyCourses, setHistoryCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [queueRes, allCoursesRes] = await Promise.all([
        fetchReviewQueue().catch(() => []),
        fetchCourses({ limit: 100 }).catch(() => ({ items: [] })),
      ]);

      const queue = Array.isArray(queueRes) ? queueRes : queueRes?.items || [];
      setPendingCourses(queue);

      const history = (allCoursesRes.items || []).filter(
        (c) => c.review?.status === "APPROVED" || c.review?.status === "CHANGES_REQUESTED"
      );
      setHistoryCourses(history);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setTab = (val) => {
    setSearchParams({ tab: val });
  };

  const oldestWaitingDays = useMemo(() => {
    if (pendingCourses.length === 0) return null;
    const dates = pendingCourses
      .map((c) => (c.review?.submittedAt ? new Date(c.review.submittedAt).getTime() : Date.now()))
      .sort((a, b) => a - b);
    const oldestMs = Date.now() - dates[0];
    const hours = Math.round(oldestMs / (1000 * 60 * 60));
    return hours > 24 ? `${Math.round(hours / 24)} day(s)` : `${hours} hr(s)`;
  }, [pendingCourses]);

  const filteredItems = useMemo(() => {
    const list = activeTab === "history" ? [...historyCourses] : [...pendingCourses];
    const q = search.trim().toLowerCase();

    let result = list.filter((c) => {
      if (!q) return true;
      const title = (c.title || "").toLowerCase();
      const instructor = (c.instructor?.name || c.instructor?.email || "").toLowerCase();
      return title.includes(q) || instructor.includes(q);
    });

    if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.review?.submittedAt || 0) - new Date(a.review?.submittedAt || 0));
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.review?.submittedAt || 0) - new Date(b.review?.submittedAt || 0));
    }

    return result;
  }, [activeTab, pendingCourses, historyCourses, search, sortBy]);

  if (loading) return <div className="py-16 text-center text-sm text-ink-subtle">Loading review queue…</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-ink-subtle hover:text-brand transition mb-1"
          >
            <Icon name="arrowLeft" size={15} /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-ink">Review Queue & Audit Trail</h1>
          <p className="mt-1 text-sm text-ink-subtle">
            Evaluate submitted courses, inspect lesson materials, and issue approval or change requests.
          </p>
        </div>
      </div>

      {/* SLA Metric Banner */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-surface border border-line bg-surface p-3.5">
          <p className="text-[11px] font-semibold uppercase text-ink-subtle">Pending Submissions</p>
          <p className="mt-1 text-2xl font-bold text-brand">{pendingCourses.length}</p>
        </div>
        <div className="rounded-surface border border-line bg-surface p-3.5">
          <p className="text-[11px] font-semibold uppercase text-ink-subtle">Oldest Waiting Item</p>
          <p className="mt-1 text-2xl font-bold text-ink">{oldestWaitingDays || "None"}</p>
        </div>
        <div className="rounded-surface border border-line bg-surface p-3.5">
          <p className="text-[11px] font-semibold uppercase text-ink-subtle">Review SLA Target</p>
          <p className="mt-1 text-2xl font-bold text-success">&lt; 24 hours</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab("pending")}
            className={`rounded-control px-4 py-2 text-sm font-medium transition ${
              activeTab === "pending"
                ? "bg-brand text-white shadow-sm"
                : "border border-line-strong text-ink-muted hover:bg-surface-sunken"
            }`}
          >
            Pending Reviews ({pendingCourses.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("history")}
            className={`rounded-control px-4 py-2 text-sm font-medium transition ${
              activeTab === "history"
                ? "bg-brand text-white shadow-sm"
                : "border border-line-strong text-ink-muted hover:bg-surface-sunken"
            }`}
          >
            Review History ({historyCourses.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or author…"
            className="rounded-control border border-line-strong px-3 py-2 text-sm sm:w-64"
          />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-control border border-line-strong px-3 py-2 text-sm bg-surface"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {error && <div className="rounded-control bg-danger-subtle p-3 text-sm text-danger">{error}</div>}

      {filteredItems.length === 0 ? (
        <div className="rounded-surface border border-dashed border-line-strong p-12 text-center">
          {activeTab === "pending" ? (
            <div>
              <p className="text-base font-semibold text-ink">No courses waiting on your review</p>
              <p className="mt-1 text-xs text-ink-subtle max-w-sm mx-auto">
                When instructors submit new courses or updated revisions for moderation, they will appear in this queue automatically.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-base font-semibold text-ink">No past review history found</p>
              <p className="mt-1 text-xs text-ink-subtle max-w-sm mx-auto">
                Courses you approve or send back with feedback notes will be logged in this audit trail.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredItems.map((course) => {
            const isApproved = course.review?.status === "APPROVED";
            const isPending = activeTab === "pending" || course.review?.status === "PENDING";

            return (
              <Link
                key={course.id}
                to={`/teach/${course.id}?from=editor`}
                className="rounded-surface border border-line bg-surface p-4 transition hover:border-brand shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="min-w-0 flex-1 font-semibold text-ink text-base hover:text-brand">
                      {course.title}
                    </h2>
                    <span
                      className={`shrink-0 rounded px-2.5 py-0.5 text-xs font-semibold ${
                        isPending
                          ? "bg-brand-muted text-brand-hover"
                          : isApproved
                          ? "bg-success-subtle text-success"
                          : "bg-warning-subtle text-warning"
                      }`}
                    >
                      {isPending ? "IN REVIEW" : isApproved ? "APPROVED" : "CHANGES REQUESTED"}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-ink-subtle">
                    Author: <strong>{course.instructor?.name || course.instructor?.email || "Unknown instructor"}</strong> ·{" "}
                    {course.category || "General"} · {course.stats?.lessonCount || 0} lessons
                  </p>

                  {course.review?.submittedAt && (
                    <p className="mt-2 text-xs text-ink-subtle">
                      Submitted: {new Date(course.review.submittedAt).toLocaleString()}
                    </p>
                  )}

                  {course.review?.note && (
                    <p className="mt-2.5 line-clamp-2 rounded bg-surface-sunken p-2.5 text-xs text-ink-muted border border-line">
                      Note: "{course.review.note}"
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-xs">
                  <span className="text-brand font-medium">Click to inspect content & decide →</span>
                  <span className="text-ink-subtle">ID: {course.id.slice(-6)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
