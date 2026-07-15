function BuildingIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" />
      <path d="M15 3v18" />
      <path d="M3 9h18" />
      <path d="M3 15h18" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      <line x1="8" y1="7" x2="16" y2="7" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

const SUPER_FEATURES = [
  { icon: BuildingIcon, title: "Organizations", desc: "Create and manage tenant workspaces" },
  { icon: ClipboardIcon, title: "Plans & billing", desc: "Assign FREE, BASIC, or PREMIUM tiers" },
  { icon: ShieldIcon, title: "Platform control", desc: "Full visibility across all schools" },
];

const TENANT_FEATURES = [
  { icon: UsersIcon, title: "User management", desc: "Create students and tutor accounts" },
  { icon: BookIcon, title: "Course oversight", desc: "Manage your organization's content" },
  { icon: ChartIcon, title: "Enrollment stats", desc: "Track learners and progress" },
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
      <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/80 px-3 py-1 text-xs font-medium text-indigo-700">
        {tenantLogoUrl && !superAdmin ? (
          <img src={tenantLogoUrl} alt="" className="h-4 w-4 rounded object-cover" />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
        )}
        {superAdmin ? "Platform Administration" : "Organization Admin"}
      </div>

      <h2 className="text-3xl font-bold leading-tight tracking-tight text-slate-900">
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

      <p className="mt-3 max-w-sm text-base leading-relaxed text-slate-600">
        {superAdmin
          ? "Sign in to create organizations, assign plans, and oversee every workspace on SkillAra."
          : welcomeMessage || `Sign in to manage users and settings for ${tenantHost || "your organization"}.`}
      </p>

      <p className="mt-4 text-sm text-slate-400">
        {superAdmin
          ? "Courses · AI tutor · Quizzes · Analytics · Multi-tenant"
          : "Courses · AI tutor · Quizzes · Progress tracking"}
      </p>

      <ul className="mt-6 space-y-0.5">
        {features.map((f, i) => (
          <li
            key={f.title}
            className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition hover:bg-slate-50/80"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100/80 transition group-hover:bg-indigo-100 group-hover:ring-indigo-200/80">
              <f.icon />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">{f.title}</p>
              <p className="text-xs text-slate-500">{f.desc}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
