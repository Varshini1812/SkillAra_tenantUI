import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { createUser, deleteUser, fetchUsers, updateUser, updateUserStatus as apiUpdateUserStatus, inviteUser, resendInvite } from "../api/admin.js";
import { getErrorMessage } from "../api/client.js";
import { getApiErrorKey } from "../utils/errorMessages.js";
import UserFormDrawer, { EMPTY_USER_FORM } from "../components/users/UserFormDrawer.jsx";
import UserDetailDrawer from "../components/users/UserDetailDrawer.jsx";
import Drawer from "../components/ui/Drawer.jsx";
import Breadcrumb from "../components/ui/Breadcrumb.jsx";
import FilterBar from "../components/ui/FilterBar.jsx";
import ImportMenu from "../components/ui/ImportMenu.jsx";
import Pagination from "../components/ui/Pagination.jsx";
import { TableAction, TableActions, ViewIcon, EditIcon, ToggleOffIcon, ToggleOnIcon, SendIcon, DeleteIcon } from "../components/ui/TableActions.jsx";
import ConfirmDialog from "../components/ui/ConfirmDialog.jsx";
import { EmptyState, OrgStatusBadge, TableSkeleton } from "../components/ui/OrgBadges.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import { usePagination } from "../hooks/usePagination.js";
import { useTenantRoles } from "../hooks/useTenantRoles.js";
import { useTenantMasterData } from "../hooks/useTenantMasterData.js";
import { enrichUser, useAuditLog, useUserProfiles } from "../hooks/useUserProfiles.js";
import { validateUserForm } from "../utils/userValidation.js";
import { filterManageableUsers, isOrganizationOwner, isOrgAdminRole, logOwnerAuthContext } from "../utils/tenantUsers.js";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";
import { downloadUserImportSample } from "../utils/userImportSample.js";
import { findMasterItemByName } from "../utils/masterDataHelpers.js";

function parseCsvRow(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function parseUserImportRows(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = parseCsvRow(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, ""));
  const rows = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cells = parseCsvRow(lines[i]);
    const record = {};
    headers.forEach((header, index) => {
      record[header] = cells[index] || "";
    });

    let firstName = record.firstname || "";
    let lastName = record.lastname || "";
    if (!firstName && !lastName && record.name) {
      const parts = record.name.trim().split(/\s+/);
      firstName = parts[0] || "";
      lastName = parts.slice(1).join(" ");
    }

    const email = (record.email || "").trim().toLowerCase();
    if (!email) continue;

    rows.push({
      firstName,
      lastName,
      email,
      phone: record.phone || "",
      department: record.department || "",
      designation: record.designation || "",
      roleName: record.role || "",
      password: record.password || `Import@${crypto.randomUUID().slice(0, 8)}`,
    });
  }

  return rows;
}

