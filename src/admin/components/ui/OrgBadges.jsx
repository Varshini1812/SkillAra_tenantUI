export function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <div className="space-y-3 p-6">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((__, j) => (
            <div key={j} className="h-8 flex-1 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon = "📭", title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="text-4xl">{icon}</span>
      <h3 className="mt-4 text-lg font-medium text-slate-900">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function RoleTypeBadge({ type }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
        type === "system" ? "bg-violet-100 text-violet-600" : "bg-sky-100 text-sky-600"
      }`}
    >
      {type === "system" ? "System" : "Custom"}
    </span>
  );
}

export function OrgStatusBadge({ status }) {
  const styles = {
    active: "bg-emerald-100 text-emerald-600",
    inactive: "bg-slate-100 text-slate-600",
    ACTIVE: "bg-emerald-100 text-emerald-600",
    INACTIVE: "bg-slate-100 text-slate-600",
    PENDING: "bg-amber-100 text-amber-600",
    BLOCKED: "bg-red-100 text-red-600",
    DISABLED: "bg-slate-100 text-slate-600",
  };
  const labels = {
    active: "Active",
    inactive: "Inactive",
    ACTIVE: "Active",
    INACTIVE: "Inactive",
    PENDING: "Pending",
    BLOCKED: "Blocked",
    DISABLED: "Disabled",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] || "bg-slate-100 text-slate-600"}`}>
      {labels[status] || status}
    </span>
  );
}
