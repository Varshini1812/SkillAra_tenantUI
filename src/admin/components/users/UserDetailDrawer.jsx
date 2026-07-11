import PermissionMatrix from "../roles/PermissionMatrix.jsx";
import { TENANT_PERMISSION_MODULES } from "../../data/tenantRolesPermissions.js";
import { OrgStatusBadge, RoleTypeBadge } from "../ui/OrgBadges.jsx";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function UserDetailDrawer({ user, role, auditLogs = [] }) {
  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="admin-card flex items-start gap-4 p-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xl font-semibold text-indigo-600">
          {user.profilePhoto ? (
            <img src={user.profilePhoto} alt="" className="h-full w-full rounded-full object-cover" />
          ) : (
            `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "?"
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-semibold text-slate-900">{user.firstName} {user.lastName}</h3>
          <p className="text-sm text-slate-500">{user.email}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <OrgStatusBadge status={user.status} />
            {role && <RoleTypeBadge type={role.roleType} />}
          </div>
        </div>
      </div>

      <section>
        <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Profile</h4>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Info label="Phone" value={user.phone || "—"} />
          <Info label="Employee ID" value={user.employeeId || "—"} />
          <Info label="Department" value={user.department || "—"} />
          <Info label="Designation" value={user.designation || "—"} />
          <Info label="Last login" value={formatDate(user.lastLoginAt)} />
          <Info label="Created" value={formatDate(user.created_on)} />
        </dl>
      </section>

      <section>
        <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Assigned role</h4>
        {role ? (
          <div className="admin-card p-4">
            <p className="font-medium text-slate-900">{role.name}</p>
            <p className="mt-1 text-sm text-slate-500">{role.description}</p>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No role assigned</p>
        )}
      </section>

      {role && (
        <section>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Inherited permissions</h4>
          <PermissionMatrix permissions={role.permissions} onChange={() => {}} readOnly modules={TENANT_PERMISSION_MODULES} />
        </section>
      )}

      <section>
        <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Context</h4>
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Courses assigned" value="—" />
          <StatCard label="Students assigned" value={role?.id === "instructor" ? "—" : "N/A"} />
          <StatCard label="Mentorship sessions" value={role?.id === "mentor" ? "—" : "N/A"} />
        </div>
      </section>

      <section>
        <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Audit history</h4>
        {auditLogs.length === 0 ? (
          <p className="text-sm text-slate-500">No audit events for this user yet</p>
        ) : (
          <ul className="space-y-2">
            {auditLogs.slice(0, 10).map((log) => (
              <li key={log.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                <p className="text-slate-800">{log.action}</p>
                <p className="text-xs text-slate-500">{formatDate(log.timestamp)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-800">{value}</dd>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="admin-card p-3 text-center">
      <p className="text-lg font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

