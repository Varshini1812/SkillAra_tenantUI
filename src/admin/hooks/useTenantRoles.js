import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createRole as apiCreateRole,
  deleteRole as apiDeleteRole,
  fetchRolePermissionModules,
  fetchRoles,
  updateRole as apiUpdateRole,
} from "../api/admin.js";
import { countTenantPermissions } from "../data/tenantRolesPermissions.js";

export function useTenantRoles() {
  const [roles, setRoles] = useState([]);
  const [permissionModules, setPermissionModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [roleList, moduleData] = await Promise.all([
        fetchRoles(),
        fetchRolePermissionModules(),
      ]);
      setRoles(Array.isArray(roleList) ? roleList : []);
      setPermissionModules(Array.isArray(moduleData) ? moduleData : []);
      setError(null);
    } catch (err) {
      setError(err);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const allRoles = useMemo(() => roles, [roles]);

  const activeRoles = useMemo(
    () => allRoles.filter((r) => r.status === "active"),
    [allRoles]
  );

  const customRoles = useMemo(
    () => allRoles.filter((r) => r.roleType === "custom"),
    [allRoles]
  );

  const refreshUserCounts = useCallback(
    (users) => {
      const counts = {};
      users.forEach((u) => {
        const rid = u.roleId;
        if (rid) counts[rid] = (counts[rid] || 0) + 1;
      });
      return allRoles.map((r) => ({ ...r, usersAssigned: counts[r.id] || r.usersAssigned || 0 }));
    },
    [allRoles]
  );

  const createRole = useCallback(
    async (payload) => {
      const role = await apiCreateRole({
        name: payload.name,
        description: payload.description,
        status: payload.status || "active",
        permissions: payload.permissions || {},
      });
      await reload();
      return role;
    },
    [reload]
  );

  const updateRole = useCallback(
    async (id, payload) => {
      await apiUpdateRole(id, {
        name: payload.name,
        description: payload.description,
        status: payload.status,
        permissions: payload.permissions,
      });
      await reload();
    },
    [reload]
  );

  const deleteRole = useCallback(
    async (id) => {
      await apiDeleteRole(id);
      await reload();
    },
    [reload]
  );

  const toggleRoleStatus = useCallback(
    async (id) => {
      const role = allRoles.find((r) => r.id === id);
      if (!role) return;
      const nextStatus = role.status === "active" ? "inactive" : "active";
      await apiUpdateRole(id, { status: nextStatus });
      await reload();
    },
    [allRoles, reload]
  );

  const assignableRoles = useMemo(
    () => activeRoles.filter((r) => !r.isOwnerRole && r.slug !== "organization-owner"),
    [activeRoles]
  );

  return {
    allRoles,
    activeRoles,
    assignableRoles,
    customRoles,
    permissionModules,
    loading,
    error,
    reload,
    createRole,
    updateRole,
    deleteRole,
    toggleRoleStatus,
    refreshUserCounts,
    countPermissions: countTenantPermissions,
  };
}
