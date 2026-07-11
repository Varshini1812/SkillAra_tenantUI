import axios from "axios";
import { getTenantSubdomain } from "../utils/tenant.js";

const ACCESS_KEY = "skillara_access";
const REFRESH_KEY = "skillara_refresh";

export function setAuthTokens(accessToken, refreshToken) {
  if (accessToken) sessionStorage.setItem(ACCESS_KEY, accessToken);
  else sessionStorage.removeItem(ACCESS_KEY);
  if (refreshToken) sessionStorage.setItem(REFRESH_KEY, refreshToken);
  else sessionStorage.removeItem(REFRESH_KEY);
}

export function clearAuthTokens() {
  sessionStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
}

function getAccessToken() {
  return sessionStorage.getItem(ACCESS_KEY);
}

function getRefreshToken() {
  return sessionStorage.getItem(REFRESH_KEY);
}

export function getStoredRefreshToken() {
  return getRefreshToken();
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const tenant = getTenantSubdomain();
  if (tenant) {
    config.headers["X-Tenant-Subdomain"] = tenant;
  }

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
      !original._retry &&
      !original.url?.includes("/auth/refresh") &&
      !original.url?.includes("/auth/login") &&
      !original.url?.includes("/auth/register") &&
      !original.url?.includes("/auth/logout")
    ) {
      const refreshToken = getRefreshToken();
      if (!refreshToken) return Promise.reject(error);

      original._retry = true;
      try {
        const res = await api.post("/api/auth/refresh", { refreshToken });
        const data = getData(res);
        if (data?.accessToken) {
          setAuthTokens(data.accessToken, data.refreshToken || refreshToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        }
      } catch {
        clearAuthTokens();
      }
    }
    return Promise.reject(error);
  }
);

export function getData(res) {
  return res.data?.data ?? res.data;
}

export function getErrorMessage(error) {
  return (
    error.response?.data?.message?.errorMessage ||
    error.response?.data?.message?.message ||
    error.message ||
    "Something went wrong"
  );
}

export default api;
