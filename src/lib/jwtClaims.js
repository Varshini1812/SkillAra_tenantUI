/**
 * Decode JWT payload for UI-only purposes (nav visibility, labels).
 * SECURITY: This is NOT a security boundary — the server enforces authorization.
 */
export function decodeJwtClaims(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), "="));
    return JSON.parse(json);
  } catch {
    return null;
  }
}
