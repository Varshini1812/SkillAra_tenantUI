import api, { getData } from "./client.js";

export async function fetchQuizByLesson(lessonId) {
  const res = await api.get(`/api/quizzes/lesson/${lessonId}`);
  return getData(res);
}

export async function submitQuiz(quizId, answers) {
  const res = await api.post(`/api/quizzes/${quizId}/submit`, { answers });
  return getData(res);
}
