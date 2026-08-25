import { useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";
import { useTenantBranding } from "../hooks/useTenantBranding.js";
import { getRoleLabel } from "../utils/roles.js";
import { getAdminNav } from "../../utils/permissions.js";
import { PoweredBySkillAra } from "./SkillAraBrand.jsx";

const STORAGE_KEY = "skillara-tenant-admin-sidebar-collapsed";


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
    case "courses":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 7h7M9 11h7" strokeLinecap="round" />
        </svg>
      );
    case "master-data":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "monitoring":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "mentors":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <circle cx="9" cy="8" r="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 20a6 6 0 0 1 12 0" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 8a3 3 0 1 1 4 2.83M21 20a5 5 0 0 0-4.5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

function CollapseIcon({ collapsed }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
      {collapsed ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      )}
    </svg>
  );
}

function navClass({ isActive }, compact) {
  const base = isActive ? "admin-nav-link admin-nav-link-active" : "admin-nav-link admin-nav-link-idle";
  return compact ? `${base} justify-center px-2` : base;
}

function BrandMark({ tenantName, logoUrl, primaryColor, compact }) {
  if (compact) {
    return null;
  }

  if (logoUrl) {
    return (
      <>
        <img src={logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-slate-200" />
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{tenantName}</p>
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
      {!compact && (
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{tenantName}</p>
        </div>
      )}
    </>
  );
}

export default function Sidebar({
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
}) {
  const { user, logout } = useAdminAuth();
  const { tenantName, logoUrl, primaryColor } = useTenantBranding();
  const roleLabel = getRoleLabel(user);
  const compact = collapsed && !mobileOpen;

  // Navigation follows the user's role permissions, so a custom role created in
  // Roles & Permissions gets the right menu without changing this file.
  const navGroups = getAdminNav(user);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onCloseMobile?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, onCloseMobile]);

  const asideClass = [
    "admin-sidebar z-50 flex shrink-0 flex-col",
    "fixed inset-y-0 left-0 lg:static",
    compact ? "admin-sidebar-collapsed" : "admin-sidebar-expanded",
    mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
    "transition-transform duration-200 lg:transition-[width]",
  ].join(" ");

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          aria-label="Close menu"
          onClick={onCloseMobile}
        />
      )}

      <aside className={asideClass} aria-label="Admin navigation">
        <div
          className={`admin-sidebar-brand gap-2 ${
            compact ? "h-auto flex-col justify-center px-2 py-3" : "justify-between px-3"
          }`}
        >
          <div className={`flex min-w-0 items-center ${compact ? "" : "gap-3"}`}>
            <BrandMark
              tenantName={tenantName}
              logoUrl={logoUrl}
              primaryColor={primaryColor}
              compact={compact}
            />
          </div>
          <button
            type="button"
            className="admin-sidebar-toggle hidden lg:inline-flex"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <CollapseIcon collapsed={collapsed} />
          </button>
        </div>

        <nav className={`flex-1 space-y-6 overflow-y-auto py-4 ${compact ? "px-2" : "px-3"}`}>
          {navGroups.map((group) => (
            <div key={group.section}>
              {!compact && (
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {group.section}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    title={compact ? item.label : undefined}
                    onClick={onCloseMobile}
                    className={(args) => navClass(args, compact)}
                  >
                    <NavIcon name={item.icon} />
                    {!compact && item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className={`shrink-0 border-t border-slate-100 ${compact ? "p-2" : "p-4"}`}>
          {user && (
            <div className={`flex flex-col ${compact ? "items-center gap-2" : "gap-3"}`}>
              <Link
                to="/admin/profile"
                onClick={onCloseMobile}
                title={compact ? user.name || user.email : undefined}
                className={`flex items-center rounded-xl transition-colors hover:bg-slate-50 ${
                  compact ? "justify-center p-1.5" : "gap-3 p-2"
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-indigo-100 bg-indigo-50 text-xs font-semibold text-indigo-600">
                  {user.profilePhoto ? (
                    <img src={user.profilePhoto} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (user.name?.[0] || user.email?.[0] || "?").toUpperCase()
                  )}
                </span>
                {!compact && (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{user.name || user.email}</p>
                    <p className="truncate text-xs text-slate-500">{roleLabel}</p>
                  </div>
                )}
              </Link>
              <button
                type="button"
                onClick={logout}
                title="Logout"
                className={`flex items-center gap-2 rounded-lg border border-rose-100 bg-rose-50/50 text-xs font-medium text-rose-600 shadow-sm transition-all hover:bg-rose-50 hover:text-rose-700 active:scale-[0.98] ${
                  compact ? "justify-center p-2" : "w-full justify-center px-3 py-2"
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {!compact && "Logout"}
              </button>
            </div>
          )}
          {!compact && (
            <div className="mt-3 text-center">
              <PoweredBySkillAra />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export function useSidebarCollapsed(storageKey = STORAGE_KEY) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(storageKey) === "1";
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(storageKey, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return [collapsed, toggleCollapsed];
}
