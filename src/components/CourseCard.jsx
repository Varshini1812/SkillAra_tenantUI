import { Link } from "react-router-dom";

export default function CourseCard({ course }) {
  const price = course.price > 0 ? `$${course.price}` : "Free";

  return (
    <Link
      to={`/courses/${course._id}`}
      className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="aspect-video bg-gradient-to-br from-indigo-500 to-purple-600">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-white/80">📚</div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600">{course.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-slate-500">{course.description}</p>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="font-medium text-indigo-600">{price}</span>
          <span className="text-slate-400">{course.stats?.enrolledCount || 0} enrolled</span>
        </div>
      </div>
    </Link>
  );
}
