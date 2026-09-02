import { useId, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useAdminAuth } from "../admin/context/AdminAuthContext.jsx";
import { getErrorMessage } from "../api/client.js";
import { setInitialPassword, workspaceLogin } from "../api/workspaceAuth.js";
import { getTenantLogoUrl } from "../admin/utils/tenantLogo.js";
import { useDocumentTitle } from "../admin/hooks/useDocumentTitle.js";
import { buildRootUrl } from "../utils/tenant.js";
import { loadRememberedLogin, saveRememberedLogin } from "../lib/rememberLogin.js";
import { readableTextOn } from "../utils/contrastColor.js";
import { DEFAULT_TENANT_BRAND } from "../admin/constants/branding.js";
import Icon from "../admin/components/ui/Icon.jsx";
import { SkillAraMark } from "../admin/components/SkillAraBrand.jsx";
import { Button, Field } from "../admin/components/ui/primitives.jsx";

const CONTROL =
  "w-full rounded-control border border-line-strong bg-surface px-3 py-2.5 text-base text-ink " +
  "transition-[border-color,box-shadow] duration-200 ease-standard " +
  "focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand-muted";

const CAPABILITIES = [
  { icon: "courses", title: "Courses", desc: "Everything your organization teaches" },
  { icon: "users", title: "People", desc: "Learners, instructors and mentors" },
  { icon: "analytics", title: "Progress", desc: "Enrolment and completion at a glance" },
];

/**
 * Password field with a show/hide toggle. Paste is never blocked and
 * `autoComplete` is always set, so password managers work normally
 * (`accessible-authentication`, `password-toggle`).
 */
function PasswordField({ id, label, value, onChange, autoComplete, hint, required = true }) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label} htmlFor={id} hint={hint} required={required}>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          required={required}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={`${CONTROL} pr-20`}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-pressed={show}
          className="absolute right-2 top-1/2 inline-flex min-h-8 -translate-y-1/2 items-center rounded-control px-2 text-xs font-semibold text-ink-muted transition-colors duration-150 ease-standard hover:bg-surface-sunken hover:text-ink"
        >
          {show ? "Hide" : "Show"}
          <span className="sr-only"> password</span>
        </button>
      </div>
    </Field>
  );
}

