import { useCallback, useEffect, useMemo, useState } from "react";

import { bulkEnroll, dropEnrollment, fetchCourseEnrollments, fetchCourseEnrollableUsers } from "../../api/enrollments.js";
import { getErrorMessage } from "../../api/client.js";
import Icon from "../../admin/components/ui/Icon.jsx";

/**
 * Roster management for a course — the admin-driven half of the two enrolment paths.
 *
 * Students who sign themselves up appear here once they enrol. Students the
 * organization has added can be enrolled directly from the picker below, which is
 * what "add a student and they are already enrolled" means in practice.
 */
export default function CourseStudents({ courseId }) {
  const [enrollments, setEnrollments] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setEnrollments(await fetchCourseEnrollments(courseId));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  const openPicker = async () => {
    setPickerOpen(true);
    setError("");
    try {
      setCandidates(await fetchCourseEnrollableUsers(courseId));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const enrolledIds = useMemo(
    () => new Set(enrollments.map((e) => String(e.user?.id || e.user?._id || e.userId))),
    [enrollments]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return candidates
      .filter((u) => !enrolledIds.has(String(u.id || u._id)))
      .filter(
        (u) =>
          !q ||
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q)
      );
  }, [candidates, enrolledIds, search]);

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const submit = async () => {
    if (selected.size === 0) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await bulkEnroll(courseId, [...selected]);
      setNotice(
        `${result.addedCount} student${result.addedCount === 1 ? "" : "s"} enrolled` +
          (result.skipped?.length ? ` · ${result.skipped.length} already enrolled` : "")
      );
      setSelected(new Set());
      setPickerOpen(false);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (enrollment) => {
    const name = enrollment.user?.name || enrollment.user?.email || "this student";
    if (!window.confirm(`Remove ${name} from this course?`)) return;
    setError("");
    setNotice("");
    try {
      await dropEnrollment(enrollment.id);
      setNotice(`${name} removed from the course.`);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="rounded-surface border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold text-ink">Students</h2>
          <p className="text-xs text-ink-subtle">
            {enrollments.length} enrolled · learners can also enrol themselves from the catalog
          </p>
        </div>
        <button
          type="button"
          onClick={openPicker}
          className="rounded-control bg-ink px-3 py-1.5 text-sm font-medium text-white hover:bg-ink"
        >
          Add students
        </button>
      </div>

      {error && <div className="mt-3 rounded-control bg-danger-subtle p-2 text-sm text-danger">{error}</div>}
      {notice && (
        <div className="mt-3 rounded-control bg-success-subtle p-2 text-sm text-success">{notice}</div>
      )}

      {loading ? (
        <p className="mt-4 text-sm text-ink-subtle">Loading roster…</p>
      ) : enrollments.length === 0 ? (
        <p className="mt-4 rounded-control border border-dashed border-line-strong p-6 text-center text-sm text-ink-subtle">
          Nobody is enrolled yet.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {enrollments.map((e) => (
            <li key={e.id} className="flex items-center gap-3 py-2 text-sm">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-xs font-semibold text-ink-muted">
                {(e.user?.name?.[0] || e.user?.email?.[0] || "?").toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-ink">
                  {e.user?.name || e.user?.email}
                </span>
                <span className="block truncate text-xs text-ink-subtle">{e.user?.email}</span>
              </span>
              <span className="w-24 shrink-0 text-right text-xs text-ink-subtle">
                {e.completedLessons || 0} done · {e.mastery || 0}%
              </span>
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium ${
                  e.status === "COMPLETED"
                    ? "bg-success-subtle text-success"
                    : "bg-surface-sunken text-ink-muted"
                }`}
              >
                {e.status}
              </span>
              <button
                type="button"
                onClick={() => remove(e)}
                className="shrink-0 rounded border border-danger-border px-2 py-1 text-xs font-medium text-danger hover:bg-danger-subtle"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="flex max-h-[80vh] w-full max-w-md flex-col rounded-surface bg-surface ">
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <h3 className="font-semibold text-ink">Add students</h3>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="rounded p-1 text-ink-subtle hover:bg-surface-sunken"
                aria-label="Close"
              >
                <Icon name="close" size={16} />
              </button>
            </div>

            <div className="border-b border-line px-5 py-3">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="w-full rounded-control border border-line-strong px-3 py-2 text-sm"
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-2">
              {filtered.length === 0 ? (
                <p className="py-6 text-center text-sm text-ink-subtle">
                  No users available to add.
                </p>
              ) : (
                filtered.map((u) => {
                  const id = String(u.id || u._id);
                  return (
                    <label
                      key={id}
                      className="flex cursor-pointer items-center gap-3 rounded-control px-2 py-2 text-sm hover:bg-surface-sunken"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(id)}
                        onChange={() => toggle(id)}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-ink">
                          {u.name || u.email}
                        </span>
                        <span className="block truncate text-xs text-ink-subtle">{u.email}</span>
                      </span>
                    </label>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between border-t border-line px-5 py-3">
              <span className="text-xs text-ink-subtle">{selected.size} selected</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPickerOpen(false)}
                  className="rounded-control border border-line-strong px-3 py-1.5 text-sm hover:bg-surface-sunken"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={saving || selected.size === 0}
                  className="rounded-control bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50"
                >
                  {saving ? "Enrolling…" : "Enrol selected"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
