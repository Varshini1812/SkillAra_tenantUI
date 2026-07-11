const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+]?[\d\s()-]{7,20}$/;

export function validateRoleName(name, existingRoles = [], excludeId = null) {
  const trimmed = (name || "").trim();
  if (!trimmed) return "Role name is required";
  if (trimmed.length < 3 || trimmed.length > 50) return "Role name must be 3–50 characters";
  const dup = existingRoles.find(
    (r) => r.name.toLowerCase() === trimmed.toLowerCase() && r.id !== excludeId
  );
  if (dup) return "Role name already exists";
  return null;
}

export function validateUserForm(form, existingUsers = [], excludeId = null) {
  const errors = {};
  if (!form.firstName?.trim()) errors.firstName = "First name is required";
  if (!form.lastName?.trim()) errors.lastName = "Last name is required";
  if (!form.email?.trim()) errors.email = "Email is required";
  else if (!EMAIL_RE.test(form.email.trim())) errors.email = "Enter a valid email";
  else {
    const dup = existingUsers.find(
      (u) => u.email.toLowerCase() === form.email.trim().toLowerCase() && u.id !== excludeId
    );
    if (dup) errors.email = "Email already exists in this organization";
  }
  if (form.phone && !PHONE_RE.test(form.phone.trim())) errors.phone = "Enter a valid phone number";
  if (!form.roleId) errors.roleId = "Assigned role is required";
  if (!form.sendInvite && form.password && form.password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  }
  if (!form.sendInvite && !form.password && !excludeId) {
    errors.password = "Password is required or enable invitation email";
  }
  return errors;
}
