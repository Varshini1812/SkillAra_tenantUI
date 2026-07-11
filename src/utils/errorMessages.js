/**
 * Client-side fallback messages for API errors.
 * Prefer errorMessage from the backend; use errorKey lookup when only a key is returned.
 */
export const ERROR_MESSAGES = {
  GENERAL_UNKNOWN: "Something went wrong. Please try again.",
  GENERAL_VALIDATION_FAILED: "Please check your input and try again.",
  GENERAL_FORBIDDEN: "You don't have permission to perform this action.",
  GENERAL_UNAUTHORIZED: "Please sign in to continue.",
  NETWORK_ERROR: "Unable to reach the server. Check your connection and try again.",

  AUTH_INVALID_CREDENTIALS: "The email or password you entered is incorrect.",
  AUTH_ACCOUNT_LOCKED:
    "Your account is temporarily locked after too many failed attempts. Please try again later.",
  AUTH_SESSION_EXPIRED: "Your session has expired. Please sign in again.",
  AUTH_TENANT_WORKSPACE_REQUIRED:
    "Workspace subdomain is required. Use your organization URL to sign in.",

  TENANT_NOT_FOUND: "We couldn't find that organization. Check the workspace URL.",
  USER_EMAIL_EXISTS: "An account with this email already exists in this organization.",
  COURSE_NOT_FOUND: "Course not found.",
  ENROLLMENT_NOT_FOUND: "Enrollment not found.",
};

/** @param {string} key */
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
  /BSON/i,
  /Mongoose/i,
  /MongoServer/i,
  /MongoNetwork/i,
  /Network Error/i,
  /Request failed with status/i,
];

function isUserFacingMessage(message) {
  if (typeof message !== "string") return false;
  const trimmed = message.trim();
  if (!trimmed || trimmed.length > 220) return false;
  if (Object.values(ERROR_MESSAGES).includes(trimmed)) return true;
  return !TECHNICAL_MESSAGE_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/** @param {unknown} err */
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
