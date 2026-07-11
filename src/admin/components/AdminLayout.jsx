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
    <div className="admin-shell-bg flex min-h-screen">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="admin-header">
          <div className="ml-auto flex shrink-0 items-center gap-3">
            {user && (
              <Link to="/admin/profile" className="admin-header-user">
                <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                  {user.profilePhoto ? (
                    <img src={user.profilePhoto} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (user.name?.[0] || user.email?.[0] || "?").toUpperCase()
                  )}
                </span>
                <span className="hidden max-w-[180px] truncate text-sm font-medium text-slate-700 md:inline">
                  {user.name || user.email}
                </span>
              </Link>
            )}
            <button type="button" onClick={logout} className="admin-btn-logout">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Zm6.22 3.22a.75.75 0 0 1 1.06 0l3 3a.75.75 0 0 1 0 1.06l-3 3a.75.75 0 1 1-1.06-1.06L10.94 12 8.28 9.34a.75.75 0 0 1 0-1.06Zm3.28-4.47a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0V5.56l-3.72 3.72a.75.75 0 1 1-1.06-1.06l3.72-3.72h-2.19a.75.75 0 0 1-.75-.75Z"
                  clipRule="evenodd"
                />
              </svg>
              Logout
            </button>
          </div>
        </header>

        <main className="admin-main flex-1 overflow-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
