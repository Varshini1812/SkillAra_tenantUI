import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchCourse } from "../api/courses.js";
import { enroll } from "../api/enrollments.js";
import { getErrorMessage } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function CourseDetail() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchCourse(id)
      .then(setCourse)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
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
      setMessage("Enrolled successfully!");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <div className="text-center text-slate-400">Loading...</div>;
  if (!course) return <div className="text-center text-red-500">{error || "Course not found"}</div>;

  const moduleCount = course.modules?.length || 0;
  const lessonCount =
    course.modules?.reduce((sum, m) => sum + (m.lessons?.length || 0), 0) || 0;

  return (
    <div>
      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-white">
        <h1 className="text-3xl font-bold">{course.title}</h1>
        <p className="mt-2 max-w-2xl text-indigo-100">{course.description}</p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <span>{moduleCount} modules</span>
          <span>{lessonCount} lessons</span>
          <span>{course.price > 0 ? `$${course.price}` : "Free"}</span>
        </div>
      </div>

      {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
      {message && (
        <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-600">{message}</div>
      )}

      <div className="mt-6 flex gap-3">
        <button
          onClick={handleEnroll}
          disabled={enrolling}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {enrolling ? "Enrolling..." : course.price > 0 ? "Purchase (coming soon)" : "Enroll Free"}
        </button>
        {isAuthenticated && (
          <Link
            to={`/learn/${id}`}
            className="rounded-lg border border-slate-300 px-5 py-2.5 font-medium hover:bg-slate-50"
          >
            Go to Course
          </Link>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold">Course Content</h2>
        <div className="mt-4 space-y-4">
          {(course.modules || []).map((mod, i) => (
            <div key={mod._id} className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="font-medium">
                Module {i + 1}: {mod.title}
              </h3>
              <ul className="mt-2 space-y-1">
                {(mod.lessons || []).map((lesson, j) => (
                  <li key={lesson._id} className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="text-slate-400">{j + 1}.</span>
                    <span>{lesson.title}</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{lesson.type}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
