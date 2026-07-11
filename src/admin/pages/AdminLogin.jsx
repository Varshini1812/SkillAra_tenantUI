import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";
import { resolveTenant } from "../api/admin.js";
import { getErrorMessage } from "../api/client.js";
import { ERROR_MESSAGES } from "../utils/errorMessages.js";
import AdminLoginBackground from "../components/login/AdminLoginBackground.jsx";
import AdminLoginShowcase from "../components/login/AdminLoginShowcase.jsx";
import {
  getActiveTenantSubdomain,
  getTenantDisplayHost,
  getTenantFromHostname,
  getTenantSubdomain,
  setDevTenantSubdomain,
} from "../../utils/tenant.js";
import { getTenantLogoUrl } from "../utils/tenantLogo.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

function TenantAvatar({ logoUrl, name }) {
  if (logoUrl) {
    return (
      <img src={logoUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-slate-200" />
    );
  }
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-[20px] font-semibold text-indigo-700">
      {name?.[0]?.toUpperCase() || "O"}
    </span>
  );
}

function InputField({ label, type, value, onChange, placeholder, autoComplete }) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
    <div>
      {label ? (
        <label className="mb-1.5 block text-[17px] font-medium text-slate-700">{label}</label>
      ) : null}
      <div className="relative">
        <input
          type={isPassword && show ? "text" : type}
          required
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 pr-10 text-[18px] text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[16px] text-slate-500 hover:text-slate-700"
          >
            {show ? "Hide" : "Show"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminLogin() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [devTenant, setDevTenant] = useState(() => getTenantSubdomain());
  const tenantSub = getActiveTenantSubdomain(devTenant);
  const tenantHost = tenantSub ? getTenantDisplayHost(tenantSub) : "";
  const [tenantName, setTenantName] = useState("");
  const [tenantLogoUrl, setTenantLogoUrl] = useState(null);
  const [tenantPrimaryColor, setTenantPrimaryColor] = useState("#4F46E5");
  const [tenantWelcomeMessage, setTenantWelcomeMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    const sub = getTenantFromHostname() || devTenant;
    if (sub && import.meta.env.DEV && !getTenantFromHostname()) {
      setDevTenantSubdomain(sub);
    }
  }, [devTenant]);

  useEffect(() => {
    if (!tenantSub) return;
    resolveTenant(tenantSub)
      .then((data) => {
        const t = data?.tenant;
        setTenantName(t?.tenant_name || "");
        setTenantLogoUrl(getTenantLogoUrl(t?.logo));
        setTenantPrimaryColor(t?.branding?.primary_color || "#4F46E5");
        setTenantWelcomeMessage(
          t?.branding?.welcome_message ||
            `Welcome to ${t?.tenant_name || "your organization"}! Sign in to continue.`
        );
      })
      .catch(() => {});
  }, [tenantSub]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const sub = getActiveTenantSubdomain(devTenant).trim().toLowerCase();
    if (!sub) {
      setError(ERROR_MESSAGES.AUTH_TENANT_WORKSPACE_REQUIRED);
      return;
    }

    if (import.meta.env.DEV && sub) {
      setDevTenantSubdomain(sub);
    }

    setLoading(true);
    try {
      await login(email, password, sub);
      navigate("/admin");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const showDevTenant = import.meta.env.DEV && !getTenantFromHostname();

  useDocumentTitle(`Sign in · ${tenantName || tenantSub || "Organization"} Admin`);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotMessage("");

    const trimmedEmail = forgotEmail.trim().toLowerCase();
    if (!trimmedEmail) {
      setForgotMessage("Enter the email address linked to your account.");
      return;
    }

    setForgotLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setForgotMessage(
        "If an account exists for that email, password reset instructions will be sent shortly. Check your inbox."
      );
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="relative flex h-screen flex-col overflow-hidden">
      <AdminLoginBackground variant="tenant" />

      <header className="relative z-10 flex shrink-0 items-center gap-2.5 px-6 py-5 lg:px-10">
        {tenantLogoUrl ? (
          <>
            <img src={tenantLogoUrl} alt="" className="h-9 w-9 rounded-lg object-cover ring-1 ring-slate-200" />
            <span className="text-[20px] font-semibold text-slate-900">{tenantName || tenantSub}</span>
          </>
        ) : (
          <>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
              style={{ backgroundColor: tenantPrimaryColor }}
            >
              {(tenantName || tenantSub || "O")?.[0]?.toUpperCase()}
            </span>
            <span className="text-[20px] font-semibold text-slate-900">{tenantName || tenantSub || "Your organization"}</span>
          </>
        )}
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[15px] font-medium text-slate-600">Admin</span>
      </header>

      <main className="relative z-10 mx-auto flex min-h-0 w-full max-w-5xl flex-1 items-center gap-10 px-6 pb-6 lg:gap-16 lg:px-10">
        <div className="hidden min-w-0 flex-1 lg:block">
          <AdminLoginShowcase
            superAdmin={false}
            tenantName={tenantName}
            tenantHost={tenantHost}
            tenantLogoUrl={tenantLogoUrl}
            welcomeMessage={tenantWelcomeMessage}
            primaryColor={tenantPrimaryColor}
          />
        </div>

        <div className="mx-auto w-full max-w-[460px] shrink-0 lg:mx-0">
          <div className="admin-login-card rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
            <div className="mb-6 flex items-center gap-3">
              <TenantAvatar logoUrl={tenantLogoUrl} name={tenantName} />
              <div>
                <h1 className="text-[20px] font-semibold text-slate-900">Sign in</h1>
                <p className="text-[17px] text-slate-500">{tenantHost || "Organization admin"}</p>
              </div>
            </div>

            {tenantHost && (
              <div className="mb-5 rounded-lg bg-emerald-50 px-3 py-2 text-[16px] text-emerald-800">
                <span className="font-mono font-medium">{tenantHost}</span>
              </div>
            )}

            {showDevTenant && (
              <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <label className="block text-[15px] font-medium text-amber-900">Dev subdomain</label>
                <input
                  value={devTenant}
                  onChange={(e) => setDevTenant(e.target.value)}
                  placeholder="acme-bootcamp"
                  className="mt-1.5 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-[17px] focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[17px] text-red-700">
                  {error}
                </div>
              )}

              {!showForgotPassword ? (
                <>
                  <InputField
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@organization.com"
                    autoComplete="email"
                  />
                  <div>
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <label className="text-[17px] font-medium text-slate-700">Password</label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(true);
                          setForgotEmail(email);
                          setForgotMessage("");
                        }}
                        className="text-[15px] font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <InputField
                      label=""
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={tenantPrimaryColor ? { backgroundColor: tenantPrimaryColor } : undefined}
                    className="w-full rounded-lg bg-indigo-600 py-2.5 text-[18px] font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    {loading ? "Signing in..." : "Log in"}
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-[18px] font-semibold text-slate-900">Reset your password</h2>
                    <p className="mt-1 text-[16px] text-slate-500">
                      Enter your email and we&apos;ll send reset instructions if an account exists.
                    </p>
                  </div>

                  {forgotMessage && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[16px] text-emerald-800">
                      {forgotMessage}
                    </div>
                  )}

                  <InputField
                    label="Email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="admin@organization.com"
                    autoComplete="email"
                  />

                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={forgotLoading}
                    style={tenantPrimaryColor ? { backgroundColor: tenantPrimaryColor } : undefined}
                    className="w-full rounded-lg bg-indigo-600 py-2.5 text-[18px] font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    {forgotLoading ? "Sending..." : "Send reset link"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotMessage("");
                    }}
                    className="w-full text-[16px] font-medium text-slate-500 hover:text-slate-700"
                  >
                    Back to sign in
                  </button>
                </div>
              )}
            </form>

            <p className="mt-5 text-center text-[15px] text-slate-400">
              Accounts are provisioned when an organization is created.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
