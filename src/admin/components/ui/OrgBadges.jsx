import { Badge } from "./primitives.jsx";

/**
 * Status pills for the organization admin tables.
 *
 * `EmptyState` and `TableSkeleton` used to live here too, duplicating the ones
 * in primitives.jsx (with a 📭 emoji as the default icon). They are gone —
 * import those from primitives.jsx instead.
 */

const ROLE_LABEL = { system: "System", custom: "Custom" };

export function RoleTypeBadge({ type }) {
  return (
    <Badge variant={type === "system" ? "brand" : "default"} icon={false}>
      {ROLE_LABEL[type] || "Custom"}
    </Badge>
  );
}

const STATUS = {
  active: ["success", "Active"],
  ACTIVE: ["success", "Active"],
  inactive: ["default", "Inactive"],
  INACTIVE: ["default", "Inactive"],
  DISABLED: ["default", "Disabled"],
  PENDING: ["warning", "Pending"],
  INVITED: ["warning", "Invited"],
  BLOCKED: ["error", "Blocked"],
  SUSPENDED: ["error", "Suspended"],
};

export function OrgStatusBadge({ status }) {
  const [variant, label] = STATUS[status] || ["default", status || "—"];
  return <Badge variant={variant}>{label}</Badge>;
}
