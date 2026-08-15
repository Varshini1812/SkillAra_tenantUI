import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import MyAccessPanel from "../components/MyAccessPanel.jsx";

export default function Home() {
  const { tenantInfo, tenantHost, user } = useAuth();
  const orgName = tenantInfo?.tenant_name || tenantHost || "SkillAra";

  return (
    <div>
      <section className="rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 px-5 py-10 text-white sm:px-8 sm:py-16">
        <p className="text-sm font-medium text-indigo-200">{orgName}</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Learn smarter with AI-powered courses
        </h1>
        <p className="mt-4 max-w-2xl text-base text-indigo-100 sm:text-lg">
          SkillAra combines video lessons, quizzes, AI tutoring, and progress tracking — all in one
          platform.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Link
            to="/courses"
            className="rounded-lg bg-white px-5 py-2.5 text-center font-medium text-indigo-700 hover:bg-indigo-50"
          >
            Browse Courses
          </Link>
          <Link
            to="/register"
            className="rounded-lg border border-white/40 px-5 py-2.5 text-center font-medium hover:bg-white/10"
          >
            Get Started
          </Link>
        </div>
      </section>

      {user && (
        <section className="mt-8">
          <MyAccessPanel compact />
        </section>
      )}

      <section className="mt-12 grid gap-6 sm:grid-cols-3">
        {[
          { icon: "🎓", title: "Structured Learning", desc: "Courses with modules, lessons, and quizzes" },
          { icon: "🤖", title: "AI Tutor", desc: "Get instant help on lesson content" },
          { icon: "📊", title: "Track Progress", desc: "See your mastery grow as you learn" },
        ].map((f) => (
          <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="text-3xl">{f.icon}</div>
            <h3 className="mt-3 font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
