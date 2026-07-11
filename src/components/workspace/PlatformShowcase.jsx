const FEATURES = [
  {
    icon: "🧠",
    title: "AI Tutor",
    desc: "Instant doubt-clearing powered by GPT — ask anything about your lessons.",
    accent: "from-violet-500/20 to-purple-600/5",
    border: "border-violet-500/20",
  },
  {
    icon: "🎯",
    title: "Mock Tests",
    desc: "Adaptive quizzes and timed assessments to prep you for real exams.",
    accent: "from-blue-500/20 to-cyan-600/5",
    border: "border-blue-500/20",
  },
  {
    icon: "📈",
    title: "Smart Progress",
    desc: "Track mastery per course, spot weak areas, and earn certificates.",
    accent: "from-emerald-500/20 to-teal-600/5",
    border: "border-emerald-500/20",
  },
  {
    icon: "💬",
    title: "Community Q&A",
    desc: "Stack Overflow-style discussions — learn together, grow faster.",
    accent: "from-amber-500/20 to-orange-600/5",
    border: "border-amber-500/20",
  },
];

const STATS = [
  { value: "10K+", label: "Active learners" },
  { value: "500+", label: "Courses" },
  { value: "98%", label: "Satisfaction" },
];

export default function PlatformShowcase() {
  return (
    <div className="relative flex flex-col justify-center">
      {/* Brand */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-violet-300 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
          AI-Enhanced Learning Platform
        </div>
        <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
          Learn smarter.
          <br />
          <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Teach better.
          </span>
        </h2>
        <p className="mt-3 max-w-md text-base leading-relaxed text-slate-400">
          SkillAra brings Udemy-style courses, AI tutoring, mock interviews, and community learning
          into one workspace for your school or team.
        </p>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {FEATURES.map((f, i) => (
          <div
            key={f.title}
            className={`workspace-card group rounded-xl border bg-gradient-to-br p-4 backdrop-blur-sm ${f.accent} ${f.border}`}
            style={{ animationDelay: `${i * 120}ms` }}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-lg backdrop-blur-sm transition group-hover:scale-110">
                {f.icon}
              </span>
              <div>
                <h3 className="text-sm font-semibold text-white">{f.title}</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{f.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stats strip */}
      <div className="mt-8 flex flex-wrap gap-6 border-t border-white/10 pt-6">
        {STATS.map((s) => (
          <div key={s.label}>
            <p className="text-xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
