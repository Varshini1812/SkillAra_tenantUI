import { useEffect, useId, useState } from "react";
import { checkWorkspace, findWorkspacesByEmail } from "../api/auth.js";
import {
  buildTenantUrl,
  getRootDomain,
  getTenantDisplayHost,
  setDevTenant,
  setTenantOverride,
  usesEmailWorkspaceDiscovery,
} from "../utils/tenant.js";
import { setPendingLoginEmail } from "../lib/rememberLogin.js";
import Icon from "../admin/components/ui/Icon.jsx";
import { SkillAraMark, SkillAraMarkChip } from "../admin/components/SkillAraBrand.jsx";
import { Badge, Button, Field, Skeleton } from "../admin/components/ui/primitives.jsx";

const SUBDOMAIN_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

const CAPABILITIES = [
  { icon: "courses", title: "Courses", desc: "Structured learning paths and lessons" },
  { icon: "mentor", title: "Mentorship", desc: "One-to-one guidance and mock interviews" },
  { icon: "clipboardCheck", title: "Assessments", desc: "Quizzes, mock tests and certificates" },
  { icon: "activity", title: "Progress", desc: "Track completion across your cohort" },
];

/**
 * Email-first entry point, used while there is no wildcard domain to carry the
 * workspace in the hostname. The address the user already knows identifies
 * their organization, so nothing about the workspace shows up in the URL.
 *
 * The subdomain form below is the same screen for the day `VITE_ROOT_DOMAIN`
 * points at a real wildcard domain — neither replaces the other.
 */
