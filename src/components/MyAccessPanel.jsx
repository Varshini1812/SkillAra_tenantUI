import { usePermissions } from "../hooks/usePermissions.js";
import { getRoleBadgeClass, ROLE_DESCRIPTIONS, getUserRole } from "../utils/permissions.js";

const ACTION_STYLES = {
  view: "bg-slate-100 text-slate-600",
  create: "bg-emerald-100 text-emerald-700",
  edit: "bg-blue-100 text-blue-700",
  delete: "bg-rose-100 text-rose-700",
  publish: "bg-indigo-100 text-indigo-700",
  manage: "bg-violet-100 text-violet-700",
  moderate: "bg-amber-100 text-amber-700",
};

/**
 * "What you can do here" — renders the signed-in user's role and the permission map
 * the server sent with their session. Purely informational; the API is the authority.
 */
export default function MyAccessPanel({ compact = false }) {
  const { user, roleLabel, permissionRows } = usePermissions();

  if (!user) return null;

  const role = getUserRole(user);
  const rows = compact ? permissionRows.slice(0, 6) : permissionRows;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">Your access</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {ROLE_DESCRIPTIONS[role] || "Permissions granted by your organization role."}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getRoleBadgeClass(user)}`}
        >
          {roleLabel}
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">
          No module permissions are attached to your role yet. Ask your organization admin if you
          expected access to something.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {rows.map((row) => (
            <li key={row.module} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="w-44 shrink-0 truncate font-medium text-slate-700">{row.label}</span>
              <span className="flex flex-wrap gap-1">
                {row.actions.map((action) => (
                  <span
                    key={action}
                    className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                      ACTION_STYLES[action] || "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {action}
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
      )}

      {compact && permissionRows.length > rows.length && (
        <p className="mt-3 text-xs text-slate-400">
          +{permissionRows.length - rows.length} more modules
        </p>
      )}
    </section>
  );
}
