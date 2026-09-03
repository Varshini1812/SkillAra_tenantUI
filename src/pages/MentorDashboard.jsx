import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMentorDashboard } from "../api/mentorshipTickets.js";
import { getErrorMessage } from "../api/client.js";

function fmt(iso) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Dashboard for TUTOR / mentor-capable roles — their ticket queue at a glance. */
export default function MentorDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    fetchMentorDashboard()
      .then(setData)
      .catch((err) => {
        if (err?.response?.status === 403) setForbidden(true);
        else setError(getErrorMessage(err));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-ink-muted">Loading dashboard…</p>;
  if (forbidden) {
    return (
      <p className="rounded-control bg-surface-sunken p-4 text-sm text-ink-subtle">
        Your role doesn&apos;t include the mentorship queue.
      </p>
    );
  }
  if (error) return <p className="text-danger">Error loading dashboard: {error}</p>;

  const stats = [
    { label: "Assigned Tickets", value: data.assignedOpenCount ?? 0, tone: "text-brand", to: "/mentorship", badge: (data.assignedOpenCount ?? 0) > 0 ? "Action Needed" : "Clear" },
    { label: "Matching Open Queue", value: data.unclaimedMatchingCount ?? 0, tone: "text-warning", to: "/mentorship", badge: "Claimable" },
    { label: "Resolved Tickets", value: data.resolvedCount ?? (data.recentTickets?.filter((t) => t.status === "CLOSED" || t.status === "RESOLVED").length || 0), tone: "text-success", to: "/mentorship" },
    { label: "Response SLA Target", value: "< 4 hrs", tone: "text-ink", badge: "On Track" },
  ];

  return (
    <section className="space-y-6">
      <div>
        <span className="rounded bg-brand-muted px-2 py-0.5 text-xs font-semibold text-brand-hover">
          Mentor Workspace
        </span>
        <h1 className="mt-1.5 text-2xl font-bold text-ink">My Mentorship Dashboard</h1>
        <p className="text-xs text-ink-subtle">Your ticket queue, SLA response performance, and upcoming sessions.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            to={stat.to}
            className="block h-full transition hover:opacity-90"
          >
            <div className="h-full flex flex-col justify-between rounded-surface border border-line bg-surface p-4 transition hover:border-line-strong">
              <div className="flex items-start justify-between gap-1.5 min-h-[1.5rem]">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">{stat.label}</p>
                {stat.badge && (
                  <span className="shrink-0 whitespace-nowrap rounded-chip bg-success-subtle px-1.5 py-0.5 text-[10px] font-semibold text-success">
                    {stat.badge}
                  </span>
                )}
              </div>
              <p className={`mt-2 text-2xl font-bold ${stat.tone}`}>{stat.value}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <article className="rounded-surface border border-line bg-surface p-6 ">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-ink">Recent tickets</h2>
            <Link to="/mentorship" className="text-sm font-medium text-brand hover:underline">
              View all
            </Link>
          </div>
          {data.recentTickets?.length ? (
            <ul className="mt-4 space-y-2">
              {data.recentTickets.map((t) => (
                <li key={t.id}>
                  <Link to={`/mentorship/${t.id}`} className="flex items-center justify-between rounded-control border border-line p-3 text-sm hover:bg-surface-sunken">
                    <div>
                      <p className="font-medium text-ink">{t.subject}</p>
                      <p className="text-xs text-ink-subtle">{t.studentId?.name || t.studentId?.email}</p>
                    </div>
                    <span className="rounded bg-surface-sunken px-1.5 py-0.5 text-[10px] font-semibold text-ink-subtle">{t.status}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 rounded-surface bg-surface-sunken px-4 py-8 text-center text-sm text-ink-subtle">No tickets assigned yet.</p>
          )}
        </article>

        <article className="rounded-surface border border-line bg-surface p-6 ">
          <h2 className="text-lg font-bold text-ink">Upcoming sessions</h2>
          {data.upcomingSessions?.length ? (
            <ul className="mt-4 space-y-2">
              {data.upcomingSessions.map((s) => (
                <li key={s.id} className="rounded-control bg-surface-sunken px-3 py-2 text-sm">
                  <p className="font-medium text-ink">{s.title}</p>
                  <p className="text-xs text-ink-subtle">
                    {fmt(s.startTime)} · {s.studentId?.name || s.studentId?.email}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 rounded-surface bg-success-subtle px-4 py-8 text-center text-sm text-success">Nothing scheduled.</p>
          )}
        </article>
      </div>
    </section>
  );
}
