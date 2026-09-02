export const ROLE_LABELS = {
  SUPER_ADMIN: "Super Admin",
  TENANT_ADMIN: "Organization Owner",
  tenant_admin: "Organization Owner",
  ORG_ADMIN: "Organization Admin",
  TUTOR: "Tutor / Instructor",
  instructor: "Tutor / Instructor",
  STUDENT: "Student",
  student: "Student",
};

export const ROLE_DESCRIPTIONS = {
  SUPER_ADMIN: "Full platform access across all organizations",
  TENANT_ADMIN: "Full organization ownership and control",
  tenant_admin: "Full organization ownership and control",
  ORG_ADMIN: "Manages users, roles, courses, and organization settings",
  TUTOR: "Creates and teaches courses within the organization",
  instructor: "Creates and teaches courses within the organization",
  STUDENT: "Enrolls in courses and tracks learning progress",
  student: "Enrolls in courses and tracks learning progress",
};

export function getRoleLabel(roleOrUser) {
  if (roleOrUser && typeof roleOrUser === "object") {
    if (roleOrUser.isTenantAdmin) return ROLE_LABELS.TENANT_ADMIN;
    return getRoleLabel(roleOrUser.role);
  }
  const role = String(roleOrUser || "");
  if (ROLE_LABELS[role]) return ROLE_LABELS[role];
  const lower = role.toLowerCase();
  if (ROLE_LABELS[lower]) return ROLE_LABELS[lower];
  return role || "—";
}
