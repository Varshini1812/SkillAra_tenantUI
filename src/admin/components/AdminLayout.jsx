import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar, { useSidebarCollapsed } from "./Sidebar.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { useTenantBranding } from "../hooks/useTenantBranding.js";

const PAGE_TITLES = {
  "/admin": "Dashboard",
  "/admin/users": "User management",
  "/admin/roles": "Roles and permissions",
  "/admin/master-data": "Master data",
  "/admin/monitoring": "Community monitoring",
  "/admin/profile": "My profile",
};

export default function AdminLayout() {
  const { tenantName } = useTenantBranding();
  const { pathname } = useLocation();
  const [collapsed, toggleCollapsed] = useSidebarCollapsed();
  const [mobileOpen, setMobileOpen] = useState(false);

  const pageTitle = PAGE_TITLES[pathname] || "Admin";
  useDocumentTitle(`${pageTitle} · ${tenantName} Admin`);

  return (
    <div className="admin-shell-bg flex h-screen overflow-hidden">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={toggleCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden">
        <div className="admin-mobile-bar">
          <button
            type="button"
            className="admin-sidebar-toggle"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <p className="truncate text-sm font-semibold text-slate-800">{pageTitle}</p>
        </div>

        <main className="admin-main flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
