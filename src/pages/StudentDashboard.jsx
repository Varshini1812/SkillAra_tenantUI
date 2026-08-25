import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api, { getData } from "../api/client.js";

const SESSION_LINK = { MOCK_INTERVIEW: "/mock-interviews", MENTORSHIP: "/mentorship", LIVE_SESSION: "/live-sessions" };

function fmtSessionAt(iso) {
  return new Date(iso).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function StudentDashboard() {
  const { accessToken, loading, isAuthenticated } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (loading || !isAuthenticated) {
      // still initializing or not logged in
      setLoadingData(true);
      return;
    }
    if (!accessToken) {
      setError(new Error("Missing access token"));
      setLoadingData(false);
      return;
    }
    api
      .get("/api/student/dashboard")
    .then((res) => {
      const json = getData(res);
      setData(json);
      setError(null);
    })
    .catch((err) => setError(err))
    .finally(() => setLoadingData(false));
  }, [loading, isAuthenticated, accessToken]);

  if (loading || loadingData) return <p className="text-gray-600">Loading dashboard…</p>;
  if (error)
    return (
      <p className="text-red-600">
        Error loading dashboard: {error.message}
      </p>
    );

  const dashboard = data || {};
  const stats = [
    { label: "Enrolled courses", value: dashboard.totalEnrollments || 0, tone: "indigo" },
    { label: "Completed courses", value: dashboard.completedCourses || 0, tone: "emerald" },
    { label: "Overall progress", value: `${dashboard.overallProgress || 0}%`, tone: "amber" },
    { label: "Average quiz score", value: `${dashboard.averageQuizScore || 0}%`, tone: "rose" },
  ];

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">Learning overview</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">My Learning Dashboard</h1>
        <p className="mt-2 text-slate-500">Keep track of your course progress and areas that need more practice.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`mb-5 h-2 w-12 rounded-full bg-${stat.tone}-500`} />
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Course progress</h2>
              <p className="mt-1 text-sm text-slate-500">Your current progress by course.</p>
            </div>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
              {dashboard.progressPerCourse?.length || 0} courses
            </span>
          </div>
          {dashboard.progressPerCourse?.length ? (
            <div className="mt-6 space-y-5">
              {dashboard.progressPerCourse.map((course) => {
                const progress = Math.min(100, Math.max(0, course.progressPercentage || course.progress || 0));
                return (
                  <div key={course.courseId?._id || course.courseId}>
                    <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                      <span className="truncate font-medium text-slate-700">{course.courseId?.title || course.courseId || "Course"}</span>
                      <span className="font-semibold text-slate-900">{progress}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-8 rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">Enroll in a course to see your progress here.</p>
          )}
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Topics to revisit</h2>
          <p className="mt-1 text-sm text-slate-500">Focus on these areas to improve your scores.</p>
          {dashboard.weakTopics?.length ? (
            <div className="mt-6 space-y-3">
              {dashboard.weakTopics.map((topic) => (
                <div key={topic.topicId?._id || topic.topicId} className="flex items-center justify-between rounded-xl bg-rose-50 px-4 py-3">
                  <span className="truncate text-sm font-medium text-rose-900">{topic.topicId?.title || topic.topicId || "Topic"}</span>
                  <span className="ml-3 text-sm font-bold text-rose-600">{Math.round(topic.avgScore || 0)}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-8 rounded-xl bg-emerald-50 px-4 py-8 text-center text-sm text-emerald-700">No weak topics yet. Keep learning!</p>
          )}
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Link to="/mentorship" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-md">
          <p className="text-sm font-medium text-slate-500">Mentorship</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{dashboard.openTicketsCount || 0}</p>
          <p className="mt-1 text-xs text-slate-400">
            {dashboard.openTicketsCount ? "open ticket" + (dashboard.openTicketsCount === 1 ? "" : "s") : "No open tickets"}
          </p>
        </Link>

        <Link to="/mock-tests" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-md">
          <p className="text-sm font-medium text-slate-500">Mock tests</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{dashboard.unattemptedMockTestsCount || 0}</p>
          <p className="mt-1 text-xs text-slate-400">not yet attempted</p>
        </Link>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-1">
          <p className="text-sm font-medium text-slate-500">Upcoming sessions</p>
          {dashboard.upcomingSessions?.length ? (
            <ul className="mt-3 space-y-2">
              {dashboard.upcomingSessions.map((s) => (
                <li key={s.id}>
                  <Link to={SESSION_LINK[s.type] || "/live-sessions"} className="block rounded-lg px-2 py-1.5 -mx-2 text-sm hover:bg-slate-50">
                    <span className="font-medium text-slate-800">{s.title}</span>
                    <span className="block text-xs text-slate-400">{fmtSessionAt(s.at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-400">Nothing scheduled.</p>
          )}
        </article>
      </div>
    </section>
  );
}
