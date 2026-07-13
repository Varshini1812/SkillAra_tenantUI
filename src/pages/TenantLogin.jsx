import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useAdminAuth } from "../admin/context/AdminAuthContext.jsx";
import { getErrorMessage } from "../api/client.js";
import { setInitialPassword, workspaceLogin } from "../api/workspaceAuth.js";
import AdminLoginBackground from "../admin/components/login/AdminLoginBackground.jsx";
import AdminLoginShowcase from "../admin/components/login/AdminLoginShowcase.jsx";
import { getTenantLogoUrl } from "../admin/utils/tenantLogo.js";
import { useDocumentTitle } from "../admin/hooks/useDocumentTitle.js";
import { buildRootUrl } from "../utils/tenant.js";
import { loadRememberedLogin, saveRememberedLogin } from "../lib/rememberLogin.js";

function TenantAvatar({ logoUrl, name, primaryColor }) {
  if (logoUrl) {
    return (
      <img src={logoUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-slate-200" />
    );
  }
  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[20px] font-semibold text-white"
      style={{ backgroundColor: primaryColor || "#4F46E5" }}
    >
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

export default function TenantLogin() {
  const { establishSession: establishUserSession, tenantInfo, tenantHost, tenantSubdomain } = useAuth();
  const { establishSession: establishAdminSession } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMsg = location.state?.message;

  const tenantName = tenantInfo?.tenant_name || tenantSubdomain || "Your Workspace";
  const tenantLogoUrl = getTenantLogoUrl(tenantInfo?.logo);
  const tenantPrimaryColor = tenantInfo?.branding?.primary_color || "#4F46E5";
  const tenantWelcomeMessage =
    tenantInfo?.branding?.welcome_message ||
    `Welcome to ${tenantName}! Sign in to continue.`;

  const [email, setEmail] = useState(() => loadRememberedLogin(tenantSubdomain).email);
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(() => loadRememberedLogin(tenantSubdomain).rememberMe);
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
        navigate("/courses");
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
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
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

  return (
    <div className="relative flex h-screen flex-col overflow-hidden">
      <AdminLoginBackground variant="tenant" />

      <header className="relative z-10 flex shrink-0 items-center gap-2.5 px-6 py-5 lg:px-10">
        {tenantLogoUrl ? (
          <>
            <img src={tenantLogoUrl} alt="" className="h-9 w-9 rounded-lg object-cover ring-1 ring-slate-200" />
            <span className="text-[20px] font-semibold text-slate-900">{tenantName}</span>
          </>
        ) : (
          <>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
              style={{ backgroundColor: tenantPrimaryColor }}
            >
              {tenantName?.[0]?.toUpperCase()}
            </span>
            <span className="text-[20px] font-semibold text-slate-900">{tenantName}</span>
          </>
        )}
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
              <TenantAvatar logoUrl={tenantLogoUrl} name={tenantName} primaryColor={tenantPrimaryColor} />
              <div>
                <h1 className="text-[20px] font-semibold text-slate-900">
                  {mustChangePassword ? "Set a new password" : "Sign in"}
                </h1>
                <p className="text-[17px] text-slate-500">
                  {mustChangePassword ? "Finish setting up your account" : "Admins and learners"}
                </p>
              </div>
            </div>

            {tenantHost && !mustChangePassword && (
              <div className="mb-5 rounded-lg bg-emerald-50 px-3 py-2 text-[16px] text-emerald-800">
                Workspace: <span className="font-mono font-medium">{tenantHost}</span>
              </div>
            )}

            <form onSubmit={mustChangePassword ? handleSetPassword : handleSubmit} className="space-y-4">
              {successMsg && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[17px] text-emerald-800">
                  {successMsg}
                </div>
              )}
              {mustChangePassword && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[16px] text-amber-900">
                  Choose a new password to finish signing in. Your temporary password from the welcome
                  email was used to authenticate this step.
                </div>
              )}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[17px] text-red-700">
                  {error}
                </div>
              )}

              {!mustChangePassword ? (
                <>
                  <InputField
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    autoComplete="email"
                  />
                  <InputField
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <label className="flex cursor-pointer items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30"
                    />
                    <span className="text-[16px] text-slate-600">Remember me</span>
                  </label>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{ backgroundColor: tenantPrimaryColor }}
                    className="w-full rounded-lg py-2.5 text-[18px] font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    {loading ? "Signing in..." : "Log in"}
                  </button>
                </>
              ) : (
                <>
                  <InputField
                    label="New password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                  />
                  <InputField
                    label="Confirm new password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    style={{ backgroundColor: tenantPrimaryColor }}
                    className="w-full rounded-lg py-2.5 text-[18px] font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    {loading ? "Saving..." : "Set password & continue"}
                  </button>
                </>
              )}
            </form>

            <p className="mt-5 text-center text-[15px] text-slate-400">
              Accounts are created when an organization is set up.
            </p>

            <p className="mt-3 text-center text-[15px]">
              <a
                href={buildRootUrl("/login")}
                className="font-medium text-slate-500 transition hover:text-slate-700"
              >
                ← Not your workspace? Switch workspace
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
