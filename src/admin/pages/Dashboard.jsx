import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";
import { getTenantDisplayHost, getTenantSubdomain } from "../../utils/tenant.js";
import { getRoleLabel } from "../utils/roles.js";
import { fetchUsers } from "../api/admin.js";
import { useTenantMasterData } from "../hooks/useTenantMasterData.js";
import { loadFromTenantStorage } from "../utils/tenantStorage.js";
import { TENANT_AUDIT_LOG_KEY } from "../data/tenantRolesPermissions.js";
import Breadcrumb from "../components/ui/Breadcrumb.jsx";

export default function Dashboard() {
  const { user } = useAdminAuth();
  const tenant = getTenantSubdomain();
  const [activeTab, setActiveTab] = useState("overview");

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Fetch users for analytics stats
  useEffect(() => {
    fetchUsers()
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.users || [];
        setUsers(list);
      })
      .catch(() => {})
      .finally(() => setLoadingUsers(false));
  }, []);

  const { activeItems: departments, loading: loadingDepts } = useTenantMasterData("department");

  // Load audit logs
  const auditLogs = useMemo(() => {
    return loadFromTenantStorage(TENANT_AUDIT_LOG_KEY, []);
  }, []);

  // Compute metrics
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.status === "ACTIVE" || u.status === "active").length;
    const pending = users.filter((u) => u.status === "PENDING" || u.status === "invited" || u.status === "INVITED").length;
    return { total, active, pending };
  }, [users]);

  const tenantDisplayName = tenant
    ? tenant.charAt(0).toUpperCase() + tenant.slice(1)
    : "Organization";

  return (
    <div className="space-y-6">
      {/* Simple Sleek Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-3xl font-black text-black tracking-tight">
            Organization Dashboard
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 flex flex-wrap items-center gap-2">
            <span>Welcome back, <span className="font-semibold text-slate-700">{user?.name || user?.email?.split("@")[0]}</span></span>
            <span className="text-slate-300">•</span>
            <span>Logged in as <span className="font-medium text-slate-600">{user?.email}</span></span>
            <span className="text-slate-300">•</span>
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-100">
              {getRoleLabel(user)}
            </span>
          </p>
        </div>
        <div className="shrink-0">
          <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600">
            Workspace: <span className="font-bold text-slate-800">{getTenantDisplayHost(tenant)}</span>
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("overview")}
            className={`border-b-2 py-4 px-1 text-sm font-medium transition-all duration-200 ${
              activeTab === "overview"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("actions")}
            className={`border-b-2 py-4 px-1 text-sm font-medium transition-all duration-200 ${
              activeTab === "actions"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
          >
            Quick Actions
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`border-b-2 py-4 px-1 text-sm font-medium transition-all duration-200 ${
              activeTab === "audit"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
          >
            Recent Activity
          </button>
        </nav>
      </div>

      {/* Tab Panels */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats Cards Grid */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
            {/* Total Users */}
            <div className="admin-card p-5 relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Users</span>
                <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-black">{loadingUsers ? "..." : stats.total}</h3>
                <p className="text-xs text-slate-500 mt-1">Registered members</p>
              </div>
            </div>

            {/* Active Users */}
            <div className="admin-card p-5 relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Users</span>
                <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-black">{loadingUsers ? "..." : stats.active}</h3>
                <p className="text-xs text-emerald-600 font-medium mt-1">● Active profiles</p>
              </div>
            </div>

            {/* Pending Invitations */}
            <div className="admin-card p-5 relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Invites</span>
                <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L22 8m-9 11h.01m-6.99-3h10a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-black">{loadingUsers ? "..." : stats.pending}</h3>
                <p className="text-xs text-amber-600 font-medium mt-1">◌ Awaiting signup</p>
              </div>
            </div>

            {/* Departments */}
            <div className="admin-card p-5 relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Departments</span>
                <div className="rounded-lg bg-violet-50 p-2 text-violet-600">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-black">{loadingDepts ? "..." : departments.length}</h3>
                <p className="text-xs text-slate-500 mt-1">Active categorizations</p>
              </div>
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="admin-card p-6">
              <h3 className="font-semibold text-black text-lg">System Configuration</h3>
              <div className="mt-4 space-y-3.5">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600 font-medium">Tenant Subdomain</span>
                  <span className="text-sm font-semibold text-black">{tenant}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600 font-medium">Domain Host</span>
                  <span className="text-sm text-slate-500">{getTenantDisplayHost(tenant)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600 font-medium">Invite Link Expiry</span>
                  <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">7 Days</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-slate-600 font-medium">Role Access Level</span>
                  <span className="text-xs font-semibold bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full">
                    {getRoleLabel(user)}
                  </span>
                </div>
              </div>
            </div>

            <div className="admin-card p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-black text-lg">Tenant Organization Workspace</h3>
                <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                  As the workspace administrator, you can manage user profiles, assign permissions, configure corporate structures, and audit system activities.
                </p>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Generate digital signup invitations for new employees, tutors, and students.
                </p>
              </div>
              <div className="mt-6 flex gap-3">
                <Link to="/admin/users?panel=create" className="admin-btn-primary text-xs py-2 inline-flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Invite New User
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "actions" && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Link to="/admin/users" className="admin-card admin-card-interactive p-6 flex flex-col justify-between group">
            <div>
              <div className="rounded-xl bg-indigo-50 text-indigo-600 p-3 w-fit group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-black text-lg mt-4">Manage Users</h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Add, edit, block, activate, or invite tutors and students in your workspace.
              </p>
            </div>
            <span className="text-xs font-semibold text-indigo-600 mt-6 inline-flex items-center gap-1 group-hover:translate-x-1 transition-all duration-300">
              Go to Users
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </Link>

          <Link to="/admin/roles" className="admin-card admin-card-interactive p-6 flex flex-col justify-between group">
            <div>
              <div className="rounded-xl bg-violet-50 text-violet-600 p-3 w-fit group-hover:bg-violet-600 group-hover:text-white transition-all duration-300">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-bold text-black text-lg mt-4">Roles & Permissions</h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Configure custom permission policies and map system roles to API profiles.
              </p>
            </div>
            <span className="text-xs font-semibold text-violet-600 mt-6 inline-flex items-center gap-1 group-hover:translate-x-1 transition-all duration-300">
              Go to Roles
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </Link>

          <Link to="/admin/master-data" className="admin-card admin-card-interactive p-6 flex flex-col justify-between group">
            <div>
              <div className="rounded-xl bg-amber-50 text-amber-600 p-3 w-fit group-hover:bg-amber-600 group-hover:text-white transition-all duration-300">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="font-bold text-black text-lg mt-4">Master Data</h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              </p>
            </div>
            <span className="text-xs font-semibold text-amber-600 mt-6 inline-flex items-center gap-1 group-hover:translate-x-1 transition-all duration-300">
              Go to Master Data
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </Link>

          <Link to="/admin/profile" className="admin-card admin-card-interactive p-6 flex flex-col justify-between group">
            <div>
              <div className="rounded-xl bg-rose-50 text-rose-600 p-3 w-fit group-hover:bg-rose-600 group-hover:text-white transition-all duration-300">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-black text-lg mt-4">My Profile</h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Update ownership details, configure security settings, or change account password.
              </p>
            </div>
            <span className="text-xs font-semibold text-rose-600 mt-6 inline-flex items-center gap-1 group-hover:translate-x-1 transition-all duration-300">
              Go to Profile
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </Link>
        </div>
      )}

      {activeTab === "audit" && (
        <div className="admin-card overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <h3 className="font-semibold text-black">Workspace Activity Feed</h3>
            <p className="text-xs text-slate-500 mt-0.5">Audit log of system actions performed inside this tenant organization</p>
          </div>
          {auditLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-4 text-sm font-medium">No actions logged yet</p>
              <p className="text-xs text-slate-400 mt-1">Actions like user invitations and status toggles will show here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
              {auditLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-5 hover:bg-slate-50 transition-colors">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                    {log.action?.[0]?.toUpperCase() || "A"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800">
                      {log.action}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>User ID: <span className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">{log.userId || "System"}</span></span>
                      {log.targetUserId && <span>Target User ID: <span className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">{log.targetUserId}</span></span>}
                      <span>•</span>
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
