import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  blockCourse,
  fetchCourses,
  unblockCourse,
  unpublishCourse,
} from "../../api/courses.js";
import { getErrorMessage } from "../../api/client.js";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";
import Breadcrumb from "../components/ui/Breadcrumb.jsx";
import { PageHeader } from "../components/ui/primitives.jsx";
import FilterBar from "../components/ui/FilterBar.jsx";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "PUBLISHED", label: "Published" },
  { value: "DRAFT", label: "Drafts" },
  { value: "ARCHIVED", label: "Archived" },
];

const STATUS_BADGE = {
  DRAFT: "bg-surface-sunken text-ink-muted",
  PUBLISHED: "bg-success-subtle text-success",
  ARCHIVED: "bg-warning-subtle text-warning",
};

/** NOT_SUBMITTED is deliberately absent — a plain draft needs no extra badge. */
const REVIEW_BADGE = {
  PENDING: { label: "In review", chip: "bg-brand-muted text-brand-hover" },
  CHANGES_REQUESTED: { label: "Changes requested", chip: "bg-warning-subtle text-warning" },
  APPROVED: { label: "Approved", chip: "bg-success-subtle text-success" },
};

function BlockDialog({ course, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          await onConfirm(reason.trim());
          setSaving(false);
        }}
        className="w-full max-w-md rounded-surface bg-surface p-6 shadow-panel"
      >
        <h2 className="text-lg font-semibold">Block “{course.title}”</h2>
        <p className="mt-1 text-sm text-ink-subtle">
          Blocking hides the course from learners immediately and stops the instructor
          re-publishing it. The reason is shown to the instructor.
        </p>

        <label className="mt-4 block text-sm font-medium text-ink-muted">
          Reason
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            minLength={3}
            maxLength={500}
            autoFocus
            className="mt-1 w-full rounded-control border border-line-strong px-3 py-2 text-sm"
            placeholder="e.g. Copyright complaint received on lesson 4"
          />
        </label>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-control border border-line-strong px-4 py-2 text-sm hover:bg-surface-sunken"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || reason.trim().length < 3}
            className="rounded-control bg-danger px-4 py-2 text-sm font-medium text-white hover:bg-danger-hover disabled:opacity-50"
          >
            {saving ? "Blocking…" : "Block course"}
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * Tenant-wide course oversight for the organization owner and org admins.
 * The list comes from GET /api/courses, which returns every course in the tenant
 * (including drafts and blocked ones) for these roles and nothing extra for others.
 */
export default function CourseModeration() {
  const { user } = useAdminAuth();

  const [courses, setCourses] = useState([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [blockTarget, setBlockTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { items } = await fetchCourses({
        status: status || undefined,
        search: search || undefined,
        limit: 100,
      });
      setCourses(items);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const apply = async (fn, successMessage) => {
    setError("");
    setNotice("");
    try {
      const updated = await fn();
      setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setNotice(successMessage);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const counts = {
    total: courses.length,
    published: courses.filter((c) => c.status === "PUBLISHED").length,
    inReview: courses.filter((c) => c.review?.status === "PENDING").length,
    blocked: courses.filter((c) => c.moderation?.isBlocked).length,
  };

  return (
    <div>
      <PageHeader
        breadcrumb={<Breadcrumb items={[{ label: "Dashboard", to: "/admin" }, { label: "Courses" }]} />}
        title="Course catalog"
        description="Every course in your organization. You can unpublish or block any of them."
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchLabel="Search courses"
        searchPlaceholder="Search courses by title"
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total courses", value: counts.total },
          { label: "Published", value: counts.published },
          { label: "Awaiting review", value: counts.inReview },
          { label: "Blocked", value: counts.blocked },
        ].map((stat) => (
          <div key={stat.label} className="rounded-surface border border-line bg-surface p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-ink">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setStatus(f.value)}
            className={`rounded-control px-3 py-1.5 text-sm transition ${
              status === f.value
                ? "bg-brand-subtle font-medium text-brand-hover"
                : "text-ink-muted hover:bg-surface-sunken"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <div className="mt-4 rounded-control bg-danger-subtle p-3 text-sm text-danger">{error}</div>}
      {notice && <div className="mt-4 rounded-control bg-success-subtle p-3 text-sm text-success">{notice}</div>}

      <div className="mt-4 overflow-x-auto rounded-surface border border-line bg-surface">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-surface-sunken text-left text-xs uppercase tracking-wide text-ink-subtle">
            <tr>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Instructor</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Lessons</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink-subtle">
                  Loading…
                </td>
              </tr>
            ) : courses.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink-subtle">
                  No courses found.
                </td>
              </tr>
            ) : (
              courses.map((course) => (
                <tr key={course.id} className="hover:bg-surface-sunken/50">
                  <td className="px-4 py-3">
                    <Link to={`/courses/${course.id}`} className="font-medium hover:text-brand">
                      {course.title}
                    </Link>
                    {course.category && (
                      <p className="text-xs text-ink-subtle">{course.category}</p>
                    )}
                    {course.moderation?.isBlocked && course.moderation.reason && (
                      <p className="mt-0.5 text-xs text-danger">
                        Blocked: {course.moderation.reason}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {course.instructor?.name || course.instructor?.email || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-semibold ${
                        STATUS_BADGE[course.status] || STATUS_BADGE.DRAFT
                      }`}
                    >
                      {course.status}
                    </span>
                    {course.moderation?.isBlocked && (
                      <span className="ml-1 rounded bg-danger-subtle px-2 py-0.5 text-xs font-semibold text-danger">
                        Blocked
                      </span>
                    )}
                    {/* Review state only matters while a course is not yet live. */}
                    {course.status !== "PUBLISHED" && REVIEW_BADGE[course.review?.status] && (
                      <span
                        className={`ml-1 rounded px-2 py-0.5 text-xs font-semibold ${
                          REVIEW_BADGE[course.review.status].chip
                        }`}
                      >
                        {REVIEW_BADGE[course.review.status].label}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{course.stats?.lessonCount || 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {course.status === "PUBLISHED" && (
                        <button
                          type="button"
                          onClick={() =>
                            apply(() => unpublishCourse(course.id), `“${course.title}” unpublished.`)
                          }
                          className="rounded border border-line-strong px-2 py-1 text-xs font-medium hover:bg-surface-sunken"
                        >
                          Unpublish
                        </button>
                      )}
                      {course.moderation?.isBlocked ? (
                        <button
                          type="button"
                          onClick={() =>
                            apply(() => unblockCourse(course.id), `“${course.title}” unblocked.`)
                          }
                          className="rounded border border-success-border px-2 py-1 text-xs font-medium text-success hover:bg-success-subtle"
                        >
                          Unblock
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setBlockTarget(course)}
                          className="rounded border border-danger-border px-2 py-1 text-xs font-medium text-danger hover:bg-danger-subtle"
                        >
                          Block
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {blockTarget && (
        <BlockDialog
          course={blockTarget}
          onClose={() => setBlockTarget(null)}
          onConfirm={async (reason) => {
            await apply(
              () => blockCourse(blockTarget.id, reason),
              `“${blockTarget.title}” blocked.`
            );
            setBlockTarget(null);
          }}
        />
      )}

      {!user?.isTenantAdmin && (
        <p className="mt-3 text-xs text-ink-subtle">
          Moderation actions are recorded against your account.
        </p>
      )}
    </div>
  );
}
