import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTenantRoles } from "../hooks/useTenantRoles.js";
import { enrichUser, useAuditLog, useUserProfiles } from "../hooks/useUserProfiles.js";
import { validateRoleForm, USER_LIMITS } from "../utils/userValidation.js";
import PermissionMatrix from "../components/roles/PermissionMatrix.jsx";
import Drawer from "../components/ui/Drawer.jsx";
import ConfirmDialog from "../components/ui/ConfirmDialog.jsx";
import Breadcrumb from "../components/ui/Breadcrumb.jsx";
import FilterBar from "../components/ui/FilterBar.jsx";
import Pagination from "../components/ui/Pagination.jsx";
import { OrgStatusBadge, RoleTypeBadge } from "../components/ui/OrgBadges.jsx";
import { Button, EmptyState, PageHeader, TableSkeleton } from "../components/ui/primitives.jsx";
import { TableAction, TableActions } from "../components/ui/TableActions.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import { usePagination } from "../hooks/usePagination.js";
import { fetchUsers } from "../api/admin.js";
import Icon from "../components/ui/Icon.jsx";
import { BTN_PRIMARY, BTN_SECONDARY, CARD, TABLE_SHELL } from "../components/ui/styles.js";

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
  const [formErrors, setFormErrors] = useState({});

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
    setFormErrors({});
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
    setFormErrors({});
    setSearchParams({});
  };

  const setFormField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const saveRole = async () => {
    const errors = validateRoleForm(form, allRoles, panel === "edit" ? roleId : null);
    setFormErrors(errors);
    if (Object.keys(errors).length) {
      toast("Please fix the highlighted fields", "error");
      return;
    }

    try {
      if (panel === "create" || cloneSource) {
        const role = await createRole({
          name: form.name.trim(),
          description: form.description.trim(),
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
          await updateRole(roleId, {
            ...form,
            name: form.name.trim(),
            description: form.description.trim(),
          });
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
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[{ label: "Organization", to: "/admin" }, { label: "Roles and permissions" }]}
          />
        }
        title="Roles and permissions"
        description="What each role in your organization can reach. A role is its permission map — the menu and the API both follow it."
        actions={
          <Button onClick={() => openPanel("create")}>
            <Icon name="plus" size={15} />
            Create role
          </Button>
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchLabel="Search roles"
        searchPlaceholder="Search roles by name or description"
        filters={[
          {
            id: "status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            defaultValue: "all",
            options: [
              { value: "all", label: "All statuses" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ],
          },
          {
            id: "type",
            label: "Role type",
            value: typeFilter,
            onChange: setTypeFilter,
            defaultValue: "all",
            options: [
              { value: "all", label: "All types" },
              { value: "system", label: "System" },
              { value: "custom", label: "Custom" },
            ],
          },
        ]}
        sort={{
          label: "Sort roles",
          value: sortBy,
          onChange: setSortBy,
          options: [
            { value: "name", label: "Sort: name" },
            { value: "permissions", label: "Sort: permissions" },
            { value: "users", label: "Sort: users" },
          ],
        }}
      />

      <div className={`${TABLE_SHELL} mt-4`}>
        {rolesLoading || usersLoading ? (
          <TableSkeleton rows={6} columns={7} />
        ) : paged.length === 0 ? (
          <EmptyState title="No roles found" description="Try adjusting your search or filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="sticky top-0 bg-surface">
                <tr className="border-b border-line text-ink-subtle">
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
                  <tr key={role.id} className="border-b border-line last:border-0">
                    <td className="px-5 py-4 font-medium text-ink">{role.name}</td>
                    <td className="max-w-[200px] truncate px-5 py-4 text-ink-subtle">{role.description}</td>
                    <td className="px-5 py-4"><RoleTypeBadge type={role.roleType} /></td>
                    <td className="px-5 py-4 text-ink-subtle">{role.usersAssigned || 0}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-brand-muted px-2 py-0.5 text-xs text-brand">
                        {countPermissions(role.permissions)}
                      </span>
                    </td>
                    <td className="px-5 py-4"><OrgStatusBadge status={role.status} /></td>
                    <td className="px-5 py-4">
                      <TableActions>
                        <TableAction variant="view" onClick={() => openPanel("view", role.id)} title="View"><Icon name="view" size={14} /></TableAction>
                        <TableAction variant="edit" onClick={() => openPanel("edit", role.id)} title="Edit"><Icon name="edit" size={14} /></TableAction>
                        <TableAction variant="muted" onClick={() => {
                          setCloneSource(role);
                          setForm({ name: `${role.name} Copy`, description: role.description, roleType: "custom", status: "active", permissions: { ...role.permissions } });
                          setSearchParams({ panel: "create" });
                        }} title="Clone"><Icon name="copy" size={14} /></TableAction>
                        {role.status === "active" ? (
                          <TableAction variant="warn" onClick={() => handleToggleStatus(role)} title="Disable"><Icon name="toggleOff" size={14} /></TableAction>
                        ) : (
                          <TableAction variant="success" onClick={() => handleToggleStatus(role)} title="Enable"><Icon name="toggleOn" size={14} /></TableAction>
                        )}
                        {role.roleType === "custom" && (
                          <TableAction variant="warn" onClick={() => setDeleteTarget(role)} title="Delete"><Icon name="trash" size={14} /></TableAction>
                        )}
                      </TableActions>
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
              <button type="button" onClick={closePanel} className={`${BTN_SECONDARY}`}>Cancel</button>
              <button type="button" onClick={saveRole} className={`${BTN_PRIMARY}`}>
                {panel === "create" ? "Create Role" : "Save Changes"}
              </button>
            </>
          ) : null
        }
      >
        {panel === "view" && activeRole ? (
          <div className="space-y-6">
            <div className={`${CARD} space-y-3 p-4`}>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-semibold text-ink">{activeRole.name}</h3>
                <RoleTypeBadge type={activeRole.roleType} />
                <OrgStatusBadge status={activeRole.status} />
              </div>
              <p className="text-sm text-ink-subtle">{activeRole.description}</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-ink-subtle">Users assigned</span><p className="text-ink">{activeRole.usersAssigned || 0}</p></div>
                <div><span className="text-ink-subtle">Permissions</span><p className="text-ink">{countPermissions(activeRole.permissions)}</p></div>
                <div><span className="text-ink-subtle">Created</span><p className="text-ink">{formatDate(activeRole.createdAt)}</p></div>
                <div><span className="text-ink-subtle">Updated</span><p className="text-ink">{formatDate(activeRole.updatedAt)}</p></div>
              </div>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-medium text-ink-muted">Assigned users ({assignedUsers.length})</h4>
              {assignedUsers.length === 0 ? (
                <p className="text-sm text-ink-subtle">No users assigned to this role</p>
              ) : (
                <ul className="space-y-2">
                  {assignedUsers.map((u) => (
                    <li key={u.id} className="flex items-center justify-between rounded-control border border-line bg-surface px-3 py-2 text-sm">
                      <div>
                        <p className="text-ink">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-ink-subtle">{u.email}</p>
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
              <label className="mb-1 block text-sm text-ink-subtle">Role name *</label>
              <input
                value={form.name}
                onChange={(e) =>
                  setFormField("name", e.target.value.slice(0, USER_LIMITS.roleName.max))
                }
                disabled={panel === "edit" && activeRole?.roleType === "system"}
                className={inputClass}
                aria-invalid={Boolean(formErrors.name)}
              />
              <p className="mt-1 text-xs text-ink-subtle">
                {USER_LIMITS.roleName.min}–{USER_LIMITS.roleName.max} characters
              </p>
              {formErrors.name && (
                <p className="mt-1 text-xs text-danger" role="alert">
                  {formErrors.name}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink-subtle">Description</label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setFormField(
                    "description",
                    e.target.value.slice(0, USER_LIMITS.roleDescription.max)
                  )
                }
                rows={3}
                className={inputClass}
                aria-invalid={Boolean(formErrors.description)}
              />
              <p className="mt-1 text-xs text-ink-subtle">
                Optional · max {USER_LIMITS.roleDescription.max} characters
              </p>
              {formErrors.description && (
                <p className="mt-1 text-xs text-danger" role="alert">
                  {formErrors.description}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm text-ink-subtle">Role type</label>
                <input value={form.roleType === "system" ? "System" : "Custom"} disabled className={`${inputClass} text-ink-subtle`} />
              </div>
              <div>
                <label className="mb-1 block text-sm text-ink-subtle">Status</label>
                <select value={form.status} onChange={(e) => setFormField("status", e.target.value)} className={inputClass}>
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
        message={<>Permanently delete <strong className="text-ink">{deleteTarget?.name}</strong>? This cannot be undone.</>}
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}


