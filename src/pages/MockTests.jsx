import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAllMockTests } from "../api/mockTests.js";
import { getErrorMessage } from "../api/client.js";
import { usePermissions } from "../hooks/usePermissions.js";
import { MockTestRunner, MockTestResult } from "../components/MockTestRunner.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";

const STATUS_STYLE = {
  DRAFT: "bg-surface-sunken text-ink-muted",
  PUBLISHED: "bg-success-subtle text-success",
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
        <p className="mt-1 text-sm text-ink-subtle">
          {canManage
            ? "Every mock test across the courses you teach."
            : "Practice tests across all the courses you're enrolled in."}
        </p>
      </div>

      {error && <div className="rounded-control bg-danger-subtle p-3 text-sm text-danger">{error}</div>}

      <div className="rounded-surface border border-line bg-surface p-4">
        {loading ? (
          <p className="text-sm text-ink-subtle">Loading…</p>
        ) : tests.length === 0 ? (
          <p className="rounded-control border border-dashed border-line-strong p-6 text-center text-sm text-ink-subtle">
            {canManage ? "No mock tests created yet." : "No mock tests available yet."}
          </p>
        ) : (
          <ul className="space-y-2">
            {tests.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-line p-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink">{t.title}</span>
                    {canManage && (
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[t.status]}`}>
                        {t.status}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-ink-subtle">
                    {t.courseId?.title || "—"} · {t.questions?.length || "—"} questions · {t.durationMinutes} min · pass at{" "}
                    {t.passingScore}%
                  </p>
                </div>
                {canManage ? (
                  <Link
                    to={`/teach/${t.courseId?._id || t.courseId}`}
                    className="rounded-control border border-line-strong px-3 py-1.5 text-xs font-medium hover:bg-surface-sunken"
                  >
                    Manage in course
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActive(t)}
                    className="rounded-control bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-hover"
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
