import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { fetchReviewQueue } from "../../api/courses.js";
import { getErrorMessage } from "../../api/client.js";

/**
 * A content reviewer's inbox: courses submitted to them and still awaiting a decision.
 *
 * The server decides what belongs here — reviewers see their own assignments, while anyone
 * who can moderate the catalog sees every pending review in the organization.
 */
export default function ReviewQueue() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setCourses(await fetchReviewQueue());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <div className="text-center text-slate-400">Loading review queue…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Review queue</h1>
        <p className="mt-1 text-sm text-slate-500">
          Courses waiting on your review. Open one to read the content, then approve it or send
          it back with your notes.
        </p>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {courses.length === 0 && !error && (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center">
          <p className="text-sm text-slate-500">Nothing waiting on you right now.</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {courses.map((course) => (
          <Link
            key={course.id}
            to={`/teach/${course.id}`}
            className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-indigo-300 hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="min-w-0 flex-1 truncate font-semibold text-slate-800">
                {course.title}
              </h2>
              <span className="shrink-0 rounded bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                In review
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              {course.instructor?.name || course.instructor?.email || "Unknown instructor"} ·{" "}
              {course.stats?.lessonCount || 0} lessons
            </p>

            {course.review?.submittedAt && (
              <p className="mt-2 text-xs text-slate-400">
                Submitted {new Date(course.review.submittedAt).toLocaleString()}
              </p>
            )}

            {course.review?.note && (
              <p className="mt-2 line-clamp-2 rounded bg-slate-50 p-2 text-xs text-slate-600">
                {course.review.note}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
