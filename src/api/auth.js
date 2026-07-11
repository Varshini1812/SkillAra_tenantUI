import api, { clearAuthTokens, getData, getStoredRefreshToken, setAuthTokens } from "./client.js";

function storeLoginTokens(data) {
  if (data?.accessToken) {
    setAuthTokens(data.accessToken, data.refreshToken);
  }
}

export async function login(email, password) {
  const res = await api.post("/api/auth/tenant/login", { email, password });
  const data = getData(res);
  storeLoginTokens(data);
  return data;
}

export async function register({ name, email, password }) {
  const res = await api.post("/api/auth/register", { name, email, password });
  return getData(res);
}

export async function logout() {
  try {
    const refreshToken = getStoredRefreshToken();
    await api.post("/api/auth/logout", refreshToken ? { refreshToken } : {});
  } finally {
    clearAuthTokens();
  }
}

export async function getMe() {
  const res = await api.get("/api/auth/me");
  return getData(res);
}

export async function resolveTenant() {
  const res = await api.get("/api/tenants/resolve");
  return getData(res);
}

export async function checkWorkspace(subdomain) {
  const res = await api.get(`/api/tenants/check/${encodeURIComponent(subdomain)}`);
  return getData(res);
}
