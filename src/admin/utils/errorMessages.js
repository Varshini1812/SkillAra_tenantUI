/**
 * Client-side fallback messages for API errors.
 * Prefer errorMessage from the backend; use errorKey lookup when only a key is returned.
 */
export const ERROR_MESSAGES = {
  GENERAL_UNKNOWN: "Something went wrong. Please try again.",
  GENERAL_VALIDATION_FAILED: "Please check your input and try again.",
  GENERAL_FORBIDDEN: "You don't have permission to perform this action.",
  GENERAL_UNAUTHORIZED: "Please sign in to continue.",
  GENERAL_NOT_FOUND: "The requested resource was not found.",
  NETWORK_ERROR: "Unable to reach the server. Check your connection and try again.",

  DB_UNAVAILABLE:
    "We're having trouble connecting to the database. Please try again in a moment.",

  AUTH_INVALID_CREDENTIALS: "The email or password you entered is incorrect.",
  AUTH_ACCOUNT_LOCKED:
    "Your account is temporarily locked after too many failed attempts. Please try again later.",
  AUTH_ACCOUNT_DISABLED: "This account has been disabled. Contact your administrator.",
  AUTH_ACCOUNT_BLOCKED: "This account has been blocked. Contact your administrator.",
  AUTH_TENANT_PANEL_DENIED: "This account cannot access the organization admin panel.",
  AUTH_SESSION_EXPIRED: "Your session has expired. Please sign in again.",
  AUTH_TENANT_REQUIRED: "Organization workspace could not be identified. Check your login URL.",
  AUTH_TENANT_WORKSPACE_REQUIRED:
    "Workspace subdomain is required. Use your organization URL (e.g. acme-bootcamp.localhost:5173/login).",
  AUTH_TENANT_INACTIVE: "This organization is currently inactive. Contact platform support.",
  AUTH_PASSWORD_INCORRECT: "Your current password is incorrect.",

  TENANT_NOT_FOUND: "We couldn't find that organization. Check the workspace URL.",
  TENANT_INVALID_ID: "Invalid organization identifier.",
  TENANT_EXISTS: "An organization with this domain, subdomain, or email already exists.",
  TENANT_EMAIL_IN_USE: "This email is already in use by another organization.",
  TENANT_OWNER_ROLE_REQUIRED: "The organization owner must have the Organization Owner role.",
  TENANT_WORKSPACE_INVALID: "Invalid workspace name.",
  TENANT_WORKSPACE_NOT_FOUND: "Workspace not found.",

  USER_NOT_FOUND: "User not found.",
  USER_EMAIL_EXISTS: "An account with this email already exists in this organization.",
  USER_ROLE_INVALID: "Role must be Tutor, Student, or Organization Admin.",
  USER_ORG_ADMIN_FORBIDDEN: "Only the Organization Owner can assign the Organization Admin role.",
  USER_OWNER_PROTECTED: "The organization owner cannot be modified from the users list.",
  USER_STATUS_INVALID: "Status must be Active or Disabled.",
  USER_SELF_STATUS: "You cannot change your own account status.",
  USER_SELF_DELETE: "You cannot delete your own account.",
  USER_NO_FIELDS: "No fields were provided to update.",

  PLAN_NOT_FOUND: "The selected plan was not found.",
  PLAN_INVALID: "The selected plan is invalid or no longer active.",
  PLAN_NAME_EXISTS: "A plan with this name already exists.",
  PLAN_LIMIT_EXCEEDED: "Your plan limit has been reached. Please upgrade to continue.",
  PLAN_LIMIT_USERS: "Your plan's user limit has been reached. Upgrade to add more users.",

  OWNERSHIP_FORBIDDEN: "Only the organization owner can request an ownership transfer.",
  OWNERSHIP_SELF: "You cannot transfer ownership to yourself.",
  OWNERSHIP_PENDING_EXISTS: "A pending ownership transfer request already exists for this organization.",
  OWNERSHIP_TARGET_INELIGIBLE:
    "Only active Organization Admins who have accepted their invitation can become owner.",
  OWNERSHIP_REQUEST_NOT_FOUND: "Ownership transfer request not found or no longer pending.",
  OWNERSHIP_ORG_INACTIVE: "This organization is inactive. Ownership cannot be transferred.",
  OWNERSHIP_OWNER_INVALID: "The current organization owner is no longer valid.",
  OWNERSHIP_REJECT_REASON_REQUIRED: "Please provide a reason for rejecting this request.",
};

export function resolveErrorMessage(key) {
  if (!key) return ERROR_MESSAGES.GENERAL_UNKNOWN;
  return ERROR_MESSAGES[key] ?? ERROR_MESSAGES.GENERAL_UNKNOWN;
}

const TECHNICAL_MESSAGE_PATTERNS = [
  /mongodb/i,
  /\bmongo/i,
  /E11000/,
  /ECONNREFUSED/,
  /ValidationError/i,
  /CastError/i,
  /SyntaxError/i,
  /TypeError/i,
  /ReferenceError/i,
  /\bat\s+\S+\s*\(/,
  /stack trace/i,
  /duplicate key error/i,
  /BSON/i,
  /Mongoose/i,
  /MongoServer/i,
  /MongoNetwork/i,
  /Cannot read propert/i,
  /is not a function/i,
  /Network Error/i,
  /Request failed with status/i,
];

function isUserFacingMessage(message) {
  if (typeof message !== "string") return false;
  const trimmed = message.trim();
  if (!trimmed || trimmed.length > 220) return false;
  if (ERROR_MESSAGES[trimmed]) return true;
  if (Object.values(ERROR_MESSAGES).includes(trimmed)) return true;
  return !TECHNICAL_MESSAGE_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function getApiErrorMessage(err) {
  const response = err?.response?.data;
  const msg = response?.message;

  if (msg?.errorKey && ERROR_MESSAGES[msg.errorKey]) {
    return ERROR_MESSAGES[msg.errorKey];
  }

  if (msg?.errorMessage && isUserFacingMessage(msg.errorMessage)) {
    return msg.errorMessage.trim();
  }

  if (!err?.response) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  return ERROR_MESSAGES.GENERAL_UNKNOWN;
}
