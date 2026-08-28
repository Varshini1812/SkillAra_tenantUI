import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { createCourse, fetchCourses } from "../../api/courses.js";
import { getErrorMessage } from "../../api/client.js";
import { usePermissions } from "../../hooks/usePermissions.js";

const LEVELS = [
  { value: "ALL_LEVELS", label: "All levels" },
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

/**
 * One label per course, folding `status` and `review.status` into the single thing the
 * author needs to know: where is this course, and is it waiting on me?
 */
function stageOf(course) {
  if (course.status === "ARCHIVED") return "archived";
  if (course.status === "PUBLISHED") return "live";
  switch (course.review?.status) {
    case "PENDING":
      return "in-review";
    case "CHANGES_REQUESTED":
      return "changes";
    case "APPROVED":
      return "approved";
    default:
      return "draft";
  }
}

const STAGE = {
  draft: { label: "Draft", chip: "bg-slate-100 text-slate-600", next: "Add lessons, then send for review" },
  "in-review": { label: "In review", chip: "bg-indigo-100 text-indigo-700", next: "Waiting on your reviewer" },
  changes: { label: "Changes requested", chip: "bg-amber-100 text-amber-800", next: "Reviewer left notes for you" },
  approved: { label: "Ready to publish", chip: "bg-emerald-100 text-emerald-700", next: "Approved — publish when you're ready" },
  live: { label: "Live", chip: "bg-emerald-600 text-white", next: "" },
  archived: { label: "Archived", chip: "bg-slate-200 text-slate-500", next: "" },
};

/** Stages where the ball is in the author's court. */
const NEEDS_ME = new Set(["changes", "approved"]);

const TABS = [
  { value: "attention", label: "Needs you" },
  { value: "", label: "All" },
  { value: "draft", label: "Drafts" },
  { value: "in-review", label: "In review" },
  { value: "live", label: "Live" },
  { value: "archived", label: "Archived" },
];

function NewCourseDialog({ onClose, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    category: "",
    level: "ALL_LEVELS",
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      onCreated(
        await createCourse({
          title: form.title.trim(),
          subtitle: form.subtitle.trim(),
          category: form.category.trim(),
          level: form.level,
          description: form.description,
        })
      );
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:items-center">
      <form
        onSubmit={submit}
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">Create a course</h2>
          <p className="mt-1 text-sm text-slate-500">
            Only the title is required — everything here can be changed later.
          </p>
        </div>

        <div className="grid gap-5 px-6 py-5 sm:grid-cols-2">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 sm:col-span-2">{error}</div>
          )}

          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">Title</span>
            <input
              value={form.title}
              onChange={set("title")}
              required
              maxLength={200}
              autoFocus
              placeholder="Node.js for Beginners"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">
              Subtitle <span className="font-normal text-slate-400">optional</span>
            </span>
            <input
              value={form.subtitle}
              onChange={set("subtitle")}
              maxLength={300}
              placeholder="Build and ship your first backend service"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Category <span className="font-normal text-slate-400">optional</span>
            </span>
            <input
              value={form.category}
              onChange={set("category")}
              maxLength={120}
              placeholder="Backend Development"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Level</span>
            <select
              value={form.level}
              onChange={set("level")}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">
              Description <span className="font-normal text-slate-400">optional</span>
            </span>
            <textarea
              value={form.description}
              onChange={set("description")}
              rows={4}
              placeholder="Who is this course for, and what will they be able to do by the end?"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </label>

          {/* Publishing goes through content review, so say so before they start. */}
          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500 sm:col-span-2">
            <span className="font-medium text-slate-700">What happens next:</span> add modules and
            lessons, then send the course to a content reviewer. Once they approve it you can
            publish it to the catalog.
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !form.title.trim()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Creating…" : "Create and open editor"}
          </button>
        </div>
      </form>
    </div>
  );
}

function CourseRow({ course }) {
  const stage = STAGE[stageOf(course)];
  return (
    <Link
      to={`/teach/${course.id}`}
      className="flex items-center gap-4 px-4 py-3.5 transition hover:bg-slate-50"
    >
      <div className="hidden h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 sm:block">
        {course.thumbnailUrl && (
          <img src={course.thumbnailUrl} alt="" className="h-full w-full object-cover" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">{course.title}</p>
        <p className="mt-0.5 truncate text-xs text-slate-500">
          {course.category || "Uncategorised"} · {course.stats?.lessonCount || 0} lessons ·{" "}
          {course.stats?.enrolledCount || 0} enrolled
        </p>
        {stage.next && <p className="mt-0.5 truncate text-xs text-slate-400">{stage.next}</p>}
      </div>

      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${stage.chip}`}>
        {stage.label}
      </span>
    </Link>
  );
}

export default function MyCourses() {
  const navigate = useNavigate();
  const { can } = usePermissions();

  const [courses, setCourses] = useState([]);
  const [tab, setTab] = useState("attention");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Fetched once and filtered here: the API filters on `status`, but the tabs that matter
    // to an author are review stages, which `status` alone cannot express.
    fetchCourses({ mine: true, limit: 200 })
      .then(({ items }) => !cancelled && setCourses(items || []))
      .catch((err) => !cancelled && setError(getErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(() => {
    const c = { attention: 0, draft: 0, "in-review": 0, live: 0, archived: 0 };
    for (const course of courses) {
      const stage = stageOf(course);
      if (c[stage] !== undefined) c[stage] += 1;
      if (NEEDS_ME.has(stage)) c.attention += 1;
    }
    return c;
  }, [courses]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return courses.filter((course) => {
      const stage = stageOf(course);
      if (tab === "attention" && !NEEDS_ME.has(stage)) return false;
      if (tab && tab !== "attention" && stage !== tab) return false;
      if (term && !`${course.title} ${course.category || ""}`.toLowerCase().includes(term)) {
        return false;
      }
      return true;
    });
  }, [courses, tab, search]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My courses</h1>
          <p className="mt-1 text-sm text-slate-500">
            {courses.length} course{courses.length === 1 ? "" : "s"}
            {counts.attention > 0 && (
              <span className="text-amber-700"> · {counts.attention} waiting on you</span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {can("courses", "approve") && (
            <Link
              to="/review-queue"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
            >
              Review queue
            </Link>
          )}
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            New course
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1">
          {TABS.map((t) => {
            const n = t.value === "" ? courses.length : counts[t.value] ?? 0;
            return (
              <button
                key={t.value || "all"}
                type="button"
                onClick={() => setTab(t.value)}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  tab === t.value
                    ? "bg-indigo-50 font-medium text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t.label}
                <span className="ml-1.5 text-xs text-slate-400">{n}</span>
              </button>
            );
          })}
        </div>

        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your courses…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm sm:w-64"
        />
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <p className="py-16 text-center text-sm text-slate-400">Loading your courses…</p>
      ) : courses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 px-6 py-16 text-center">
          <p className="text-sm font-medium text-slate-700">You haven&apos;t created a course yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Start with a title, add your modules and lessons, then send it to a content reviewer
            for approval.
          </p>
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Create your first course
          </button>
        </div>
      ) : visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 py-16 text-center text-sm text-slate-400">
          {tab === "attention"
            ? "Nothing is waiting on you right now."
            : "No courses match this filter."}
        </p>
      ) : (
        <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {visible.map((course) => (
            <CourseRow key={course.id} course={course} />
          ))}
        </div>
      )}

      {dialogOpen && (
        <NewCourseDialog
          onClose={() => setDialogOpen(false)}
          onCreated={(course) => navigate(`/teach/${course.id}`)}
        />
      )}
    </div>
  );
}
