const LOGO_SRC = "/favicon.svg";

export function SkillAraLogo({ className = "h-9 w-9" }) {
  return <img src={LOGO_SRC} alt="" className={`shrink-0 rounded-lg object-cover ${className}`} />;
}

export function SkillAraWordmark({ className = "text-sm font-semibold text-slate-900" }) {
  return <span className={className}>SkillAra</span>;
}

export function SkillAraSidebarBrand({ subtitle = "Super Admin" }) {
  return (
    <>
      <SkillAraLogo />
      <div className="min-w-0">
        <SkillAraWordmark className="truncate font-semibold text-slate-900" />
        <p className="truncate text-xs text-slate-500">{subtitle}</p>
      </div>
    </>
  );
}

export function PoweredBySkillAra() {
  return (
    <div className="flex items-center justify-center gap-2 py-1 text-slate-400">
      <SkillAraLogo className="h-4 w-4" />
      <span className="text-xs font-semibold tracking-wide text-slate-400">SkillAra</span>
    </div>
  );
}
