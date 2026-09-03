import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { fetchCourse } from "../api/courses.js";
import { enroll } from "../api/enrollments.js";
import { fetchCourseAiSummary } from "../api/ai.js";
import { getErrorMessage } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import Icon from "../admin/components/ui/Icon.jsx";

function formatPrice(course) {
  if (!course.price) return "Free";
  const currency = course.currency || "INR";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(course.price);
  } catch {
    return `${currency} ${course.price}`;
  }
}

function AiSummaryCard({ courseId, initialSummary, initialGeneratedAt, canManage }) {
  const [summary, setSummary] = useState(initialSummary || "");
  const [generatedAt, setGeneratedAt] = useState(initialGeneratedAt || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    }
  };

  return (
    <div className="mt-8 rounded-surface border border-brand-border bg-brand-subtle p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 font-semibold text-ink">
          <Icon name="sparkles" size={15} /> AI summary
        </h2>
        {summary && canManage && (
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
              Generated {new Date(generatedAt).toLocaleDateString()} — AI-generated, may not be fully accurate.
            </p>
          )}
        </>
      ) : (
        <div className="mt-2">
          <p className="text-sm text-ink-subtle">Get a quick AI-written overview of what this course covers.</p>
          <button
            type="button"
            onClick={() => generate(false)}
            disabled={loading}
            className="mt-2 rounded-control bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-hover disabled:opacity-50"
          >
            {loading ? "Generating…" : "Generate summary"}
          </button>
        </div>
      )}
    </div>
  );
}

function LessonRow({ lesson, index }) {
  return (
    <li className="flex items-center gap-2 py-1 text-sm text-ink-muted">
      <span className="w-5 shrink-0 text-right text-ink-subtle">{index + 1}.</span>
      <span className="flex-1 truncate">{lesson.title}</span>

      {lesson.isPreview && (
        <span className="rounded bg-success-subtle px-1.5 py-0.5 text-[11px] font-medium text-success">
          Preview
        </span>
      )}
      {lesson.locked && (
        <span className="text-ink-subtle" title="Enroll to unlock">
          <Icon name="lock" size={15} />
        </span>
      )}

      <span className="rounded bg-surface-sunken px-1.5 py-0.5 text-[11px]">{lesson.type}</span>
      {lesson.duration > 0 && (
        <span className="w-14 shrink-0 text-right text-xs text-ink-subtle">{lesson.duration} min</span>
      )}
    </li>
  );
}

import { useLocation, useSearchParams } from "react-router-dom";

