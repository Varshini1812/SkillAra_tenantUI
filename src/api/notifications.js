import api, { getData } from "./client.js";

/**
 * In-app notification inbox.
 *
 * Every endpoint is scoped server-side to the signed-in user, so there is no user id to
 * pass and no way to read someone else's inbox.
 */

/** @param {{unreadOnly?: boolean, page?: number, limit?: number}} params */
export async function fetchNotifications(params = {}) {
  const res = await api.get("/api/notifications", { params });
  const data = getData(res) || {};
  return {
    notifications: data.notifications || [],
    unreadCount: data.unreadCount || 0,
    totalCount: data.totalCount || 0,
  };
}

export async function fetchUnreadCount() {
  const res = await api.get("/api/notifications/unread-count");
  return getData(res)?.unreadCount || 0;
}

export async function markNotificationRead(id) {
  const res = await api.patch(`/api/notifications/${id}/read`);
  return getData(res);
}

export async function markAllNotificationsRead() {
  const res = await api.post("/api/notifications/read-all");
  return getData(res);
}