function Notice({ variant = "error", children }) {
  const style = {
    error: "border-danger-border bg-danger-subtle text-danger",
    success: "border-success-border bg-success-subtle text-success",
    warning: "border-warning-border bg-warning-subtle text-warning",
  }[variant];
  const icon = { error: "danger", success: "success", warning: "warning" }[variant];

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-surface border px-3.5 py-2.5 text-[0.8125rem] ${style}`}
    >
      <Icon name={icon} size={15} className="mt-0.5 shrink-0" />
      <p className="min-w-0 flex-1">{children}</p>
    </div>
  );
}

export default function TenantLogin() {
  const { establishSession: establishUserSession, tenantInfo, tenantHost, tenantSubdomain } =
    useAuth();
  const { establishSession: establishAdminSession } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMsg = location.state?.message;

  const emailId = useId();
  const passwordId = useId();
  const newPasswordId = useId();
  const confirmId = useId();

  const tenantName = tenantInfo?.tenant_name || tenantSubdomain || "Your workspace";
  const tenantLogoUrl = getTenantLogoUrl(tenantInfo?.logo);
  const brand = tenantInfo?.branding?.primary_color || DEFAULT_TENANT_BRAND;
  // Every tenant picks its own brand colour, so the text on top is chosen at
  // runtime rather than assumed to be white.
  const onBrand = readableTextOn(brand);

  const [email, setEmail] = useState(() => loadRememberedLogin(tenantSubdomain).email);
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(
    () => loadRememberedLogin(tenantSubdomain).rememberMe
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [loginPortal, setLoginPortal] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useDocumentTitle(`Sign in · ${tenantName}`);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await workspaceLogin(email, password);
      saveRememberedLogin(tenantSubdomain, email, rememberMe);
      if (
        data.isDefaultPassword ||
        data.user?.isDefaultPassword ||
        data.mustChangePassword ||
        data.user?.mustChangePassword
      ) {
        setMustChangePassword(true);
        setLoginPortal(data.portal);
        return;
      }
      if (data.portal === "admin") {
        establishAdminSession(data);
        navigate("/admin");
      } else {
        establishUserSession(data);
        navigate("/dashboard");
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) {
      setError("Your new password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Those passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const result = await setInitialPassword({
        currentPassword: password,
        newPassword,
        portal: loginPortal || "learning",
      });
      const session = { user: result.user };
      if (loginPortal === "admin") {
        establishAdminSession(session);
        navigate("/admin");
      } else {
        establishUserSession(session);
        navigate("/courses");
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const mark = tenantLogoUrl ? (
    <img src={tenantLogoUrl} alt="" className="h-10 w-10 rounded-control object-cover" />
  ) : (
    <span
      className="flex h-10 w-10 items-center justify-center rounded-control text-base font-bold"
      style={{ backgroundColor: "rgba(255,255,255,0.16)", color: onBrand }}
      aria-hidden="true"
    >
      {tenantName?.[0]?.toUpperCase()}
    </span>
  );

  return (
    <div className="slim-scroll font-sans flex min-h-dvh items-stretch bg-surface text-ink">
      {/* Brand panel — decorative, hidden below lg. Pinned to the viewport so it
          can never grow the page and produce a second scrollbar. */}
      <aside
        className="relative hidden flex-col justify-between overflow-hidden px-10 py-10 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-[46%] xl:w-[48%]"
        style={{ backgroundColor: brand, color: onBrand }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(110% 80% at 105% -10%, rgba(255,255,255,0.16) 0%, transparent 60%)," +
              "radial-gradient(70% 55% at -10% 110%, rgba(0,0,0,0.18) 0%, transparent 60%)",
          }}
        />

        <div className="relative flex shrink-0 items-center gap-3">
          {mark}
          <span className="truncate text-lg font-bold tracking-tight">{tenantName}</span>
        </div>

        <div className="relative flex flex-1 flex-col justify-center py-10">
          <div className="max-w-lg">
            <h2 className="text-[2.25rem] font-bold leading-[1.12] tracking-tight xl:text-[2.5rem]">
              Welcome back to
              <br />
              {tenantName}.
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed opacity-80">
              {tenantInfo?.branding?.welcome_message ||
                "Sign in to reach your courses, your people and your progress."}
            </p>
          </div>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {CAPABILITIES.map((c) => (
              <li
                key={c.title}
                className="rounded-surface p-3.5"
                style={{
                  border: "1px solid rgba(255,255,255,0.18)",
                  backgroundColor: "rgba(255,255,255,0.09)",
                }}
              >
                <div className="flex items-center gap-2">
                  <Icon name={c.icon} size={16} className="opacity-80" />
                  <p className="text-[0.875rem] font-semibold">{c.title}</p>
                </div>
                <p className="mt-1 text-[0.8125rem] leading-5 opacity-75">{c.desc}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex shrink-0 items-center gap-1.5 text-xs font-medium tracking-wide opacity-70">
          <span>Powered by</span>
          <SkillAraMark className="h-3.5 w-3.5" />
          <span className="font-semibold">SkillAra</span>
        </div>
      </aside>

      <div className="flex w-full flex-col justify-center px-6 py-10 sm:px-8 lg:flex-1">
        <div className="mx-auto w-full max-w-sm">
          <div className="flex items-center gap-2.5 lg:hidden">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-control text-sm font-bold"
              style={{ backgroundColor: brand, color: onBrand }}
              aria-hidden="true"
            >
              {tenantLogoUrl ? (
                <img src={tenantLogoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                tenantName?.[0]?.toUpperCase()
              )}
            </span>
            <span className="min-w-0 truncate text-base font-semibold text-ink">{tenantName}</span>
          </div>

          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-ink lg:mt-0">
            {mustChangePassword ? "Set a new password" : "Sign in"}
          </h1>
          <p className="mt-1.5 text-[0.875rem] text-ink-muted">
            {mustChangePassword
              ? "One last step to finish setting up your account."
              : `Continue to ${tenantName}.`}
          </p>

          {tenantHost && !mustChangePassword && (
            <p className="mt-5 rounded-control border border-line bg-surface-sunken px-3 py-2 text-[0.8125rem] text-ink-muted">
              Workspace <span className="break-token font-mono text-ink">{tenantHost}</span>
            </p>
          )}

          <form
            onSubmit={mustChangePassword ? handleSetPassword : handleSubmit}
            className="mt-6 space-y-4"
            noValidate
          >
            {successMsg && <Notice variant="success">{successMsg}</Notice>}
            {mustChangePassword && (
              <Notice variant="warning">
                Your temporary password got you this far. Choose a new one to finish signing in.
              </Notice>
            )}
            {error && <Notice>{error}</Notice>}

            {!mustChangePassword ? (
              <>
                <Field label="Email" htmlFor={emailId} required>
                  <input
                    id={emailId}
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className={CONTROL}
                  />
                </Field>

                <PasswordField
                  id={passwordId}
                  label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />

                <label className="flex w-fit cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded-chip border-line-strong accent-[var(--color-brand)]"
                  />
                  <span className="text-[0.8125rem] text-ink-muted">Remember me</span>
                </label>

                {/* The CTA carries the tenant's brand colour, with its text
                    colour chosen for contrast rather than assumed white. */}
                <Button
                  type="submit"
                  size="lg"
                  variant="tenant"
                  loading={loading}
                  className="w-full"
                  style={{ backgroundColor: brand, color: onBrand }}
                >
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </>
            ) : (
              <>
                <PasswordField
                  id={newPasswordId}
                  label="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  hint="At least 8 characters."
                />
                <PasswordField
                  id={confirmId}
                  label="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <Button
                  type="submit"
                  size="lg"
                  variant="tenant"
                  loading={loading}
                  className="w-full"
                  style={{ backgroundColor: brand, color: onBrand }}
                >
                  {loading ? "Saving…" : "Set password and continue"}
                </Button>
              </>
            )}
          </form>

          <p className="mt-7 text-center text-xs text-ink-subtle">
            Accounts are created by your organization admin.
          </p>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-[0.6875rem] text-ink-subtle lg:hidden">
            Powered by
            <SkillAraMark className="h-3.5 w-3.5" />
            <span className="font-semibold text-ink-muted">SkillAra</span>
          </p>
          <p className="mt-2 text-center text-xs">
            <a
              href={buildRootUrl("/login")}
              className="rounded-control font-medium text-ink-subtle transition-colors duration-150 ease-standard hover:text-ink hover:underline underline-offset-2"
            >
              Not your workspace? Switch workspace
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
