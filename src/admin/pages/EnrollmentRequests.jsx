import { useCallback, useEffect, useState } from "react";

import {
  approveEnrollmentRequest,
  fetchEnrollmentRequests,
  rejectEnrollmentRequest,
} from "../../api/enrollments.js";
import { getErrorMessage } from "../../api/client.js";
import Breadcrumb from "../components/ui/Breadcrumb.jsx";

const PENDING = ["PENDING_APPROVAL", "PENDING_PAYMENT"];

const STATUS_BADGE = {
  PENDING_APPROVAL: { label: "Awaiting decision", chip: "bg-amber-100 text-amber-800" },
  PENDING_PAYMENT: { label: "Awaiting decision", chip: "bg-amber-100 text-amber-800" },
  ACTIVE: { label: "Approved", chip: "bg-emerald-100 text-emerald-700" },
  REJECTED: { label: "Declined", chip: "bg-rose-100 text-rose-700" },
};

function money(request) {
  if (!request.course) return "";
  const { price, currency } = request.course;
  return price > 0 ? `${currency} ${price}` : "Free";
}

/**
 * Staff queue for paid-course access requests.
 *
 * A learner enrols in a free course instantly; a paid one records a request that sits here
 * until someone with `learners:assign` approves or declines it. Either way the learner gets
 * a notification.
 */
export default function EnrollmentRequests() {
  const [requests, setRequests] = useState([]);
  const [tab, setTab] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [notes, setNotes] = useState({});

  const load = useCallback(async () => {
    setError("");
    try {
      setRequests(await fetchEnrollmentRequests(tab === "all" ? "ALL" : undefined));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (request, approve) => {
    setBusyId(request.id);
    setError("");
    setNotice("");
    const note = (notes[request.id] || "").trim();
    try {
      if (approve) await approveEnrollmentRequest(request.id, note);
      else await rejectEnrollmentRequest(request.id, note);
      setNotice(
        approve
          ? `${request.learner?.name || "The learner"} now has access to ${request.course?.title || "the course"}.`
          : "Request declined and the learner has been notified."
      );
      setNotes((n) => ({ ...n, [request.id]: "" }));
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const pendingCount = requests.filter((r) => PENDING.includes(r.status)).length;

  return (
    <div>
      <Breadcrumb items={[{ label: "Dashboard", to: "/admin" }, { label: "Access requests" }]} />

      <div className="mt-4">
        <h1 className="text-2xl font-bold text-slate-900">Course access requests</h1>
        <p className="mt-1 text-sm text-slate-500">
          Learners enrol in free courses themselves. Paid courses wait here for your approval.
        </p>
      </div>

      <div className="mt-4 flex gap-1">
        {[
          { value: "pending", label: `Pending${pendingCount ? ` (${pendingCount})` : ""}` },
          { value: "all", label: "All" },
        ].map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              tab === t.value
                ? "bg-indigo-50 font-medium text-indigo-700"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
      {notice && (
        <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{notice}</div>
      )}

      {loading ? (
        <p className="py-16 text-center text-sm text-slate-400">Loading requests…</p>
      ) : requests.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 px-6 py-16 text-center">
          <p className="text-sm text-slate-500">
            {tab === "pending" ? "No requests waiting on you." : "No access requests yet."}
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {requests.map((request) => {
            const badge = STATUS_BADGE[request.status] || STATUS_BADGE.PENDING_APPROVAL;
            const isPending = PENDING.includes(request.status);
            return (
              <div key={request.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {request.learner?.name || request.learner?.email || "Unknown learner"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {request.learner?.email} · wants{" "}
                      <span className="font-medium text-slate-700">
                        {request.course?.title || "a course"}
                      </span>{" "}
                      · {money(request)}
                    </p>
                    {request.requestedAt && (
                      <p className="mt-0.5 text-xs text-slate-400">
                        Requested {new Date(request.requestedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${badge.chip}`}>
                    {badge.label}
                  </span>
                </div>

                {request.requestNote && (
                  <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                    “{request.requestNote}”
                  </p>
                )}

                {request.decisionNote && !isPending && (
                  <p className="mt-3 text-xs text-slate-500">
                    Your note: {request.decisionNote}
                  </p>
                )}

                {isPending && (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input
                      value={notes[request.id] || ""}
                      onChange={(e) => setNotes((n) => ({ ...n, [request.id]: e.target.value }))}
                      placeholder="Optional note to the learner"
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busyId === request.id}
                        onClick={() => decide(request, true)}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busyId === request.id}
                        onClick={() => decide(request, false)}
                        className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
