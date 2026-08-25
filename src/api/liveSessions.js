import api, { getData } from "./client.js";

export async function createLiveSession(payload) {
  const res = await api.post("/api/live-sessions", payload);
  return getData(res);
}

export async function fetchCourseLiveSessions(courseId) {
  const res = await api.get(`/api/live-sessions/course/${courseId}`);
  return getData(res);
}

/** Role-scoped: staff see every session, instructors see their own courses', students
 *  see sessions on courses they're enrolled in. Backs the Live Sessions hub. */
export async function fetchAllLiveSessions(params = {}) {
  const res = await api.get("/api/live-sessions", { params });
  return getData(res);
}

export async function joinLiveSession(id) {
  const res = await api.get(`/api/live-sessions/${id}/join`);
  return getData(res);
}

export async function endLiveSession(id, recordingUrl) {
  const res = await api.patch(`/api/live-sessions/${id}/end`, recordingUrl ? { recordingUrl } : {});
  return getData(res);
}

export async function cancelLiveSession(id, reason) {
  const res = await api.patch(`/api/live-sessions/${id}/cancel`, { reason });
  return getData(res);
}
