const PREFIX = "[SkillAra:tenant-auth]";

/** Dev-only structured logs for organization-owner / org-admin assignment debugging. */
export function debugTenantAuth(label, payload = {}) {
  if (!import.meta.env.DEV) return;
  console.groupCollapsed(`${PREFIX} ${label}`);
  console.log(payload);
  console.groupEnd();
}
