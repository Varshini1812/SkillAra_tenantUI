import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { fetchCourse } from "../api/courses.js";
import { enroll } from "../api/enrollments.js";
import { getErrorMessage } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

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

function LessonRow({ lesson, index }) {
  return (
    <li className="flex items-center gap-2 py-1 text-sm text-slate-600">
      <span className="w-5 shrink-0 text-right text-slate-400">{index + 1}.</span>
      <span className="flex-1 truncate">{lesson.title}</span>

      {lesson.isPreview && (
        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
          Preview
        </span>
      )}
      {lesson.locked && (
        <span className="text-slate-400" title="Enroll to unlock">
          🔒
        </span>
      )}

      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px]">{lesson.type}</span>
      {lesson.duration > 0 && (
        <span className="w-14 shrink-0 text-right text-xs text-slate-400">{lesson.duration} min</span>
      )}
    </li>
  );
}

export default function CourseDetail() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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
      setMessage("Enrolled successfully.");
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <div className="text-center text-slate-400">Loading...</div>;
  if (!course) return <div className="text-center text-red-500">{error || "Course not found"}</div>;

  const moduleCount = course.modules?.length || 0;
  const lessonCount = course.stats?.lessonCount || 0;

  return (
    <div>
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
        {course.thumbnailUrl && (
          <img src={course.thumbnailUrl} alt="" className="h-48 w-full object-cover opacity-90" />
        )}
        <div className="p-8">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {course.category && (
              <span className="rounded bg-white/20 px-2 py-0.5">{course.category}</span>
            )}
            <span className="rounded bg-white/20 px-2 py-0.5">{course.level}</span>
            {course.status !== "PUBLISHED" && (
              <span className="rounded bg-amber-400 px-2 py-0.5 font-semibold text-amber-950">
                {course.status}
              </span>
            )}
          </div>

          <h1 className="mt-3 text-3xl font-bold">{course.title}</h1>
          {course.subtitle && <p className="mt-1 text-lg text-indigo-100">{course.subtitle}</p>}
          <p className="mt-3 max-w-2xl whitespace-pre-wrap text-indigo-100">{course.description}</p>

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
        <div className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
          This course is currently blocked by an administrator
          {course.moderation.reason ? `: ${course.moderation.reason}` : "."}
        </div>
      )}

      {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
      {message && (
        <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-600">{message}</div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        {course.hasAccess ? (
          <Link
            to={`/learn/${id}`}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700"
          >
            Continue learning
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleEnroll}
            disabled={enrolling}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {enrolling ? "Enrolling..." : course.price > 0 ? "Purchase (coming soon)" : "Enroll free"}
          </button>
        )}

        {course.canManage && (
          <Link
            to={`/teach/${id}`}
            className="rounded-lg border border-slate-300 px-5 py-2.5 font-medium hover:bg-slate-50"
          >
            Edit course
          </Link>
        )}
      </div>

      {(course.outcomes?.length > 0 || course.requirements?.length > 0) && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {course.outcomes?.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="font-semibold">What you'll learn</h2>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                {course.outcomes.map((o, i) => (
                  <li key={i}>• {o}</li>
                ))}
              </ul>
            </div>
          )}
          {course.requirements?.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="font-semibold">Requirements</h2>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
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
            <div key={mod.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="font-medium">
                Module {i + 1}: {mod.title}
              </h3>
              {mod.description && <p className="mt-1 text-sm text-slate-500">{mod.description}</p>}
              <ul className="mt-2 divide-y divide-slate-100">
                {(mod.lessons || []).map((lesson, j) => (
                  <LessonRow key={lesson.id} lesson={lesson} index={j} />
                ))}
              </ul>
            </div>
          ))}
          {moduleCount === 0 && (
            <p className="text-sm text-slate-400">No content published yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
