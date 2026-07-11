import { useEffect, useState } from "react";
import { checkWorkspace } from "../api/auth.js";
import PlatformShowcase from "../components/workspace/PlatformShowcase.jsx";
import WorkspaceBackground from "../components/workspace/WorkspaceBackground.jsx";
import { buildTenantUrl, setDevTenant } from "../utils/tenant.js";

const SUBDOMAIN_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

function WorkspaceForm() {
  const root = getRootDomain() || "skillara.com";
  const [workspace, setWorkspace] = useState("");
  const [status, setStatus] = useState("idle");
  const [tenantName, setTenantName] = useState("");

  useEffect(() => {
    const sub = workspace.trim().toLowerCase();
    if (!sub) {
      setStatus("idle");
      setTenantName("");
      return;
    }
    if (!SUBDOMAIN_RE.test(sub)) {
      setStatus("invalid");
      setTenantName("");
      return;
    }

    setStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const data = await checkWorkspace(sub);
        if (data?.exists) {
          setStatus("valid");
          setTenantName(data.tenant_name);
        } else {
          setStatus("invalid");
          setTenantName("");
        }
      } catch {
        setStatus("invalid");
        setTenantName("");
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [workspace]);

  const handleContinue = (e) => {
    e.preventDefault();
    const sub = workspace.trim().toLowerCase();
    if (status !== "valid" || !sub) return;
    setDevTenant(sub);
    window.location.href = `${buildTenantUrl(sub)}/login`;
  };

  const displayHost = workspace.trim() ? getTenantDisplayHost(workspace.trim().toLowerCase()) : "";

  return (
    <div className="workspace-form-card relative rounded-2xl border border-white/10 bg-[#161b26]/90 p-8 shadow-2xl backdrop-blur-xl">
      {/* Glow ring behind card */}
      <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-b from-violet-500/20 via-transparent to-blue-500/10 opacity-60" />

      <div className="relative">
        <div className="flex items-center gap-2 text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/20 text-base">
            📍
          </span>
          <h1 className="text-xl font-semibold">Find your workspace</h1>
        </div>
        <p className="mt-2 text-sm text-slate-400">
          Enter the name your school or team uses on SkillAra.
        </p>

        <form onSubmit={handleContinue} className="mt-8">
          <label className="block text-sm font-medium text-slate-300">Workspace name</label>
          <div className="mt-2 flex overflow-hidden rounded-xl border border-white/10 bg-[#0f1117] focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500">
            <input
              value={workspace}
              onChange={(e) =>
                setWorkspace(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
              }
              placeholder="acmebootcamp"
              className="min-w-0 flex-1 border-0 bg-transparent px-4 py-3 text-white placeholder:text-slate-600 focus:ring-0"
              autoFocus
              autoComplete="off"
              spellCheck={false}
            />
            <span className="flex items-center border-l border-white/10 px-4 text-sm text-slate-500">
              .{root}
            </span>
          </div>

          {status === "checking" && (
            <p className="mt-2 text-sm text-slate-500">Checking workspace…</p>
          )}
          {status === "valid" && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-emerald-400">
              <span>✓</span>
              <span>
                <strong>{displayHost}</strong> is a workspace
                {tenantName ? ` — ${tenantName}` : ""}
              </span>
            </p>
          )}
          {status === "invalid" && workspace.trim() && (
            <p className="mt-2 text-sm text-red-400">
              No workspace found at <strong>{displayHost || `?.${root}`}</strong>
            </p>
          )}

          <button
            type="submit"
            disabled={status !== "valid"}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:from-violet-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            Continue
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Don&apos;t know it? Ask your instructor or admin for the link.
        </p>
      </div>
    </div>
  );
}

export default function FindWorkspace() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <WorkspaceBackground />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 lg:px-10">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 text-sm font-bold text-white shadow-lg shadow-violet-900/40">
            S
          </span>
          <span className="text-lg font-bold text-white">SkillAra</span>
        </div>
        <p className="hidden text-xs text-slate-500 sm:block">
          Your organization&apos;s learning hub
        </p>
      </header>

      {/* Main content */}
      <main className="relative z-10 mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-12 pt-4 lg:flex-row lg:items-center lg:gap-16 lg:px-10 lg:pb-16 lg:pt-8">
        <div className="flex-1 lg:max-w-xl">
          <PlatformShowcase />
        </div>
        <div className="w-full shrink-0 lg:max-w-md">
          <WorkspaceForm />
        </div>
      </main>

      {/* Bottom tagline */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-4 text-center text-xs text-slate-600 lg:px-10">
        Courses · AI Tutoring · Mock Tests · Mentorship · Community — all in one platform.
      </footer>
    </div>
  );
}
