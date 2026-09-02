import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";
import { useTenantBranding } from "../hooks/useTenantBranding.js";
import { getAdminNav } from "../../utils/permissions.js";
import Icon from "./ui/Icon.jsx";
import SidebarFooter from "./SidebarFooter.jsx";

const STORAGE_KEY = "skillara-tenant-admin-sidebar-collapsed";

/** Nav config icon keys -> the shared icon set. */
const ICON = {
  dashboard: "dashboard",
  courses: "courses",
  enrollments: "inbox",
  review: "clipboardCheck",
  monitoring: "activity",
  mentors: "mentor",
  users: "users",
  roles: "roles",
  "master-data": "database",
};

/** Organization mark: the tenant's own logo when it has one, else its initial. */
function BrandMark({ tenantName, logoUrl, primaryColor, compact }) {
  const initial = (tenantName || "O").trim().charAt(0).toUpperCase();

  const badge = logoUrl ? (
    <img
      src={logoUrl}
      alt=""
      className="h-9 w-9 shrink-0 rounded-control border border-line object-cover"
    />
  ) : (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-sm font-semibold text-white"
      style={{ backgroundColor: primaryColor || "var(--color-brand)" }}
      aria-hidden="true"
    >
      {initial}
    </span>
  );

  if (compact) return badge;

  return (
    <>
      {badge}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink">{tenantName || "Your organization"}</p>
        <p className="truncate text-xs text-ink-subtle">Admin</p>
      </div>
    </>
  );
}

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
          <Icon name={ICON[item.icon] || "dashboard"} size={16} />
          {/* The label stays in the accessibility tree when collapsed, so the
              link never becomes an unnamed icon (`nav-label-icon`). */}
          <span className={compact ? "sr-only" : "truncate"}>{item.label}</span>
          {isActive && <span className="sr-only">(current page)</span>}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
}) {
  const { user } = useAdminAuth();
  const { tenantName, logoUrl, primaryColor } = useTenantBranding();
  const compact = collapsed && !mobileOpen;

  // Navigation follows the user's role permissions, so a custom role created in
  // Roles & permissions gets the right menu without changing this file.
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
    "z-50 flex h-full min-h-0 shrink-0 flex-col border-r border-line bg-surface",
    "fixed inset-y-0 left-0 lg:static",
    compact ? "w-[4.5rem]" : "w-60 sm:w-64",
    mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
    "transition-transform duration-200 ease-standard lg:transition-[width]",
  ].join(" ");

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

      <aside className={asideClass} aria-label="Admin navigation">
        <div
          className={`flex h-14 shrink-0 items-center gap-2 border-b border-line ${
            compact ? "justify-center px-2" : "justify-between px-3"
          }`}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <BrandMark
              tenantName={tenantName}
              logoUrl={logoUrl}
              primaryColor={primaryColor}
              compact={compact}
            />
          </div>

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
          {navGroups.map((group) => (
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

        <SidebarFooter
          compact={compact}
          onToggleCollapse={onToggleCollapse}
          onNavigate={onCloseMobile}
        />

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
