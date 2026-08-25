import api, { getData } from "./client.js";

export async function createTicket(payload) {
  const res = await api.post("/api/mentorship-tickets", payload);
  return getData(res);
}

/** Open, unclaimed tickets a mentor can pick up. */
export async function fetchTicketQueue(params = {}) {
  const res = await api.get("/api/mentorship-tickets/queue", { params });
  return getData(res);
}

/** Student's own tickets, or a mentor's assigned tickets — role-aware on the server. */
export async function fetchMyTickets(params = {}) {
  const res = await api.get("/api/mentorship-tickets/mine", { params });
  return getData(res);
}

/** Staff oversight — every ticket in the tenant, any mentor. */
export async function fetchAllTickets(params = {}) {
  const res = await api.get("/api/mentorship-tickets", { params });
  return getData(res);
}

export async function fetchTicket(id) {
  const res = await api.get(`/api/mentorship-tickets/${id}`);
  return getData(res);
}

export async function claimTicket(id) {
  const res = await api.patch(`/api/mentorship-tickets/${id}/claim`);
  return getData(res);
}

export async function assignTicket(id, mentorId) {
  const res = await api.patch(`/api/mentorship-tickets/${id}/assign`, { mentorId });
  return getData(res);
}

export async function closeTicket(id, closeNote) {
  const res = await api.patch(`/api/mentorship-tickets/${id}/close`, { closeNote });
  return getData(res);
}

export async function reopenTicket(id) {
  const res = await api.patch(`/api/mentorship-tickets/${id}/reopen`);
  return getData(res);
}

export async function fetchTicketMessages(id) {
  const res = await api.get(`/api/mentorship-tickets/${id}/messages`);
  return getData(res);
}

/** REST fallback for sending a chat message — the socket path (useTicketChat) is primary. */
export async function postTicketMessage(id, body) {
  const res = await api.post(`/api/mentorship-tickets/${id}/messages`, { body });
  return getData(res);
}

export async function fetchTicketSessions(id) {
  const res = await api.get(`/api/mentorship-tickets/${id}/sessions`);
  return getData(res);
}

export async function createTicketSession(id, payload) {
  const res = await api.post(`/api/mentorship-tickets/${id}/sessions`, payload);
  return getData(res);
}

export async function fetchMentorDashboard() {
  const res = await api.get("/api/mentorship-tickets/dashboard/mentor");
  return getData(res);
}

export async function fetchAdminMentorshipDashboard() {
  const res = await api.get("/api/mentorship-tickets/dashboard/admin");
  return getData(res);
}
