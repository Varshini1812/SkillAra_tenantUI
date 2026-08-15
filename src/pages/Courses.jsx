import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { fetchCourses } from "../api/courses.js";
import { getErrorMessage } from "../api/client.js";
import CourseCard from "../components/CourseCard.jsx";
import { usePermissions } from "../hooks/usePermissions.js";

const LEVELS = [
  { value: "", label: "All levels" },
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

export default function Courses() {
  const { canAuthorCourses } = usePermissions();
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        // The API decides visibility from the caller's role — a student only ever
        // receives published, unblocked courses.
        const { items } = await fetchCourses({
          search: search || undefined,
          level: level || undefined,
        });
        if (!cancelled) setCourses(items);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const timer = setTimeout(load, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, level]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Browse Courses</h1>
          <p className="text-slate-500">Find your next skill to master</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {LEVELS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
          <input
            type="search"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 sm:w-64"
          />
          {canAuthorCourses && (
            <Link
              to="/teach"
              className="whitespace-nowrap rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-indigo-700"
            >
              Teach
            </Link>
          )}
        </div>
      </div>

      {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <div className="mt-12 text-center text-slate-400">Loading courses...</div>
      ) : courses.length === 0 ? (
        <div className="mt-12 text-center text-slate-400">No courses found.</div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} showStatus={canAuthorCourses} />
          ))}
        </div>
      )}
    </div>
  );
}
