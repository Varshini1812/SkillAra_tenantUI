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

  useEffect(() => {
    fetchMentorDashboard()
      .then(setData)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-600">Loading dashboard…</p>;
  if (error) return <p className="text-red-600">Error loading dashboard: {error}</p>;

  const stats = [
    { label: "Assigned tickets", value: data.assignedOpenCount, tone: "indigo", to: "/mentorship" },
    { label: "Open tickets matching your expertise", value: data.unclaimedMatchingCount, tone: "amber", to: "/mentorship" },
  ];

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">Mentorship overview</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">My Mentorship Dashboard</h1>
        <p className="mt-2 text-slate-500">Your ticket queue and upcoming sessions at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            to={stat.to}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
          >
            <div className={`mb-5 h-2 w-12 rounded-full bg-${stat.tone}-500`} />
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-900">Recent tickets</h2>
            <Link to="/mentorship" className="text-sm font-medium text-indigo-600 hover:underline">
              View all
            </Link>
          </div>
          {data.recentTickets?.length ? (
            <ul className="mt-4 space-y-2">
              {data.recentTickets.map((t) => (
                <li key={t.id}>
                  <Link to={`/mentorship/${t.id}`} className="flex items-center justify-between rounded-lg border border-slate-100 p-3 text-sm hover:bg-slate-50">
                    <div>
                      <p className="font-medium text-slate-800">{t.subject}</p>
                      <p className="text-xs text-slate-400">{t.studentId?.name || t.studentId?.email}</p>
                    </div>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">{t.status}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">No tickets assigned yet.</p>
          )}
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Upcoming sessions</h2>
          {data.upcomingSessions?.length ? (
            <ul className="mt-4 space-y-2">
              {data.upcomingSessions.map((s) => (
                <li key={s.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <p className="font-medium text-slate-800">{s.title}</p>
                  <p className="text-xs text-slate-400">
                    {fmt(s.startTime)} · {s.studentId?.name || s.studentId?.email}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 rounded-xl bg-emerald-50 px-4 py-8 text-center text-sm text-emerald-700">Nothing scheduled.</p>
          )}
        </article>
      </div>
    </section>
  );
}
