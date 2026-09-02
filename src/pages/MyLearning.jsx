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

  if (loading) return <div className="text-center text-ink-subtle">Loading...</div>;
  if (error) return <div className="rounded-control bg-danger-subtle p-3 text-sm text-danger">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold">My Learning</h1>
      <p className="text-ink-subtle">Continue where you left off</p>

      {enrollments.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-ink-subtle">You haven&apos;t enrolled in any courses yet.</p>
          <Link to="/courses" className="mt-4 inline-block text-brand hover:underline">
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
                className="flex items-center justify-between rounded-surface border border-line bg-surface p-5"
              >
                <div>
                  <h3 className="font-semibold">{course?.title || "Course"}</h3>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-2 w-32 overflow-hidden rounded-full bg-surface-sunken">
                      <div
                        className="h-full rounded-full bg-brand transition-all"
                        style={{ width: `${e.mastery || 0}%` }}
                      />
                    </div>
                    <span className="text-sm text-ink-subtle">{e.mastery || 0}% complete</span>
                  </div>
                </div>
                <Link
                  to={`/learn/${courseId}`}
                  className="rounded-control bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
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
