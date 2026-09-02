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

  if (loading) return <div className="text-center text-ink-subtle">Loading review queue…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Review queue</h1>
        <p className="mt-1 text-sm text-ink-subtle">
          Courses waiting on your review. Open one to read the content, then approve it or send
          it back with your notes.
        </p>
      </div>

      {error && <div className="rounded-control bg-danger-subtle p-3 text-sm text-danger">{error}</div>}

      {courses.length === 0 && !error && (
        <div className="rounded-surface border border-dashed border-line-strong p-10 text-center">
          <p className="text-sm text-ink-subtle">Nothing waiting on you right now.</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {courses.map((course) => (
          <Link
            key={course.id}
            to={`/teach/${course.id}`}
            className="rounded-surface border border-line bg-surface p-4 transition hover:border-brand "
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="min-w-0 flex-1 truncate font-semibold text-ink">
                {course.title}
              </h2>
              <span className="shrink-0 rounded bg-brand-muted px-2 py-0.5 text-xs font-semibold text-brand-hover">
                In review
              </span>
            </div>

            <p className="mt-1 text-xs text-ink-subtle">
              {course.instructor?.name || course.instructor?.email || "Unknown instructor"} ·{" "}
              {course.stats?.lessonCount || 0} lessons
            </p>

            {course.review?.submittedAt && (
              <p className="mt-2 text-xs text-ink-subtle">
                Submitted {new Date(course.review.submittedAt).toLocaleString()}
              </p>
            )}

            {course.review?.note && (
              <p className="mt-2 line-clamp-2 rounded bg-surface-sunken p-2 text-xs text-ink-muted">
                {course.review.note}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
