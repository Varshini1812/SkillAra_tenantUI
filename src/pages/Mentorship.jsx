import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createTicket,
  fetchMyTickets,
  fetchTicketQueue,
  claimTicket,
} from "../api/mentorshipTickets.js";
import {
  fetchMentors,
  upsertMentorProfile,
  fetchMyMentorProfile,
} from "../api/mentorship.js";
import { getErrorMessage } from "../api/client.js";
import { usePermissions } from "../hooks/usePermissions.js";
import { useAuth } from "../context/AuthContext.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import LockedFeature from "../components/common/LockedFeature.jsx";

const STATUS_STYLE = {
  OPEN: "bg-surface-sunken text-ink-muted",
  ASSIGNED: "bg-brand-muted text-brand-hover",
  CLOSED: "bg-success-subtle text-success",
};

function fmt(iso) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function hasUnread(ticket, isLearner) {
  if (!ticket.lastMessageAt) return false;
  const readAt = isLearner ? ticket.studentLastReadAt : ticket.mentorLastReadAt;
  return !readAt || new Date(ticket.lastMessageAt) > new Date(readAt);
}

function NewTicketDialog({ onClose, onCreated }) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [topicTags, setTopicTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await createTicket({
        subject: subject.trim(),
        description: description.trim(),
        topicTags: topicTags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      onCreated();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <form onSubmit={submit} className="w-full max-w-md space-y-3 rounded-surface bg-surface p-5 ">
        <h3 className="font-semibold text-ink">Raise a mentorship ticket</h3>
        {error && <div className="rounded-control bg-danger-subtle p-2 text-sm text-danger">{error}</div>}
        <label className="block text-xs font-medium text-ink-muted">
          Subject
          <input
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Stuck on React hooks"
            className="mt-1 w-full rounded border border-line-strong px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block text-xs font-medium text-ink-muted">
          What do you need help with?
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded border border-line-strong px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block text-xs font-medium text-ink-muted">
          Topics <span className="font-normal text-ink-subtle">(comma separated — helps match a mentor)</span>
          <input
            value={topicTags}
            onChange={(e) => setTopicTags(e.target.value)}
            placeholder="React, System Design"
            className="mt-1 w-full rounded border border-line-strong px-2 py-1.5 text-sm"
          />
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-control border border-line-strong px-3 py-1.5 text-sm hover:bg-surface-sunken">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-control bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50"
          >
            {saving ? "Raising…" : "Raise ticket"}
          </button>
        </div>
      </form>
    </div>
  );
}

function TicketList({ tickets, isLearner, emptyText, onOpen }) {
  if (tickets.length === 0) {
    return (
      <p className="rounded-control border border-dashed border-line-strong p-6 text-center text-sm text-ink-subtle">
        {emptyText}
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {tickets.map((t) => (
        <li key={t.id}>
          <button
            type="button"
            onClick={() => onOpen(t.id)}
            className="flex w-full flex-wrap items-center justify-between gap-2 rounded-control border border-line p-3 text-left hover:bg-surface-sunken"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-ink">{t.subject}</span>
                {hasUnread(t, isLearner) && <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />}
              </div>
              <p className="mt-1 text-xs text-ink-subtle">
                {isLearner
                  ? t.mentorId
                    ? `Mentor: ${t.mentorId.name || t.mentorId.email}`
                    : "Unclaimed"
                  : `Student: ${t.studentId?.name || t.studentId?.email}`}
                {" · "}
                {fmt(t.created_on)}
              </p>
            </div>
            <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[t.status]}`}>{t.status}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function QueueTab({ onClaimed }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [claimingId, setClaimingId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchTicketQueue()
      .then(setTickets)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const claim = async (id) => {
    setClaimingId(id);
    setError("");
    try {
      await claimTicket(id);
      onClaimed();
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="rounded-surface border border-line bg-surface p-4">
      <h2 className="font-semibold">Open queue</h2>
      <p className="mt-1 text-xs text-ink-subtle">Unclaimed tickets any mentor can pick up.</p>
      {error && <div className="mt-2 rounded-control bg-danger-subtle p-2 text-sm text-danger">{error}</div>}
      {loading ? (
        <p className="mt-3 text-sm text-ink-subtle">Loading…</p>
      ) : tickets.length === 0 ? (
        <p className="mt-3 rounded-control border border-dashed border-line-strong p-6 text-center text-sm text-ink-subtle">
          Nothing waiting right now.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {tickets.map((t) => (
            <li key={t.id} className="rounded-control border border-line p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-ink">{t.subject}</p>
                  {t.description && <p className="mt-1 text-xs text-ink-subtle">{t.description}</p>}
                  <p className="mt-1 text-xs text-ink-subtle">
                    {t.studentId?.name || t.studentId?.email} · {fmt(t.created_on)}
                  </p>
                  {t.topicTags?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {t.topicTags.map((tag) => (
                        <span key={tag} className="rounded bg-brand-subtle px-1.5 py-0.5 text-[10px] text-brand-hover">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  disabled={claimingId === t.id}
                  onClick={() => claim(t.id)}
                  className="shrink-0 rounded-control bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-hover disabled:opacity-50"
                >
                  {claimingId === t.id ? "Claiming…" : "Claim"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MyTicketsTab({ isLearner, onOpen, reloadKey }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchMyTickets()
      .then(setTickets)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [reloadKey]);

  return (
    <div className="rounded-surface border border-line bg-surface p-4">
      <h2 className="font-semibold">My tickets</h2>
      {error && <div className="mt-2 rounded-control bg-danger-subtle p-2 text-sm text-danger">{error}</div>}
      <div className="mt-3">
        {loading ? (
          <p className="text-sm text-ink-subtle">Loading…</p>
        ) : (
          <TicketList
            tickets={tickets}
            isLearner={isLearner}
            emptyText={isLearner ? "You haven't raised a ticket yet." : "No tickets assigned to you yet."}
            onOpen={onOpen}
          />
        )}
      </div>
    </div>
  );
}

function MentorsTab() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { can } = usePermissions();
  const canBeMentor = can("mentorship", "host");

  const [profile, setProfile] = useState(null);
  const [bio, setBio] = useState("");
  const [tags, setTags] = useState("");
  const [years, setYears] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    fetchMentors()
      .then(setMentors)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
    if (canBeMentor) {
      fetchMyMentorProfile()
        .then((p) => {
          setProfile(p);
          setBio(p.bio || "");
          setTags((p.expertiseTags || []).join(", "));
          setYears(p.yearsExperience || 0);
          setIsActive(p.isActive ?? true);
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canBeMentor]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
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

  return (
    <div className="space-y-4">
      {canBeMentor && (
        <form onSubmit={saveProfile} className="space-y-3 rounded-surface border border-line bg-surface p-4">
          <h2 className="font-semibold">{profile ? "My mentor profile" : "Become a mentor"}</h2>
          {notice && <div className="rounded-control bg-success-subtle p-2 text-sm text-success">{notice}</div>}
          <label className="block text-xs font-medium text-ink-muted">
            Bio
            <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} className="mt-1 w-full rounded border border-line-strong px-2 py-1.5 text-sm" />
          </label>
          <label className="block text-xs font-medium text-ink-muted">
            Expertise <span className="font-normal text-ink-subtle">(comma separated — matched against ticket topics)</span>
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="React, System Design, Career coaching" className="mt-1 w-full rounded border border-line-strong px-2 py-1.5 text-sm" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-ink-muted">
              Years of experience
              <input type="number" min="0" value={years} onChange={(e) => setYears(e.target.value)} className="mt-1 w-full rounded border border-line-strong px-2 py-1.5 text-sm" />
            </label>
            <label className="mt-5 flex items-center gap-2 text-sm text-ink-muted">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Listed as active mentor
            </label>
          </div>
          <button type="submit" disabled={saving} className="rounded-control bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50">
            {saving ? "Saving…" : "Save profile"}
          </button>
        </form>
      )}

      <div className="rounded-surface border border-line bg-surface p-4">
        <h2 className="font-semibold">Meet our mentors</h2>
        {error && <div className="mt-2 rounded-control bg-danger-subtle p-2 text-sm text-danger">{error}</div>}
        {loading ? (
          <p className="mt-3 text-sm text-ink-subtle">Loading…</p>
        ) : mentors.length === 0 ? (
          <div className="mt-3 rounded-surface border border-dashed border-line-strong p-8 text-center">
            <p className="text-sm font-medium text-ink-muted">No active mentors listed yet</p>
            <p className="mt-1 text-xs text-ink-subtle max-w-sm mx-auto">
              {canBeMentor
                ? "Become a mentor to help learners solve problems, review code, and offer career guidance."
                : "Mentors will appear here as soon as instructors publish their mentor profiles."}
            </p>
            {canBeMentor && !profile && (
              <button
                type="button"
                onClick={() => {
                  setBio("Experienced instructor ready to mentor students in software engineering.");
                  setTags("React, JavaScript, Node.js");
                  setYears("3");
                  setIsActive(true);
                }}
                className="mt-4 rounded-control bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover shadow-sm"
              >
                ⚡ Quick Fill & Set Up Profile
              </button>
            )}
          </div>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {mentors.map((m) => {
              const tagsList = Array.isArray(m.expertiseTags)
                ? m.expertiseTags
                : typeof m.expertiseTags === "string"
                ? m.expertiseTags.split(",")
                : [];
              const cleanTags = tagsList
                .map((t) => (typeof t === "string" ? t.trim() : ""))
                .filter((t) => t.length > 1);

              return (
                <li key={m.id} className="rounded-control border border-line p-3">
                  <p className="font-medium text-ink">{m.user?.name || m.user?.email}</p>
                  {m.bio && <p className="mt-1 text-xs text-ink-subtle">{m.bio}</p>}
                  {cleanTags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {cleanTags.map((tag) => (
                        <span key={tag} className="rounded bg-brand-subtle px-1.5 py-0.5 text-[10px] text-brand-hover">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function MentorshipContent() {
  const { can } = usePermissions();
  const canMentor = can("mentorship", "claim");
  const navigate = useNavigate();

  const [tab, setTab] = useState(canMentor ? "queue" : "mine");
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const openTicket = (id) => navigate(`/mentorship/${id}`);

  const tabs = canMentor
    ? [
        { id: "queue", label: "Open queue" },
        { id: "mine", label: "My tickets" },
        { id: "mentors", label: "My mentor profile" },
      ]
    : [
        { id: "mine", label: "My tickets" },
        { id: "mentors", label: "Meet our mentors" },
      ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Mentorship</h1>
          <p className="mt-1 text-sm text-ink-subtle">
            {canMentor ? "Claim open tickets, chat, and schedule sessions." : "Raise a ticket, chat with your mentor, and book sessions."}
          </p>
        </div>
        {!canMentor && (
          <button
            type="button"
            onClick={() => setShowNewTicket(true)}
            className="rounded-control bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
          >
            Raise a ticket
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-control px-4 py-2 text-sm font-medium ${
              tab === t.id ? "bg-brand text-white" : "border border-line-strong text-ink-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "queue" && canMentor && <QueueTab onClaimed={() => setReloadKey((k) => k + 1)} />}
      {tab === "mine" && <MyTicketsTab isLearner={!canMentor} onOpen={openTicket} reloadKey={reloadKey} />}
      {tab === "mentors" && <MentorsTab />}

      {showNewTicket && (
        <NewTicketDialog
          onClose={() => setShowNewTicket(false)}
          onCreated={() => {
            setShowNewTicket(false);
            setReloadKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}

export default function Mentorship() {
  const { tenantInfo } = useAuth();
  
  if (tenantInfo?.planFeatures && tenantInfo.planFeatures.mentorshipEnabled === false) {
    return (
      <LockedFeature 
        title="Mentorship" 
        description="Enable learners to create mentorship tickets, get assigned to mentors, and communicate seamlessly." 
      />
    );
  }

  return (
    <ProtectedRoute module="mentorship" actions={["view"]}>
      <MentorshipContent />
    </ProtectedRoute>
  );
}
