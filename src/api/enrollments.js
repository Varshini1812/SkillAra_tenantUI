import api, { getData } from "./client.js";

export async function enroll(courseId) {
  const res = await api.post("/api/enrollments", { courseId });
  return getData(res);
}

export async function fetchMyEnrollments() {
  const res = await api.get("/api/enrollments/my");
  return getData(res);
}
