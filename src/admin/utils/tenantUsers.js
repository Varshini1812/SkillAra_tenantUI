import { debugTenantAuth } from "./debugTenantAuth.js";

function normalizeApiRole(role) {
  return String(role || "")
    .trim()
    .toUpperCase()
    .replace(/-/g, "_");
}

/** True when the embedded/API role represents Organization Admin (assignable only by owner). */
export function isOrgAdminRole(role) {
  if (!role) return false;
  const slug = String(role.slug || "").toLowerCase();
  if (slug === "org-admin" || slug === "org_admin") return true;
  const apiRole = normalizeApiRole(role.legacyApiRole || role.apiRole || role.role);
  if (apiRole === "ORG_ADMIN") return true;
  const name = String(role.name || "").trim().toLowerCase();
  return name === "organization admin";
}

/**
 * Organization owner (tenant admin) — managed via super admin org setup, not employee listings.
 * Accepts session JWT claims when /me user payload is incomplete.
 */
export function isOrganizationOwner(user, sessionClaims = null) {
  if (!user && !sessionClaims) return false;

  if (user?.isTenantAdmin === true) return true;
  if (user?.isOwnerRole === true) return true;
  if (String(user?.roleSlug || "").toLowerCase() === "organization-owner") return true;
  if (String(user?.roleName || "").trim().toLowerCase() === "organization owner") return true;

  const roleValues = [user?.role, sessionClaims?.role].filter(Boolean);
  if (roleValues.some((r) => normalizeApiRole(r) === "TENANT_ADMIN")) return true;

  return false;
}

export function filterManageableUsers(users = []) {
  return users.filter((u) => !isOrganizationOwner(u));
}

export const OWNER_MANAGED_MESSAGE =
  "Organization owner accounts are managed in the platform admin panel when creating or editing the organization.";

/** Log owner resolution context — call from user create/edit flows while debugging. */
export function logOwnerAuthContext(action, { user, sessionClaims, selectedRole, isOwner, ...extra }) {
  debugTenantAuth(action, {
    isOwner,
    user: user
      ? {
          id: user.id,
          email: user.email,
          role: user.role,
          roleId: user.roleId,
          roleSlug: user.roleSlug,
          roleName: user.roleName,
          isTenantAdmin: user.isTenantAdmin,
          isOwnerRole: user.isOwnerRole,
        }
      : null,
    sessionClaims: sessionClaims
      ? { role: sessionClaims.role, sub: sessionClaims.sub, tenant_id: sessionClaims.tenant_id }
      : null,
    selectedRole: selectedRole
      ? {
          id: selectedRole.id,
          name: selectedRole.name,
          slug: selectedRole.slug,
          legacyApiRole: selectedRole.legacyApiRole,
          isOrgAdmin: isOrgAdminRole(selectedRole),
        }
      : null,
    ...extra,
  });
}