function EmailWorkspaceForm() {
  const inputId = useId();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [choices, setChoices] = useState([]);

  const enter = (workspace) => {
    if (!setTenantOverride(workspace.subdomain)) {
      setError("That workspace could not be opened. Ask your administrator for help.");
      return;
    }
    setPendingLoginEmail(email);
    // A full load rather than a route change: the app decides between the
    // finder and the workspace routes at boot, from the stored workspace.
    window.location.assign("/login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!value) return;

    setLoading(true);
    setError("");
    setChoices([]);
    try {
      const data = await findWorkspacesByEmail(value);
      const workspaces = (data?.workspaces || []).filter((w) => w?.subdomain);

      if (workspaces.length === 0) {
        setError("We could not find a workspace for that email. Check the address, or ask your administrator to invite you.");
        return;
      }
      if (workspaces.length === 1) {
        enter(workspaces[0]);
        return;
      }
      // The same address can be a member of more than one organization, so the
      // user picks rather than being sent somewhere arbitrary.
      setChoices(workspaces);
    } catch {
      setError("We could not look that up just now. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-sm">
      <span className="flex h-11 w-11 items-center justify-center rounded-surface bg-brand-subtle text-brand">
        <Icon name="search" size={22} />
      </span>

      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-ink">Sign in to SkillAra</h1>
      <p className="mt-1.5 text-[0.875rem] text-ink-muted">
        Enter your email and we&apos;ll take you to your organization.
      </p>

      <form onSubmit={handleSubmit} className="mt-6" noValidate>
        <Field label="Email address" htmlFor={inputId} required>
          <input
            id={inputId}
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
              setChoices([]);
            }}
            placeholder="you@your-academy.com"
            autoFocus
            autoComplete="email"
            className="w-full rounded-control border border-line-strong bg-surface px-3 py-2.5 text-base text-ink transition-[border-color,box-shadow] duration-200 ease-standard focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand-muted"
          />
        </Field>

        <div aria-live="polite" className="mt-2">
          {loading && (
            <span className="flex items-center gap-2">
              <Skeleton className="h-5 w-20" />
              <span className="text-xs text-ink-subtle">Looking up your organization…</span>
            </span>
          )}
          {error && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-control border border-danger-border bg-danger-subtle px-3 py-2 text-[0.8125rem] text-danger"
            >
              <Icon name="danger" size={15} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </p>
          )}
        </div>

        {choices.length > 0 ? (
          <div className="mt-4">
            <p className="text-[0.8125rem] font-medium text-ink">
              You belong to {choices.length} organizations. Choose one:
            </p>
            <ul className="mt-2 space-y-2">
              {choices.map((w) => (
                <li key={w.subdomain}>
                  <button
                    type="button"
                    onClick={() => enter(w)}
                    className="flex w-full items-center justify-between gap-3 rounded-control border border-line-strong bg-surface px-3 py-2.5 text-left transition-colors duration-150 ease-standard hover:border-brand hover:bg-brand-subtle"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[0.875rem] font-medium text-ink">
                        {w.name || w.subdomain}
                      </span>
                      <span className="block truncate font-mono text-xs text-ink-subtle">
                        {w.subdomain}
                      </span>
                    </span>
                    <Icon name="chevronRight" size={16} className="shrink-0 text-ink-muted" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <Button
            type="submit"
            size="lg"
            disabled={loading || !email.trim()}
            className="mt-4 w-full"
          >
            Continue
            <Icon name="chevronRight" size={16} />
          </Button>
        )}
      </form>

      <p className="mt-6 text-center text-xs text-ink-subtle">
        Don&apos;t have an account? Ask your instructor or administrator for an invite.
      </p>
    </div>
  );
}

/**
 * Root-domain entry point: this page is SkillAra's own, not a tenant's, so it
 * uses the product palette rather than any organization's branding.
 */
function WorkspaceForm() {
  const root = getRootDomain() || "skillara.com";
  const inputId = useId();

  const [workspace, setWorkspace] = useState("");
  const [status, setStatus] = useState("idle");
  const [tenantName, setTenantName] = useState("");

  useEffect(() => {
    const sub = workspace.trim().toLowerCase();
    if (!sub) {
      setStatus("idle");
      setTenantName("");
      return undefined;
    }
    if (!SUBDOMAIN_RE.test(sub)) {
      setStatus("invalid");
      setTenantName("");
      return undefined;
    }

    setStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const data = await checkWorkspace(sub);
        if (data?.exists && !data?.inactive) {
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
    window.location.href = buildTenantUrl(sub, "/login");
  };

  const displayHost = workspace.trim()
    ? getTenantDisplayHost(workspace.trim().toLowerCase())
    : "";

  const borderClass =
    status === "invalid" && workspace.trim()
      ? "border-danger"
      : status === "valid"
        ? "border-success"
        : "border-line-strong focus-within:border-brand";

  return (
    <div className="mx-auto w-full max-w-sm">
      <span className="flex h-11 w-11 items-center justify-center rounded-surface bg-brand-subtle text-brand">
        <Icon name="search" size={22} />
      </span>

      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-ink">Find your workspace</h1>
      <p className="mt-1.5 text-[0.875rem] text-ink-muted">
        Enter the name your academy or team uses on SkillAra.
      </p>

      <form onSubmit={handleContinue} className="mt-6" noValidate>
        <Field label="Workspace name" htmlFor={inputId} required>
          <div
            className={`flex overflow-hidden rounded-control border bg-surface transition-[border-color,box-shadow] duration-200 ease-standard focus-within:ring-[3px] focus-within:ring-brand-muted ${borderClass}`}
          >
            <input
              id={inputId}
              value={workspace}
              onChange={(e) =>
                setWorkspace(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
              }
              placeholder="acme-academy"
              autoFocus
              autoComplete="off"
              spellCheck={false}
              aria-describedby={`${inputId}-status`}
              className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 font-mono text-base text-ink placeholder:text-ink-subtle focus:outline-none"
            />
            <span className="flex items-center border-l border-line bg-surface-sunken px-3 text-[0.8125rem] font-medium text-ink-muted">
              .{root}
            </span>
          </div>
        </Field>

        {/* Result is announced as it resolves, and always pairs a word and an
            icon with its colour (`color-not-only`). */}
        <div id={`${inputId}-status`} aria-live="polite" className="mt-2 min-h-6">
          {status === "checking" && (
            <span className="flex items-center gap-2">
              <Skeleton className="h-5 w-20" />
              <span className="text-xs text-ink-subtle">Checking…</span>
            </span>
          )}
          {status === "valid" && (
            <span className="flex flex-wrap items-center gap-2">
              <Badge variant="success">Found</Badge>
              <span className="break-token text-xs text-ink-muted">
                <span className="font-medium text-ink">{displayHost}</span>
                {tenantName ? ` · ${tenantName}` : ""}
              </span>
            </span>
          )}
          {status === "invalid" && workspace.trim() && (
            <span className="flex flex-wrap items-center gap-2">
              <Badge variant="error">Not found</Badge>
              <span className="break-token text-xs text-ink-muted">
                Nothing at {displayHost || `?.${root}`}
              </span>
            </span>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={status !== "valid"}
          className="mt-4 w-full"
        >
          Continue
          <Icon name="chevronRight" size={16} />
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-ink-subtle">
        Don&apos;t know it? Ask your instructor or administrator for the link.
      </p>
    </div>
  );
}

export default function FindWorkspace() {
  return (
    <div className="slim-scroll font-sans flex min-h-dvh items-stretch bg-surface text-ink">
      {/* Brand panel — decorative, hidden below lg, pinned to the viewport so it
          can never grow the page into a second scrollbar. */}
      <aside
        className="relative hidden flex-col justify-between overflow-hidden px-10 py-10 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-[46%] xl:w-[48%]"
        style={{
          backgroundColor: "var(--color-brand-active)",
          backgroundImage:
            "radial-gradient(115% 85% at 108% -10%, var(--color-brand-hover) 0%, transparent 62%)," +
            "radial-gradient(75% 55% at -10% 110%, rgba(13,148,136,0.30) 0%, transparent 58%)",
        }}
      >
        <div className="relative flex shrink-0 items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-control bg-white text-brand-active">
            <SkillAraMark className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight text-white">SkillAra</span>
        </div>

        <div className="relative flex flex-1 flex-col justify-center py-10">
          <div className="max-w-lg">
            <h2 className="text-[2.25rem] font-bold leading-[1.12] tracking-tight text-white xl:text-[2.5rem]">
              Your academy,
              <br />
              wherever you learn.
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-white/75">
              Every organization on SkillAra gets its own workspace. We&apos;ll find yours from your email.
            </p>
          </div>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {CAPABILITIES.map((c) => (
              <li
                key={c.title}
                className="rounded-surface border border-white/15 bg-white/[0.06] p-3.5"
              >
                <div className="flex items-center gap-2">
                  <Icon name={c.icon} size={16} className="text-white/70" />
                  <p className="text-[0.875rem] font-semibold text-white">{c.title}</p>
                </div>
                <p className="mt-1 text-[0.8125rem] leading-5 text-white/70">{c.desc}</p>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative shrink-0 text-xs font-medium tracking-wide text-white/70">
          Multi-tenant learning platform · Data isolated per organization
        </p>
      </aside>

      <div className="flex w-full flex-col justify-center px-6 py-10 sm:px-8 lg:flex-1">
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <SkillAraMarkChip />
          <span className="text-xl font-bold text-ink">SkillAra</span>
        </div>

        {usesEmailWorkspaceDiscovery() ? <EmailWorkspaceForm /> : <WorkspaceForm />}
      </div>
    </div>
  );
}
