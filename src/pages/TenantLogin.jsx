import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useAdminAuth } from "../admin/context/AdminAuthContext.jsx";
import { getErrorMessage } from "../api/client.js";
import { setInitialPassword, workspaceLogin } from "../api/workspaceAuth.js";
import { getTenantLogoUrl } from "../admin/utils/tenantLogo.js";
import { useDocumentTitle } from "../admin/hooks/useDocumentTitle.js";
import { buildRootUrl } from "../utils/tenant.js";
import { loadRememberedLogin, saveRememberedLogin } from "../lib/rememberLogin.js";

function InputField({ label, type, value, onChange, placeholder, autoComplete }) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
    <div>
      {label ? (
        <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      ) : null}
      <div className="relative">
        <input
          type={isPassword && show ? "text" : type}
          required
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 pr-10 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 hover:text-gray-600"
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
    <div className="flex min-h-screen bg-white">
      {/* Left: branded panel */}
      <div className="relative hidden w-[45%] flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-10 py-10 lg:flex">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-violet-400/10 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        {/* Top: brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            {tenantLogoUrl ? (
              <img src={tenantLogoUrl} alt="" className="h-10 w-10 rounded-xl object-cover shadow-lg" />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-lg font-bold text-white backdrop-blur-sm">
                {tenantName?.[0]?.toUpperCase()}
              </span>
            )}
            <span className="text-lg font-bold text-white">{tenantName}</span>
          </div>
        </div>

        {/* Middle: content */}
        <div className="relative z-10 flex flex-col justify-center">
          <p className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-indigo-100 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Active workspace
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white">
            Welcome back to
            <br />
            <span className="text-indigo-200">{tenantName}</span>
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-indigo-200/80">
            {tenantInfo?.branding?.welcome_message || `Sign in to access your courses, track progress, and learn smarter.`}
          </p>

          {/* Feature cards */}
          <div className="mt-10 space-y-3">
            {[
              { icon: "users", title: "User management", desc: "Create students and tutor accounts" },
              { icon: "book", title: "Course oversight", desc: "Manage your organization's content" },
              { icon: "chart", title: "Enrollment stats", desc: "Track learners and progress" },
            ].map((f) => (
              <div
                key={f.title}
                className="flex items-center gap-3.5 rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur-sm transition hover:bg-white/[0.12]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
                  {f.icon === "users" && (
                    <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 00-3-3.87" />
                      <path d="M16 3.13a4 4 0 010 7.75" />
                    </svg>
                  )}
                  {f.icon === "book" && (
                    <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                      <line x1="8" y1="7" x2="16" y2="7" />
                      <line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                  )}
                  {f.icon === "chart" && (
                    <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                  )}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-xs text-indigo-200/70">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: tagline */}
        <div className="relative z-10">
          <p className="text-xs text-indigo-300/60">
            Courses &middot; AI Tutoring &middot; Mock Tests &middot; Progress Tracking
          </p>
        </div>
      </div>

      {/* Right: login form */}
      <div className="flex w-full flex-col justify-center bg-white px-8 lg:w-[55%]">
        <div className="mx-auto w-full max-w-sm">
          <div className="text-center lg:text-left">
            {tenantLogoUrl ? (
              <img src={tenantLogoUrl} alt="" className="mx-auto h-12 w-12 rounded-2xl object-cover shadow-sm lg:mx-0" />
            ) : (
              <span
                className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-sm lg:mx-0"
                style={{ backgroundColor: tenantPrimaryColor }}
              >
                {tenantName?.[0]?.toUpperCase()}
              </span>
            )}
            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-gray-900">
              {mustChangePassword ? "Set a new password" : "Sign in"}
            </h1>
            <p className="mt-1.5 text-sm text-gray-500">
              {mustChangePassword ? "Finish setting up your account" : "Enter your credentials to continue"}
            </p>
          </div>

          <div className="mt-8">
            {tenantHost && !mustChangePassword && (
              <div className="mb-5 rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-2.5 text-sm text-gray-500">
                <span className="font-medium text-gray-700">Workspace:</span>{" "}
                <span className="font-mono font-medium text-gray-900">{tenantHost}</span>
              </div>
            )}

            <form onSubmit={mustChangePassword ? handleSetPassword : handleSubmit} className="space-y-5">
              {successMsg && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {successMsg}
                </div>
              )}
              {mustChangePassword && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Choose a new password to finish signing in. Your temporary password was used to authenticate this step.
                </div>
              )}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
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
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-900/20"
                      />
                      <span className="text-sm text-gray-500">Remember me</span>
                    </label>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{ backgroundColor: tenantPrimaryColor }}
                    className="w-full rounded-xl py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 hover:shadow-md disabled:opacity-50 disabled:shadow-none"
                  >
                    {loading ? "Signing in..." : "Sign in"}
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
                    className="w-full rounded-xl py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 hover:shadow-md disabled:opacity-50 disabled:shadow-none"
                  >
                    {loading ? "Saving..." : "Set password & continue"}
                  </button>
                </>
              )}
            </form>
          </div>

          <p className="mt-8 text-center text-xs text-gray-400">
            Accounts are created by your organization admin.
          </p>

          <p className="mt-3 text-center text-xs">
            <a
              href={buildRootUrl("/login")}
              className="font-medium text-gray-400 transition hover:text-gray-600"
            >
              Not your workspace? Switch workspace
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
