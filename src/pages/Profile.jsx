import { useState } from "react";

import { updateMyProfile } from "../api/auth.js";
import { getErrorMessage } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { usePermissions } from "../hooks/usePermissions.js";
import MyAccessPanel from "../components/MyAccessPanel.jsx";
import { getRoleBadgeClass, ROLE_DESCRIPTIONS, getUserRole } from "../utils/permissions.js";

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm text-slate-800">{value || "—"}</p>
    </div>
  );
}

/**
 * Account page available to every signed-in role.
 * Editable fields are limited to what the self-service endpoint accepts — role,
 * department, and status are managed by admins, so they are shown read-only.
 */
export default function Profile() {
  const { user, tenantInfo, tenantHost, refreshUser } = useAuth();
  const { roleLabel } = usePermissions();

  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  if (!user) return <div className="text-center text-slate-400">Loading…</div>;

  const role = getUserRole(user);
  const dirty = form.name !== (user.name || "") || form.phone !== (user.phone || "");

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await updateMyProfile({ name: form.name.trim(), phone: form.phone.trim() });
      await refreshUser();
      setNotice("Profile updated.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My profile</h1>
        <p className="text-slate-500">Your account details and what your role allows.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-50 text-xl font-bold text-indigo-600 ring-1 ring-indigo-100">
            {user.profilePhoto ? (
              <img src={user.profilePhoto} alt="" className="h-full w-full object-cover" />
            ) : (
              (user.name?.[0] || user.email?.[0] || "?").toUpperCase()
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-slate-900">
              {user.name || user.email}
            </p>
            <p className="truncate text-sm text-slate-500">{user.email}</p>
            <span
              className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${getRoleBadgeClass(user)}`}
            >
              {roleLabel}
            </span>
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-500">
          {ROLE_DESCRIPTIONS[role] || "Your access is defined by your organization role."}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={save} className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Details</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Name and phone are yours to change. Everything else is managed by your
            organization admin.
          </p>

          {error && <div className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-600">{error}</div>}
          {notice && (
            <div className="mt-3 rounded-lg bg-green-50 p-2 text-sm text-green-700">{notice}</div>
          )}

          <label className="mt-4 block text-xs font-medium text-slate-600">
            Full name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              maxLength={100}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="mt-3 block text-xs font-medium text-slate-600">
            Phone
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              maxLength={20}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="mt-3 block text-xs font-medium text-slate-600">
            Email
            <input
              value={user.email}
              disabled
              className="mt-1 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
            />
          </label>

          <button
            type="submit"
            disabled={saving || !dirty}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Organization</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Organization" value={tenantInfo?.tenant_name || tenantHost} />
            <Field label="Role" value={roleLabel} />
            <Field label="Department" value={user.department} />
            <Field label="Designation" value={user.designation} />
            <Field label="Employee ID" value={user.employeeId} />
            <Field label="Status" value={user.status} />
          </div>

          {user.isDefaultPassword && (
            <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              You are still using a temporary password. Change it from the sign-in flow.
            </div>
          )}
        </div>
      </div>

      <MyAccessPanel />
    </div>
  );
}
