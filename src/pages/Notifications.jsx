import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notifications.js";
import { getErrorMessage } from "../api/client.js";

const TYPE_META = {
  // Course Review & Moderation Pipeline
  "course.review.assigned": { label: "Review requested", dot: "bg-brand", category: "reviews" },
  "course.review.submitted": { label: "Review submitted", dot: "bg-brand", category: "reviews" },
  "course.review.changes_requested": { label: "Changes requested", dot: "bg-warning", category: "reviews" },
  "course.review.approved": { label: "Course approved", dot: "bg-success", category: "reviews" },
  "course.published": { label: "Course published", dot: "bg-success", category: "reviews" },

  // Enrollment & Access
  "enrollment.requested": { label: "Access requested", dot: "bg-brand", category: "access" },
  "enrollment.approved": { label: "Access approved", dot: "bg-success", category: "access" },
  "enrollment.rejected": { label: "Access declined", dot: "bg-danger", category: "access" },
  "enrollment.granted": { label: "Access granted", dot: "bg-success", category: "access" },

  // Mentorship & Community
  "mentorship.ticket.assigned": { label: "Ticket assigned", dot: "bg-brand", category: "community" },
  "mentorship.ticket.created": { label: "New ticket raised", dot: "bg-brand", category: "community" },
  "mentorship.ticket.reply": { label: "Mentorship reply", dot: "bg-success", category: "community" },
  "mentorship.ticket.resolved": { label: "Ticket resolved", dot: "bg-success", category: "community" },

  // Forum & Practice
  "forum.question.answered": { label: "Forum answer", dot: "bg-success", category: "community" },
  "forum.answer.accepted": { label: "Answer accepted", dot: "bg-success", category: "community" },
  "live_session.starting_soon": { label: "Live session alert", dot: "bg-warning", category: "community" },
  "mock_interview.booked": { label: "Interview booked", dot: "bg-brand", category: "community" },
};

function when(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 60 * 24) return `${Math.floor(mins / 60)}h ago`;
  return date.toLocaleString();
}

export default function Notifications() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [tab, setTab] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await fetchNotifications({
        limit: 100,
        unreadOnly: tab === "unread" ? true : undefined,
      });
      setItems(data.notifications);
      setUnread(data.unreadCount);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const open = async (n) => {
    if (!n.isRead) {
      setItems((list) => list.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      setUnread((c) => Math.max(0, c - 1));
      markNotificationRead(n.id).catch(() => load());
    }
    if (n.link) navigate(n.link);
    else if (n.courseId) navigate(`/courses/${n.courseId}`);
  };

  const readAll = async () => {
    setUnread(0);
    setItems((list) => list.map((n) => ({ ...n, isRead: true })));
    try {
      await markAllNotificationsRead();
      if (tab === "unread") load();
    } catch {
      load();
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Notifications</h1>
          <p className="mt-1 text-sm text-ink-subtle">
            {unread > 0 ? `${unread} unread` : "You're all caught up"}
          </p>
        </div>
        {unread > 0 && (
          <button
            type="button"
            onClick={readAll}
            className="rounded-control border border-line-strong px-4 py-2 text-sm hover:bg-surface-sunken"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {[
            { value: "all", label: "All" },
            { value: "unread", label: `Unread${unread ? ` (${unread})` : ""}` },
          ].map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={`rounded-control px-3 py-1.5 text-sm transition ${
                tab === t.value
                  ? "bg-brand font-medium text-white shadow-sm"
                  : "border border-line text-ink-muted hover:bg-surface-sunken"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1 text-xs">
          <span className="text-ink-subtle mr-1">Category:</span>
          {[
            { id: "all", label: "All Categories" },
            { id: "reviews", label: "Reviews" },
            { id: "access", label: "Course Access" },
            { id: "community", label: "Community & Mentorship" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`rounded-chip px-2.5 py-1 text-xs font-medium transition ${
                categoryFilter === cat.id
                  ? "bg-brand-muted font-semibold text-brand-hover"
                  : "bg-surface-sunken text-ink-subtle hover:bg-line"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="rounded-control bg-danger-subtle p-3 text-sm text-danger">{error}</div>}

      {loading ? (
        <p className="py-16 text-center text-sm text-ink-subtle">Loading…</p>
      ) : items.filter((n) => categoryFilter === "all" || TYPE_META[n.type]?.category === categoryFilter).length === 0 ? (
        <div className="rounded-surface border border-dashed border-line-strong px-6 py-16 text-center">
          <p className="text-sm text-ink-subtle">
            {tab === "unread" ? "Nothing unread in this category." : "No notifications match this category."}
          </p>
          <Link to="/dashboard" className="mt-3 inline-block text-sm text-brand hover:underline">
            Back to dashboard
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-line overflow-hidden rounded-surface border border-line bg-surface">
          {items
            .filter((n) => categoryFilter === "all" || TYPE_META[n.type]?.category === categoryFilter)
            .map((n) => {
              const meta = TYPE_META[n.type] || { label: "", dot: "bg-ink-subtle" };
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => open(n)}
                  className={`flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition hover:bg-surface-sunken ${
                    n.isRead ? "" : "bg-brand-subtle/40"
                  }`}
                >
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${meta.dot}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink">{n.title}</span>
                    {n.message && (
                      <span className="mt-0.5 block text-xs text-ink-muted">{n.message}</span>
                    )}
                    <span className="mt-1 block text-[11px] text-ink-subtle">
                      {meta.label ? `${meta.label} · ` : ""}
                      {n.actorName ? `${n.actorName} · ` : ""}
                      {when(n.createdAt)}
                    </span>
                  </span>
                  {!n.isRead && (
                    <span className="shrink-0 rounded-full bg-brand px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider text-white shadow-xs">
                      NEW
                    </span>
                  )}
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
}