export default function CourseDetail() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isEditorPreview = searchParams.get("from") === "editor" || location.state?.from === "editor";

  const load = () =>
    fetchCourse(id)
      .then(setCourse)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setEnrolling(true);
    setError("");
    try {
      await enroll(id);
      setMessage(
        course.needsApproval
          ? "Access requested. An admin will review it and you'll get a notification."
          : "Enrolled successfully."
      );
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <div className="text-center text-ink-subtle">Loading...</div>;
  if (!course) return <div className="text-center text-danger">{error || "Course not found"}</div>;

  // A paid course is not entered by paying here — the learner asks and staff decide.
  const pending = ["PENDING_APPROVAL", "PENDING_PAYMENT"].includes(course.myEnrollment?.status);
  const declined = course.myEnrollment?.status === "REJECTED";
  const moduleCount = course.modules?.length || 0;
  const lessonCount = course.stats?.lessonCount || 0;

  return (
    <div className="space-y-4">
      {isEditorPreview ? (
        <div className="flex items-center justify-between rounded-surface border border-brand-border bg-brand-subtle px-4 py-2.5 text-sm text-brand-hover shadow-sm">
          <div className="flex items-center gap-2 font-medium">
            <Icon name="sparkles" size={16} /> Viewing in Course Editor Preview Mode
          </div>
          <Link
            to={`/teach/${id}`}
            className="rounded-control bg-brand px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-hover shadow-sm"
          >
            ← Back to Course Editor
          </Link>
        </div>
      ) : (
        <Link
          to="/courses"
          className="inline-flex items-center gap-1.5 text-sm text-ink-subtle hover:text-brand transition mb-1"
        >
          <Icon name="arrowLeft" size={15} /> Back to Courses
        </Link>
      )}

      <div className="overflow-hidden rounded-surface bg-gradient-to-br from-brand to-brand-hover text-white">
        {course.thumbnailUrl && (
          <img src={course.thumbnailUrl} alt="" className="h-48 w-full object-cover opacity-90" />
        )}
        <div className="p-8">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {course.category && (
              <span className="rounded bg-surface/20 px-2 py-0.5">{course.category}</span>
            )}
            <span className="rounded bg-surface/20 px-2 py-0.5">{course.level}</span>
            {course.status !== "PUBLISHED" && (
              <span className="rounded bg-warning-subtle px-2 py-0.5 font-semibold text-warning">
                {course.status}
              </span>
            )}
          </div>

          <h1 className="mt-3 text-3xl font-bold">{course.title}</h1>
          {course.subtitle && <p className="mt-1 text-lg text-brand-muted">{course.subtitle}</p>}
          <p className="mt-3 max-w-2xl whitespace-pre-wrap text-brand-muted">{course.description}</p>

          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <span>{moduleCount} modules</span>
            <span>{lessonCount} lessons</span>
            {course.stats?.durationMinutes > 0 && <span>{course.stats.durationMinutes} min</span>}
            <span>{formatPrice(course)}</span>
            {course.instructor?.name && <span>By {course.instructor.name}</span>}
          </div>
        </div>
      </div>

      {course.moderation?.isBlocked && (
        <div className="mt-4 rounded-control bg-danger-subtle p-3 text-sm text-danger">
          This course is currently blocked by an administrator
          {course.moderation.reason ? `: ${course.moderation.reason}` : "."}
        </div>
      )}

      {declined && (
        <div className="mt-4 rounded-control bg-danger-subtle p-3 text-sm text-danger">
          Your access request was declined
          {course.myEnrollment.decisionNote ? `: ${course.myEnrollment.decisionNote}` : "."} You can
          ask again if something has changed.
        </div>
      )}

      {error && <div className="mt-4 rounded-control bg-danger-subtle p-3 text-sm text-danger">{error}</div>}
      {message && (
        <div className="mt-4 rounded-control bg-success-subtle p-3 text-sm text-success">{message}</div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        {course.hasAccess ? (
          <Link
            to={`/learn/${id}`}
            className="rounded-control bg-brand px-5 py-2.5 font-medium text-white hover:bg-brand-hover"
          >
            Continue learning
          </Link>
        ) : pending ? (
          <div className="rounded-control bg-brand-subtle px-5 py-2.5 text-sm font-medium text-brand-hover">
            Access requested — waiting for approval
          </div>
        ) : (
          <button
            type="button"
            onClick={handleEnroll}
            disabled={enrolling}
            className="rounded-control bg-brand px-5 py-2.5 font-medium text-white hover:bg-brand-hover disabled:opacity-50"
          >
            {enrolling
              ? "Processing…"
              : course.needsApproval
                ? `Request access — ${course.currency} ${course.price}`
                : "Enroll free"}
          </button>
        )}

        {course.canManage && (
          <Link
            to={`/teach/${id}`}
            className="rounded-control border border-line-strong px-5 py-2.5 font-medium hover:bg-surface-sunken"
          >
            Edit course
          </Link>
        )}
      </div>

      <AiSummaryCard
        key={id}
        courseId={id}
        initialSummary={course.aiSummary}
        initialGeneratedAt={course.aiSummaryGeneratedAt}
        canManage={course.canManage}
      />

      {(course.outcomes?.length > 0 || course.requirements?.length > 0) && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {course.outcomes?.length > 0 && (
            <div className="rounded-surface border border-line bg-surface p-4">
              <h2 className="font-semibold">What you'll learn</h2>
              <ul className="mt-2 space-y-1 text-sm text-ink-muted">
                {course.outcomes.map((o, i) => (
                  <li key={i}>• {o}</li>
                ))}
              </ul>
            </div>
          )}
          {course.requirements?.length > 0 && (
            <div className="rounded-surface border border-line bg-surface p-4">
              <h2 className="font-semibold">Requirements</h2>
              <ul className="mt-2 space-y-1 text-sm text-ink-muted">
                {course.requirements.map((r, i) => (
                  <li key={i}>• {r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-semibold">Course content</h2>
        <div className="mt-4 space-y-4">
          {(course.modules || []).map((mod, i) => (
            <div key={mod.id} className="rounded-surface border border-line bg-surface p-4">
              <h3 className="font-medium">
                Module {i + 1}: {mod.title}
              </h3>
              {mod.description && <p className="mt-1 text-sm text-ink-subtle">{mod.description}</p>}
              <ul className="mt-2 divide-y divide-line">
                {(mod.lessons || []).map((lesson, j) => (
                  <LessonRow key={lesson.id} lesson={lesson} index={j} />
                ))}
              </ul>
            </div>
          ))}
          {moduleCount === 0 && (
            <p className="text-sm text-ink-subtle">No content published yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
