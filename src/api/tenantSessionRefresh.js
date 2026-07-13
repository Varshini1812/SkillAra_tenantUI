import axios from "axios";
import { getTenantSubdomain } from "../utils/tenant.js";
import { setAccessToken as setStudentToken } from "../lib/accessTokenMemory.js";
import { setAccessToken as setAdminToken } from "../lib/adminAccessTokenMemory.js";

/** Single in-flight refresh for tenant sessions — prevents cookie rotation races. */
let refreshPromise = null;

function tenantHeaders() {
  const tenant = getTenantSubdomain();
  return tenant ? { "X-Tenant-Subdomain": tenant } : {};
}

export async function refreshTenantAccessToken() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(
        "/api/auth/refresh",
        {},
        {
          baseURL: import.meta.env.VITE_API_URL || "",
          withCredentials: true,
          headers: { "Content-Type": "application/json", ...tenantHeaders() },
        }
      )
      .then((res) => {
        const data = res.data?.data ?? res.data;
        if (data?.accessToken) {
          setStudentToken(data.accessToken);
          setAdminToken(data.accessToken);
        }
        return data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export function applyTenantAccessToken(token) {
  if (!token) return;
  setStudentToken(token);
  setAdminToken(token);
}
