const SUPER_FEATURES = [
  { icon: "🏢", title: "Organizations", desc: "Create and manage tenant workspaces" },
  { icon: "📋", title: "Plans & billing", desc: "Assign FREE, BASIC, or PREMIUM tiers" },
  { icon: "🔐", title: "Platform control", desc: "Full visibility across all schools" },
];

const TENANT_FEATURES = [
  { icon: "👥", title: "User management", desc: "Create students and tutor accounts" },
  { icon: "📚", title: "Course oversight", desc: "Manage your organization's content" },
  { icon: "📊", title: "Enrollment stats", desc: "Track learners and progress" },
];

export default function AdminLoginShowcase({
  superAdmin,
  tenantName,
  tenantHost,
  tenantLogoUrl,
  welcomeMessage,
  primaryColor,
}) {
  const features = superAdmin ? SUPER_FEATURES : TENANT_FEATURES;
  const accent = primaryColor || "#4F46E5";

  return (
    <div className="flex flex-col justify-center">
      <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-indigo-50 px-3.5 py-1 text-[16px] font-medium text-indigo-700">
        {tenantLogoUrl && !superAdmin ? (
          <img src={tenantLogoUrl} alt="" className="h-5 w-5 rounded object-cover" />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
        )}
        {superAdmin ? "Platform Administration" : "Organization Admin"}
      </div>

      <h2 className="text-[34px] font-bold leading-[1.15] tracking-tight text-slate-900">
        {superAdmin ? (
          <>
            Manage your
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              learning platform
            </span>
          </>
        ) : (
          <>
            Welcome back to
            <br />
            <span style={{ color: accent }}>{tenantName || "your workspace"}</span>
          </>
        )}
      </h2>

      <p className="mt-3 max-w-sm text-[18px] leading-relaxed text-slate-600">
        {superAdmin
          ? "Sign in to create organizations, assign plans, and oversee every workspace on SkillAra."
          : welcomeMessage || `Sign in to manage users and settings for ${tenantHost || "your organization"}.`}
      </p>

      <p className="mt-4 text-[16px] text-slate-400">
        {superAdmin
          ? "Courses · AI tutor · Quizzes · Analytics · Multi-tenant"
          : "Courses · AI tutor · Quizzes · Progress tracking"}
      </p>

      <ul className="mt-8 space-y-1">
        {features.map((f, i) => (
          <li
            key={f.title}
            className="admin-feature-card flex items-center gap-4 rounded-xl px-1 py-3.5"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[20px] shadow-sm ring-1 ring-slate-200/80">
              {f.icon}
            </span>
            <div className="min-w-0">
              <p className="text-[18px] font-semibold text-slate-900">{f.title}</p>
              <p className="text-[16px] text-slate-500">{f.desc}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
