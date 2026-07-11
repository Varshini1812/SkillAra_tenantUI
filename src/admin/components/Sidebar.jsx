import { NavLink } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";
import { useTenantBranding } from "../hooks/useTenantBranding.js";
import { getRoleLabel } from "../utils/roles.js";
import { PoweredBySkillAra } from "./SkillAraBrand.jsx";

const TENANT_NAV = [
  {
    section: "Overview",
    items: [{ to: "/admin", label: "Dashboard", icon: "▦", end: true }],
  },
  {
    section: "People",
    items: [
      { to: "/admin/users", label: "Users", icon: "👥" },
      { to: "/admin/roles", label: "Roles & permissions", icon: "🛡️" },
    ],
  },
  {
    section: "Organization",
    items: [
      { to: "/admin/master-data", label: "Master data", icon: "📋" },
    ],
  },
  {
    section: "Account",
    items: [{ to: "/admin/profile", label: "My profile", icon: "👤" }],
  },
];

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
  const { user } = useAdminAuth();
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
                  <span className="text-base opacity-80">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-slate-200 px-5 py-4">
        <PoweredBySkillAra />
      </div>
    </aside>
  );
}
