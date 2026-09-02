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
    { label: "Assigned tickets", value: data.assignedOpenCount, tone: "indigo", to: "/mentorship" },
    { label: "Open tickets matching your expertise", value: data.unclaimedMatchingCount, tone: "amber", to: "/mentorship" },
  ];

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">Mentorship overview</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">My Mentorship Dashboard</h1>
        <p className="mt-2 text-ink-subtle">Your ticket queue and upcoming sessions at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            to={stat.to}
            className="rounded-surface border border-line bg-surface p-5  transition hover:border-brand-border "
          >
            <div className={`mb-5 h-2 w-12 rounded-full bg-${stat.tone}-500`} />
            <p className="text-sm font-medium text-ink-subtle">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-ink">{stat.value}</p>
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
