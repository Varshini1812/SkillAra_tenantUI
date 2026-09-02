import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { fetchReviewQueue } from "../../api/courses.js";
import { getErrorMessage } from "../../api/client.js";
import Breadcrumb from "../components/ui/Breadcrumb.jsx";
import Icon from "../components/ui/Icon.jsx";
import { PageHeader } from "../components/ui/primitives.jsx";

const STAGE = {
  PENDING: { label: "In review", chip: "bg-brand-muted text-brand-hover" },
  CHANGES_REQUESTED: { label: "Changes requested", chip: "bg-warning-subtle text-warning" },
  APPROVED: { label: "Approved, not published", chip: "bg-success-subtle text-success" },
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
      <PageHeader
        breadcrumb={
          <Breadcrumb items={[{ label: "Dashboard", to: "/admin" }, { label: "Content reviews" }]} />
        }
        title="Content reviews"
        description="Every course moving through review. Instructors submit, reviewers decide, and only approved courses can be published."
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          { label: "In review", value: counts.PENDING },
          { label: "Changes requested", value: counts.CHANGES_REQUESTED },
          { label: "Awaiting publish", value: counts.APPROVED },
        ].map((stat) => (
          <div key={stat.label} className="rounded-surface border border-line bg-surface p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">
              {stat.label}
            </p>
            <p className="mt-1 text-2xl font-bold text-ink">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-1">
        {TABS.map((t) => (
          <button
            key={t.value || "all"}
            type="button"
            onClick={() => setTab(t.value)}
            className={`rounded-control px-3 py-1.5 text-sm transition ${
              tab === t.value
                ? "bg-brand-subtle font-medium text-brand-hover"
                : "text-ink-muted hover:bg-surface-sunken"
            }`}
          >
            {t.label}
            <span className="ml-1.5 text-xs text-ink-subtle">
              {t.value ? counts[t.value] : courses.length}
            </span>
          </button>
        ))}
      </div>

      {error && <div className="mt-4 rounded-control bg-danger-subtle p-3 text-sm text-danger">{error}</div>}

      {loading ? (
        <p className="py-16 text-center text-sm text-ink-subtle">Loading reviews…</p>
      ) : visible.length === 0 ? (
        <div className="mt-6 rounded-surface border border-dashed border-line-strong px-6 py-16 text-center">
          <p className="text-sm text-ink-subtle">Nothing in review right now.</p>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-surface border border-line bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-surface-sunken text-left text-xs uppercase tracking-wide text-ink-subtle">
              <tr>
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Instructor</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium">Waiting</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.map((course) => {
                const stage = STAGE[course.review?.status] || {
                  label: course.review?.status || "—",
                  chip: "bg-surface-sunken text-ink-muted",
                };
                const days = ageInDays(course.review?.submittedAt);
                return (
                  <tr key={course.id} className="hover:bg-surface-sunken">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{course.title}</p>
                      {course.review?.note && (
                        <p className="mt-0.5 max-w-md truncate text-xs text-ink-subtle">
                          {course.review.note}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {course.instructor?.name || course.instructor?.email || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-2 py-0.5 text-xs font-semibold ${stage.chip}`}>
                        {stage.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-subtle">
                      {days === null ? "—" : days === 0 ? "today" : `${days}d`}
                      {days !== null && days >= 3 && course.review?.status === "PENDING" && (
                        <span className="ml-1 inline-flex align-middle text-warning" title="Sitting a while">
                          <Icon name="clock" size={12} />
                          <span className="sr-only">Waiting three days or more</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/teach/${course.id}`}
                        className="text-xs font-medium text-brand hover:underline"
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
