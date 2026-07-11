import api, { getData } from "./client.js";

export async function fetchCourseProgress(courseId) {
  const res = await api.get(`/api/progress/course/${courseId}`);
  return getData(res);
}

export async function markLessonComplete(lessonId) {
  const res = await api.post(`/api/progress/lessons/${lessonId}/complete`);
  return getData(res);
}

export async function fetchMyProgress() {
  const res = await api.get("/api/progress/my");
  return getData(res);
}
