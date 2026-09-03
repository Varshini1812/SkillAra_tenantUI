import { useEffect, useMemo, useState } from "react";
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

const SORTS = [
  { value: "newest", label: "Sort: Newest" },
  { value: "enrolled", label: "Sort: Most Enrolled" },
  { value: "title", label: "Sort: Title A-Z" },
  { value: "price-asc", label: "Sort: Price (Low to High)" },
  { value: "price-desc", label: "Sort: Price (High to Low)" },
];

export default function Courses() {
  const { canAuthorCourses } = usePermissions();
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const { items } = await fetchCourses({
          search: search || undefined,
          level: level || undefined,
          category: category || undefined,
        });
        if (!cancelled) setCourses(items || []);
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
  }, [search, level, category]);

  // Extract unique categories from returned items
  const availableCategories = useMemo(() => {
    const set = new Set();
    courses.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set).sort();
  }, [courses]);

  // Client-side sorting
  const processedCourses = useMemo(() => {
    const list = [...courses];
    if (sortBy === "newest") {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortBy === "enrolled") {
      list.sort((a, b) => (b.stats?.enrolledCount || 0) - (a.stats?.enrolledCount || 0));
    } else if (sortBy === "title") {
      list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else if (sortBy === "price-asc") {
      list.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => (b.price || 0) - (a.price || 0));
    }
    return list;
  }, [courses, sortBy]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Browse Courses</h1>
          <p className="text-ink-subtle">Find your next skill to master</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-control border border-line-strong px-4 py-2 text-sm sm:w-56"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-control border border-line-strong px-3 py-2 text-sm"
          >
            <option value="">All categories</option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="rounded-control border border-line-strong px-3 py-2 text-sm"
          >
            {LEVELS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-control border border-line-strong px-3 py-2 text-sm bg-surface font-medium"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {canAuthorCourses && (
            <Link
              to="/teach"
              className="whitespace-nowrap rounded-control bg-brand px-4 py-2 text-center text-sm font-medium text-white hover:bg-brand-hover"
            >
              Teach
            </Link>
          )}
        </div>
      </div>

      {error && <div className="mt-4 rounded-control bg-danger-subtle p-3 text-sm text-danger">{error}</div>}

      {loading ? (
        <div className="mt-12 text-center text-ink-subtle">Loading courses...</div>
      ) : processedCourses.length === 0 ? (
        <div className="mt-12 text-center text-ink-subtle">No courses found matching your criteria.</div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {processedCourses.map((c) => (
            <CourseCard key={c.id} course={c} showStatus={canAuthorCourses} />
          ))}
        </div>
      )}
    </div>
  );
}
