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

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "CLOSED", label: "Closed" },
];

const STATUS_BADGE = {
  OPEN: "bg-slate-100 text-slate-600",
  ASSIGNED: "bg-indigo-100 text-indigo-700",
  CLOSED: "bg-emerald-100 text-emerald-700",
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
      <Breadcrumb items={[{ label: "Dashboard", to: "/admin" }, { label: "Mentorship queue" }]} />

      <div className="mt-4">
        <h1 className="text-2xl font-bold text-slate-900">Mentorship queue</h1>
        <p className="text-sm text-slate-500">Ticket load across every mentor in your organization.</p>
      </div>

      {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
      {notice && <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{notice}</div>}

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
          <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Mentor</th>
              <th className="px-4 py-3">Open tickets</th>
              <th className="px-4 py-3">Closed tickets</th>
              <th className="px-4 py-3">Avg. close time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!summary?.perMentor?.length ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  No mentor has taken a ticket yet.
                </td>
              </tr>
            ) : (
              summary.perMentor.map((m) => (
                <tr key={m.mentorId} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-800">{m.name || m.email}</td>
                  <td className="px-4 py-3 text-slate-600">{m.openCount}</td>
                  <td className="px-4 py-3 text-slate-600">{m.closedCount}</td>
                  <td className="px-4 py-3 text-slate-600">{m.avgCloseHours ? `${m.avgCloseHours.toFixed(1)}h` : "—"}</td>
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
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              status === f.value ? "bg-indigo-50 font-medium text-indigo-700" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Ticket</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Mentor</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Assign</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  No tickets found.
                </td>
              </tr>
            ) : (
              tickets.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <Link to={`/mentorship/${t.id}`} className="font-medium hover:text-indigo-600">
                      {t.subject}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{t.studentId?.name || t.studentId?.email || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{t.mentorId?.name || t.mentorId?.email || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[t.status]}`}>{t.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    {t.status !== "CLOSED" && (
                      <div className="flex justify-end gap-2">
                        <select
                          value={assignChoice[t.id] || ""}
                          onChange={(e) => setAssignChoice((prev) => ({ ...prev, [t.id]: e.target.value }))}
                          className="rounded border border-slate-300 px-2 py-1 text-xs"
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
                          className="rounded border border-slate-300 px-2 py-1 text-xs font-medium hover:bg-slate-50"
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
