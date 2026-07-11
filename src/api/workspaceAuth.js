import api, { getData } from "./client.js";
import adminApi, { getData as getAdminData } from "../admin/api/client.js";
import { applyTenantAccessToken } from "./tenantSessionRefresh.js";
import { getTenantSubdomain } from "../utils/tenant.js";
import axios from "axios";

const ADMIN_ROLES = new Set(["tenant_admin", "TENANT_ADMIN", "ORG_ADMIN"]);

export function portalForRole(role) {
  return ADMIN_ROLES.has(role) ? "admin" : "learning";
}

function tenantHeaders() {
  const tenant = getTenantSubdomain();
  return tenant ? { "X-Tenant-Subdomain": tenant } : {};
}

export async function workspaceLogin(email, password) {
  const res = await api.post("/api/auth/login", { email, password });
  const data = getData(res);
  const portal = portalForRole(data.user?.role);

  if (data.accessToken) {
    applyTenantAccessToken(data.accessToken);
  }

  return { ...data, portal };
}

export async function setInitialPassword({ currentPassword, newPassword, portal = "learning" }) {
  const client = portal === "admin" ? adminApi : api;
  const res = await client.post("/api/auth/set-initial-password", {
    currentPassword,
    newPassword,
  });
  return portal === "admin" ? getAdminData(res) : getData(res);
}

export async function fetchPortalHint(email) {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return null;

  try {
    const res = await axios.post(
      "/api/auth/legacy/workspace/portal-hint",
      { email: trimmed },
      {
        baseURL: import.meta.env.VITE_API_URL || "",
        withCredentials: true,
        headers: tenantHeaders(),
      }
    );
    return getData(res)?.portal ?? null;
  } catch {
    return null;
  }
}
