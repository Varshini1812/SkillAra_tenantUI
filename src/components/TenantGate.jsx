import { useAuth } from "../context/AuthContext.jsx";
import { isRootApp } from "../utils/tenant.js";

export default function TenantGate({ children }) {
  const { tenantSubdomain, tenantInfo, tenantError, loading } = useAuth();

  // Root domain only shows workspace finder — no tenant validation needed
  if (isRootApp()) return children;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1117]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (tenantError === "reserved") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1117] px-4 text-center text-white">
        <div>
          <h1 className="text-xl font-bold">This subdomain is reserved</h1>
          <p className="mt-2 text-slate-400">Use your organization&apos;s workspace URL to sign in.</p>
        </div>
      </div>
    );
  }

  if (tenantSubdomain && tenantError === "not_found") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1117] px-4 text-center text-white">
        <div>
          <h1 className="text-xl font-bold">Workspace not found</h1>
          <p className="mt-2 text-slate-400">
            <strong>{tenantSubdomain}</strong> doesn&apos;t exist. Check the URL or ask your admin.
          </p>
        </div>
      </div>
    );
  }

  if (tenantInfo && tenantInfo.status === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1117] px-4 text-center text-white">
        <div>
          <h1 className="text-xl font-bold">Workspace inactive</h1>
          <p className="mt-2 text-slate-400">This organization&apos;s account is currently disabled.</p>
        </div>
      </div>
    );
  }

  return children;
}
