import { Link } from "react-router-dom";
import Icon from "../admin/components/ui/Icon.jsx";

const LEVEL_LABELS = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
  ALL_LEVELS: "All levels",
};

const STATUS_STYLES = {
  DRAFT: "bg-surface-sunken text-ink-muted",
  PUBLISHED: "bg-success-subtle text-success",
  ARCHIVED: "bg-warning-subtle text-warning",
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
      className="group flex flex-col overflow-hidden rounded-surface border border-line bg-surface  transition "
    >
      <div className="relative aspect-video bg-gradient-to-br from-brand to-brand">
        {course.thumbnailUrl ? (
          <img src={course.thumbnailUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-white/80">
            <Icon name="books" size={36} />
          </div>
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
              <span className="rounded bg-danger-subtle px-1.5 py-0.5 text-[11px] font-semibold text-danger">
                Blocked
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-ink-subtle">
          {course.category && (
            <span className="rounded bg-surface-sunken px-1.5 py-0.5 font-medium">{course.category}</span>
          )}
          <span className="rounded bg-surface-sunken px-1.5 py-0.5">
            {LEVEL_LABELS[course.level] || course.level}
          </span>
        </div>

        <h3 className="mt-2 font-semibold text-ink group-hover:text-brand">
          {course.title}
        </h3>
        <p className="mt-1 line-clamp-2 flex-1 text-sm text-ink-subtle">
          {course.subtitle || course.description}
        </p>

        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="font-medium text-brand">{formatPrice(course)}</span>
          <span className="text-xs text-ink-subtle">
            {lessonCount} lesson{lessonCount === 1 ? "" : "s"}
            {duration > 0 && ` · ${duration} min`}
          </span>
        </div>

        {course.instructor?.name && (
          <p className="mt-2 truncate text-xs text-ink-subtle">By {course.instructor.name}</p>
        )}
      </div>
    </Link>
  );
}
