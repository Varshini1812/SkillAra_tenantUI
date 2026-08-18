import api, { getData } from "./client.js";

export async function upsertMentorProfile(payload) {
  const res = await api.put("/api/mentorship/profile", payload);
  return getData(res);
}

export async function fetchMyMentorProfile() {
  const res = await api.get("/api/mentorship/profile/me");
  return getData(res);
}

export async function fetchMentors(params = {}) {
  const res = await api.get("/api/mentorship/mentors", { params });
  return getData(res);
}

export async function requestMentorship(payload) {
  const res = await api.post("/api/mentorship/requests", payload);
  return getData(res);
}

/** Staff oversight — every mentorship request in the tenant, any mentor. */
export async function fetchAllMentorshipRequests(params = {}) {
  const res = await api.get("/api/mentorship/requests", { params });
  return getData(res);
}

export async function fetchIncomingRequests(params = {}) {
  const res = await api.get("/api/mentorship/requests/incoming", { params });
  return getData(res);
}

export async function fetchOutgoingRequests() {
  const res = await api.get("/api/mentorship/requests/outgoing");
  return getData(res);
}

export async function respondToRequest(id, status, responseNote) {
  const res = await api.patch(`/api/mentorship/requests/${id}/respond`, { status, responseNote });
  return getData(res);
}
