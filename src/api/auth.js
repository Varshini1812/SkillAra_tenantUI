import api, { clearAccessToken, getAccessToken, getData, refreshAccessToken, setAccessToken } from "./client.js";
import { applyTenantAccessToken } from "./tenantSessionRefresh.js";
import { getTenantSubdomain } from "../utils/tenant.js";

export async function login(email, password) {
  const res = await api.post("/api/auth/login", { email, password });
  const data = getData(res);
  if (data?.accessToken) applyTenantAccessToken(data.accessToken);
  return data;
}

export async function register({ inviteToken, password }) {
  const res = await api.post("/api/auth/register", { inviteToken, password });
  return getData(res);
}

export async function logout() {
  try {
    await api.post("/api/auth/logout");
  } finally {
    clearAccessToken();
  }
}

export async function getMe() {
  const res = await api.get("/api/auth/me");
  return getData(res);
}

export async function bootstrapSession() {
  try {
    if (getAccessToken()) {
      return await getMe();
    }
    const data = await refreshAccessToken();
    if (!data?.accessToken) return null;
    return getMe();
  } catch {
    try {
      const data = await refreshAccessToken();
      if (!data?.accessToken) return null;
      return getMe();
    } catch {
      return null;
    }
  }
}

export async function resolveTenant(subdomain) {
  const sub = (subdomain || getTenantSubdomain() || "").trim().toLowerCase();
  const res = await api.get("/api/tenants/resolve", {
    params: sub ? { tenant: sub } : {},
  });
  return getData(res);
}

export async function checkWorkspace(subdomain) {
  const res = await api.get(`/api/tenants/check/${encodeURIComponent(subdomain)}`);
  return getData(res);
}

export { refreshAccessToken, setAccessToken, clearAccessToken };

/** Self-service profile update. Returns the refreshed session user (with permissions). */
export async function updateMyProfile(payload) {
  const res = await api.patch("/api/users/me/profile", payload);
  return getData(res);
}
