import { NavLink, Link } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";
import { useTenantBranding } from "../hooks/useTenantBranding.js";
import { getRoleLabel } from "../utils/roles.js";
import { PoweredBySkillAra } from "./SkillAraBrand.jsx";

const TENANT_NAV = [
  {
    section: "Overview",
    items: [{ to: "/admin", label: "Dashboard", icon: "dashboard", end: true }],
  },
  {
    section: "People",
    items: [
      { to: "/admin/users", label: "Users", icon: "users" },
      { to: "/admin/roles", label: "Roles & permissions", icon: "roles" },
    ],
  },
  {
    section: "Organization",
    items: [
      { to: "/admin/master-data", label: "Master data", icon: "master-data" },
    ],
  },
  {
    section: "Account",
    items: [{ to: "/admin/profile", label: "My profile", icon: "profile" }],
  },
];

function NavIcon({ name }) {
  const className = "h-4 w-4 shrink-0 transition-colors";
  switch (name) {
    case "dashboard":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <rect x="3" y="3" width="7" height="9" rx="1" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="14" y="3" width="7" height="5" rx="1" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="14" y="12" width="7" height="9" rx="1" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="3" y="16" width="7" height="5" rx="1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "users":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "roles":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "master-data":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "profile":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

function navClass({ isActive }) {
  return isActive ? "admin-nav-link admin-nav-link-active" : "admin-nav-link admin-nav-link-idle";
}

function BrandMark({ tenantName, logoUrl, primaryColor, roleLabel }) {
  if (logoUrl) {
    return (
      <>
        <img src={logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-slate-200" />
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{tenantName}</p>
          <p className="truncate text-xs text-slate-500">{roleLabel}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
        style={{ backgroundColor: primaryColor }}
      >
        {tenantName?.[0]?.toUpperCase() || "O"}
      </span>
      <div className="min-w-0">
        <p className="truncate font-semibold text-slate-900">{tenantName}</p>
        <p className="truncate text-xs text-slate-500">{roleLabel}</p>
      </div>
    </>
  );
}

export default function Sidebar() {
  const { user, logout } = useAdminAuth();
  const { tenantName, logoUrl, primaryColor } = useTenantBranding();
  const roleLabel = getRoleLabel(user);

  return (
    <aside className="admin-sidebar flex w-60 shrink-0 flex-col">
      <div className="admin-sidebar-brand">
        <div className="flex w-full items-center gap-3">
          <BrandMark
            tenantName={tenantName}
            logoUrl={logoUrl}
            primaryColor={primaryColor}
            roleLabel={roleLabel}
          />
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {TENANT_NAV.map((group) => (
          <div key={group.section}>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {group.section}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
                  <NavIcon name={item.icon} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-slate-100 p-4">
        {user && (
          <div className="flex flex-col gap-3">
            <Link to="/admin/profile" className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50 transition-colors">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600 border border-indigo-100">
                {user.profilePhoto ? (
                  <img src={user.profilePhoto} alt="" className="h-full w-full object-cover" />
                ) : (
                  (user.name?.[0] || user.email?.[0] || "?").toUpperCase()
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {user.name || user.email}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {roleLabel}
                </p>
              </div>
            </Link>
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-100 bg-rose-50/50 px-3 py-2 text-xs font-medium text-rose-600 shadow-sm hover:bg-rose-50 hover:text-rose-700 transition-all active:scale-[0.98]"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        )}
        <div className="mt-3 text-center">
          <PoweredBySkillAra />
        </div>
      </div>
    </aside>
  );
}
