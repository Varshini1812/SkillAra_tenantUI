import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { createCourse, fetchCourses } from "../../api/courses.js";
import { getErrorMessage } from "../../api/client.js";
import CourseCard from "../../components/CourseCard.jsx";
import { usePermissions } from "../../hooks/usePermissions.js";

const FILTERS = [
  { value: "", label: "All" },
  { value: "DRAFT", label: "Drafts" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

function NewCourseDialog({ onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("ALL_LEVELS");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const course = await createCourse({ title: title.trim(), category: category.trim(), level });
      onCreated(course);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      >
        <h2 className="text-lg font-semibold">New course</h2>
        <p className="mt-1 text-sm text-slate-500">
          Start with a title — you can fill in the rest before publishing.
        </p>

        {error && <div className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-600">{error}</div>}

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
            autoFocus
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="e.g. Node.js for Beginners"
          />
        </label>

        <label className="mt-3 block text-sm font-medium text-slate-700">
          Category
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            maxLength={120}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="e.g. Backend Development"
          />
        </label>

        <label className="mt-3 block text-sm font-medium text-slate-700">
          Level
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="ALL_LEVELS">All levels</option>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>
        </label>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create course"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function MyCourses() {
  const navigate = useNavigate();
  const { roleLabel, isStaff } = usePermissions();

  const [courses, setCourses] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    // mine=true keeps this to courses the signed-in user owns, even for admins who
    // could otherwise see the whole tenant catalog.
    fetchCourses({ mine: true, status: status || undefined })
      .then(({ items }) => !cancelled && setCourses(items))
      .catch((err) => !cancelled && setError(getErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [status]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teach</h1>
          <p className="text-slate-500">
            Courses you own · signed in as {roleLabel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isStaff && (
            <Link
              to="/admin/courses"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
            >
              Moderate catalog
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

      <div className="mt-4 flex flex-wrap gap-1">
        {FILTERS.map((f) => (
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

      {loading ? (
        <div className="mt-12 text-center text-slate-400">Loading...</div>
      ) : courses.length === 0 ? (
        <div className="mt-12 rounded-xl border border-dashed border-slate-300 p-10 text-center">
          <p className="text-slate-500">You haven't created any courses yet.</p>
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Create your first course
          </button>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} to={`/teach/${c.id}`} showStatus />
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
