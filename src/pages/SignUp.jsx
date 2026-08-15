import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { signUp } from "../api/auth.js";
import { getErrorMessage } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import AuthShell from "../components/AuthShell.jsx";

/**
 * Open learner registration — the self-serve half of the two enrolment paths.
 * Students who sign up here browse the catalog and enrol themselves; students an
 * admin adds are invited instead and can be enrolled in courses automatically.
 */
export default function SignUp() {
  const { tenantInfo, tenantHost, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const tenantName = tenantInfo?.tenant_name || tenantInfo?.name || tenantHost || "SkillAra";

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await signUp({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      // The API signs the new student in, so land them straight on the catalog.
      await refreshUser();
      navigate("/courses", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const field = "w-full rounded-lg border border-white/10 bg-[#0f1117] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none";

  return (
    <AuthShell>
      <div className="rounded-2xl border border-white/10 bg-[#161b26] p-8 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/20 text-2xl">
            🎓
          </div>
          <h1 className="mt-4 text-xl font-semibold text-white">Create your account</h1>
          <p className="mt-1 text-sm text-slate-400">{tenantName}</p>
          <p className="mt-2 text-sm text-slate-500">
            Sign up as a student and start enrolling in courses
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm text-slate-300">
            Full name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              minLength={2}
              maxLength={100}
              autoComplete="name"
              className={`mt-1 ${field}`}
              placeholder="Priya Sharma"
            />
          </label>

          <label className="block text-sm text-slate-300">
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
              className={`mt-1 ${field}`}
              placeholder="you@example.com"
            />
          </label>

          <label className="block text-sm text-slate-300">
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={8}
              autoComplete="new-password"
              className={`mt-1 ${field}`}
              placeholder="At least 8 characters"
            />
          </label>

          <label className="block text-sm text-slate-300">
            Confirm password
            <input
              type="password"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              required
              autoComplete="new-password"
              className={`mt-1 ${field}`}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-blue-400 hover:text-blue-300">
            Sign in
          </Link>
        </p>

        <p className="mt-2 text-center text-xs text-slate-500">
          Invited by your organization? Use the link in your invitation email instead.
        </p>
      </div>
    </AuthShell>
  );
}
