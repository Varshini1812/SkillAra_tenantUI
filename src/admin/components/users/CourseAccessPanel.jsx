import { useCallback, useEffect, useState } from "react";

import { fetchCourses } from "../../../api/courses.js";
import {
  dropEnrollment,
  fetchUserEnrollments,
  grantCourseAccess,
} from "../../../api/enrollments.js";
import { getErrorMessage } from "../../../api/client.js";

const STATUS = {
  ACTIVE: { label: "Enrolled", chip: "bg-emerald-100 text-emerald-700" },
  COMPLETED: { label: "Completed", chip: "bg-emerald-100 text-emerald-700" },
  PENDING_APPROVAL: { label: "Awaiting approval", chip: "bg-amber-100 text-amber-800" },
  PENDING_PAYMENT: { label: "Awaiting approval", chip: "bg-amber-100 text-amber-800" },
  REJECTED: { label: "Declined", chip: "bg-rose-100 text-rose-700" },
};

/**
 * Which courses one learner is on, and the controls to change that.
 *
 * Shows pending and declined rows too, not just active ones, so staff opening a student can
 * see a request is outstanding rather than wondering why the person has no access.
 */
export default function CourseAccessPanel({ user }) {
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [mine, catalog] = await Promise.all([
        fetchUserEnrollments(user.id),
        fetchCourses({ status: "PUBLISHED", limit: 200 }),
      ]);
      setEnrollments(mine);
      setCourses(catalog.items || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    load();
  }, [load]);

  // Don't offer a course they are already on or waiting on.
  const taken = new Set(
    enrollments.filter((e) => e.status !== "REJECTED").map((e) => e.course?.id)
  );
  const addable = courses.filter((c) => !taken.has(c.id));

  const grant = async () => {
    const target = courseId || addable[0]?.id;
    if (!target) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await grantCourseAccess(user.id, target);
      setNotice("Enrolled. They've been notified.");
      setCourseId("");
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (enrollment) => {
    if (!window.confirm(`Remove access to ${enrollment.course?.title || "this course"}?`)) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await dropEnrollment(enrollment.id);
      setNotice("Access removed.");
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-6 border-t border-slate-100 pt-5">
      <h3 className="text-sm font-semibold text-slate-800">Course access</h3>
      <p className="mt-1 text-xs text-slate-500">
        Free courses are self-service. Paid ones need approval — or enrol this person directly
        here.
      </p>

      {error && <div className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-600">{error}</div>}
      {notice && (
        <div className="mt-3 rounded-lg bg-green-50 p-2 text-sm text-green-700">{notice}</div>
      )}

      {loading ? (
        <p className="mt-3 text-sm text-slate-400">Loading course access…</p>
      ) : enrollments.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-slate-200 p-3 text-sm text-slate-400">
          Not enrolled in any course yet.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200">
          {enrollments.map((e) => {
            const badge = STATUS[e.status] || { label: e.status, chip: "bg-slate-100 text-slate-600" };
            return (
              <li key={e.id} className="flex items-center gap-3 px-3 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-slate-800">
                    {e.course?.title || "Unknown course"}
                  </span>
                  <span className="text-xs text-slate-400">
                    {e.course?.price > 0 ? `${e.course.currency} ${e.course.price}` : "Free"}
                    {e.grantedByStaff ? " · added by staff" : ""}
                  </span>
                </span>
                <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${badge.chip}`}>
                  {badge.label}
                </span>
                {["ACTIVE", "COMPLETED"].includes(e.status) && (
                  <button
                    type="button"
                    onClick={() => remove(e)}
                    disabled={saving}
                    className="shrink-0 text-xs font-medium text-rose-600 hover:underline disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          disabled={saving || addable.length === 0}
          className="admin-input flex-1"
          aria-label="Course to add"
        >
          {addable.length === 0 ? (
            <option value="">No other published courses</option>
          ) : (
            <>
              <option value="">Choose a course…</option>
              {addable.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                  {c.price > 0 ? ` — ${c.currency} ${c.price}` : " — Free"}
                </option>
              ))}
            </>
          )}
        </select>
        <button
          type="button"
          onClick={grant}
          disabled={saving || !courseId}
          className="admin-btn-primary shrink-0 disabled:opacity-50"
        >
          {saving ? "Adding…" : "Add course"}
        </button>
      </div>
    </section>
  );
}
