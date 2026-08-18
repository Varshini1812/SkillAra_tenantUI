import api, { getData } from "./client.js";

export async function fetchMockTestsByCourse(courseId) {
  const res = await api.get(`/api/mock-tests/course/${courseId}`);
  return getData(res);
}

/** Staff oversight — every mock test in the tenant, across all courses. */
export async function fetchAllMockTests(params = {}) {
  const res = await api.get("/api/mock-tests", { params });
  return getData(res);
}

export async function fetchMockTest(id) {
  const res = await api.get(`/api/mock-tests/${id}`);
  return getData(res);
}

export async function createMockTest(payload) {
  const res = await api.post("/api/mock-tests", payload);
  return getData(res);
}

export async function generateMockTest(payload) {
  const res = await api.post("/api/mock-tests/generate", payload);
  return getData(res);
}

export async function startMockTestAttempt(id) {
  const res = await api.post(`/api/mock-tests/${id}/start`);
  return getData(res);
}

export async function submitMockTest(id, startedAt, answers) {
  const res = await api.post(`/api/mock-tests/${id}/submit`, { startedAt, answers });
  return getData(res);
}

export async function fetchMockTestAttempts(id) {
  const res = await api.get(`/api/mock-tests/${id}/attempts`);
  return getData(res);
}

export async function publishMockTest(id) {
  const res = await api.patch(`/api/mock-tests/${id}/publish`);
  return getData(res);
}
