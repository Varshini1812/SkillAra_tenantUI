import { useCallback, useEffect, useMemo, useState } from "react";

import { bulkEnroll, fetchCourseEnrollments } from "../../api/enrollments.js";
import { fetchUsers } from "../../admin/api/admin.js";
import { getErrorMessage } from "../../api/client.js";

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
      const data = await fetchUsers();
      const list = Array.isArray(data) ? data : data?.users || [];
      setCandidates(list);
    } catch (err) {
      // Instructors cannot list tenant users; only staff can. Say so plainly.
      setError(
        `${getErrorMessage(err)} — only organization admins can browse the full user list.`
      );
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

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold text-slate-900">Students</h2>
          <p className="text-xs text-slate-500">
            {enrollments.length} enrolled · learners can also enrol themselves from the catalog
          </p>
        </div>
        <button
          type="button"
          onClick={openPicker}
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-900"
        >
          Add students
        </button>
      </div>

      {error && <div className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-600">{error}</div>}
      {notice && (
        <div className="mt-3 rounded-lg bg-green-50 p-2 text-sm text-green-700">{notice}</div>
      )}

      {loading ? (
        <p className="mt-4 text-sm text-slate-400">Loading roster…</p>
      ) : enrollments.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
          Nobody is enrolled yet.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100">
          {enrollments.map((e) => (
            <li key={e.id} className="flex items-center gap-3 py-2 text-sm">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                {(e.user?.name?.[0] || e.user?.email?.[0] || "?").toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-slate-800">
                  {e.user?.name || e.user?.email}
                </span>
                <span className="block truncate text-xs text-slate-400">{e.user?.email}</span>
              </span>
              <span className="w-24 shrink-0 text-right text-xs text-slate-500">
                {e.completedLessons || 0} done · {e.mastery || 0}%
              </span>
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium ${
                  e.status === "COMPLETED"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {e.status}
              </span>
            </li>
          ))}
        </ul>
      )}

      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="flex max-h-[80vh] w-full max-w-md flex-col rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <h3 className="font-semibold text-slate-900">Add students</h3>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="border-b border-slate-100 px-5 py-3">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-2">
              {filtered.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">
                  No users available to add.
                </p>
              ) : (
                filtered.map((u) => {
                  const id = String(u.id || u._id);
                  return (
                    <label
                      key={id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(id)}
                        onChange={() => toggle(id)}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-slate-800">
                          {u.name || u.email}
                        </span>
                        <span className="block truncate text-xs text-slate-400">{u.email}</span>
                      </span>
                      <span className="shrink-0 text-[11px] text-slate-400">{u.role}</span>
                    </label>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
              <span className="text-xs text-slate-500">{selected.size} selected</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPickerOpen(false)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={saving || selected.size === 0}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
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
