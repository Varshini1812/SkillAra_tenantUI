import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchCourse } from "../api/courses.js";
import { fetchCourseProgress, markLessonComplete } from "../api/progress.js";
import { fetchQuizByLesson, submitQuiz } from "../api/quizzes.js";
import { fetchModuleAiSummary, fetchAiTutorResponse } from "../api/ai.js";
import { getErrorMessage } from "../api/client.js";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import LessonPlayer, { LessonAttachments } from "../components/LessonPlayer.jsx";
import MockTestPanel from "../components/MockTestPanel.jsx";
import CourseLiveSessionsPanel from "../components/CourseLiveSessionsPanel.jsx";
import Icon from "../admin/components/ui/Icon.jsx";

function ModuleSummaryPanel({ module }) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState(module.aiSummary || "");
  const [generatedAt, setGeneratedAt] = useState(module.aiSummaryGeneratedAt || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async (regenerate = false) => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchModuleAiSummary(module.id, { regenerate });
      setSummary(data.summary);
      setGeneratedAt(data.generatedAt);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1 px-3 py-1 text-left text-[11px] font-medium text-brand hover:text-brand-hover"
      >
        <Icon name="sparkles" size={15} /> {open ? "Hide" : "AI"} summary
      </button>
      {open && (
        <div className="mx-3 mb-2 rounded-control bg-brand-subtle/70 p-2 text-xs text-ink-muted">
          {error && <p className="text-danger">{error}</p>}
          {summary ? (
            <>
              <p className="whitespace-pre-wrap">{summary}</p>
              <button
                type="button"
                onClick={() => generate(true)}
                disabled={loading}
                className="mt-1 text-[10px] font-medium text-brand hover:underline disabled:opacity-50"
              >
                {loading ? "Regenerating…" : "Regenerate"}
              </button>
              {generatedAt && (
                <span className="ml-2 text-[10px] text-ink-subtle">
                  {new Date(generatedAt).toLocaleDateString()}
                </span>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={() => generate(false)}
              disabled={loading}
              className="font-medium text-brand hover:underline disabled:opacity-50"
            >
              {loading ? "Generating…" : "Generate summary for this module"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function AiTutorPanel({ lessonId }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    const userMessage = { role: "user", content: query };
    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setLoading(true);
    setError("");

    try {
      const data = await fetchAiTutorResponse(lessonId, userMessage.content);
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button 
        onClick={() => setOpen(true)}
        className="mt-6 flex items-center gap-2 rounded-control bg-brand-subtle px-4 py-2 text-sm font-medium text-brand-hover hover:bg-brand-muted w-full justify-center"
      >
        <Icon name="robot" size={15} /> Ask AI Tutor about this lesson
      </button>
    );
  }

  return (
    <div className="mt-6 rounded-surface border border-brand-border bg-brand-subtle/30 overflow-hidden">
      <div className="flex items-center justify-between bg-brand-subtle px-4 py-2 border-b border-brand-border">
        <h3 className="text-sm font-semibold text-brand-active flex items-center gap-2">
          <Icon name="robot" size={15} /> AI Tutor
        </h3>
        <button onClick={() => setOpen(false)} className="text-xs text-ink-subtle hover:text-ink-muted">Close</button>
      </div>
      <div className="p-4">
        <div className="space-y-4 max-h-60 overflow-y-auto mb-4">
          {messages.length === 0 ? (
            <p className="text-sm text-ink-subtle italic">Hi! I'm your AI tutor. Ask me anything about this lesson.</p>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`rounded-control p-3 text-sm ${m.role === 'user' ? 'bg-surface border border-line ml-8' : 'bg-brand-muted mr-8 whitespace-pre-wrap'}`}>
                {m.content}
              </div>
            ))
          )}
          {loading && <p className="text-sm text-ink-subtle italic">Thinking...</p>}
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question..."
            disabled={loading}
            className="flex-1 rounded-control border border-line-strong px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="rounded-control bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50"
          >
            Ask
          </button>
        </form>
      </div>
    </div>
  );
}

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

  if (loading) return <p className="text-sm text-ink-subtle">Loading quiz...</p>;
  if (!quiz) return <p className="text-sm text-ink-subtle">No quiz available for this lesson.</p>;

  if (result) {
    return (
      <div className="mt-4 rounded-surface border border-line bg-surface p-4">
        <h3 className="font-semibold">
          Score: {result.percentage}% <span className={`inline-flex items-center gap-1 ${result.passed ? "text-success" : "text-danger"}`}>
              <Icon name={result.passed ? "success" : "danger"} size={14} />
              {result.passed ? "Passed" : "Failed"}
            </span>
        </h3>
        <div className="mt-3 space-y-2">
          {result.results?.map((r, i) => (
            <div
              key={i}
              className={`rounded-control p-3 text-sm ${r.isCorrect ? "bg-success-subtle" : "bg-danger-subtle"}`}
            >
              <p>{quiz.questions[r.questionIndex]?.question}</p>
              <p className="mt-1 text-ink-subtle">
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
      {error && <div className="rounded-control bg-danger-subtle p-2 text-sm text-danger">{error}</div>}
      {quiz.questions.map((q, i) => (
        <div key={i} className="rounded-surface border border-line bg-surface p-4">
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
        className="rounded-control bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50"
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
        const flat = c.modules?.flatMap((m) => (m.lessons || []).map((l) => ({ ...l, moduleTitle: m.title }))) || [];
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

  if (loading) return <div className="text-center text-ink-subtle">Loading course...</div>;
  if (!course) return <div className="text-danger">{error || "Course not found"}</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{course.title}</h1>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-surface-sunken">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${progress?.mastery || 0}%` }}
            />
          </div>
          <span className="text-sm text-ink-subtle">
            {progress?.completedCount || 0}/{progress?.totalLessons || lessons.length} lessons ·{" "}
            {progress?.mastery || 0}%
          </span>
        </div>
      </div>

      {progress?.isPreview && (
        <div className="mb-4 rounded-control bg-brand-subtle p-3 text-sm text-brand-active">
          Preview mode — you are viewing this course as its instructor. Completions are
          saved to your own record and are not counted as a learner enrolment.
        </div>
      )}

      {error && <div className="mb-4 rounded-control bg-danger-subtle p-3 text-sm text-danger">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-3">
        <aside className="rounded-surface border border-line bg-surface p-4 lg:col-span-1">
          <h2 className="font-semibold">Lessons</h2>
          <div className="mt-3 space-y-3">
            {(course.modules || []).map((mod) => (
              <div key={mod.id}>
                <p className="px-3 text-xs font-semibold uppercase tracking-wide text-ink-subtle">{mod.title}</p>
                <ModuleSummaryPanel module={mod} />
                <ul className="space-y-1">
                  {(mod.lessons || []).map((lesson) => {
                    const globalIndex = lessons.findIndex((l) => l.id === lesson.id);
                    return (
                      <li key={lesson.id}>
                        <button
                          onClick={() => setActiveLesson({ ...lesson, moduleTitle: mod.title })}
                          className={`flex w-full items-center gap-2 rounded-control px-3 py-2 text-left text-sm transition ${
                            activeLesson?.id === lesson.id
                              ? "bg-brand-subtle text-brand-hover"
                              : "hover:bg-surface-sunken"
                          }`}
                        >
                          <span className="text-ink-subtle">
                            {completedIds.has(lesson.id) ? <Icon name="check" size={13} /> : globalIndex + 1}
                          </span>
                          <span className="flex-1 truncate">{lesson.title}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        <section className="rounded-surface border border-line bg-surface p-4 sm:p-6 lg:col-span-2">
          {activeLesson ? (
            <>
              <div className="flex items-center gap-2 text-xs text-ink-subtle">
                <span>{activeLesson.moduleTitle}</span>
                <span>·</span>
                <span>{activeLesson.type}</span>
              </div>
              <h2 className="mt-1 text-xl font-semibold">{activeLesson.title}</h2>

              <LessonPlayer lesson={activeLesson} />

              {activeLesson.videoUrl && !activeLesson.hasContent && (
                <div className="mt-4 aspect-video overflow-hidden rounded-control bg-black">
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
                    className="mt-6 rounded-control bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
                  >
                    Mark as Complete
                  </button>
                )
              )}

              <AiTutorPanel lessonId={activeLesson.id} />
            </>
          ) : (
            <p className="text-ink-subtle">Select a lesson to begin.</p>
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
    <ProtectedRoute requires={["lessons", "view"]}>
      <LearnContent />
    </ProtectedRoute>
  );
}
