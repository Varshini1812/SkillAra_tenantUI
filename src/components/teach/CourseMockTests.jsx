import { useCallback, useEffect, useState } from "react";
import {
  fetchMockTestsByCourse,
  createMockTest,
  generateMockTest,
  publishMockTest,
  fetchMockTestAttempts,
} from "../../api/mockTests.js";
import { getErrorMessage } from "../../api/client.js";

const emptyQuestion = () => ({
  question: "",
  options: ["", "", "", ""],
  correctAnswer: "",
  explanation: "",
});

function ManualBuilder({ courseId, onCreated, onCancel }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [passingScore, setPassingScore] = useState(60);
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const updateQuestion = (i, patch) =>
    setQuestions((prev) => prev.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));

  const updateOption = (qi, oi, value) =>
    setQuestions((prev) =>
      prev.map((q, idx) =>
        idx === qi ? { ...q, options: q.options.map((o, j) => (j === oi ? value : o)) } : q
      )
    );

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const cleaned = questions.map((q) => ({
        ...q,
        options: q.options.map((o) => o.trim()).filter(Boolean),
      }));
      const test = await createMockTest({
        courseId,
        title: title.trim(),
        description: description.trim(),
        durationMinutes: Number(durationMinutes) || 30,
        passingScore: Number(passingScore) || 60,
        questions: cleaned,
      });
      onCreated(test);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-slate-200 p-4">
      {error && <div className="rounded-lg bg-red-50 p-2 text-sm text-red-600">{error}</div>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-xs font-medium text-slate-600">
          Title
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Description
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Duration (minutes)
          <input
            type="number"
            min="1"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Passing score (%)
          <input
            type="number"
            min="0"
            max="100"
            value={passingScore}
            onChange={(e) => setPassingScore(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
        </label>
      </div>

      <div className="space-y-3">
        {questions.map((q, i) => (
          <div key={i} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Question {i + 1}</span>
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => setQuestions((prev) => prev.filter((_, idx) => idx !== i))}
                  className="text-xs text-rose-600 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
            <input
              required
              placeholder="Question text"
              value={q.question}
              onChange={(e) => updateQuestion(i, { question: e.target.value })}
              className="mt-2 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            />
            <div className="mt-2 grid grid-cols-2 gap-2">
              {q.options.map((opt, oi) => (
                <input
                  key={oi}
                  placeholder={`Option ${oi + 1}`}
                  value={opt}
                  onChange={(e) => updateOption(i, oi, e.target.value)}
                  className="rounded border border-slate-300 px-2 py-1.5 text-sm"
                />
              ))}
            </div>
            <select
              required
              value={q.correctAnswer}
              onChange={(e) => updateQuestion(i, { correctAnswer: e.target.value })}
              className="mt-2 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="">Correct answer…</option>
              {q.options.filter(Boolean).map((opt, oi) => (
                <option key={oi} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <input
              placeholder="Explanation (optional)"
              value={q.explanation}
              onChange={(e) => updateQuestion(i, { explanation: e.target.value })}
              className="mt-2 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => setQuestions((prev) => [...prev, emptyQuestion()])}
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          + Add question
        </button>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Create mock test"}
        </button>
      </div>
    </form>
  );
}

function AiGenerateForm({ courseId, onCreated, onCancel }) {
  const [title, setTitle] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setError("");
    try {
      const test = await generateMockTest({
        courseId,
        title: title.trim() || undefined,
        questionCount: Number(questionCount) || 10,
        durationMinutes: Number(durationMinutes) || 30,
      });
      onCreated(test);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-slate-200 p-4">
      {error && <div className="rounded-lg bg-red-50 p-2 text-sm text-red-600">{error}</div>}
      <p className="text-xs text-slate-500">
        Generates questions from this course's lesson content using AI, then saves and publishes
        the test.
      </p>
      <label className="block text-xs font-medium text-slate-600">
        Title (optional)
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-xs font-medium text-slate-600">
          Question count
          <input
            type="number"
            min="1"
            max="50"
            value={questionCount}
            onChange={(e) => setQuestionCount(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Duration (minutes)
          <input
            type="number"
            min="1"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
        </label>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={generating}
          className="rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {generating ? "Generating…" : "Generate with AI"}
        </button>
      </div>
    </form>
  );
}

function AttemptsList({ mockTestId }) {
  const [attempts, setAttempts] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMockTestAttempts(mockTestId)
      .then(setAttempts)
      .catch((err) => setError(getErrorMessage(err)));
  }, [mockTestId]);

  if (error) return <p className="mt-2 text-xs text-red-600">{error}</p>;
  if (!attempts) return <p className="mt-2 text-xs text-slate-400">Loading attempts…</p>;
  if (attempts.length === 0) return <p className="mt-2 text-xs text-slate-400">No attempts yet.</p>;

  return (
    <ul className="mt-2 space-y-1 text-xs text-slate-600">
      {attempts.map((a) => (
        <li key={a._id} className="flex justify-between rounded bg-slate-50 px-2 py-1">
          <span>{a.userId?.name || a.userId?.email || "Student"}</span>
          <span className={a.passed ? "text-emerald-600" : "text-rose-600"}>{a.percentage}%</span>
        </li>
      ))}
    </ul>
  );
}

/** Instructor-facing mock test management for one course — manual builder, AI generation, publish, attempts. */
export default function CourseMockTests({ courseId }) {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mode, setMode] = useState(null); // null | "manual" | "ai"
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchMockTestsByCourse(courseId)
      .then(setTests)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreated = () => {
    setMode(null);
    load();
  };

  const handlePublish = async (id) => {
    setError("");
    try {
      await publishMockTest(id);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-slate-900">Mock tests</h2>
        {!mode && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("ai")}
              className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700 hover:bg-purple-100"
            >
              Generate with AI
            </button>
            <button
              type="button"
              onClick={() => setMode("manual")}
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-900"
            >
              New mock test
            </button>
          </div>
        )}
      </div>

      {error && <div className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-600">{error}</div>}

      {mode === "manual" && (
        <div className="mt-3">
          <ManualBuilder courseId={courseId} onCreated={handleCreated} onCancel={() => setMode(null)} />
        </div>
      )}
      {mode === "ai" && (
        <div className="mt-3">
          <AiGenerateForm courseId={courseId} onCreated={handleCreated} onCancel={() => setMode(null)} />
        </div>
      )}

      {loading ? (
        <p className="mt-4 text-sm text-slate-400">Loading…</p>
      ) : tests.length === 0 ? (
        !mode && (
          <p className="mt-4 rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
            No mock tests yet.
          </p>
        )
      ) : (
        <ul className="mt-4 space-y-2">
          {tests.map((t) => (
            <li key={t.id} className="rounded-lg border border-slate-100 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">{t.title}</p>
                  <p className="text-xs text-slate-400">
                    {t.questions?.length} questions · {t.durationMinutes} min ·{" "}
                    <span
                      className={`font-medium ${
                        t.status === "PUBLISHED" ? "text-emerald-600" : "text-slate-500"
                      }`}
                    >
                      {t.status}
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {t.status === "DRAFT" && (
                    <button
                      type="button"
                      onClick={() => handlePublish(t.id)}
                      className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700"
                    >
                      Publish
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setExpanded((cur) => (cur === t.id ? null : t.id))}
                    className="rounded-lg border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50"
                  >
                    {expanded === t.id ? "Hide attempts" : "Attempts"}
                  </button>
                </div>
              </div>
              {expanded === t.id && <AttemptsList mockTestId={t.id} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
