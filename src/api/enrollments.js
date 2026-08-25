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

/** Remove a student from a course. Allowed for the enrolled student themself, the
 *  course's instructor, or staff. */
export async function dropEnrollment(enrollmentId) {
  const res = await api.delete(`/api/enrollments/${enrollmentId}`);
  return getData(res);
}

/** Instructor-safe roster picker — students only, minimal fields (id/name/email). */
export async function fetchStudentDirectory(params = {}) {
  const res = await api.get("/api/users/students", { params });
  return getData(res);
}
