import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getErrorMessage } from "../api/client.js";
import AuthShell from "../components/AuthShell.jsx";
import { buildRootUrl, clearTenantOverride } from "../utils/tenant.js";
import Icon from "../admin/components/ui/Icon.jsx";
import { Button, Input } from "../admin/components/ui/primitives.jsx";

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
      <div className="rounded-surface border border-line bg-surface p-6 sm:p-7">
        <div className="text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-surface bg-brand-subtle text-brand">
            <Icon name="user" size={22} />
          </span>
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-ink">Join {tenantName}</h1>
          {tenantHost && (
            <p className="break-token mt-1 font-mono text-xs text-ink-subtle">{tenantHost}</p>
          )}
          <p className="mt-2 text-[0.8125rem] text-ink-muted">
            Set a password to activate your account.
          </p>
        </div>

        {inviteMissing ? (
          <p
            role="alert"
            className="mt-6 flex items-start gap-2 rounded-control border border-warning-border bg-warning-subtle p-3 text-[0.8125rem] text-warning"
          >
            <Icon name="warning" size={15} className="mt-0.5 shrink-0" />
            <span>This page needs a valid invitation link from your organization admin.</span>
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            {error && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-control border border-danger-border bg-danger-subtle p-3 text-[0.8125rem] text-danger"
              >
                <Icon name="danger" size={15} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </p>
            )}

            <Input
              label="Password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              hint="At least 6 characters."
            />

            <Input
              label="Confirm password"
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />

            <Button type="submit" size="lg" loading={loading} className="w-full">
              {loading ? "Activating…" : "Activate account"}
            </Button>
          </form>
        )}

        <p className="mt-6 border-t border-line pt-4 text-center text-[0.8125rem] text-ink-muted">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-brand hover:underline underline-offset-2">
            Sign in
          </Link>
        </p>

        <p className="mt-2 text-center">
          <a
            href={buildRootUrl("/login")}
              onClick={clearTenantOverride}
            className="inline-flex items-center gap-1 text-xs text-ink-subtle transition-colors duration-150 ease-standard hover:text-ink"
          >
            <Icon name="chevronLeft" size={13} />
            Switch workspace
          </a>
        </p>
      </div>
    </AuthShell>
  );
}