export default function UserManagement() {
  const { toast } = useToast();
  const { user: currentUser, sessionClaims } = useAdminAuth();
  const isOwner = isOrganizationOwner(currentUser, sessionClaims);
  const { allRoles, assignableRoles } = useTenantRoles();
  const { activeItems: departments } = useTenantMasterData("department");
  const { activeItems: designations } = useTenantMasterData("designation");
  const { profiles, saveProfile, removeProfile } = useUserProfiles();
  const { append: audit, getForUser } = useAuditLog();

  const [searchParams, setSearchParams] = useSearchParams();
  const panel = searchParams.get("panel");
  const userId = searchParams.get("id");

  const [users, setUsers] = useState([]);
  const [usersForEmailCheck, setUsersForEmailCheck] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  const [form, setForm] = useState(EMPTY_USER_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [importing, setImporting] = useState(false);
  const importInputRef = useRef(null);

  const loadUsers = useCallback(() => {
    setLoading(true);
    setError("");
    fetchUsers({ limit: 100 })
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.users || [];
        const enriched = list.map((u) => enrichUser(u, profiles));
        setUsersForEmailCheck(enriched);
        setUsers(filterManageableUsers(enriched));
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [profiles]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const emailUniquenessUsers = useMemo(() => {
    const byEmail = new Map();
    for (const u of usersForEmailCheck) {
      const key = String(u.email || "").trim().toLowerCase();
      if (key) byEmail.set(key, u);
    }
    if (currentUser?.email) {
      const key = String(currentUser.email).trim().toLowerCase();
      if (key && !byEmail.has(key)) {
        byEmail.set(key, {
          id: currentUser.id || currentUser._id,
          email: currentUser.email,
        });
      }
    }
    return [...byEmail.values()];
  }, [usersForEmailCheck, currentUser]);

  useEffect(() => {
    logOwnerAuthContext("UserManagement session", {
      user: currentUser,
      sessionClaims,
      isOwner,
    });
  }, [currentUser, sessionClaims, isOwner]);

  useEffect(() => {
    if (panel === "create") {
      setForm(EMPTY_USER_FORM);
      setFormErrors({});
    }
  }, [panel]);

  const filtered = useMemo(() => {
    let list = [...users];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (u) =>
          `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.phone || "").includes(q) ||
          (u.department || "").toLowerCase().includes(q) ||
          (u.designation || "").toLowerCase().includes(q)
      );
    }
    if (roleFilter !== "all") list = list.filter((u) => u.roleId === roleFilter);
    if (statusFilter !== "all") list = list.filter((u) => u.status === statusFilter);
    if (deptFilter !== "all") list = list.filter((u) => u.departmentId === deptFilter);

    list.sort((a, b) => {
      if (sortBy === "name") return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      if (sortBy === "created") return new Date(b.created_on || 0) - new Date(a.created_on || 0);
      if (sortBy === "role") {
        const ra = allRoles.find((r) => r.id === a.roleId)?.name || "";
        const rb = allRoles.find((r) => r.id === b.roleId)?.name || "";
        return ra.localeCompare(rb);
      }
      if (sortBy === "status") return (a.status || "").localeCompare(b.status || "");
      return 0;
    });
    return list;
  }, [users, search, roleFilter, statusFilter, deptFilter, sortBy, allRoles]);

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    pagedItems: paged,
  } = usePagination(filtered, {
    resetDeps: [search, roleFilter, statusFilter, deptFilter, sortBy],
  });

  const hasActiveFilters =
    Boolean(search.trim()) ||
    roleFilter !== "all" ||
    statusFilter !== "all" ||
    deptFilter !== "all" ||
    sortBy !== "name";

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("all");
    setStatusFilter("all");
    setDeptFilter("all");
    setSortBy("name");
  };

  const activeUser = users.find((u) => u.id === userId);
  const activeRole = allRoles.find((r) => r.id === activeUser?.roleId);

  const openCreate = () => {
    setForm(EMPTY_USER_FORM);
    setFormErrors({});
    setSearchParams({ panel: "create" });
  };

  const openEdit = (user) => {
    if (isOrganizationOwner(user)) return;
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      employeeId: user.employeeId,
      departmentId: user.departmentId || "",
      designationId: user.designationId || "",
      roleId: user.roleId,
      status: user.status,
      profilePhoto: user.profilePhoto,
      password: "",
      sendInvite: false,
      generateTempPassword: false,
    });
    setFormErrors({});
    setSearchParams({ panel: "edit", id: user.id });
  };

  const openView = (user) => {
    if (isOrganizationOwner(user)) return;
    setSearchParams({ panel: "view", id: user.id });
  };
  const closePanel = () => setSearchParams({});

  const handleCreate = async (e) => {
    e.preventDefault();
    const errors = validateUserForm(form, emailUniquenessUsers);
    setFormErrors(errors);
    if (Object.keys(errors).length) {
      toast("Please fix the highlighted fields", "error");
      return;
    }

    const role = allRoles.find((r) => r.id === form.roleId);
    if (role?.status === "inactive") {
      toast("Cannot assign an inactive role", "error");
      return;
    }

    if (isOrgAdminRole(role) && !isOwner) {
      logOwnerAuthContext("Create user blocked (client)", {
        user: currentUser,
        sessionClaims,
        selectedRole: role,
        isOwner,
      });
      toast("Only the Organization Owner can assign the Organization Admin role", "error");
      return;
    }

    logOwnerAuthContext("Create user submit", {
      user: currentUser,
      sessionClaims,
      selectedRole: role,
      isOwner,
    });

    setSubmitting(true);
    try {
      if (!form.roleId) {
        toast("Select a role", "error");
        return;
      }

      let createdUser;
      let emailSent = false;
      let emailResult = null;

      if (form.sendInvite) {
        const payload = {
          name: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email.trim().toLowerCase(),
          roleId: form.roleId,
          phone: form.phone,
          employeeId: form.employeeId,
          departmentId: form.departmentId || null,
          designationId: form.designationId || null,
          profilePhoto: form.profilePhoto,
        };
        const data = await inviteUser(payload);
        createdUser = data?.user || data;
        emailSent = Boolean(data?.emailSent);
        emailResult = data?.emailResult;
      } else {
        const payload = {
          name: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          roleId: form.roleId,
          phone: form.phone,
          employeeId: form.employeeId,
          departmentId: form.departmentId || null,
          designationId: form.designationId || null,
          profilePhoto: form.profilePhoto,
        };
        const data = await createUser(payload);
        createdUser = data?.user || data;
      }

      saveProfile(createdUser.id, {
        firstName: form.firstName,
        lastName: form.lastName,
        roleId: form.roleId,
        status: form.sendInvite ? "PENDING" : form.status,
        invitedAt: form.sendInvite ? new Date().toISOString() : null,
      });

      audit({
        action: form.sendInvite ? "user.invited" : "user.created",
        userId: createdUser.id,
        email: form.email,
        roleId: form.roleId,
      });

      if (form.sendInvite) {
        if (emailSent) {
          toast(`Invitation sent to ${form.email}`, "success");
        } else {
          if (emailResult?.mode === "log") {
            toast(`Invitation created (email logged to console)`, "success");
          } else {
            toast(`Invitation created, but failed to send email to ${form.email}`, "info");
          }
        }
      } else {
        toast(`${form.firstName} created successfully`, "success");
      }
      closePanel();
      loadUsers();
    } catch (err) {
      logOwnerAuthContext("Create user API error", {
        user: currentUser,
        sessionClaims,
        selectedRole: role,
        isOwner,
        error: getErrorMessage(err),
      });
      if (getApiErrorKey(err) === "USER_EMAIL_EXISTS") {
        setFormErrors((prev) => ({
          ...prev,
          email: "Email already exists in this organization",
        }));
      }
      toast(getErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const errors = validateUserForm(form, emailUniquenessUsers, userId);
    setFormErrors(errors);
    if (Object.keys(errors).length) {
      toast("Please fix the highlighted fields", "error");
      return;
    }

    const user = users.find((u) => u.id === userId);
    if (!user) return;

    const role = allRoles.find((r) => r.id === form.roleId);
    if (role?.status === "inactive") {
      toast("Cannot assign an inactive role", "error");
      return;
    }

    if (isOrgAdminRole(role) && !isOwner) {
      logOwnerAuthContext("Edit user blocked (client)", {
        user: currentUser,
        sessionClaims,
        selectedRole: role,
        isOwner,
      });
      toast("Only the Organization Owner can assign the Organization Admin role", "error");
      return;
    }

    setSubmitting(true);
    try {
      await updateUser(userId, {
        name: `${form.firstName} ${form.lastName}`.trim(),
        roleId: form.roleId,
        phone: form.phone,
        employeeId: form.employeeId,
        departmentId: form.departmentId || null,
        designationId: form.designationId || null,
        profilePhoto: form.profilePhoto,
      });

      saveProfile(userId, {
        firstName: form.firstName,
        lastName: form.lastName,
        roleId: form.roleId,
        status: form.status,
      });

      audit({ action: "user.updated", userId, email: user.email, roleId: form.roleId });
      toast("User updated successfully", "success");
      closePanel();
      loadUsers();
    } catch (err) {
      toast(getErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const updateUserStatus = async (user, status) => {
    if (user.id === currentUser?.id) {
      toast("You cannot deactivate yourself", "error");
      return;
    }
    try {
      await apiUpdateUserStatus(user.id, status);
      saveProfile(user.id, { status });
      audit({ action: status === "ACTIVE" ? "user.activated" : "user.deactivated", userId: user.id, email: user.email });
      toast(`User ${status === "ACTIVE" ? "activated" : "deactivated"}`, "success");
      loadUsers();
    } catch (err) {
      toast(getErrorMessage(err), "error");
    }
  };

  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUser(deleteTarget.id);
      removeProfile(deleteTarget.id);
      audit({ action: "user.deleted", userId: deleteTarget.id, email: deleteTarget.email });
      toast("User deleted successfully", "success");
      setDeleteTarget(null);
      loadUsers();
    } catch (err) {
      toast(getErrorMessage(err), "error");
    }
  };

  const handleResendInvite = async (user) => {
    try {
      const data = await resendInvite(user.id);
      saveProfile(user.id, {
        invitedAt: new Date().toISOString(),
      });
      audit({
        action: "user.invited_resent",
        userId: user.id,
        email: user.email,
        roleId: user.roleId,
      });

      if (data?.emailSent) {
        toast(`Invite resent to ${user.email}`, "success");
      } else {
        if (data?.emailResult?.mode === "log") {
          toast(`Invite resent successfully (email logged to console)`, "success");
        } else {
          toast(`Invite resent, but failed to send email to ${user.email}`, "info");
        }
      }
    } catch (err) {
      toast(getErrorMessage(err), "error");
    }
  };

  const handleDownloadSample = () => {
    downloadUserImportSample({
      roleName: assignableRoles[0]?.name || "",
      departmentName: departments[0]?.name || "",
      designationName: designations[0]?.name || "",
    });
  };

  const handleImportUsers = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";

    setImporting(true);
    try {
      const rows = parseUserImportRows(await file.text());
      if (!rows.length) {
        toast("No valid rows found in CSV. Use columns: FirstName, LastName, Email, Role", "error");
        return;
      }

      let created = 0;
      let failed = 0;

      for (const row of rows) {
        try {
          const matchedRole = allRoles.find(
            (r) =>
              r.name.toLowerCase() === row.roleName.toLowerCase() ||
              r.slug === row.roleName.toLowerCase().replace(/\s+/g, "-")
          );
          if (!matchedRole || matchedRole.isOwnerRole || matchedRole.slug === "organization-owner") {
            failed += 1;
            continue;
          }
          if (isOrgAdminRole(matchedRole) && !isOwner) {
            failed += 1;
            continue;
          }

          const department = findMasterItemByName(departments, row.department);
          const designation = findMasterItemByName(designations, row.designation);

          const data = await createUser({
            name: `${row.firstName} ${row.lastName}`.trim() || row.email,
            email: String(row.email || "").trim().toLowerCase(),
            password: row.password,
            roleId: matchedRole.id,
            phone: row.phone || undefined,
            departmentId: department?.id || null,
            designationId: designation?.id || null,
            invitationStatus: "PENDING",
          });

          const createdUser = data?.user || data;
          if (createdUser?.id || createdUser?._id) {
            saveProfile(createdUser.id || createdUser._id, {
              firstName: row.firstName,
              lastName: row.lastName,
              phone: row.phone,
              departmentId: department?.id || "",
              designationId: designation?.id || "",
              roleId: matchedRole.id,
              status: "PENDING",
            });
            audit({ action: "user.imported", userId: createdUser.id || createdUser._id, email: row.email });
          }
          created += 1;
        } catch {
          failed += 1;
        }
      }

      loadUsers();
      if (created > 0) {
        toast(
          `Imported ${created} user${created === 1 ? "" : "s"}${failed ? ` (${failed} skipped)` : ""}`,
          failed ? "info" : "success"
        );
      } else {
        toast("Import failed. Check CSV format, role names, and duplicate emails.", "error");
      }
    } catch {
      toast("Could not read the import file.", "error");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <Breadcrumb items={[{ label: "Organization", to: "/admin" }, { label: "Users" }]} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="mt-1 text-slate-500">
            Manage organization members. The organization owner is updated via the platform admin panel.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleImportUsers}
          />
          <ImportMenu
            importing={importing}
            onImportClick={() => importInputRef.current?.click()}
            onDownloadSample={handleDownloadSample}
          />
          <button type="button" onClick={openCreate} className="admin-btn-primary">
            + Create user
          </button>
        </div>
      </div>

      <FilterBar onClear={clearFilters} showClear={hasActiveFilters}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, phone, department..."
          className="admin-input admin-filter-search min-w-[220px]"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="admin-input admin-filter-select text-slate-700"
          aria-label="Filter by role"
        >
          <option value="all">All roles</option>
          {assignableRoles.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="admin-input admin-filter-select text-slate-700"
          aria-label="Filter by status"
        >
          <option value="all">All status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="PENDING">Pending</option>
          <option value="BLOCKED">Blocked</option>
        </select>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="admin-input admin-filter-select text-slate-700"
          aria-label="Filter by department"
        >
          <option value="all">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="admin-input admin-filter-select text-slate-700"
          aria-label="Sort users"
        >
          <option value="name">Sort: Name</option>
          <option value="created">Sort: Created</option>
          <option value="role">Sort: Role</option>
          <option value="status">Sort: Status</option>
        </select>
      </FilterBar>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="admin-table mt-4">
        {loading ? (
          <TableSkeleton rows={8} cols={5} />
        ) : paged.length === 0 ? (
          <EmptyState
            icon="👥"
            title="No users found"
            description="Create your first user or adjust filters."
            action={
              <button type="button" onClick={openCreate} className="admin-btn-primary">
                + Create user
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th className="col-user">User</th>
                  <th className="col-email">Email</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th className="col-actions-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((user) => {
                  const role = allRoles.find((r) => r.id === user.roleId);
                  return (
                    <tr key={user.id} className="admin-table-row border-b border-slate-100 last:border-0">
                      <td className="col-user">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-600">
                            {(user.firstName?.[0] || "?").toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">{user.firstName} {user.lastName}</p>
                            {user.designation && <p className="truncate text-xs text-slate-500">{user.designation}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="col-email">
                        <span className="block truncate">{user.email}</span>
                      </td>
                      <td>{user.department || "—"}</td>
                      <td>
                        <span className="inline-flex rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-600">
                          {role?.name || "—"}
                        </span>
                      </td>
                      <td><OrgStatusBadge status={user.status} /></td>
                      <td className="col-actions-wide">
                        <TableActions>
                          <TableAction variant="view" onClick={() => openView(user)} title="View"><ViewIcon /></TableAction>
                          <TableAction variant="edit" onClick={() => openEdit(user)} title="Edit"><EditIcon /></TableAction>
                          {user.status === "ACTIVE" ? (
                            <TableAction variant="warn" onClick={() => updateUserStatus(user, "DISABLED")} title="Deactivate"><ToggleOffIcon /></TableAction>
                          ) : (
                            <TableAction variant="success" onClick={() => updateUserStatus(user, "ACTIVE")} title="Activate"><ToggleOnIcon /></TableAction>
                          )}
                          {user.status === "PENDING" && (
                            <TableAction variant="muted" onClick={() => handleResendInvite(user)} title="Resend invite"><SendIcon /></TableAction>
                          )}
                          <TableAction variant="warn" onClick={() => setDeleteTarget(user)} title="Delete"><DeleteIcon /></TableAction>
                        </TableActions>
                      </td>
                    </tr>
                  );
                })}
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
          itemLabel="user"
        />
      </div>

      <Drawer
        open={panel === "create"}
        onClose={closePanel}
        title="Create user"
        subtitle="Add a new member to your organization"
        width="max-w-xl"
        footer={
          <>
            <button type="button" onClick={closePanel} className="admin-btn-secondary" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" form="create-user-form" disabled={submitting} className="admin-btn-primary">
              {submitting ? "Saving..." : "Create user"}
            </button>
          </>
        }
      >
        <UserFormDrawer
          mode="create"
          formId="create-user-form"
          hideActions
          form={form}
          setForm={setForm}
          errors={formErrors}
          roles={assignableRoles}
          departments={departments}
          designations={designations}
          onSubmit={handleCreate}
          loading={submitting}
        />
      </Drawer>

      <Drawer
        open={panel === "edit"}
        onClose={closePanel}
        title="Edit user"
        subtitle={activeUser?.email}
        width="max-w-xl"
        footer={
          <>
            <button type="button" onClick={closePanel} className="admin-btn-secondary" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" form="edit-user-form" disabled={submitting} className="admin-btn-primary">
              {submitting ? "Saving..." : "Save changes"}
            </button>
          </>
        }
      >
        <UserFormDrawer
          mode="edit"
          formId="edit-user-form"
          hideActions
          form={form}
          setForm={setForm}
          errors={formErrors}
          roles={assignableRoles}
          departments={departments}
          designations={designations}
          onSubmit={handleEdit}
          loading={submitting}
        />
      </Drawer>

      <Drawer
        open={panel === "view"}
        onClose={closePanel}
        title="User details"
        subtitle={activeUser?.email}
      >
        <UserDetailDrawer user={activeUser} role={activeRole} auditLogs={getForUser(userId)} />
      </Drawer>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete user"
        message={`Are you sure you want to delete ${deleteTarget?.firstName} ${deleteTarget?.lastName}? This will disable their access.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
