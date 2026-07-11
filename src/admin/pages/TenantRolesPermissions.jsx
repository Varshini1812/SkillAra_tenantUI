import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTenantRoles } from "../hooks/useTenantRoles.js";
import { enrichUser, useAuditLog, useUserProfiles } from "../hooks/useUserProfiles.js";
import { validateRoleName } from "../utils/userValidation.js";
import PermissionMatrix from "../components/roles/PermissionMatrix.jsx";
import Drawer from "../components/ui/Drawer.jsx";
import ConfirmDialog from "../components/ui/ConfirmDialog.jsx";
import Breadcrumb from "../components/ui/Breadcrumb.jsx";
import FilterBar from "../components/ui/FilterBar.jsx";
import Pagination from "../components/ui/Pagination.jsx";
import { EmptyState, OrgStatusBadge, RoleTypeBadge, TableSkeleton } from "../components/ui/OrgBadges.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import { usePagination } from "../hooks/usePagination.js";
import { fetchUsers } from "../api/admin.js";

const inputClass = "admin-input";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function TenantRolesPermissions() {
  const { toast } = useToast();
  const { append: audit } = useAuditLog();
  const { profiles } = useUserProfiles();
  const {
    allRoles: baseRoles,
    permissionModules,
    loading: rolesLoading,
    createRole,
    updateRole,
    deleteRole,
    toggleRoleStatus,
    refreshUserCounts,
    countPermissions,
  } = useTenantRoles();

  const [searchParams, setSearchParams] = useSearchParams();
  const panel = searchParams.get("panel");
  const roleId = searchParams.get("id");

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [permSearch, setPermSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [cloneSource, setCloneSource] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    roleType: "custom",
    status: "active",
    permissions: {},
  });

  useEffect(() => {
    fetchUsers()
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.users || [];
        setUsers(list.map((u) => enrichUser(u, profiles)));
      })
      .catch(() => setUsers([]))
      .finally(() => setUsersLoading(false));
  }, [profiles]);

  const allRoles = useMemo(() => refreshUserCounts(users), [baseRoles, users, refreshUserCounts]);

  const filtered = useMemo(() => {
    let list = [...allRoles];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") list = list.filter((r) => r.status === statusFilter);
    if (typeFilter !== "all") list = list.filter((r) => r.roleType === typeFilter);

    list.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "permissions") return countPermissions(b.permissions) - countPermissions(a.permissions);
      if (sortBy === "users") return (b.usersAssigned || 0) - (a.usersAssigned || 0);
      return 0;
    });
    return list;
  }, [allRoles, search, statusFilter, typeFilter, sortBy, countPermissions]);

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    pagedItems: paged,
  } = usePagination(filtered, {
    resetDeps: [search, statusFilter, typeFilter, sortBy],
  });

  const hasActiveFilters =
    Boolean(search.trim()) || statusFilter !== "all" || typeFilter !== "all" || sortBy !== "name";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
    setSortBy("name");
  };

  const activeRole = allRoles.find((r) => r.id === roleId);

  const openPanel = (mode, id = null) => {
    if (mode === "create") {
      setForm({ name: "", description: "", roleType: "custom", status: "active", permissions: {} });
      setSearchParams({ panel: "create" });
    } else if (mode === "edit" && id) {
      const role = allRoles.find((r) => r.id === id);
      if (role) {
        setForm({
          name: role.name,
          description: role.description,
          roleType: role.roleType,
          status: role.status,
          permissions: { ...role.permissions },
        });
      }
      setSearchParams({ panel: "edit", id });
    } else if (mode === "view" && id) {
      setSearchParams({ panel: "view", id });
    }
  };

  const closePanel = () => {
    setCloneSource(null);
    setSearchParams({});
  };

  const saveRole = async () => {
    const err = validateRoleName(form.name, allRoles, panel === "edit" ? roleId : null);
    if (err) {
      toast(err, "error");
      return;
    }
    if (form.description.length > 250) {
      toast("Description max 250 characters", "error");
      return;
    }

    try {
      if (panel === "create" || cloneSource) {
        const role = await createRole({
          name: form.name,
          description: form.description,
          status: form.status,
          permissions: form.permissions,
          createdBy: "Organization Admin",
        });
        audit({ action: cloneSource ? "role.cloned" : "role.created", roleId: role.id, roleName: role.name });
        toast(cloneSource ? "Role cloned" : "Role created", "success");
        setCloneSource(null);
        closePanel();
        return;
      }

      if (panel === "edit" && roleId) {
        const role = allRoles.find((r) => r.id === roleId);
        if (role?.roleType === "system" && role?.protected) {
          await updateRole(roleId, { permissions: form.permissions });
        } else {
          await updateRole(roleId, form);
        }
        audit({ action: "role.updated", roleId, roleName: form.name });
        toast("Role updated", "success");
        closePanel();
      }
    } catch {
      toast("Could not save role. Please try again.", "error");
    }
  };

  const handleToggleStatus = async (role) => {
    if (role.protected && role.roleType === "system") {
      toast("System roles cannot be disabled", "info");
      return;
    }
    try {
      await toggleRoleStatus(role.id);
      audit({ action: role.status === "active" ? "role.disabled" : "role.enabled", roleId: role.id, roleName: role.name });
      toast(`Role ${role.status === "active" ? "disabled" : "enabled"}`, "success");
    } catch {
      toast("Could not update role status", "error");
    }
  };

  const confirmDelete = async () => {
    const role = deleteTarget;
    if (!role || role.roleType === "system") return;
    if (role.usersAssigned > 0) {
      toast("Cannot delete role with assigned users", "error");
      setDeleteTarget(null);
      return;
    }
    try {
      await deleteRole(role.id);
      audit({ action: "role.deleted", roleId: role.id, roleName: role.name });
      toast("Role deleted", "success");
    } catch {
      toast("Could not delete role", "error");
    }
    setDeleteTarget(null);
  };

  const assignedUsers = useMemo(
    () => users.filter((u) => u.roleId === roleId),
    [users, roleId]
  );

  return (
    <div>
      <Breadcrumb items={[{ label: "Organization", to: "/admin" }, { label: "Roles & Permissions" }]} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Roles & Permissions</h1>
          <p className="mt-1 text-slate-500">Manage organization roles and permission assignments</p>
        </div>
        <button
          type="button"
          onClick={() => openPanel("create")}
          className="admin-btn-primary"
        >
          + Create Role
        </button>
      </div>

      <FilterBar onClear={clearFilters} showClear={hasActiveFilters}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search roles..."
          className="admin-input admin-filter-search"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="admin-input admin-filter-select text-slate-700"
          aria-label="Filter by status"
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="admin-input admin-filter-select text-slate-700"
          aria-label="Filter by type"
        >
          <option value="all">All types</option>
          <option value="system">System</option>
          <option value="custom">Custom</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="admin-input admin-filter-select text-slate-700"
          aria-label="Sort roles"
        >
          <option value="name">Sort: Name</option>
          <option value="permissions">Sort: Permissions</option>
          <option value="users">Sort: Users</option>
        </select>
      </FilterBar>

      <div className="admin-table mt-4">
        {rolesLoading || usersLoading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : paged.length === 0 ? (
          <EmptyState title="No roles found" description="Try adjusting your search or filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="px-5 py-3 font-medium">Role Name</th>
                  <th className="px-5 py-3 font-medium">Description</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Users</th>
                  <th className="px-5 py-3 font-medium">Permissions</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((role) => (
                  <tr key={role.id} className="admin-table-row border-b border-slate-100 last:border-0">
                    <td className="px-5 py-4 font-medium text-slate-900">{role.name}</td>
                    <td className="max-w-[200px] truncate px-5 py-4 text-slate-500">{role.description}</td>
                    <td className="px-5 py-4"><RoleTypeBadge type={role.roleType} /></td>
                    <td className="px-5 py-4 text-slate-500">{role.usersAssigned || 0}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-600">
                        {countPermissions(role.permissions)}
                      </span>
                    </td>
                    <td className="px-5 py-4"><OrgStatusBadge status={role.status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        <ActionBtn onClick={() => openPanel("view", role.id)}>View</ActionBtn>
                        <ActionBtn onClick={() => openPanel("edit", role.id)}>Edit</ActionBtn>
                        <ActionBtn onClick={() => {
                          setCloneSource(role);
                          setForm({ name: `${role.name} Copy`, description: role.description, roleType: "custom", status: "active", permissions: { ...role.permissions } });
                          setSearchParams({ panel: "create" });
                        }}>Clone</ActionBtn>
                        <ActionBtn onClick={() => handleToggleStatus(role)}>{role.status === "active" ? "Disable" : "Enable"}</ActionBtn>
                        {role.roleType === "custom" && (
                          <ActionBtn danger onClick={() => setDeleteTarget(role)}>Delete</ActionBtn>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemLabel="role"
        />
      </div>

      <Drawer
        open={Boolean(panel)}
        onClose={closePanel}
        title={panel === "create" ? (cloneSource ? "Clone Role" : "Create Role") : panel === "edit" ? "Edit Role" : "Role Details"}
        subtitle={panel === "view" ? activeRole?.name : "Assign module permissions for this role"}
        footer={
          panel !== "view" ? (
            <>
              <button type="button" onClick={closePanel} className="admin-btn-secondary">Cancel</button>
              <button type="button" onClick={saveRole} className="admin-btn-primary">
                {panel === "create" ? "Create Role" : "Save Changes"}
              </button>
            </>
          ) : null
        }
      >
        {panel === "view" && activeRole ? (
          <div className="space-y-6">
            <div className="admin-card space-y-3 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-semibold text-slate-900">{activeRole.name}</h3>
                <RoleTypeBadge type={activeRole.roleType} />
                <OrgStatusBadge status={activeRole.status} />
              </div>
              <p className="text-sm text-slate-500">{activeRole.description}</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-500">Users assigned</span><p className="text-slate-800">{activeRole.usersAssigned || 0}</p></div>
                <div><span className="text-slate-500">Permissions</span><p className="text-slate-800">{countPermissions(activeRole.permissions)}</p></div>
                <div><span className="text-slate-500">Created</span><p className="text-slate-800">{formatDate(activeRole.createdAt)}</p></div>
                <div><span className="text-slate-500">Updated</span><p className="text-slate-800">{formatDate(activeRole.updatedAt)}</p></div>
              </div>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-medium text-slate-700">Assigned users ({assignedUsers.length})</h4>
              {assignedUsers.length === 0 ? (
                <p className="text-sm text-slate-500">No users assigned to this role</p>
              ) : (
                <ul className="space-y-2">
                  {assignedUsers.map((u) => (
                    <li key={u.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                      <div>
                        <p className="text-slate-800">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                      <OrgStatusBadge status={u.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <PermissionMatrix permissions={activeRole.permissions} onChange={() => {}} readOnly modules={permissionModules} />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-slate-500">Role name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={panel === "edit" && activeRole?.roleType === "system"} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-500">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value.slice(0, 250) })} rows={3} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm text-slate-500">Role type</label>
                <input value={form.roleType === "system" ? "System" : "Custom"} disabled className={`${inputClass} text-slate-500`} />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-500">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <input value={permSearch} onChange={(e) => setPermSearch(e.target.value)} placeholder="Search permissions..." className={inputClass} />
            <PermissionMatrix
              permissions={form.permissions}
              onChange={(permissions) => setForm({ ...form, permissions })}
              search={permSearch}
              modules={permissionModules}
              readOnly={false}
            />
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete role?"
        message={<>Permanently delete <strong className="text-slate-800">{deleteTarget?.name}</strong>? This cannot be undone.</>}
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function ActionBtn({ children, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={danger ? "admin-btn-ghost-danger" : "admin-btn-ghost"}
    >
      {children}
    </button>
  );
}
