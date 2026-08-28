import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notifications.js";
import { getErrorMessage } from "../api/client.js";

const TYPE_META = {
  "course.review.assigned": { label: "Review requested", dot: "bg-indigo-500" },
  "course.review.submitted": { label: "Submitted", dot: "bg-indigo-500" },
  "course.review.changes_requested": { label: "Changes requested", dot: "bg-amber-500" },
  "course.review.approved": { label: "Approved", dot: "bg-emerald-500" },
  "course.published": { label: "Published", dot: "bg-emerald-500" },
  "enrollment.requested": { label: "Access requested", dot: "bg-indigo-500" },
  "enrollment.approved": { label: "Access approved", dot: "bg-emerald-500" },
  "enrollment.rejected": { label: "Access declined", dot: "bg-rose-500" },
  "enrollment.granted": { label: "Access granted", dot: "bg-emerald-500" },
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

/**
 * The notification inbox, as a page rather than a dropdown.
 *
 * Everyone in the organization has one — students, mentors, instructors and admins alike —
 * because it is scoped to the caller on the server and is never gated on a permission.
 */
export default function Notifications() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [tab, setTab] = useState("all");
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
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">
            {unread > 0 ? `${unread} unread` : "You're all caught up"}
          </p>
        </div>
        {unread > 0 && (
          <button
            type="button"
            onClick={readAll}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="flex gap-1">
        {[
          { value: "all", label: "All" },
          { value: "unread", label: `Unread${unread ? ` (${unread})` : ""}` },
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

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <p className="py-16 text-center text-sm text-slate-400">Loading…</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 px-6 py-16 text-center">
          <p className="text-sm text-slate-500">
            {tab === "unread" ? "Nothing unread." : "No notifications yet."}
          </p>
          <Link to="/dashboard" className="mt-3 inline-block text-sm text-indigo-600 hover:underline">
            Back to dashboard
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {items.map((n) => {
            const meta = TYPE_META[n.type] || { label: "", dot: "bg-slate-400" };
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => open(n)}
                className={`flex w-full gap-3 px-4 py-4 text-left transition hover:bg-slate-50 ${
                  n.isRead ? "" : "bg-indigo-50/40"
                }`}
              >
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${meta.dot}`} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-slate-900">{n.title}</span>
                  {n.message && (
                    <span className="mt-0.5 block text-sm text-slate-600">{n.message}</span>
                  )}
                  <span className="mt-1 block text-xs text-slate-400">
                    {meta.label ? `${meta.label} · ` : ""}
                    {n.actorName ? `${n.actorName} · ` : ""}
                    {when(n.createdAt)}
                  </span>
                </span>
                {!n.isRead && (
                  <span className="mt-1 shrink-0 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
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
