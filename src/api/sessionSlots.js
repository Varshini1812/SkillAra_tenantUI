import api, { getData } from "./client.js";

export async function createSlot(payload) {
  const res = await api.post("/api/session-slots", payload);
  return getData(res);
}

export async function fetchOpenSlots(params = {}) {
  const res = await api.get("/api/session-slots", { params });
  return getData(res);
}

export async function fetchMySlots(params = {}) {
  const res = await api.get("/api/session-slots/my", { params });
  return getData(res);
}

/** Staff oversight — every slot in the tenant, any host, any status. */
export async function fetchAllSlots(params = {}) {
  const res = await api.get("/api/session-slots/all", { params });
  return getData(res);
}

export async function bookSlot(id) {
  const res = await api.post(`/api/session-slots/${id}/book`);
  return getData(res);
}

export async function cancelSlot(id, reason) {
  const res = await api.post(`/api/session-slots/${id}/cancel`, { reason });
  return getData(res);
}

export async function completeSlot(id, feedback) {
  const res = await api.post(`/api/session-slots/${id}/complete`, feedback || {});
  return getData(res);
}

export async function deleteSlot(id) {
  const res = await api.delete(`/api/session-slots/${id}`);
  return getData(res);
}
