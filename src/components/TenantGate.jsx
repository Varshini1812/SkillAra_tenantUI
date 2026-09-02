import { useId, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { isRootApp } from "../utils/tenant.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import api from "../api/client.js";
import Icon from "../admin/components/ui/Icon.jsx";
import { SkillAraMark } from "../admin/components/SkillAraBrand.jsx";
import { Button, EmptyState, Field, Skeleton } from "../admin/components/ui/primitives.jsx";

const CONTROL =
  "w-full rounded-control border border-line-strong bg-surface px-3 py-2.5 text-base text-ink " +
  "transition-[border-color,box-shadow] duration-200 ease-standard " +
  "focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand-muted";

/**
 * Shared shell for every gate state, so a blocked entry point looks like the
 * rest of the product rather than a stray dark error screen.
 */
function GateShell({ children }) {
  return (
    <div className="slim-scroll font-sans flex min-h-dvh flex-col items-center justify-center bg-canvas px-4 py-10 text-ink">
      <div className="mb-8 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-control bg-brand">
          <SkillAraMark className="h-5 w-5" />
        </span>
        <span className="text-lg font-bold tracking-tight text-ink">SkillAra</span>
      </div>

      <div className="w-full max-w-md rounded-surface border border-line bg-surface p-6 sm:p-7">
        {children}
      </div>
    </div>
  );
}

/** A terminal state: an icon, an explanation, and where to go next. */
function GateMessage({ icon, tone = "warning", title, children }) {
  const toneClass = {
    warning: "bg-warning-subtle text-warning",
    danger: "bg-danger-subtle text-danger",
    brand: "bg-brand-subtle text-brand",
  }[tone];

  return (
    <GateShell>
      <div className="text-center">
        <span
          className={`mx-auto flex h-11 w-11 items-center justify-center rounded-surface ${toneClass}`}
        >
          <Icon name={icon} size={22} />
        </span>
        <h1 className="mt-4 text-lg font-semibold text-ink">{title}</h1>
        <div className="mt-2 text-[0.8125rem] leading-5 text-ink-muted">{children}</div>
      </div>
    </GateShell>
  );
}

/**
 * Dev-only entry point. On a real deployment you reach a workspace by its
 * subdomain; on plain localhost there is none, so this looks one up by email.
 */
function DevDomainGate() {
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/tenants/workspace/find", { email: email.trim() });
      setWorkspaces(res.data?.data?.workspaces || []);
      setSearched(true);
    } catch {
      setError("We could not look that up just now. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GateShell>
      <span className="flex h-11 w-11 items-center justify-center rounded-surface bg-brand-subtle text-brand">
        <Icon name="search" size={22} />
      </span>

      <h1 className="mt-4 text-xl font-semibold tracking-tight text-ink">Find your workspace</h1>
      <p className="mt-1.5 text-[0.8125rem] leading-5 text-ink-muted">
        Enter your email address and we&apos;ll list the workspaces you belong to.
      </p>

      {!searched ? (
        <form onSubmit={handleSearch} className="mt-5 space-y-4" noValidate>
          {error && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-control border border-danger-border bg-danger-subtle px-3 py-2 text-[0.8125rem] text-danger"
            >
              <Icon name="danger" size={15} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </p>
          )}

          <Field label="Work email" htmlFor={emailId} required>
            <input
              id={emailId}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@your-academy.com"
              autoComplete="email"
              autoFocus
              className={CONTROL}
            />
          </Field>

          <Button type="submit" size="lg" loading={loading} className="w-full">
            {loading ? "Searching…" : "Find workspaces"}
          </Button>
        </form>
      ) : (
        <div className="mt-5">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : workspaces.length > 0 ? (
            <>
              <p className="mb-2 text-xs font-medium text-ink-subtle" aria-live="polite">
                {workspaces.length} workspace{workspaces.length === 1 ? "" : "s"} found
              </p>
              <ul className="space-y-2">
                {workspaces.map((w) => (
                  <li key={w.subdomain}>
                    <a
                      href={w.url}
                      className="flex items-center gap-3 rounded-control border border-line bg-surface p-3 transition-colors duration-200 ease-standard hover:border-brand-border hover:bg-brand-subtle"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-brand-subtle text-sm font-semibold text-brand-hover">
                        {(w.name || w.subdomain || "?").charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.875rem] font-semibold text-ink">
                          {w.name}
                        </span>
                        <span className="break-token block font-mono text-xs text-ink-subtle">
                          {w.url}
                        </span>
                      </span>
                      <Icon name="chevronRight" size={16} className="text-ink-subtle" />
                    </a>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <EmptyState
              icon="search"
              title="No workspaces for that email"
              description="Check the address, or ask your administrator for your workspace link."
            />
          )}

          <Button
            variant="secondary"
            className="mt-4 w-full"
            onClick={() => {
              setSearched(false);
              setEmail("");
              setWorkspaces([]);
            }}
          >
            Try another email
          </Button>
        </div>
      )}

      <p className="mt-6 border-t border-line pt-4 text-xs text-ink-subtle">
        Know your workspace URL? Go straight there — for example{" "}
        <span className="font-mono text-ink-muted">acme.skillara.com</span>.
      </p>
    </GateShell>
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

  // Dev gate: plain localhost has no subdomain to identify a workspace by.
  if (import.meta.env.DEV && isRootApp()) {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return <DevDomainGate />;
    }
  }

  // Root domain only shows the workspace finder — no tenant validation needed.
  if (isRootApp()) return children;

  if (loading) {
    return (
      <div
        className="flex min-h-dvh items-center justify-center bg-canvas"
        role="status"
        aria-label="Loading workspace"
      >
        <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-line-strong border-t-brand" />
        <span className="sr-only">Loading workspace…</span>
      </div>
    );
  }

  if (tenantError === "reserved") {
    return (
      <GateMessage icon="lock" title="This subdomain is reserved">
        Use your organization&apos;s own workspace URL to sign in.
      </GateMessage>
    );
  }

  if (tenantSubdomain && tenantError === "not_found") {
    return (
      <GateMessage icon="warning" title="Workspace not found">
        <span className="break-token font-semibold text-ink">{tenantSubdomain}</span> doesn&apos;t
        exist. Check the address, or ask your administrator for the right link.
      </GateMessage>
    );
  }

  if (tenantInfo && tenantInfo.status === false) {
    return (
      <GateMessage icon="danger" tone="danger" title="Workspace inactive">
        This organization&apos;s account is currently disabled. Contact your administrator.
      </GateMessage>
    );
  }

  return children;
}
