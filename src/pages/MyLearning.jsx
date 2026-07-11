import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMyEnrollments } from "../api/enrollments.js";
import { getErrorMessage } from "../api/client.js";
import ProtectedRoute from "../components/ProtectedRoute.jsx";

function MyLearningContent() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMyEnrollments()
      .then((data) => setEnrollments(Array.isArray(data) ? data : []))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center text-slate-400">Loading...</div>;
  if (error) return <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold">My Learning</h1>
      <p className="text-slate-500">Continue where you left off</p>

      {enrollments.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-slate-400">You haven&apos;t enrolled in any courses yet.</p>
          <Link to="/courses" className="mt-4 inline-block text-indigo-600 hover:underline">
            Browse courses
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {enrollments.map((e) => {
            const course = e.course;
            const courseId = course?._id || e.courseId;
            return (
              <div
                key={e.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5"
              >
                <div>
                  <h3 className="font-semibold">{course?.title || "Course"}</h3>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all"
                        style={{ width: `${e.mastery || 0}%` }}
                      />
                    </div>
                    <span className="text-sm text-slate-500">{e.mastery || 0}% complete</span>
                  </div>
                </div>
                <Link
                  to={`/learn/${courseId}`}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Continue
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function MyLearning() {
  return (
    <ProtectedRoute>
      <MyLearningContent />
    </ProtectedRoute>
  );
}
