import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchCourse } from "../api/courses.js";
import { fetchCourseProgress, markLessonComplete } from "../api/progress.js";
import { fetchQuizByLesson, submitQuiz } from "../api/quizzes.js";
import { getErrorMessage } from "../api/client.js";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import LessonPlayer, { LessonAttachments } from "../components/LessonPlayer.jsx";
import MockTestPanel from "../components/MockTestPanel.jsx";
import CourseLiveSessionsPanel from "../components/CourseLiveSessionsPanel.jsx";

function QuizPanel({ lessonId, onComplete }) {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setResult(null);
    setAnswers({});
    fetchQuizByLesson(lessonId)
      .then((data) => setQuiz(data.quiz))
      .catch(() => setQuiz(null))
      .finally(() => setLoading(false));
  }, [lessonId]);

  const handleSubmit = async () => {
    if (!quiz) return;
    setSubmitting(true);
    setError("");
    try {
      const payload = Object.entries(answers).map(([idx, selectedAnswer]) => ({
        questionIndex: Number(idx),
        selectedAnswer,
      }));
      const data = await submitQuiz(quiz.id, payload);
      setResult(data);
      if (data.passed) onComplete?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-sm text-slate-400">Loading quiz...</p>;
  if (!quiz) return <p className="text-sm text-slate-400">No quiz available for this lesson.</p>;

  if (result) {
    return (
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="font-semibold">
          Score: {result.percentage}% {result.passed ? "✅ Passed" : "❌ Failed"}
        </h3>
        <div className="mt-3 space-y-2">
          {result.results?.map((r, i) => (
            <div
              key={i}
              className={`rounded-lg p-3 text-sm ${r.isCorrect ? "bg-green-50" : "bg-red-50"}`}
            >
              <p>{quiz.questions[r.questionIndex]?.question}</p>
              <p className="mt-1 text-slate-500">
                Your answer: {r.selectedAnswer} | Correct: {r.correctAnswer}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <h3 className="font-semibold">{quiz.title}</h3>
      {error && <div className="rounded-lg bg-red-50 p-2 text-sm text-red-600">{error}</div>}
      {quiz.questions.map((q, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="font-medium">
            {i + 1}. {q.question}
          </p>
          <div className="mt-2 space-y-1">
            {q.options.map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={`q-${i}`}
                  checked={answers[i] === opt}
                  onChange={() => setAnswers({ ...answers, [i]: opt })}
                />
                {opt}
              </label>
            ))}
          </div>
        </div>
      ))}
      <button
        onClick={handleSubmit}
        disabled={submitting || Object.keys(answers).length < quiz.questions.length}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Submit Quiz"}
      </button>
    </div>
  );
}

function LearnContent() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const lessons = useMemo(() => {
    if (!course?.modules) return [];
    return course.modules.flatMap((m) =>
      (m.lessons || []).map((l) => ({ ...l, moduleTitle: m.title }))
    );
  }, [course]);

  const completedIds = useMemo(
    () => new Set((progress?.completedLessons || []).map((cl) => cl.lessonId)),
    [progress]
  );

  useEffect(() => {
    Promise.all([fetchCourse(courseId), fetchCourseProgress(courseId)])
      .then(([c, p]) => {
        setCourse(c);
        setProgress(p);
        const flat = c.modules?.flatMap((m) => m.lessons || []) || [];
        if (flat.length) setActiveLesson(flat[0]);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleComplete = async () => {
    if (!activeLesson) return;
    try {
      const data = await markLessonComplete(activeLesson.id);
      setProgress((prev) => ({
        ...prev,
        completedLessons: [
          ...(prev?.completedLessons || []),
          { lessonId: activeLesson.id },
        ],
        mastery: data.mastery,
        completedCount: data.completedCount,
        totalLessons: data.totalLessons,
        isPreview: data.isPreview ?? prev?.isPreview,
      }));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (loading) return <div className="text-center text-slate-400">Loading course...</div>;
  if (!course) return <div className="text-red-500">{error || "Course not found"}</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{course.title}</h1>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-indigo-600"
              style={{ width: `${progress?.mastery || 0}%` }}
            />
          </div>
          <span className="text-sm text-slate-500">
            {progress?.completedCount || 0}/{progress?.totalLessons || lessons.length} lessons ·{" "}
            {progress?.mastery || 0}%
          </span>
        </div>
      </div>

      {progress?.isPreview && (
        <div className="mb-4 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-800">
          Preview mode — you are viewing this course as its instructor. Completions are
          saved to your own record and are not counted as a learner enrolment.
        </div>
      )}

      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-3">
        <aside className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-1">
          <h2 className="font-semibold">Lessons</h2>
          <ul className="mt-3 space-y-1">
            {lessons.map((lesson, i) => (
              <li key={lesson.id}>
                <button
                  onClick={() => setActiveLesson(lesson)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                    activeLesson?.id === lesson.id
                      ? "bg-indigo-50 text-indigo-700"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <span className="text-slate-400">{completedIds.has(lesson.id) ? "✓" : i + 1}</span>
                  <span className="flex-1 truncate">{lesson.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 lg:col-span-2">
          {activeLesson ? (
            <>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{activeLesson.moduleTitle}</span>
                <span>·</span>
                <span>{activeLesson.type}</span>
              </div>
              <h2 className="mt-1 text-xl font-semibold">{activeLesson.title}</h2>

              <LessonPlayer lesson={activeLesson} />

              {activeLesson.videoUrl && !activeLesson.hasContent && (
                <div className="mt-4 aspect-video overflow-hidden rounded-lg bg-black">
                  <video src={activeLesson.videoUrl} controls className="h-full w-full" />
                </div>
              )}

              {activeLesson.content && (
                <div className="prose prose-slate mt-4 max-w-none whitespace-pre-wrap text-sm">
                  {activeLesson.content}
                </div>
              )}

              <LessonAttachments lesson={activeLesson} />

              {activeLesson.type === "QUIZ" ? (
                <QuizPanel lessonId={activeLesson.id} onComplete={handleComplete} />
              ) : (
                !completedIds.has(activeLesson.id) && (
                  <button
                    onClick={handleComplete}
                    className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    Mark as Complete
                  </button>
                )
              )}
            </>
          ) : (
            <p className="text-slate-400">Select a lesson to begin.</p>
          )}
        </section>
      </div>

      <div className="mt-6 space-y-4">
        <CourseLiveSessionsPanel courseId={courseId} />
        <MockTestPanel courseId={courseId} />
      </div>
    </div>
  );
}

export default function Learn() {
  return (
    <ProtectedRoute roles={["STUDENT", "TUTOR", "TENANT_ADMIN"]}>
      <LearnContent />
    </ProtectedRoute>
  );
}
