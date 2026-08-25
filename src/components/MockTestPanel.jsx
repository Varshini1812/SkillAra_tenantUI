import { useCallback, useEffect, useState } from "react";
import { fetchMockTestsByCourse } from "../api/mockTests.js";
import { getErrorMessage } from "../api/client.js";
import { MockTestRunner, MockTestResult } from "./MockTestRunner.jsx";

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
