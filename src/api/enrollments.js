import api, { getData } from "./client.js";

/**
 * Free courses enrol immediately; paid courses record a request that staff must approve.
 * The response message tells the learner which happened.
 */
export async function enroll(courseId, note) {
  const res = await api.post("/api/enrollments", { courseId, note });
  return getData(res);
}

/* ------------------- paid-course access requests (staff) ------------------- */

export async function fetchEnrollmentRequests(status) {
  const res = await api.get("/api/enrollments/requests", { params: { status } });
  return getData(res)?.requests || [];
}

export async function approveEnrollmentRequest(id, note) {
  const res = await api.post(`/api/enrollments/requests/${id}/approve`, { note });
  return getData(res);
}

export async function rejectEnrollmentRequest(id, note) {
  const res = await api.post(`/api/enrollments/requests/${id}/reject`, { note });
  return getData(res);
}

/** Staff view of one learner's course access — includes pending and declined rows. */
export async function fetchUserEnrollments(userId) {
  const res = await api.get(`/api/enrollments/user/${userId}`);
  return getData(res)?.enrollments || [];
}

/** Give one learner access to one course directly, without waiting for a request. */
export async function grantCourseAccess(userId, courseId) {
  const res = await api.post("/api/enrollments/grant", { userId, courseId });
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

export async function fetchCourseEnrollableUsers(courseId) {
  const res = await api.get(`/api/courses/${courseId}/enrollable-users`);
  return getData(res);
}
