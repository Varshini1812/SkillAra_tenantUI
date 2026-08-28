import { useState } from "react";
import { Outlet } from "react-router-dom";

import AppSidebar, { useSidebarCollapsed } from "./AppSidebar.jsx";
import DevTenantBanner from "./DevTenantBanner.jsx";
import NotificationBell from "./NotificationBell.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { usePermissions } from "../hooks/usePermissions.js";
import { getTenantFromHostname } from "../utils/tenant.js";

/**
 * Shell for every signed-in role. The sidebar carries navigation for students,
 * instructors, and staff alike; the top bar is only a mobile menu trigger plus
 * context, so the same layout works at every breakpoint.
 */
export default function Layout() {
  const { tenantInfo, tenantHost } = useAuth();
  const { roleLabel, user } = usePermissions();
  const [collapsed, toggleCollapsed] = useSidebarCollapsed();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isPlainLocalhost =
    import.meta.env.DEV &&
    !getTenantFromHostname() &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  return (
    // h-screen + overflow-hidden pins the shell to the viewport so the sidebar stays
    // put; only <main> scrolls.
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <AppSidebar
        collapsed={collapsed}
        onToggleCollapse={toggleCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg border border-slate-300 p-2 lg:hidden"
            aria-label="Open menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800">
              {tenantInfo?.tenant_name || tenantHost || "SkillAra"}
            </p>
            {user && <p className="truncate text-xs text-slate-500">{roleLabel}</p>}
          </div>

          {user && <NotificationBell />}
        </header>

        {isPlainLocalhost && (
          <div className="shrink-0 border-b border-amber-100 bg-amber-50 px-4 py-3">
            <DevTenantBanner />
          </div>
        )}

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
