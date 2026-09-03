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
  draft: { label: "Draft", chip: "bg-surface-sunken text-ink-muted", next: "Add lessons, then send for review" },
"in-review": { label: "In review", chip: "bg-brand-muted text-brand-hover", next: "Waiting on your reviewer" },
  changes: { label: "Changes requested", chip: "bg-warning-subtle text-warning", next: "Reviewer left notes for you" },
  approved: { label: "Ready to publish", chip: "bg-success-subtle text-success", next: "Approved — publish when you're ready" },
  live: { label: "Live", chip: "bg-success text-white", next: "" },
  archived: { label: "Archived", chip: "bg-surface-sunken text-ink-subtle", next: "" },
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
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/50 p-4 sm:items-center">
      <form
        onSubmit={submit}
        className="w-full max-w-2xl overflow-hidden rounded-surface bg-surface "
      >
        <div className="border-b border-line px-6 py-5">
          <h2 className="text-lg font-semibold text-ink">Create a course</h2>
          <p className="mt-1 text-sm text-ink-subtle">
            Only the title is required — everything here can be changed later.
          </p>
        </div>

        <div className="grid gap-5 px-6 py-5 sm:grid-cols-2">
          {error && (
            <div className="rounded-control bg-danger-subtle p-3 text-sm text-danger sm:col-span-2">{error}</div>
          )}

          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-ink-muted">Title</span>
            <input
              value={form.title}
              onChange={set("title")}
              required
              maxLength={200}
              autoFocus
              placeholder="Node.js for Beginners"
              className="mt-1 w-full rounded-control border border-line-strong px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-ink-muted">
              Subtitle <span className="font-normal text-ink-subtle">optional</span>
            </span>
            <input
              value={form.subtitle}
              onChange={set("subtitle")}
              maxLength={300}
              placeholder="Build and ship your first backend service"
              className="mt-1 w-full rounded-control border border-line-strong px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-ink-muted">
              Category <span className="font-normal text-ink-subtle">optional</span>
            </span>
            <input
              value={form.category}
              onChange={set("category")}
              maxLength={120}
              placeholder="Backend Development"
              className="mt-1 w-full rounded-control border border-line-strong px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-ink-muted">Level</span>
            <select
              value={form.level}
              onChange={set("level")}
              className="mt-1 w-full rounded-control border border-line-strong px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            >
              {LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-ink-muted">
              Description <span className="font-normal text-ink-subtle">optional</span>
            </span>
            <textarea
              value={form.description}
              onChange={set("description")}
              rows={4}
              placeholder="Who is this course for, and what will they be able to do by the end?"
              className="mt-1 w-full rounded-control border border-line-strong px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </label>

          {/* Publishing goes through content review, so say so before they start. */}
          <div className="rounded-control bg-surface-sunken p-3 text-xs text-ink-subtle sm:col-span-2">
            <span className="font-medium text-ink-muted">What happens next:</span> add modules and
            lessons, then send the course to a content reviewer. Once they approve it you can
            publish it to the catalog.
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-line bg-surface-sunken px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-control border border-line-strong bg-surface px-4 py-2 text-sm hover:bg-surface-sunken"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !form.title.trim()}
            className="rounded-control bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50"
          >
            {saving ? "Creating…" : "Create and open editor"}
          </button>
        </div>
      </form>
    </div>
  );
}

import { useSearchParams } from "react-router-dom";
import { publishCourse, deleteCourse } from "../../api/courses.js";

