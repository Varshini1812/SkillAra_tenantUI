import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import { usePermissions } from "../hooks/usePermissions.js";
import { getRoleBadgeClass } from "../utils/permissions.js";
import Icon from "../admin/components/ui/Icon.jsx";
import { PoweredBySkillAra } from "../admin/components/SkillAraBrand.jsx";

const STORAGE_KEY = "skillara-app-sidebar-collapsed";

/** Nav config icon keys -> the shared icon set. */
const ICON = {
  home: "home",
  courses: "courses",
  learning: "graduation",
  sessions: "calendar",
  live: "tv",
  quiz: "clipboardCheck",
  mentors: "mentor",
  forum: "chat",
  ai: "robot",
  teach: "books",
  moderate: "moderation",
  admin: "settings",
  notifications: "bell",
  profile: "user",
};

function NavItem({ item, compact, onNavigate }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      title={compact ? item.label : undefined}
      className={({ isActive }) =>
        [
          "group relative flex min-h-9 items-center rounded-control border text-[0.8125rem]",
          "transition-colors duration-200 ease-standard",
          compact ? "justify-center px-2" : "gap-2.5 px-2.5",
          isActive
            ? "border-brand-border bg-brand-subtle font-semibold text-brand-hover"
            : "border-transparent text-ink-muted hover:bg-surface-sunken hover:text-ink",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          {/* Active state is a shape as well as a colour (`color-not-only`). */}
          {isActive && (
            <span
              aria-hidden="true"
              className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-brand"
            />
          )}
          <Icon name={ICON[item.icon] || "home"} size={16} />
          {/* The label stays in the accessibility tree when collapsed, so the
              link never becomes an unnamed icon (`nav-label-icon`). */}
          <span className={compact ? "sr-only" : "truncate"}>{item.label}</span>
          {isActive && <span className="sr-only">(current page)</span>}
        </>
      )}
    </NavLink>
  );
}

/**
 * Primary navigation for every signed-in role — students, instructors and
 * mentors. Entries come from the user's permission map (see
 * utils/permissions.js), so each role sees only what it can actually use.
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

  const rowBase =
    "flex min-h-9 w-full items-center rounded-control border text-[0.8125rem] font-medium " +
    "transition-colors duration-200 ease-standard";

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
          aria-label="Close menu"
          onClick={onCloseMobile}
        />
      )}

      <aside
        aria-label="Main navigation"
        className={[
          // h-full inside the viewport-height shell keeps the rail static; only
          // its <nav> scrolls, and only when the menu is taller than the screen.
          "z-50 flex h-full min-h-0 shrink-0 flex-col border-r border-line bg-surface",
          "fixed inset-y-0 left-0 lg:static",
          compact ? "w-[4.5rem]" : "w-60 sm:w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "transition-transform duration-200 ease-standard lg:transition-[width]",
        ].join(" ")}
      >
        <div
          className={`flex h-14 shrink-0 items-center gap-2 border-b border-line ${
            compact ? "justify-center px-2" : "justify-between px-3"
          }`}
        >
          <Link
            to="/"
            onClick={onCloseMobile}
            className="flex min-w-0 items-center gap-2.5 rounded-control"
          >
            <img src="/logo.png" alt="" aria-hidden="true" className="h-8 w-8 shrink-0 object-contain" />
            {!compact && <span className="truncate text-sm font-semibold text-ink">{orgName}</span>}
          </Link>

          {!compact && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-expanded
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
              className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-control text-ink-subtle transition-colors duration-200 ease-standard hover:bg-surface-sunken hover:text-ink lg:inline-flex"
            >
              <Icon name="chevronsLeft" size={16} />
            </button>
          )}
        </div>

        <nav
          className={`min-h-0 flex-1 space-y-4 overflow-y-auto py-3 ${compact ? "px-2" : "px-2.5"}`}
          aria-label="Sections"
        >
          {nav.map((group) => (
            <div key={group.section}>
              {compact ? (
                <hr className="mx-2 mb-2 border-line" aria-hidden="true" />
              ) : (
                <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-subtle">
                  {group.section}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavItem
                    key={item.to}
                    item={item}
                    compact={compact}
                    onNavigate={onCloseMobile}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-line p-2">
          {user ? (
            <>
              <div className="space-y-0.5">
                <NavLink
                  to="/profile"
                  onClick={onCloseMobile}
                  title={compact ? `${user.name || user.email} · ${roleLabel}` : undefined}
                  className={({ isActive }) =>
                    [
                      rowBase,
                      compact ? "justify-center px-1" : "gap-2.5 px-2",
                      isActive
                        ? "border-brand-border bg-brand-subtle text-brand-hover"
                        : "border-transparent text-ink-muted hover:bg-surface-sunken hover:text-ink",
                    ].join(" ")
                  }
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-subtle text-[0.6875rem] font-semibold text-brand-hover ring-1 ring-brand-border">
                    {user.profilePhoto ? (
                      <img src={user.profilePhoto} alt="" className="h-full w-full object-cover" />
                    ) : (
                      (user.name?.[0] || user.email?.[0] || "?").toUpperCase()
                    )}
                  </span>
                  {compact ? (
                    <span className="sr-only">
                      My profile — {user.name || user.email}, {roleLabel}
                    </span>
                  ) : (
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block truncate font-semibold leading-4 text-ink">
                        {user.name || user.email}
                      </span>
                      <span
                        className={`mt-0.5 inline-block rounded-chip px-1.5 py-px text-[0.625rem] font-semibold ring-1 ${getRoleBadgeClass(user)}`}
                      >
                        {roleLabel}
                      </span>
                    </span>
                  )}
                </NavLink>

                <button
                  type="button"
                  onClick={logout}
                  title={compact ? "Log out" : undefined}
                  className={[
                    rowBase,
                    "border-transparent text-danger hover:bg-danger-subtle",
                    compact ? "justify-center px-1" : "gap-2.5 px-2",
                  ].join(" ")}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center">
                    <Icon name="logout" size={16} />
                  </span>
                  <span className={compact ? "sr-only" : ""}>Log out</span>
                </button>

                {/* Expanded, the collapse control sits beside the workspace name
                    at the top; collapsed, the way back out lives here. */}
                {compact && (
                  <button
                    type="button"
                    onClick={onToggleCollapse}
                    aria-expanded={false}
                    title="Expand sidebar"
                    className={[
                      rowBase,
                      "hidden justify-center border-transparent px-1 text-ink-muted hover:bg-surface-sunken hover:text-ink lg:flex",
                    ].join(" ")}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center">
                      <Icon name="chevronsRight" size={16} />
                    </span>
                    <span className="sr-only">Expand sidebar</span>
                  </button>
                )}
              </div>

              <div className="mt-2 border-t border-line pt-2">
                <PoweredBySkillAra compact={compact} />
              </div>
            </>
          ) : (
            !compact && (
              <Link
                to="/login"
                className="flex min-h-9 items-center justify-center rounded-control bg-brand px-3 text-[0.8125rem] font-semibold text-brand-fg transition-colors duration-200 ease-standard hover:bg-brand-hover"
              >
                Sign in
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
