import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchMockTestsByCourse,
  fetchMockTest,
  startMockTestAttempt,
  submitMockTest,
} from "../api/mockTests.js";
import { getErrorMessage } from "../api/client.js";

function formatClock(totalSeconds) {
  const m = Math.floor(Math.max(0, totalSeconds) / 60);
  const s = Math.max(0, totalSeconds) % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function MockTestRunner({ test, onDone, onCancel }) {
  const [startedAt, setStartedAt] = useState(null);
  const [questions, setQuestions] = useState(null);
  const [answers, setAnswers] = useState({});
  const [remaining, setRemaining] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const submittedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    startMockTestAttempt(test.id)
      .then((data) => {
        if (cancelled) return;
        setStartedAt(data.startedAt);
        setRemaining(data.durationMinutes * 60);
        return fetchMockTest(test.id);
      })
      .then((data) => {
        if (!cancelled && data) setQuestions(data.mockTest.questions);
      })
      .catch((err) => !cancelled && setError(getErrorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [test.id]);

  const submit = useCallback(async () => {
    if (submittedRef.current || !startedAt) return;
    submittedRef.current = true;
    setSubmitting(true);
    setError("");
    try {
      const payload = Object.entries(answers).map(([idx, selectedAnswer]) => ({
        questionIndex: Number(idx),
        selectedAnswer,
      }));
      const result = await submitMockTest(test.id, startedAt, payload);
      onDone(result, questions);
    } catch (err) {
      setError(getErrorMessage(err));
      submittedRef.current = false;
    } finally {
      setSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, startedAt, test.id, questions]);

  useEffect(() => {
    if (!startedAt) return undefined;
    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          submit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [startedAt, submit]);

  if (!questions) {
    return <p className="text-sm text-slate-400">Preparing test…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="font-semibold">{test.title}</h3>
        <span
          className={`rounded-lg px-3 py-1 text-sm font-semibold ${
            remaining <= 60 ? "bg-red-50 text-red-600" : "bg-indigo-50 text-indigo-700"
          }`}
        >
          {formatClock(remaining)}
        </span>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-2 text-sm text-red-600">{error}</div>}

      {questions.map((q, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="font-medium">
            {i + 1}. {q.question}
          </p>
          <div className="mt-2 space-y-1">
            {q.options.map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={`mt-${i}`}
                  checked={answers[i] === opt}
                  onChange={() => setAnswers({ ...answers, [i]: opt })}
                />
                {opt}
              </label>
            ))}
          </div>
        </div>
      ))}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={submitting || Object.keys(answers).length < questions.length}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit test"}
        </button>
      </div>
    </div>
  );
}

function MockTestResult({ result, questions, onClose }) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="font-semibold">
        Score: {result.percentage}% {result.passed ? "✅ Passed" : "❌ Not passed"}
      </h3>
      <p className="text-xs text-slate-400">
        Completed in {Math.floor(result.durationTakenSeconds / 60)}m{" "}
        {result.durationTakenSeconds % 60}s
      </p>
      <div className="space-y-2">
        {result.results?.map((r, i) => (
          <div key={i} className={`rounded-lg p-3 text-sm ${r.isCorrect ? "bg-green-50" : "bg-red-50"}`}>
            <p>{questions?.[r.questionIndex]?.question}</p>
            <p className="mt-1 text-slate-500">
              Your answer: {r.selectedAnswer} | Correct: {r.correctAnswer}
            </p>
            {r.explanation && <p className="mt-1 text-slate-400">{r.explanation}</p>}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
      >
        Back to mock tests
      </button>
    </div>
  );
}

/** Course-scoped list of published mock tests, with a timed take-and-grade flow. */
export default function MockTestPanel({ courseId }) {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [active, setActive] = useState(null);
  const [outcome, setOutcome] = useState(null);

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

  if (loading) return null;
  if (tests.length === 0) return null;

  if (outcome) {
    return (
      <MockTestResult
        result={outcome.result}
        questions={outcome.questions}
        onClose={() => {
          setOutcome(null);
          setActive(null);
        }}
      />
    );
  }

  if (active) {
    return (
      <MockTestRunner
        test={active}
        onCancel={() => setActive(null)}
        onDone={(result, questions) => setOutcome({ result, questions })}
      />
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="font-semibold">Mock tests</h2>
      {error && <div className="mt-2 rounded-lg bg-red-50 p-2 text-sm text-red-600">{error}</div>}
      <ul className="mt-3 space-y-2">
        {tests.map((t) => (
          <li
            key={t.id}
            className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
          >
            <div>
              <p className="text-sm font-medium text-slate-800">{t.title}</p>
              <p className="text-xs text-slate-400">
                {t.questions?.length || "—"} questions · {t.durationMinutes} min · pass at{" "}
                {t.passingScore}%
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActive(t)}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Start
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
