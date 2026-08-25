import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import { usePermissions } from "../hooks/usePermissions.js";
import { getRoleBadgeClass } from "../utils/permissions.js";

const STORAGE_KEY = "skillara-app-sidebar-collapsed";

function NavIcon({ name }) {
  const cls = "h-4 w-4 shrink-0";
  const common = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, className: cls };
  const cap = { strokeLinecap: "round", strokeLinejoin: "round" };

  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" {...cap} />
          <path d="M9 22V12h6v10" {...cap} />
        </svg>
      );
    case "courses":
      return (
        <svg {...common}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" {...cap} />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" {...cap} />
        </svg>
      );
    case "learning":
      return (
        <svg {...common}>
          <path d="M22 10L12 5 2 10l10 5 10-5z" {...cap} />
          <path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5" {...cap} />
        </svg>
      );
    case "sessions":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" {...cap} />
          <path d="M16 2v4M8 2v4M3 10h18" {...cap} />
        </svg>
      );
    case "mentors":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" {...cap} />
          <path d="M3 20a6 6 0 0 1 12 0" {...cap} />
          <path d="M16 8a3 3 0 1 1 4 2.83M21 20a5 5 0 0 0-4.5-5" {...cap} />
        </svg>
      );
    case "forum":
      return (
        <svg {...common}>
          <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" {...cap} />
        </svg>
      );
    case "ai":
      return (
        <svg {...common}>
          <path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" {...cap} />
          <circle cx="12" cy="12" r="3.5" {...cap} />
        </svg>
      );
    case "quiz":
      return (
        <svg {...common}>
          <path d="M9 11l3 3L22 4" {...cap} />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" {...cap} />
        </svg>
      );
    case "live":
      return (
        <svg {...common}>
          <rect x="2" y="6" width="14" height="12" rx="2" {...cap} />
          <path d="m22 8-6 4 6 4z" {...cap} />
        </svg>
      );
    case "teach":
      return (
        <svg {...common}>
          <rect x="2" y="3" width="20" height="14" rx="2" {...cap} />
          <path d="M8 21h8M12 17v4" {...cap} />
          <path d="m10 8 5 2-5 2z" {...cap} />
        </svg>
      );
    case "admin":
      return (
        <svg {...common}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...cap} />
        </svg>
      );
    case "moderate":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" {...cap} />
          <path d="M5.6 5.6l12.8 12.8" {...cap} />
        </svg>
      );
    case "profile":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" {...cap} />
          <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" {...cap} />
        </svg>
      );
    default:
      return null;
  }
}

function navClass({ isActive }, compact) {
  const base = [
    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
    isActive
      ? "bg-indigo-50 text-indigo-700"
      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
  ].join(" ");
  return compact ? `${base} justify-center px-2` : base;
}

/**
 * Primary navigation for every signed-in role — students, instructors, and staff.
 * Entries come from the user's permission map (see utils/permissions.js), so each
 * role sees only what it can actually use.
 */
export default function AppSidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  const { user, tenantInfo, tenantHost, logout } = useAuth();
  const { nav, roleLabel } = usePermissions();

  const compact = collapsed && !mobileOpen;
  const orgName = tenantInfo?.tenant_name || tenantHost || "SkillAra";

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKey = (e) => e.key === "Escape" && onCloseMobile?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, onCloseMobile]);

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

      <aside
        aria-label="Main navigation"
        className={[
          // h-full inside the viewport-height shell keeps the rail static; only its
          // <nav> scrolls, and only when the menu is taller than the screen.
          "z-50 flex h-full shrink-0 flex-col border-r border-slate-200 bg-white",
          "fixed inset-y-0 left-0 lg:static",
          compact ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "transition-transform duration-200 lg:transition-[width]",
        ].join(" ")}
      >
        <div className={`flex h-16 items-center border-b border-slate-100 ${compact ? "justify-center px-2" : "justify-between px-4"}`}>
          <Link to="/" onClick={onCloseMobile} className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              {orgName[0]?.toUpperCase() || "S"}
            </span>
            {!compact && (
              <span className="truncate font-semibold text-slate-900">{orgName}</span>
            )}
          </Link>
          {!compact && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden rounded p-1 text-slate-400 hover:bg-slate-100 lg:inline-flex"
              aria-label="Collapse sidebar"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>

        {compact && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="mx-auto mt-2 hidden rounded p-1 text-slate-400 hover:bg-slate-100 lg:inline-flex"
            aria-label="Expand sidebar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        <nav className={`flex-1 space-y-5 overflow-y-auto py-4 ${compact ? "px-2" : "px-3"}`}>
          {nav.map((group) => (
            <div key={group.section}>
              {!compact && (
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {group.section}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={onCloseMobile}
                    title={compact ? item.label : undefined}
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

        <div className={`shrink-0 border-t border-slate-100 ${compact ? "p-2" : "p-3"}`}>
          {user ? (
            <div className={compact ? "flex flex-col items-center gap-2" : "space-y-2"}>
              <Link
                to="/profile"
                onClick={onCloseMobile}
                title={compact ? user.name || user.email : undefined}
                className={`flex items-center rounded-lg transition hover:bg-slate-50 ${compact ? "justify-center p-1.5" : "gap-3 p-2"}`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600 ring-1 ring-indigo-100">
                  {user.profilePhoto ? (
                    <img src={user.profilePhoto} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (user.name?.[0] || user.email?.[0] || "?").toUpperCase()
                  )}
                </span>
                {!compact && (
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-800">
                      {user.name || user.email}
                    </span>
                    <span
                      className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${getRoleBadgeClass(user)}`}
                    >
                      {roleLabel}
                    </span>
                  </span>
                )}
              </Link>

              <button
                type="button"
                onClick={logout}
                title="Log out"
                className={`flex items-center justify-center gap-2 rounded-lg border border-rose-100 bg-rose-50/50 text-xs font-medium text-rose-600 transition hover:bg-rose-50 ${compact ? "p-2" : "w-full px-3 py-2"}`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {!compact && "Log out"}
              </button>
            </div>
          ) : (
            !compact && (
              <Link
                to="/login"
                className="block rounded-lg bg-indigo-600 px-3 py-2 text-center text-sm font-medium text-white"
              >
                Login
              </Link>
            )
          )}
        </div>
      </aside>
    </>
  );
}

/** Sidebar collapse state, persisted so it survives navigation and reloads. */
export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  const toggle = () =>
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* private browsing — collapse simply won't persist */
      }
      return next;
    });

  return [collapsed, toggle];
}
