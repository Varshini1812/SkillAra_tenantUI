import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { fetchReviewQueue } from "../../api/courses.js";
import { getErrorMessage } from "../../api/client.js";
import Breadcrumb from "../components/ui/Breadcrumb.jsx";

const STAGE = {
  PENDING: { label: "In review", chip: "bg-indigo-100 text-indigo-700" },
  CHANGES_REQUESTED: { label: "Changes requested", chip: "bg-amber-100 text-amber-800" },
  APPROVED: { label: "Approved, not published", chip: "bg-emerald-100 text-emerald-700" },
};

const TABS = [
  { value: "", label: "All" },
  { value: "PENDING", label: "In review" },
  { value: "CHANGES_REQUESTED", label: "Changes requested" },
  { value: "APPROVED", label: "Awaiting publish" },
];

/** Days a course has been sitting in its current review state. */
function ageInDays(iso) {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

/**
 * Admin oversight of the content-review pipeline.
 *
 * The reviewer's own queue lives at /review-queue and shows only what is assigned to them.
 * This is the whole picture: everything in review across the organization, who is holding
 * it, and how long it has been sitting there.
 */
export default function ContentReviews() {
  const [courses, setCourses] = useState([]);
  const [tab, setTab] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setCourses(await fetchReviewQueue("ALL"));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const c = { PENDING: 0, CHANGES_REQUESTED: 0, APPROVED: 0 };
    for (const course of courses) {
      const s = course.review?.status;
      if (c[s] !== undefined) c[s] += 1;
    }
    return c;
  }, [courses]);

  const visible = tab ? courses.filter((c) => c.review?.status === tab) : courses;

  return (
    <div>
      <Breadcrumb items={[{ label: "Dashboard", to: "/admin" }, { label: "Content reviews" }]} />

      <div className="mt-4">
        <h1 className="text-2xl font-bold text-slate-900">Content reviews</h1>
        <p className="mt-1 text-sm text-slate-500">
          Every course moving through review. Instructors submit, content reviewers decide, and
          only approved courses can be published.
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          { label: "In review", value: counts.PENDING },
          { label: "Changes requested", value: counts.CHANGES_REQUESTED },
          { label: "Awaiting publish", value: counts.APPROVED },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {stat.label}
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-1">
        {TABS.map((t) => (
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
            <span className="ml-1.5 text-xs text-slate-400">
              {t.value ? counts[t.value] : courses.length}
            </span>
          </button>
        ))}
      </div>

      {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <p className="py-16 text-center text-sm text-slate-400">Loading reviews…</p>
      ) : visible.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 px-6 py-16 text-center">
          <p className="text-sm text-slate-500">Nothing in review right now.</p>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Instructor</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium">Waiting</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((course) => {
                const stage = STAGE[course.review?.status] || {
                  label: course.review?.status || "—",
                  chip: "bg-slate-100 text-slate-600",
                };
                const days = ageInDays(course.review?.submittedAt);
                return (
                  <tr key={course.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{course.title}</p>
                      {course.review?.note && (
                        <p className="mt-0.5 max-w-md truncate text-xs text-slate-500">
                          {course.review.note}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {course.instructor?.name || course.instructor?.email || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-2 py-0.5 text-xs font-semibold ${stage.chip}`}>
                        {stage.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {days === null ? "—" : days === 0 ? "today" : `${days}d`}
                      {days !== null && days >= 3 && course.review?.status === "PENDING" && (
                        <span className="ml-1 text-amber-600" title="Sitting a while">
                          ●
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/teach/${course.id}`}
                        className="text-xs font-medium text-indigo-600 hover:underline"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
