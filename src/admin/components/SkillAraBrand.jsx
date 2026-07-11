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
    <div className="admin-sidebar-powered-by">
      <span className="text-[11px] text-slate-400">Powered by</span>
      <div className="mt-1 flex items-center justify-center gap-2">
        <SkillAraLogo className="h-5 w-5" />
        <SkillAraWordmark className="text-xs font-semibold text-slate-600" />
      </div>
    </div>
  );
}
