function keys(tenantSubdomain) {
  const scope = (tenantSubdomain || "default").trim().toLowerCase();
  return {
    rememberMe: `skillara_client_remember_me_${scope}`,
    email: `skillara_client_remember_email_${scope}`,
  };
}

export function loadRememberedLogin(tenantSubdomain) {
  const { rememberMe: rememberKey, email: emailKey } = keys(tenantSubdomain);
  const rememberMe = localStorage.getItem(rememberKey) === "true";
  if (!rememberMe) {
    return { email: "", rememberMe: false };
  }
  return {
    email: localStorage.getItem(emailKey) || "",
    rememberMe: true,
  };
}

export function saveRememberedLogin(tenantSubdomain, email, rememberMe) {
  const { rememberMe: rememberKey, email: emailKey } = keys(tenantSubdomain);
  if (rememberMe) {
    localStorage.setItem(rememberKey, "true");
    localStorage.setItem(emailKey, email.trim().toLowerCase());
    return;
  }
  localStorage.removeItem(rememberKey);
  localStorage.removeItem(emailKey);
}

const PENDING_EMAIL_KEY = "skillara_pending_login_email";

/**
 * Hands the address typed in the workspace finder to the sign-in form, so the
 * user types their email once even though the two steps are separate screens.
 */
export function setPendingLoginEmail(email) {
  try {
    sessionStorage.setItem(PENDING_EMAIL_KEY, String(email || "").trim().toLowerCase());
  } catch {
    // private mode — the user retypes their email, nothing breaks
  }
}

export function takePendingLoginEmail() {
  try {
    const value = sessionStorage.getItem(PENDING_EMAIL_KEY) || "";
    sessionStorage.removeItem(PENDING_EMAIL_KEY);
    return value;
  } catch {
    return "";
  }
}
