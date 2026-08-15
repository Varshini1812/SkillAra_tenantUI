import { Link } from "react-router-dom";

const LEVEL_LABELS = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
  ALL_LEVELS: "All levels",
};

const STATUS_STYLES = {
  DRAFT: "bg-slate-100 text-slate-600",
  PUBLISHED: "bg-emerald-100 text-emerald-700",
  ARCHIVED: "bg-amber-100 text-amber-700",
};

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

/**
 * @param {object} props
 * @param {object} props.course serialized course from GET /api/courses
 * @param {string} [props.to] override destination (instructors link to the editor)
 * @param {boolean} [props.showStatus] render draft/published/blocked badges
 */
export default function CourseCard({ course, to, showStatus = false }) {
  const href = to || `/courses/${course.id}`;
  const lessonCount = course.stats?.lessonCount || 0;
  const duration = course.stats?.durationMinutes || 0;

  return (
    <Link
      to={href}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="relative aspect-video bg-gradient-to-br from-indigo-500 to-purple-600">
        {course.thumbnailUrl ? (
          <img src={course.thumbnailUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-white/80">📚</div>
        )}

        {showStatus && (
          <div className="absolute left-2 top-2 flex flex-wrap gap-1">
            <span
              className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                STATUS_STYLES[course.status] || STATUS_STYLES.DRAFT
              }`}
            >
              {course.status}
            </span>
            {course.moderation?.isBlocked && (
              <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[11px] font-semibold text-rose-700">
                Blocked
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
          {course.category && (
            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium">{course.category}</span>
          )}
          <span className="rounded bg-slate-100 px-1.5 py-0.5">
            {LEVEL_LABELS[course.level] || course.level}
          </span>
        </div>

        <h3 className="mt-2 font-semibold text-slate-900 group-hover:text-indigo-600">
          {course.title}
        </h3>
        <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-500">
          {course.subtitle || course.description}
        </p>

        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="font-medium text-indigo-600">{formatPrice(course)}</span>
          <span className="text-xs text-slate-400">
            {lessonCount} lesson{lessonCount === 1 ? "" : "s"}
            {duration > 0 && ` · ${duration} min`}
          </span>
        </div>

        {course.instructor?.name && (
          <p className="mt-2 truncate text-xs text-slate-400">By {course.instructor.name}</p>
        )}
      </div>
    </Link>
  );
}
