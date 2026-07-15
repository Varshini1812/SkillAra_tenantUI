import { useAuth } from "../context/AuthContext.jsx";
import { isRootApp } from "../utils/tenant.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

function DevDomainGate() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f1117] px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10">
          <svg className="h-6 w-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white">Enter a valid workspace URL</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          Use your workspace domain to sign in. For example:
        </p>
        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm text-violet-300">
          damil.localhost:5173
        </div>
        <p className="mt-6 text-xs text-slate-500">
          Don&apos;t know your workspace URL? Contact your admin.
        </p>
      </div>
    </div>
  );
}

export default function TenantGate({ children }) {
  const { tenantSubdomain, tenantInfo, tenantError, loading } = useAuth();

  const tenantName = tenantInfo?.tenant_name || tenantSubdomain;
  useDocumentTitle(
    isRootApp()
      ? "Find workspace · SkillAra"
      : tenantName
        ? `${tenantName} · SkillAra`
        : "SkillAra — Learn Smarter"
  );

  // Dev gate: show a prompt when hitting plain localhost without a subdomain
  if (import.meta.env.DEV && isRootApp()) {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return <DevDomainGate />;
    }
  }

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
      <div className="flex min-h-screen items-center justify-center bg-[#0f1117] px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10">
            <svg className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">Workspace not found</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            <strong className="text-white">{tenantSubdomain}</strong> doesn&apos;t exist. Check the URL or ask your admin for the correct workspace link.
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
