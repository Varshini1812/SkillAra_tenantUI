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

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "PUBLISHED", label: "Published" },
  { value: "DRAFT", label: "Drafts" },
  { value: "ARCHIVED", label: "Archived" },
];

const STATUS_BADGE = {
  DRAFT: "bg-slate-100 text-slate-600",
  PUBLISHED: "bg-emerald-100 text-emerald-700",
  ARCHIVED: "bg-amber-100 text-amber-700",
};

function BlockDialog({ course, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          await onConfirm(reason.trim());
          setSaving(false);
        }}
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      >
        <h2 className="text-lg font-semibold">Block “{course.title}”</h2>
        <p className="mt-1 text-sm text-slate-500">
          Blocking hides the course from learners immediately and stops the instructor
          re-publishing it. The reason is shown to the instructor.
        </p>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Reason
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            minLength={3}
            maxLength={500}
            autoFocus
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="e.g. Copyright complaint received on lesson 4"
          />
        </label>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || reason.trim().length < 3}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
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
    blocked: courses.filter((c) => c.moderation?.isBlocked).length,
  };

  return (
    <div>
      <Breadcrumb items={[{ label: "Dashboard", to: "/admin" }, { label: "Courses" }]} />

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Course catalog</h1>
          <p className="text-sm text-slate-500">
            Every course in your organization. You can unpublish or block any of them.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses…"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Total courses", value: counts.total },
          { label: "Published", value: counts.published },
          { label: "Blocked", value: counts.blocked },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setStatus(f.value)}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              status === f.value
                ? "bg-indigo-50 font-medium text-indigo-700"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
      {notice && <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{notice}</div>}

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Instructor</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Lessons</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : courses.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  No courses found.
                </td>
              </tr>
            ) : (
              courses.map((course) => (
                <tr key={course.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <Link to={`/courses/${course.id}`} className="font-medium hover:text-indigo-600">
                      {course.title}
                    </Link>
                    {course.category && (
                      <p className="text-xs text-slate-400">{course.category}</p>
                    )}
                    {course.moderation?.isBlocked && course.moderation.reason && (
                      <p className="mt-0.5 text-xs text-rose-600">
                        Blocked: {course.moderation.reason}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
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
                      <span className="ml-1 rounded bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                        Blocked
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{course.stats?.lessonCount || 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {course.status === "PUBLISHED" && (
                        <button
                          type="button"
                          onClick={() =>
                            apply(() => unpublishCourse(course.id), `“${course.title}” unpublished.`)
                          }
                          className="rounded border border-slate-300 px-2 py-1 text-xs font-medium hover:bg-slate-50"
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
                          className="rounded border border-emerald-300 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                        >
                          Unblock
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setBlockTarget(course)}
                          className="rounded border border-rose-300 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50"
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
        <p className="mt-3 text-xs text-slate-400">
          Moderation actions are recorded against your account.
        </p>
      )}
    </div>
  );
}
