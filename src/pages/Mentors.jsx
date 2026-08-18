import { useCallback, useEffect, useState } from "react";
import {
  fetchMentors,
  requestMentorship,
  fetchOutgoingRequests,
  upsertMentorProfile,
  fetchMyMentorProfile,
  fetchIncomingRequests,
  respondToRequest,
} from "../api/mentorship.js";
import { getErrorMessage } from "../api/client.js";
import { usePermissions } from "../hooks/usePermissions.js";
import ProtectedRoute from "../components/ProtectedRoute.jsx";

const STATUS_STYLE = {
  PENDING: "bg-amber-100 text-amber-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
  COMPLETED: "bg-slate-100 text-slate-600",
};

function RequestDialog({ mentor, onClose, onSent }) {
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await requestMentorship({ mentorId: mentor.userId, message: message.trim() });
      onSent();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <form onSubmit={submit} className="w-full max-w-md space-y-3 rounded-xl bg-white p-5 shadow-xl">
        <h3 className="font-semibold text-slate-900">Request mentorship from {mentor.user?.name}</h3>
        {error && <div className="rounded-lg bg-red-50 p-2 text-sm text-red-600">{error}</div>}
        <textarea
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What would you like help with?"
          className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
        />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Sending…" : "Send request"}
          </button>
        </div>
      </form>
    </div>
  );
}

function FindMentors() {
  const [mentors, setMentors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [target, setTarget] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([fetchMentors(), fetchOutgoingRequests()])
      .then(([m, r]) => {
        setMentors(m);
        setRequests(r);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const requestedIds = new Set(
    requests.filter((r) => r.status === "PENDING").map((r) => String(r.mentorId?._id || r.mentorId))
  );

  return (
    <div className="space-y-4">
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
      {notice && <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{notice}</div>}

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold">Mentors</h2>
        {loading ? (
          <p className="mt-3 text-sm text-slate-400">Loading…</p>
        ) : mentors.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
            No mentors listed yet.
          </p>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {mentors.map((m) => (
              <li key={m.id} className="rounded-lg border border-slate-100 p-3">
                <p className="font-medium text-slate-800">{m.user?.name || m.user?.email}</p>
                {m.bio && <p className="mt-1 text-xs text-slate-500">{m.bio}</p>}
                {m.expertiseTags?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {m.expertiseTags.map((tag) => (
                      <span key={tag} className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] text-indigo-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  disabled={requestedIds.has(String(m.userId))}
                  onClick={() => setTarget(m)}
                  className="mt-3 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {requestedIds.has(String(m.userId)) ? "Requested" : "Request mentorship"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold">My requests</h2>
        {requests.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">You haven't requested a mentor yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {requests.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3 text-sm">
                <span>{r.mentorId?.name || r.mentorId?.email}</span>
                <span className={`rounded px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[r.status]}`}>
                  {r.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {target && (
        <RequestDialog
          mentor={target}
          onClose={() => setTarget(null)}
          onSent={() => {
            setTarget(null);
            setNotice("Request sent.");
            load();
          }}
        />
      )}
    </div>
  );
}

function MyMentorProfile() {
  const [profile, setProfile] = useState(null);
  const [bio, setBio] = useState("");
  const [tags, setTags] = useState("");
  const [years, setYears] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [incoming, setIncoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetchMyMentorProfile().catch(() => null),
      fetchIncomingRequests({ status: "PENDING" }),
    ])
      .then(([p, reqs]) => {
        if (p) {
          setProfile(p);
          setBio(p.bio || "");
          setTags((p.expertiseTags || []).join(", "));
          setYears(p.yearsExperience || 0);
          setIsActive(p.isActive ?? true);
        }
        setIncoming(reqs);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const updated = await upsertMentorProfile({
        bio: bio.trim(),
        expertiseTags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        yearsExperience: Number(years) || 0,
        isActive,
      });
      setProfile(updated);
      setNotice("Mentor profile saved.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const respond = async (id, status) => {
    setError("");
    try {
      await respondToRequest(id, status);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (loading) return <p className="text-sm text-slate-400">Loading…</p>;

  return (
    <div className="space-y-4">
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
      {notice && <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{notice}</div>}

      <form onSubmit={save} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold">{profile ? "My mentor profile" : "Become a mentor"}</h2>
        <label className="block text-xs font-medium text-slate-600">
          Bio
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Expertise <span className="font-normal text-slate-400">(comma separated)</span>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="React, System Design, Career coaching"
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs font-medium text-slate-600">
            Years of experience
            <input
              type="number"
              min="0"
              value={years}
              onChange={(e) => setYears(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="mt-5 flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Listed as active mentor
          </label>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save profile"}
        </button>
      </form>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold">Incoming requests</h2>
        {incoming.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">No pending requests.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {incoming.map((r) => (
              <li key={r.id} className="rounded-lg border border-slate-100 p-3">
                <p className="text-sm font-medium text-slate-800">
                  {r.studentId?.name || r.studentId?.email}
                </p>
                {r.message && <p className="mt-1 text-xs text-slate-500">{r.message}</p>}
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => respond(r.id, "ACCEPTED")}
                    className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => respond(r.id, "REJECTED")}
                    className="rounded-lg border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50"
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-slate-400">
          After accepting, publish a mentorship time slot from the Sessions page for the student to
          book.
        </p>
      </div>
    </div>
  );
}

function MentorsContent() {
  const { isInstructor, isStaff } = usePermissions();
  const canBeMentor = isInstructor || isStaff;
  const [tab, setTab] = useState("find");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mentorship</h1>
        <p className="mt-1 text-sm text-slate-500">Find a mentor, or offer mentorship yourself.</p>
      </div>

      {canBeMentor && (
        <div className="flex flex-wrap gap-2">
          {["find", "mentor"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                tab === t ? "bg-indigo-600 text-white" : "border border-slate-300 text-slate-600"
              }`}
            >
              {t === "find" ? "Find a mentor" : "My mentor profile"}
            </button>
          ))}
        </div>
      )}

      {tab === "find" ? <FindMentors /> : <MyMentorProfile />}
    </div>
  );
}

export default function Mentors() {
  return (
    <ProtectedRoute>
      <MentorsContent />
    </ProtectedRoute>
  );
}
