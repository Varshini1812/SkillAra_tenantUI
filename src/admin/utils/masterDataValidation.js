const NAME_RE = /^[\p{L}\p{N}][\p{L}\p{N}&' .\-]{0,78}$/u;
const CODE_RE = /^[A-Za-z0-9]{3}$/;

export const MASTER_DATA_LIMITS = {
  name: { min: 2, max: 80 },
  code: { length: 3 },
  description: { max: 500 },
};

/**
 * Validate department create-edit form.
 * @returns {{ name?: string, code?: string, description?: string }}
 */
export function validateMasterDataForm(form, { existingItems = [], excludeId = null } = {}) {
  const errors = {};
  const name = String(form?.name || "").trim();
  const code = String(form?.code || "").trim().toUpperCase();
  const description = String(form?.description || "").trim();

  if (!name) {
    errors.name = "Name is required";
  } else if (name.length < MASTER_DATA_LIMITS.name.min) {
    errors.name = `Name must be at least ${MASTER_DATA_LIMITS.name.min} characters`;
  } else if (name.length > MASTER_DATA_LIMITS.name.max) {
    errors.name = `Name must be ${MASTER_DATA_LIMITS.name.max} characters or fewer`;
  } else if (!NAME_RE.test(name)) {
    errors.name = "Use letters, numbers, spaces, and basic punctuation only";
  } else {
    const dup = existingItems.find(
      (item) =>
        String(item.name || "").trim().toLowerCase() === name.toLowerCase() &&
        String(item.id) !== String(excludeId || "")
    );
    if (dup) errors.name = "An item with this name already exists";
  }

  if (!code) {
    errors.code = "Code is required";
  } else if (!CODE_RE.test(code)) {
    errors.code = "Code must be exactly 3 letters or numbers";
  } else {
    const dupCode = existingItems.find(
      (item) =>
        String(item.code || "").trim().toUpperCase() === code &&
        String(item.id) !== String(excludeId || "")
    );
    if (dupCode) errors.code = "This code is already in use";
  }

  if (description.length > MASTER_DATA_LIMITS.description.max) {
    errors.description = `Description must be ${MASTER_DATA_LIMITS.description.max} characters or fewer`;
  }

  return errors;
}
