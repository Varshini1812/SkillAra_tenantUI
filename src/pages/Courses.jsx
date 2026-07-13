import { useEffect, useState } from "react";
import { fetchCourses } from "../api/courses.js";
import { getErrorMessage } from "../api/client.js";
import CourseCard from "../components/CourseCard.jsx";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchCourses({ status: "PUBLISHED", search: search || undefined });
        setCourses(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Browse Courses</h1>
          <p className="text-slate-500">Find your next skill to master</p>
        </div>
        <input
          type="search"
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-4 py-2 sm:w-72"
        />
      </div>

      {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <div className="mt-12 text-center text-slate-400">Loading courses...</div>
      ) : courses.length === 0 ? (
        <div className="mt-12 text-center text-slate-400">No courses found.</div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <CourseCard key={c._id} course={c} />
          ))}
        </div>
      )}
    </div>
  );
}
