import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAllMockTests } from "../api/mockTests.js";
import { getErrorMessage } from "../api/client.js";
import { usePermissions } from "../hooks/usePermissions.js";
import { MockTestRunner, MockTestResult } from "../components/MockTestRunner.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";

const STATUS_STYLE = {
  DRAFT: "bg-slate-100 text-slate-600",
  PUBLISHED: "bg-emerald-100 text-emerald-700",
};

function MockTestsContent() {
  const { isInstructor, isStaff } = usePermissions();
  const canManage = isInstructor || isStaff;

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [active, setActive] = useState(null);
  const [outcome, setOutcome] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchAllMockTests()
      .then(setTests)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (outcome) {
    return (
      <MockTestResult
        result={outcome.result}
        questions={outcome.questions}
        closeLabel="Back to Mock Tests"
        onClose={() => {
          setOutcome(null);
          setActive(null);
          load();
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mock Tests</h1>
        <p className="mt-1 text-sm text-slate-500">
          {canManage
            ? "Every mock test across the courses you teach."
            : "Practice tests across all the courses you're enrolled in."}
        </p>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        {loading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : tests.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
            {canManage ? "No mock tests created yet." : "No mock tests available yet."}
          </p>
        ) : (
          <ul className="space-y-2">
            {tests.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 p-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-800">{t.title}</span>
                    {canManage && (
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[t.status]}`}>
                        {t.status}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {t.courseId?.title || "—"} · {t.questions?.length || "—"} questions · {t.durationMinutes} min · pass at{" "}
                    {t.passingScore}%
                  </p>
                </div>
                {canManage ? (
                  <Link
                    to={`/teach/${t.courseId?._id || t.courseId}`}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
                  >
                    Manage in course
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActive(t)}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                  >
                    Start
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function MockTests() {
  return (
    <ProtectedRoute>
      <MockTestsContent />
    </ProtectedRoute>
  );
}
