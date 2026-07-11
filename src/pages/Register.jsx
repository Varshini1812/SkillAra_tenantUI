import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getErrorMessage } from "../api/client.js";
import AuthShell from "../components/AuthShell.jsx";
import { buildRootUrl } from "../utils/tenant.js";

export default function Register() {
  const { register, tenantInfo, tenantHost } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("inviteToken") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const tenantName = tenantInfo?.tenant_name || tenantInfo?.name || tenantHost || "Your Workspace";

  const inviteMissing = useMemo(() => !inviteToken, [inviteToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await register({ inviteToken, password });
      navigate("/login", { state: { message: "Account ready! Please sign in." } });
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
          <h1 className="mt-4 text-xl font-semibold text-white">Join {tenantName}</h1>
          {tenantHost && <p className="mt-1 text-sm text-slate-400">{tenantHost}</p>}
          <p className="mt-2 text-sm text-slate-500">Complete your invitation to activate your account</p>
        </div>

        {inviteMissing ? (
          <div className="mt-8 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
            This page requires a valid invitation link from your organization admin.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0f1117] px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">Confirm password</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0f1117] px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {loading ? "Activating..." : "Activate account"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-blue-400 hover:underline">
            Sign in
          </Link>
        </p>

        <p className="mt-3 text-center text-sm">
          <a href={buildRootUrl("/login")} className="text-slate-400 hover:text-white">
            ← Switch workspace
          </a>
        </p>
      </div>
    </AuthShell>
  );
}
