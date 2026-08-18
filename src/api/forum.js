import api, { getData } from "./client.js";

export async function createQuestion(payload) {
  const res = await api.post("/api/forum/questions", payload);
  return getData(res);
}

export async function fetchQuestions(params = {}) {
  const res = await api.get("/api/forum/questions", { params });
  return { items: getData(res) || [], pagination: res.data?.pagination || {} };
}

export async function fetchQuestion(id) {
  const res = await api.get(`/api/forum/questions/${id}`);
  return getData(res);
}

export async function deleteQuestion(id) {
  const res = await api.delete(`/api/forum/questions/${id}`);
  return getData(res);
}

export async function voteQuestion(id, value) {
  const res = await api.post(`/api/forum/questions/${id}/vote`, { value });
  return getData(res);
}

export async function moderateQuestion(id, isHidden, reason) {
  const res = await api.patch(`/api/forum/questions/${id}/moderate`, { isHidden, reason });
  return getData(res);
}

export async function createAnswer(questionId, body) {
  const res = await api.post(`/api/forum/questions/${questionId}/answers`, { body });
  return getData(res);
}

export async function deleteAnswer(id) {
  const res = await api.delete(`/api/forum/answers/${id}`);
  return getData(res);
}

export async function acceptAnswer(id) {
  const res = await api.post(`/api/forum/answers/${id}/accept`);
  return getData(res);
}

export async function voteAnswer(id, value) {
  const res = await api.post(`/api/forum/answers/${id}/vote`, { value });
  return getData(res);
}

export async function moderateAnswer(id, isHidden, reason) {
  const res = await api.patch(`/api/forum/answers/${id}/moderate`, { isHidden, reason });
  return getData(res);
}
