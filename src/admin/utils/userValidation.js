const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+]?[\d\s().-]{7,20}$/;
const NAME_RE = /^[\p{L}](?:[\p{L}\p{M}' .\-]*[\p{L}\p{M}])?$/u;
const ROLE_NAME_RE = /^[\p{L}\p{N}][\p{L}\p{N} &'()\-.]{0,78}$/u;
const EMPLOYEE_ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,29}$/;

export const USER_LIMITS = {
  firstName: { min: 2, max: 50 },
  lastName: { min: 1, max: 50 },
  email: { max: 254 },
  phone: { minDigits: 7, maxDigits: 15 },
  employeeId: { max: 30 },
  password: { min: 6, max: 128 },
  roleName: { min: 2, max: 80 },
  roleDescription: { max: 250 },
};

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

export function validateRoleName(name, existingRoles = [], excludeId = null) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return "Role name is required";
  if (trimmed.length < USER_LIMITS.roleName.min) {
    return `Role name must be at least ${USER_LIMITS.roleName.min} characters`;
  }
  if (trimmed.length > USER_LIMITS.roleName.max) {
    return `Role name must be ${USER_LIMITS.roleName.max} characters or fewer`;
  }
  if (!ROLE_NAME_RE.test(trimmed)) {
    return "Use letters, numbers, spaces, and basic punctuation only";
  }
  const dup = existingRoles.find(
    (r) =>
      String(r.name || "").trim().toLowerCase() === trimmed.toLowerCase() &&
      String(r.id) !== String(excludeId || "")
  );
  if (dup) return "Role name already exists";
  return null;
}

export function validateRoleForm(form, existingRoles = [], excludeId = null) {
  const errors = {};
  const nameError = validateRoleName(form?.name, existingRoles, excludeId);
  if (nameError) errors.name = nameError;

  const description = String(form?.description || "");
  if (description.length > USER_LIMITS.roleDescription.max) {
    errors.description = `Description must be ${USER_LIMITS.roleDescription.max} characters or fewer`;
  }
  return errors;
}

export function validateUserForm(form, existingUsers = [], excludeId = null) {
  const errors = {};
  const firstName = String(form?.firstName || "").trim();
  const lastName = String(form?.lastName || "").trim();
  const email = String(form?.email || "").trim();
  const phone = String(form?.phone || "").trim();
  const employeeId = String(form?.employeeId || "").trim();
  const profilePhoto = String(form?.profilePhoto || "").trim();

  if (!firstName) {
    errors.firstName = "First name is required";
  } else if (firstName.length < USER_LIMITS.firstName.min) {
    errors.firstName = `First name must be at least ${USER_LIMITS.firstName.min} characters`;
  } else if (firstName.length > USER_LIMITS.firstName.max) {
    errors.firstName = `First name must be ${USER_LIMITS.firstName.max} characters or fewer`;
  } else if (!NAME_RE.test(firstName)) {
    errors.firstName = "Enter a valid first name";
  }

  if (!lastName) {
    errors.lastName = "Last name is required";
  } else if (lastName.length < USER_LIMITS.lastName.min) {
    errors.lastName = `Last name must be at least ${USER_LIMITS.lastName.min} character`;
  } else if (lastName.length > USER_LIMITS.lastName.max) {
    errors.lastName = `Last name must be ${USER_LIMITS.lastName.max} characters or fewer`;
  } else if (!NAME_RE.test(lastName)) {
    errors.lastName = "Enter a valid last name";
  }

  if (!email) {
    errors.email = "Email is required";
  } else if (email.length > USER_LIMITS.email.max) {
    errors.email = `Email must be ${USER_LIMITS.email.max} characters or fewer`;
  } else if (!EMAIL_RE.test(email)) {
    errors.email = "Enter a valid email";
  } else {
    const normalizedEmail = email.toLowerCase();
    const dup = existingUsers.find(
      (u) =>
        String(u.email || "").trim().toLowerCase() === normalizedEmail &&
        String(u.id || u._id || "") !== String(excludeId || "")
    );
    if (dup) errors.email = "Email already exists in this organization";
  }

  if (phone) {
    if (!PHONE_RE.test(phone)) {
      errors.phone = "Enter a valid phone number";
    } else {
      const digits = digitsOnly(phone);
      if (
        digits.length < USER_LIMITS.phone.minDigits ||
        digits.length > USER_LIMITS.phone.maxDigits
      ) {
        errors.phone = `Phone must have ${USER_LIMITS.phone.minDigits}–${USER_LIMITS.phone.maxDigits} digits`;
      }
    }
  }

  if (employeeId) {
    if (employeeId.length > USER_LIMITS.employeeId.max) {
      errors.employeeId = `Employee ID must be ${USER_LIMITS.employeeId.max} characters or fewer`;
    } else if (!EMPLOYEE_ID_RE.test(employeeId)) {
      errors.employeeId = "Use letters, numbers, hyphens, or underscores only";
    }
  }

  if (profilePhoto) {
    try {
      const withProtocol = /^https?:\/\//i.test(profilePhoto)
        ? profilePhoto
        : `https://${profilePhoto}`;
      const url = new URL(withProtocol);
      if (!["http:", "https:"].includes(url.protocol)) {
        errors.profilePhoto = "Enter a valid image URL";
      }
    } catch {
      errors.profilePhoto = "Enter a valid image URL";
    }
  }

  if (!form.roleId) errors.roleId = "Assigned role is required";

  if (!form.sendInvite && form.password && form.password.length < USER_LIMITS.password.min) {
    errors.password = `Password must be at least ${USER_LIMITS.password.min} characters`;
  }
  if (
    !form.sendInvite &&
    form.password &&
    form.password.length > USER_LIMITS.password.max
  ) {
    errors.password = `Password must be ${USER_LIMITS.password.max} characters or fewer`;
  }
  if (!form.sendInvite && !form.password && !excludeId) {
    errors.password = "Password is required or enable invitation email";
  }

  return errors;
}
