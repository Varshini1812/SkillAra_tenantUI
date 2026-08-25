import api, { getData } from "./client.js";

/** Cached short AI overview of a course; pass { regenerate: true } to force a refresh. */
export async function fetchCourseAiSummary(courseId, { regenerate = false } = {}) {
  const res = await api.post("/api/ai/course-summary", { courseId, regenerate });
  return getData(res);
}

/** Cached short AI overview of one module's lessons; pass { regenerate: true } to force a refresh. */
export async function fetchModuleAiSummary(moduleId, { regenerate = false } = {}) {
  const res = await api.post("/api/ai/module-summary", { moduleId, regenerate });
  return getData(res);
}
