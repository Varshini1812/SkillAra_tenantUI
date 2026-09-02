import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchCourses } from "../api/courses.js";
import { fetchMyEnrollments } from "../api/enrollments.js";
import { fetchCourseAiSummary } from "../api/ai.js";
import { generateMockTest } from "../api/mockTests.js";
import { getErrorMessage } from "../api/client.js";
import { usePermissions } from "../hooks/usePermissions.js";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import Icon from "../admin/components/ui/Icon.jsx";

function CourseSummaryPanel({ courseId }) {
  const [summary, setSummary] = useState("");
  const [generatedAt, setGeneratedAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  const generate = async (regenerate = false) => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchCourseAiSummary(courseId, { regenerate });
      setSummary(data.summary);
      setGeneratedAt(data.generatedAt);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  };

  useEffect(() => {
    setSummary("");
    setGeneratedAt(null);
    setLoaded(false);
  }, [courseId]);

  return (
    <div className="rounded-surface border border-brand-border bg-brand-subtle p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 font-semibold text-ink">
          <Icon name="sparkles" size={15} /> Course summary
        </h2>
        {summary && (
          <button
            type="button"
            onClick={() => generate(true)}
            disabled={loading}
            className="text-xs font-medium text-brand hover:underline disabled:opacity-50"
          >
            {loading ? "Regenerating…" : "Regenerate"}
          </button>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      {summary ? (
        <>
          <p className="mt-2 whitespace-pre-wrap text-sm text-ink-muted">{summary}</p>
          {generatedAt && (
            <p className="mt-2 text-[11px] text-ink-subtle">
              Generated {new Date(generatedAt).toLocaleDateString()}
            </p>
          )}
        </>
      ) : (
        <div className="mt-2">
          {!loaded && <p className="text-sm text-ink-subtle">Get a quick AI-written overview of this course.</p>}
          <button
            type="button"
            onClick={() => generate(false)}
            disabled={loading}
            className="mt-2 rounded-control bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-hover disabled:opacity-50"
          >
            {loading ? "Generating…" : loaded ? "Try again" : "Generate summary"}
          </button>
        </div>
      )}
    </div>
  );
}

function MockTestGenerator({ courseId, courseTitle }) {
  const [title, setTitle] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);

  const navigate = useNavigate();
  const submit = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setError("");
    setCreated(null);
    try {
      const test = await generateMockTest({
        courseId,
        title: title.trim() || undefined,
        questionCount: Number(questionCount) || 10,
        durationMinutes: Number(durationMinutes) || 30,
      });
      setCreated(test);
      setTitle("");
      setTimeout(() => navigate(`/teach/${courseId}`), 1500);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-surface border border-line bg-surface p-4">
      <h2 className="font-semibold">Generate a mock test with AI</h2>
      <p className="mt-1 text-xs text-ink-subtle">
        Draws from every lesson in "{courseTitle}", saves it, and publishes it straight away.
      </p>

      {error && <div className="mt-3 rounded-control bg-danger-subtle p-2 text-sm text-danger">{error}</div>}
      {created && (
        <div className="mt-3 rounded-control bg-success-subtle p-2 text-sm text-success">
"{created.title}" saved as a draft with {created.questions?.length || questionCount} questions. Redirecting to course editor...
        </div>
      )}

      <div className="mt-3 space-y-3">
        <label className="block text-xs font-medium text-ink-muted">
          Title (optional)
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`Mock Test: ${courseTitle}`}
            className="mt-1 w-full rounded border border-line-strong px-2 py-1.5 text-sm"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs font-medium text-ink-muted">
            Question count
            <input
              type="number"
              min="1"
              max="50"
              value={questionCount}
              onChange={(e) => setQuestionCount(e.target.value)}
              className="mt-1 w-full rounded border border-line-strong px-2 py-1.5 text-sm"
            />
          </label>
          <label className="block text-xs font-medium text-ink-muted">
            Duration (minutes)
            <input
              type="number"
              min="1"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              className="mt-1 w-full rounded border border-line-strong px-2 py-1.5 text-sm"
            />
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={generating}
        className="mt-3 rounded-control bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50"
      >
        {generating ? "Generating…" : "Generate with AI"}
      </button>
    </form>
  );
}

const QUICK_LINKS = [
  { to: "/mock-tests", label: "Mock Tests", icon: "clipboardCheck" },
  { to: "/mock-interviews", label: "Mock Interviews", icon: "mic" },
  { to: "/live-sessions", label: "Live Sessions", icon: "tv" },
  { to: "/mentorship", label: "Mentorship", icon: "mentor" },
  { to: "/forum", label: "Forum", icon: "chat" },
];

function AiToolsContent() {
  const { can } = usePermissions();
  const canManage = can("courses", "create");

  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    const load = canManage
      ? fetchCourses({ mine: true }).then((r) => r.items)
      : fetchMyEnrollments().then((rows) =>
          (Array.isArray(rows) ? rows : [])
            .map((e) => ({ id: e.course?._id || e.courseId, title: e.course?.title }))
            .filter((c) => c.id && c.title)
        );

    load
      .then((list) => {
        setCourses(list);
        if (list.length) setCourseId(list[0].id);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [canManage]);

  const selectedCourse = courses.find((c) => c.id === courseId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Tools</h1>
        <p className="mt-1 text-sm text-ink-subtle">
          Pick a course to get an AI summary{canManage ? ", generate a mock test with AI" : ""}, and jump
          straight into practice.
        </p>
      </div>

      {error && <div className="rounded-control bg-danger-subtle p-3 text-sm text-danger">{error}</div>}

      {loading ? (
        <p className="text-sm text-ink-subtle">Loading…</p>
      ) : courses.length === 0 ? (
        <p className="rounded-control border border-dashed border-line-strong p-6 text-center text-sm text-ink-subtle">
          {canManage ? "You don't have any courses yet." : "You're not enrolled in any courses yet."}
        </p>
      ) : (
        <>
          <label className="block max-w-sm text-xs font-medium text-ink-muted">
            Course
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="mt-1 w-full rounded-control border border-line-strong px-3 py-2 text-sm"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>

          {selectedCourse && (
            <div key={courseId} className="space-y-4">
              <CourseSummaryPanel courseId={courseId} />
              {canManage && <MockTestGenerator courseId={courseId} courseTitle={selectedCourse.title} />}

              <div className="rounded-surface border border-line bg-surface p-4">
                <h2 className="font-semibold">More for this course</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {QUICK_LINKS.map((l) => (
                    <Link
                      key={l.to}
                      to={l.to}
                      className="rounded-control border border-line-strong px-3 py-1.5 text-xs font-medium hover:bg-surface-sunken"
                    >
                      {l.icon} {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AiTools() {
  return (
    <ProtectedRoute>
      <AiToolsContent />
    </ProtectedRoute>
  );
}
