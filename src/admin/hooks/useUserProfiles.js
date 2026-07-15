import { useCallback, useState } from "react";
import {
  TENANT_AUDIT_LOG_KEY,
  TENANT_USER_PROFILES_KEY,
  mapApiRoleToTenantRoleId,
} from "../data/tenantRolesPermissions.js";
import { loadFromTenantStorage, saveToTenantStorage } from "../utils/tenantStorage.js";

function splitName(name = "") {
  const parts = name.trim().split(/\s+/);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ") || "",
  };
}

export function enrichUser(apiUser, profiles = {}) {
  const profile = profiles[apiUser.id] || profiles[apiUser.email] || {};
  const { firstName, lastName } = profile.firstName
    ? { firstName: profile.firstName, lastName: profile.lastName || "" }
    : splitName(apiUser.name);

  let resolvedStatus = apiUser.status || profile.status || "ACTIVE";
  if (resolvedStatus === "invited" || resolvedStatus === "INVITED") {
    resolvedStatus = "PENDING";
  }

  return {
    ...apiUser,
    firstName,
    lastName,
    phone: apiUser.phone || profile.phone || "",
    employeeId: apiUser.employeeId || profile.employeeId || "",
    departmentId: apiUser.departmentId || "",
    designationId: apiUser.designationId || "",
    department: apiUser.department || "",
    designation: apiUser.designation || "",
    roleId: apiUser.roleId || profile.roleId || mapApiRoleToTenantRoleId(apiUser.role),
    profilePhoto: profile.profilePhoto || "",
    status: resolvedStatus,
    invitationStatus: profile.invitationStatus || apiUser.invitationStatus || "ACCEPTED",
    invitedAt: profile.invitedAt || null,
    auditNote: profile.auditNote || "",
  };
}

export function useUserProfiles() {
  const [profiles, setProfiles] = useState(() =>
    loadFromTenantStorage(TENANT_USER_PROFILES_KEY, {})
  );

  const persist = useCallback((next) => {
    setProfiles(next);
    saveToTenantStorage(TENANT_USER_PROFILES_KEY, next);
  }, []);

  const saveProfile = useCallback(
    (userId, data) => {
      const next = { ...profiles, [userId]: { ...profiles[userId], ...data } };
      persist(next);
      return next[userId];
    },
    [profiles, persist]
  );

  const removeProfile = useCallback(
    (userId) => {
      const next = { ...profiles };
      delete next[userId];
      persist(next);
    },
    [profiles, persist]
  );

  return { profiles, saveProfile, removeProfile, enrichUser };
}

export function useAuditLog() {
  const append = useCallback((entry) => {
    const logs = loadFromTenantStorage(TENANT_AUDIT_LOG_KEY, []);
    const next = [
      {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        ...entry,
      },
      ...logs,
    ].slice(0, 200);
    saveToTenantStorage(TENANT_AUDIT_LOG_KEY, next);
    return next;
  }, []);

  const getForUser = useCallback((userId) => {
    const logs = loadFromTenantStorage(TENANT_AUDIT_LOG_KEY, []);
    return logs.filter((l) => l.userId === userId);
  }, []);

  return { append, getForUser };
}
