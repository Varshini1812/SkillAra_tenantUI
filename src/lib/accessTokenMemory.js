const SESSION_KEY = "skillara_access_token";

let accessToken = null;

function restoreFromSession() {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      accessToken = stored;
      return stored;
    }
  } catch {
    // storage unavailable
  }
  return null;
}

export function getAccessToken() {
  if (accessToken) return accessToken;
  return restoreFromSession();
}

export function setAccessToken(token) {
  accessToken = token || null;
  try {
    if (token) sessionStorage.setItem(SESSION_KEY, token);
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // storage unavailable
  }
}

export function clearAccessToken() {
  accessToken = null;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // storage unavailable
  }
}
