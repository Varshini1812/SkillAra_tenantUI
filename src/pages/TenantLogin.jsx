import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getErrorMessage } from "../api/client.js";
import AuthShell from "../components/AuthShell.jsx";
import { buildRootUrl } from "../utils/tenant.js";

export default function TenantLogin() {
  const { login, tenantInfo, tenantHost } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMsg = location.state?.message;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const tenantName = tenantInfo?.tenant_name || tenantHost || "Your Workspace";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/courses");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="rounded-2xl border border-white/10 bg-[#161b26] p-8 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/20 text-2xl">
            🎓
          </div>
          <h1 className="mt-4 text-xl font-semibold text-white">{tenantName}</h1>
          {tenantHost && <p className="mt-1 text-sm text-slate-400">{tenantHost}</p>}
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {successMsg && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
              {successMsg}
            </div>
          )}
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0f1117] px-4 py-3 text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0f1117] px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Log in"}
          </button>

          <button
            type="button"
            disabled
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-sm font-medium text-slate-400"
            title="Coming soon"
          >
            Log in with school SSO
            <span className="text-xs">↗</span>
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          <a
            href={buildRootUrl("/login")}
            className="text-slate-400 transition hover:text-white"
          >
            ← Not your workspace? Switch workspace
          </a>
        </p>

        <p className="mt-4 text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-medium text-blue-400 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
