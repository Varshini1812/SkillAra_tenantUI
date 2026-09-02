import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchAdminMentorshipDashboard,
  fetchAllTickets,
  assignTicket,
} from "../../api/mentorshipTickets.js";
import { fetchMentors } from "../../api/mentorship.js";
import { getErrorMessage } from "../../api/client.js";
import Breadcrumb from "../components/ui/Breadcrumb.jsx";
import { PageHeader } from "../components/ui/primitives.jsx";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "CLOSED", label: "Closed" },
];

const STATUS_BADGE = {
  OPEN: "bg-surface-sunken text-ink-muted",
  ASSIGNED: "bg-brand-muted text-brand-hover",
  CLOSED: "bg-success-subtle text-success",
};

function fmt(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Tenant-wide mentorship-ticket oversight for org admins: queue depth, per-mentor
 *  load, and the ability to force-assign a ticket that's stuck. */
export default function MentorshipQueue() {
  const [summary, setSummary] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [assignChoice, setAssignChoice] = useState({});

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    Promise.all([
      fetchAdminMentorshipDashboard(),
      fetchAllTickets(status ? { status } : {}),
      fetchMentors(),
    ])
      .then(([dash, list, mentorList]) => {
        setSummary(dash);
        setTickets(list);
        setMentors(mentorList);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const doAssign = async (ticketId) => {
    const mentorId = assignChoice[ticketId];
    if (!mentorId) return;
    setError("");
    setNotice("");
    try {
      await assignTicket(ticketId, mentorId);
      setNotice("Ticket assigned.");
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader
        breadcrumb={
          <Breadcrumb items={[{ label: "Dashboard", to: "/admin" }, { label: "Mentorship queue" }]} />
        }
        title="Mentorship queue"
        description="Ticket load across every mentor in your organization."
      />

      {error && <div className="mt-4 rounded-control bg-danger-subtle p-3 text-sm text-danger">{error}</div>}
      {notice && <div className="mt-4 rounded-control bg-success-subtle p-3 text-sm text-success">{notice}</div>}

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        {[
          { label: "Open", value: summary?.queue.open ?? "—" },
          { label: "Assigned", value: summary?.queue.assigned ?? "—" },
          { label: "Closed", value: summary?.queue.closed ?? "—" },
          {
            label: "Oldest unclaimed",
            value: summary?.oldestOpenTicketAt ? fmt(summary.oldestOpenTicketAt) : "—",
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-surface border border-line bg-surface p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-ink">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-surface border border-line bg-surface">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-surface-sunken text-left text-xs uppercase tracking-wide text-ink-subtle">
            <tr>
              <th className="px-4 py-3">Mentor</th>
              <th className="px-4 py-3">Open tickets</th>
              <th className="px-4 py-3">Closed tickets</th>
              <th className="px-4 py-3">Avg. close time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {!summary?.perMentor?.length ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-ink-subtle">
                  No mentor has taken a ticket yet.
                </td>
              </tr>
            ) : (
              summary.perMentor.map((m) => (
                <tr key={m.mentorId} className="hover:bg-surface-sunken/50">
                  <td className="px-4 py-3 font-medium text-ink">{m.name || m.email}</td>
                  <td className="px-4 py-3 text-ink-muted">{m.openCount}</td>
                  <td className="px-4 py-3 text-ink-muted">{m.closedCount}</td>
                  <td className="px-4 py-3 text-ink-muted">{m.avgCloseHours ? `${m.avgCloseHours.toFixed(1)}h` : "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-wrap gap-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setStatus(f.value)}
            className={`rounded-control px-3 py-1.5 text-sm transition ${
              status === f.value ? "bg-brand-subtle font-medium text-brand-hover" : "text-ink-muted hover:bg-surface-sunken"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-surface border border-line bg-surface">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-surface-sunken text-left text-xs uppercase tracking-wide text-ink-subtle">
            <tr>
              <th className="px-4 py-3">Ticket</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Mentor</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Assign</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink-subtle">
                  Loading…
                </td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink-subtle">
                  No tickets found.
                </td>
              </tr>
            ) : (
              tickets.map((t) => (
                <tr key={t.id} className="hover:bg-surface-sunken/50">
                  <td className="px-4 py-3">
                    <Link to={`/mentorship/${t.id}`} className="font-medium hover:text-brand">
                      {t.subject}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{t.studentId?.name || t.studentId?.email || "—"}</td>
                  <td className="px-4 py-3 text-ink-muted">{t.mentorId?.name || t.mentorId?.email || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[t.status]}`}>{t.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    {t.status !== "CLOSED" && (
                      <div className="flex justify-end gap-2">
                        <select
                          value={assignChoice[t.id] || ""}
                          onChange={(e) => setAssignChoice((prev) => ({ ...prev, [t.id]: e.target.value }))}
                          className="rounded border border-line-strong px-2 py-1 text-xs"
                        >
                          <option value="">Select mentor…</option>
                          {mentors.map((m) => (
                            <option key={m.userId} value={m.userId}>
                              {m.user?.name || m.user?.email}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => doAssign(t.id)}
                          className="rounded border border-line-strong px-2 py-1 text-xs font-medium hover:bg-surface-sunken"
                        >
                          Assign
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
