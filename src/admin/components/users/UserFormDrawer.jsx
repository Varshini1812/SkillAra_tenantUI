import { mapTenantRoleToApiRole } from "../../data/tenantRolesPermissions.js";
import { USER_LIMITS } from "../../utils/userValidation.js";

const inputClass = "admin-input";
const labelClass = "mb-1 block text-sm text-slate-500";

export default function UserFormDrawer({
  mode,
  form,
  setForm,
  errors,
  roles,
  departments = [],
  designations = [],
  onSubmit,
  loading,
  formId = "user-form",
  hideActions = false,
}) {
  const activeRoles = roles.filter((r) => r.status === "active");
  const assignableRoles = activeRoles.filter(
    (r) => !r.isOwnerRole && r.slug !== "organization-owner"
  );
  const activeDepartments = departments.filter((d) => d.status === "active" || !d.status);
  const activeDesignations = designations.filter((d) => d.status === "active" || !d.status);

  const setField = (key, value) => setForm({ ...form, [key]: value });

  return (
    <form id={formId} onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-2xl text-slate-500">
          {form.profilePhoto ? (
            <img src={form.profilePhoto} alt="" className="h-full w-full rounded-full object-cover" />
          ) : (
            (form.firstName?.[0] || "?").toUpperCase()
          )}
        </div>
        <div className="flex-1">
          <label className={labelClass}>Profile photo URL</label>
          <input
            value={form.profilePhoto}
            onChange={(e) => setField("profilePhoto", e.target.value)}
            placeholder="https://..."
            className={inputClass}
            aria-invalid={Boolean(errors.profilePhoto)}
          />
          <p className="mt-1 text-xs text-slate-500">Optional · must be a valid http(s) URL</p>
          {errors.profilePhoto && <p className="mt-1 text-xs text-red-600">{errors.profilePhoto}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>First name *</label>
          <input
            value={form.firstName}
            onChange={(e) => setField("firstName", e.target.value.slice(0, USER_LIMITS.firstName.max))}
            className={inputClass}
            aria-invalid={Boolean(errors.firstName)}
          />
          <p className="mt-1 text-xs text-slate-500">
            {USER_LIMITS.firstName.min}–{USER_LIMITS.firstName.max} characters
          </p>
          {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>}
        </div>
        <div>
          <label className={labelClass}>Last name *</label>
          <input
            value={form.lastName}
            onChange={(e) => setField("lastName", e.target.value.slice(0, USER_LIMITS.lastName.max))}
            className={inputClass}
            aria-invalid={Boolean(errors.lastName)}
          />
          <p className="mt-1 text-xs text-slate-500">
            At least {USER_LIMITS.lastName.min} character · max {USER_LIMITS.lastName.max}
          </p>
          {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>}
        </div>
      </div>

      <div>
        <label className={labelClass}>Email *</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setField("email", e.target.value.slice(0, USER_LIMITS.email.max))}
          disabled={mode === "edit"}
          className={`${inputClass} disabled:opacity-60`}
          aria-invalid={Boolean(errors.email)}
        />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Phone</label>
          <input
            value={form.phone}
            onChange={(e) => setField("phone", e.target.value)}
            className={inputClass}
            aria-invalid={Boolean(errors.phone)}
          />
          <p className="mt-1 text-xs text-slate-500">
            Optional · {USER_LIMITS.phone.minDigits}–{USER_LIMITS.phone.maxDigits} digits
          </p>
          {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
        </div>
        <div>
          <label className={labelClass}>Employee ID</label>
          <input
            value={form.employeeId}
            onChange={(e) =>
              setField("employeeId", e.target.value.slice(0, USER_LIMITS.employeeId.max))
            }
            className={inputClass}
            aria-invalid={Boolean(errors.employeeId)}
          />
          <p className="mt-1 text-xs text-slate-500">
            Optional · letters, numbers, hyphens, underscores
          </p>
          {errors.employeeId && <p className="mt-1 text-xs text-red-600">{errors.employeeId}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Department</label>
          <select
            value={form.departmentId}
            onChange={(e) => setField("departmentId", e.target.value)}
            className={inputClass}
          >
            <option value="">Select department</option>
            {activeDepartments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          {activeDepartments.length === 0 && (
            <p className="mt-1 text-xs text-slate-500">
              No departments yet. Add them under Master data.
            </p>
          )}
        </div>
        <div>
          <label className={labelClass}>Designation</label>
          <select
            value={form.designationId}
            onChange={(e) => setField("designationId", e.target.value)}
            className={inputClass}
          >
            <option value="">Select designation</option>
            {activeDesignations.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          {activeDesignations.length === 0 && (
            <p className="mt-1 text-xs text-slate-500">
              No designations yet. Add them under Master data.
            </p>
          )}
        </div>
      </div>

      <div>
        <label className={labelClass}>Assign role *</label>
        <select
          value={form.roleId}
          onChange={(e) => setField("roleId", e.target.value)}
          className={inputClass}
          aria-invalid={Boolean(errors.roleId)}
        >
          <option value="">Select role</option>
          {assignableRoles.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        {errors.roleId && <p className="mt-1 text-xs text-red-600">{errors.roleId}</p>}
        {form.roleId && (
          <p className="mt-1 text-xs text-slate-500">
            {assignableRoles.find((r) => r.id === form.roleId)?.description}
          </p>
        )}
      </div>

      <div>
        <label className={labelClass}>Status</label>
        <select
          value={form.status}
          onChange={(e) => setField("status", e.target.value)}
          className={inputClass}
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="PENDING">Pending invitation</option>
          <option value="BLOCKED">Blocked</option>
        </select>
      </div>

      {mode === "create" && (
        <>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.sendInvite}
              onChange={(e) => setField("sendInvite", e.target.checked)}
              className="mt-0.5 rounded"
            />
            <span>
              <span className="font-medium">Send invitation email</span>
              <span className="mt-1 block text-xs text-slate-500">
                User is created as pending. They receive an invitation link to set up their account password on first sign-in.
              </span>
            </span>
          </label>
          {!form.sendInvite && (
            <div>
              <label className={labelClass}>Password *</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setField("password", e.target.value.slice(0, USER_LIMITS.password.max))
                }
                className={inputClass}
                aria-invalid={Boolean(errors.password)}
              />
              <p className="mt-1 text-xs text-slate-500">
                At least {USER_LIMITS.password.min} characters
              </p>
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
            </div>
          )}
        </>
      )}

      {!hideActions && (
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? "Saving..." : mode === "create" ? "Create user" : "Save changes"}
        </button>
      )}
    </form>
  );
}

export function getApiRoleForForm(roleId, roles) {
  const role = roles.find((r) => r.id === roleId);
  return mapTenantRoleToApiRole(role);
}

export const EMPTY_USER_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  employeeId: "",
  departmentId: "",
  designationId: "",
  roleId: "",
  status: "ACTIVE",
  password: "",
  profilePhoto: "",
  sendInvite: true,
};
