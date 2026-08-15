import api, { getData } from "./client.js";

export async function enroll(courseId) {
  const res = await api.post("/api/enrollments", { courseId });
  return getData(res);
}

export async function fetchMyEnrollments() {
  const res = await api.get("/api/enrollments/my");
  return getData(res);
}

/** Staff/instructor path — enrol students who were added by an admin. */
export async function bulkEnroll(courseId, userIds) {
  const res = await api.post("/api/enrollments/bulk", { courseId, userIds });
  return getData(res);
}

export async function fetchCourseEnrollments(courseId) {
  const res = await api.get(`/api/enrollments/course/${courseId}`);
  return getData(res);
}
