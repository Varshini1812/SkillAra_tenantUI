import { useAuth } from "../context/AuthContext.jsx";
import { isRootApp } from "../utils/tenant.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

import { useState } from "react";
import api from "../api/client.js";

function DevDomainGate() {
  const [email, setEmail] = useState("");
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await api.post("/api/tenants/workspace/find", { email });
      setWorkspaces(res.data?.data?.workspaces || []);
      setSearched(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f1117] px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10">
          <svg className="h-6 w-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white">Find your workspace</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-400 mb-6">
          Enter your email address to find the workspaces you belong to.
        </p>

        {!searched ? (
          <form onSubmit={handleSearch} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@work-email.com"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
            >
              {loading ? "Searching..." : "Find Workspaces"}
            </button>
          </form>
        ) : (
          <div className="space-y-4 text-left">
            <h3 className="text-sm font-medium text-slate-300">Found {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}</h3>
            {workspaces.length > 0 ? (
              workspaces.map((w) => (
                <a
                  key={w.subdomain}
                  href={w.url}
                  className="block rounded-xl border border-white/10 bg-white/5 p-4 hover:border-violet-500/50 hover:bg-white/10 transition"
                >
                  <p className="font-semibold text-white">{w.name}</p>
                  <p className="mt-1 text-sm text-violet-400">{w.url}</p>
                </a>
              ))
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">No workspaces found for that email.</p>
            )}
            <button
              onClick={() => { setSearched(false); setEmail(""); }}
              className="mt-4 w-full text-sm text-slate-400 hover:text-white"
            >
              Try another email
            </button>
          </div>
        )}

        <div className="mt-8 border-t border-white/10 pt-6">
          <p className="text-xs text-slate-500">
            Know your workspace URL? Just type it directly in your browser. (e.g., acme.skillara.com)
          </p>
        </div>
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
