import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { usePermissions } from "../hooks/usePermissions.js";
import MyAccessPanel from "../components/MyAccessPanel.jsx";
import Icon from "../admin/components/ui/Icon.jsx";

export default function Home() {
  const { tenantInfo, tenantHost, user } = useAuth();
  const { isInstructor } = usePermissions();
  const orgName = tenantInfo?.tenant_name || tenantHost || "SkillAra";

  return (
    <div>
      <section className="rounded-surface bg-gradient-to-br from-brand to-brand-hover px-5 py-10 text-white sm:px-8 sm:py-16">
        <p className="text-sm font-medium text-brand-border">{orgName}</p>
        
        {isInstructor ? (
          <>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Manage your teaching workspace
            </h1>
            <p className="mt-4 max-w-2xl text-base text-brand-muted sm:text-lg">
              Create courses, monitor student progress, and engage with your learners.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Link
                to="/teach"
                className="rounded-control bg-surface px-5 py-2.5 text-center font-medium text-brand-hover hover:bg-brand-subtle"
              >
                Create New Course
              </Link>
              <Link
                to="/teach"
                className="rounded-control border border-white/40 px-5 py-2.5 text-center font-medium hover:bg-surface/10"
              >
                View My Courses
              </Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Learn smarter with AI-powered courses
            </h1>
            <p className="mt-4 max-w-2xl text-base text-brand-muted sm:text-lg">
              SkillAra combines video lessons, quizzes, AI tutoring, and progress tracking — all in one platform.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Link
                to="/courses"
                className="rounded-control bg-surface px-5 py-2.5 text-center font-medium text-brand-hover hover:bg-brand-subtle"
              >
                Browse Courses
              </Link>
              <Link
                to="/register"
                className="rounded-control border border-white/40 px-5 py-2.5 text-center font-medium hover:bg-surface/10"
              >
                Get Started
              </Link>
            </div>
          </>
        )}
      </section>



      <section className="mt-12 grid gap-6 sm:grid-cols-3">
        {isInstructor ? (
          [
            { icon: "clipboardCheck", title: "My Courses", desc: "Manage your drafts and published courses.", link: "/teach" },
            { icon: "users", title: "My Students", desc: "View total enrollments across your catalog.", link: "/teach" },
            { icon: "analytics", title: "Recent Activity", desc: "Monitor quiz attempts and forum questions.", link: "/teach" },
          ].map((f) => (
            <Link key={f.title} to={f.link} className="block rounded-surface border border-line bg-surface p-6  transition">
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-3 font-semibold text-ink">{f.title}</h3>
              <p className="mt-1 text-sm text-ink-subtle">{f.desc}</p>
            </Link>
          ))
        ) : (
          [
            { icon: "graduation", title: "Structured Learning", desc: "Courses with modules, lessons, and quizzes" },
            { icon: "robot", title: "AI Tutor", desc: "Get instant help on lesson content" },
            { icon: "chart", title: "Track Progress", desc: "See your mastery grow as you learn" },
          ].map((f) => (
            <div key={f.title} className="rounded-surface border border-line bg-surface p-6">
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-3 font-semibold text-ink">{f.title}</h3>
              <p className="mt-1 text-sm text-ink-subtle">{f.desc}</p>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
