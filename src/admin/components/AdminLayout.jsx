import { Link, Outlet, useLocation } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";
import Sidebar from "./Sidebar.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { useTenantBranding } from "../hooks/useTenantBranding.js";

const PAGE_TITLES = {
  "/admin": "Dashboard",
  "/admin/users": "User management",
  "/admin/roles": "Roles and permissions",
  "/admin/master-data": "Master data",
  "/admin/profile": "My profile",
};

export default function AdminLayout() {
  const { user, logout } = useAdminAuth();
  const { tenantName } = useTenantBranding();
  const { pathname } = useLocation();

  const pageTitle = PAGE_TITLES[pathname] || "Admin";
  useDocumentTitle(`${pageTitle} · ${tenantName} Admin`);

  return (
    <div className="admin-shell-bg flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden">
        <main className="admin-main flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
