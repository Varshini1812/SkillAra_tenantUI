import api, { getData } from "./client.js";

export async function fetchCourses(params = {}) {
  const res = await api.get("/api/courses", { params });
  return getData(res);
}

export async function fetchCourse(id) {
  const res = await api.get(`/api/courses/${id}`);
  return getData(res);
}