function CourseRow({ course, selected, onToggle }) {
  const stage = STAGE[stageOf(course)];
  return (
    <div className="flex items-center gap-4 px-4 py-3.5 transition hover:bg-surface-sunken">
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggle(course.id)}
        className="h-4 w-4 rounded border-line-strong text-brand focus:ring-brand"
      />
      <Link
        to={`/teach/${course.id}`}
        className="hidden h-12 w-20 shrink-0 overflow-hidden rounded-control bg-gradient-to-br from-brand to-brand sm:block"
      >
        {course.thumbnailUrl && (
          <img src={course.thumbnailUrl} alt="" className="h-full w-full object-cover" />
        )}
      </Link>

      <Link to={`/teach/${course.id}`} className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink hover:text-brand">{course.title}</p>
        <p className="mt-0.5 truncate text-xs text-ink-subtle">
          {course.category || "Uncategorised"} · {course.stats?.lessonCount || 0} lessons ·{" "}
          {course.stats?.enrolledCount || 0} enrolled
        </p>
        {stage.next && <p className="mt-0.5 truncate text-xs text-ink-subtle">{stage.next}</p>}
      </Link>

      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${stage.chip}`}>
        {stage.label}
      </span>
    </div>
  );
}

export default function MyCourses() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { can } = usePermissions();

  const [courses, setCourses] = useState([]);
  const activeTabParam = searchParams.get("tab") || "attention";
  const [tab, setTab] = useState(activeTabParam);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkActioning, setBulkActioning] = useState(false);

  useEffect(() => {
    const p = searchParams.get("tab");
    if (p !== null) {
      setTab(p === "all" ? "" : p);
    }
  }, [searchParams]);

  const handleTabChange = (val) => {
    setTab(val);
    setSearchParams(val ? { tab: val === "" ? "all" : val } : {});
  };

  useEffect(() => {
    let cancelled = false;
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

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === visible.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(visible.map((c) => c.id));
    }
  };

  const handleBulkPublish = async () => {
    if (!selectedIds.length) return;
    setBulkActioning(true);
    try {
      await Promise.all(selectedIds.map((id) => publishCourse(id).catch(() => null)));
      const { items } = await fetchCourses({ mine: true, limit: 200 });
      setCourses(items || []);
      setSelectedIds([]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBulkActioning(false);
    }
  };

  const handleBulkArchive = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Archive ${selectedIds.length} selected course(s)?`)) return;
    setBulkActioning(true);
    try {
      await Promise.all(selectedIds.map((id) => deleteCourse(id).catch(() => null)));
      const { items } = await fetchCourses({ mine: true, limit: 200 });
      setCourses(items || []);
      setSelectedIds([]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBulkActioning(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">My courses</h1>
          <p className="mt-1 text-sm text-ink-subtle">
            {courses.length} course{courses.length === 1 ? "" : "s"}
            {counts.attention > 0 && (
              <span className="text-warning font-semibold"> · {counts.attention} waiting on you</span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {can("courses", "approve") && (
            <Link
              to="/review-queue"
              className="rounded-control border border-line-strong px-4 py-2 text-sm hover:bg-surface-sunken"
            >
              Review queue
            </Link>
          )}
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="rounded-control bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover shadow-sm"
          >
            + Create New Course
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
                onClick={() => handleTabChange(t.value)}
                className={`rounded-control px-3 py-1.5 text-sm transition ${
                  tab === t.value
                    ? "bg-brand-subtle font-medium text-brand-hover"
                    : "text-ink-muted hover:bg-surface-sunken"
                }`}
              >
                {t.label}
                <span className="ml-1.5 text-xs text-ink-subtle">{n}</span>
              </button>
            );
          })}
        </div>

        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your courses…"
          className="w-full rounded-control border border-line-strong px-3 py-2 text-sm sm:w-64"
        />
      </div>

      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between rounded-surface border border-brand-border bg-brand-subtle p-3 text-sm">
          <span className="font-medium text-brand-hover">
            {selectedIds.length} course(s) selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBulkPublish}
              disabled={bulkActioning}
              className="rounded-control bg-brand px-3 py-1 text-xs font-medium text-white hover:bg-brand-hover disabled:opacity-50"
            >
              Publish selected
            </button>
            <button
              type="button"
              onClick={handleBulkArchive}
              disabled={bulkActioning}
              className="rounded-control border border-line-strong bg-surface px-3 py-1 text-xs font-medium text-danger hover:bg-danger-subtle disabled:opacity-50"
            >
              Archive selected
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-xs text-ink-subtle hover:underline"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {error && <div className="rounded-control bg-danger-subtle p-3 text-sm text-danger">{error}</div>}

      {loading ? (
        <p className="py-16 text-center text-sm text-ink-subtle">Loading your courses…</p>
      ) : courses.length === 0 ? (
        <div className="rounded-surface border border-dashed border-line-strong px-6 py-16 text-center">
          <p className="text-sm font-medium text-ink-muted">You haven&apos;t created a course yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-ink-subtle">
            Start with a title, add your modules and lessons, then send it to a content reviewer
            for approval.
          </p>
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="mt-4 rounded-control bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
          >
            Create your first course
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-surface border border-dashed border-line px-6 py-12 text-center text-sm text-ink-subtle">
          {tab === "attention" ? (
            <div>
              <p className="font-semibold text-ink">Nothing is waiting on you right now.</p>
              <p className="mt-1 text-xs text-ink-subtle max-w-md mx-auto">
                Courses requiring your action — such as reviewer notes needing edits or approved drafts ready to publish — will automatically appear in this view.
              </p>
            </div>
          ) : (
            "No courses match this filter."
          )}
        </div>
      ) : (
        <div className="divide-y divide-line overflow-hidden rounded-surface border border-line bg-surface">
          <div className="flex items-center justify-between border-b border-line px-4 py-2 bg-surface-sunken text-xs font-semibold text-ink-subtle">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.length === visible.length && visible.length > 0}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-line-strong text-brand"
              />
              Select All
            </label>
            <span>Stage / Status</span>
          </div>
          {visible.map((course) => (
            <CourseRow
              key={course.id}
              course={course}
              selected={selectedIds.includes(course.id)}
              onToggle={toggleSelect}
            />
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
