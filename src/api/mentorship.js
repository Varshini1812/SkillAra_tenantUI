import api, { getData } from "./client.js";

/**
 * The mentor directory: a mentor's self-service profile, and browsing mentors.
 * The request/accept-reject flow that used to live here has been replaced by the
 * ticket-based flow in api/mentorshipTickets.js.
 */

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
