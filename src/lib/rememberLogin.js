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
