import axios from "axios";
import { getApiErrorMessage } from "../utils/errorMessages.js";
import { getTenantSubdomain } from "../utils/tenant.js";
import { clearAccessToken, getAccessToken, setAccessToken } from "../lib/accessTokenMemory.js";
import { refreshTenantAccessToken } from "./tenantSessionRefresh.js";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export async function refreshAccessToken() {
  return refreshTenantAccessToken();
}

api.interceptors.request.use((config) => {
  const tenant = getTenantSubdomain();
  if (tenant) config.headers["X-Tenant-Subdomain"] = tenant;

  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes("/api/auth/refresh") &&
      !original.url?.includes("/api/auth/login") &&
      !original.url?.includes("/api/auth/register") &&
      !original.url?.includes("/api/auth/logout")
    ) {
      original._retry = true;
      try {
        const data = await refreshAccessToken();
        if (data?.accessToken) {
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        }
      } catch {
        clearAccessToken();
      }
    }
    return Promise.reject(error);
  }
);

export function getData(res) {
  return res.data?.data ?? res.data;
}

export function getErrorMessage(error) {
  return getApiErrorMessage(error);
}

export { setAccessToken, clearAccessToken, getAccessToken };

export default api;
