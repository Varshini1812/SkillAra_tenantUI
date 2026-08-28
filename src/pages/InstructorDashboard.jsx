import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { fetchCourses } from "../api/courses.js";
import { getErrorMessage } from "../api/client.js";
import { usePermissions } from "../hooks/usePermissions.js";

const REVIEW_CHIP = {
  PENDING: { label: "In review", chip: "bg-indigo-100 text-indigo-700" },
  CHANGES_REQUESTED: { label: "Changes requested", chip: "bg-amber-100 text-amber-800" },
  APPROVED: { label: "Ready to publish", chip: "bg-emerald-100 text-emerald-700" },
};

function Stat({ label, value, to, tone = "slate" }) {
  const tones = {
    slate: "text-slate-900",
    indigo: "text-indigo-700",
    amber: "text-amber-700",
    emerald: "text-emerald-700",
  };
  const card = (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tones[tone]}`}>{value}</p>
    </div>
  );
  return to ? (
    <Link to={to} className="block transition hover:opacity-80">
      {card}
    </Link>
  ) : (
    card
  );
}

/**
 * Landing page for anyone who authors courses.
 *
 * Leads with the states that need the instructor to do something — changes requested by a
 * reviewer, and approved courses sitting unpublished — because those are the two places the
 * content-review flow stalls waiting on them.
 */
export default function InstructorDashboard() {
  const { user, can } = usePermissions();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCourses({ mine: true, limit: 100 })
      .then((r) => setCourses(r.items || []))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-slate-500">Loading your dashboard…</p>;

  const published = courses.filter((c) => c.status === "PUBLISHED");
  const drafts = courses.filter((c) => c.status !== "PUBLISHED" && c.status !== "ARCHIVED");
  const inReview = drafts.filter((c) => c.review?.status === "PENDING");
  const needsWork = drafts.filter((c) => c.review?.status === "CHANGES_REQUESTED");
  const readyToPublish = drafts.filter((c) => c.review?.status === "APPROVED");
  const learners = published.reduce((n, c) => n + (c.stats?.enrolledCount || 0), 0);

  const actionable = [...needsWork, ...readyToPublish];

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
          Teaching overview
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Welcome back{user?.name ? `, ${user.name}` : ""}
        </h1>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="My courses" value={courses.length} to="/teach" />
        <Stat label="Published" value={published.length} to="/teach" tone="emerald" />
        <Stat label="In review" value={inReview.length} to="/teach" tone="indigo" />
        <Stat label="Needs changes" value={needsWork.length} to="/teach" tone="amber" />
        <Stat label="Enrolled learners" value={learners} />
      </div>

      {actionable.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-800">Waiting on you</h2>
          </div>
          <ul className="divide-y divide-slate-50">
            {actionable.map((course) => {
              const chip = REVIEW_CHIP[course.review?.status];
              return (
                <li key={course.id}>
                  <Link
                    to={`/teach/${course.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-800">
                        {course.title}
                      </span>
                      {course.review?.note && (
                        <span className="mt-0.5 block line-clamp-1 text-xs text-slate-500">
                          {course.review.note}
                        </span>
                      )}
                    </span>
                    {chip && (
                      <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${chip.chip}`}>
                        {chip.label}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-800">My courses</h2>
          <Link to="/teach" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
            Manage all
          </Link>
        </div>

        {courses.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-400">
            You haven&apos;t created a course yet.{" "}
            {can("courses", "create") && (
              <Link to="/teach" className="text-indigo-600 hover:underline">
                Create your first one.
              </Link>
            )}
          </p>
        ) : (
          <ul className="divide-y divide-slate-50">
            {courses.slice(0, 8).map((course) => (
              <li key={course.id}>
                <Link
                  to={`/teach/${course.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50"
                >
                  <span className="min-w-0 truncate text-sm text-slate-800">{course.title}</span>
                  <span className="shrink-0 text-xs text-slate-400">
                    {course.status} · {course.stats?.lessonCount || 0} lessons ·{" "}
                    {course.stats?.enrolledCount || 0} enrolled
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
