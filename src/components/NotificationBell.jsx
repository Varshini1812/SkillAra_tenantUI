import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { fetchUnreadCount } from "../api/notifications.js";
import { getAccessToken } from "../lib/accessTokenMemory.js";

/** How often the badge re-checks. The list itself lives on /notifications. */
const POLL_MS = 60_000;

/**
 * Header badge linking to the notification page.
 *
 * Deliberately not a dropdown: the same inbox has to work for a student on a phone and an
 * admin triaging a queue, and a popup is the wrong shape for both. This only ever fetches a
 * count.
 */
export default function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const { pathname } = useLocation();

  const refresh = useCallback(async () => {
    // Session bootstrap can render the shell before the access token lands; polling then
    // is a guaranteed 401, so wait for the next tick instead.
    if (!getAccessToken()) return;
    try {
      setUnread(await fetchUnreadCount());
    } catch {
      // A failing badge must never break the page it is rendered on.
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  // Re-check on navigation so the badge clears right after visiting the inbox.
  useEffect(() => {
    refresh();
  }, [pathname, refresh]);

  return (
    <Link
      to="/notifications"
      aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
      className="relative shrink-0 rounded-control border border-line-strong p-2 text-ink-muted hover:bg-surface-sunken"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      {unread > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
