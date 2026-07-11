import api, { clearAccessToken, getData, setAccessToken } from "./client.js";
import { getTenantSubdomain } from "../../utils/tenant.js";

export async function tenantAdminLogin(email, password, subdomain) {
  const sub = (subdomain || getTenantSubdomain() || "").trim().toLowerCase();
  const res = await api.post(
    "/api/auth/login",
    { email, password, subdomain: sub || undefined },
    sub ? { headers: { "X-Tenant-Subdomain": sub } } : undefined
  );
  const data = getData(res);
  if (data?.accessToken) setAccessToken(data.accessToken);
  return data;
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

export async function fetchUsers(params = {}) {
  const res = await api.get("/api/users", { params });
  return getData(res);
}

export async function createUser(payload) {
  const res = await api.post("/api/users", payload);
  return getData(res);
}

export async function updateUser(id, payload) {
  const res = await api.patch(`/api/users/${id}`, payload);
  return getData(res);
}

export async function updateUserStatus(id, status) {
  const res = await api.patch(`/api/users/${id}/status`, { status });
  return getData(res);
}

export async function deleteUser(id) {
  const res = await api.delete(`/api/users/${id}`);
  return getData(res);
}

export async function updateMyProfile(payload) {
  const res = await api.patch("/api/users/me/profile", payload);
  return getData(res);
}

export async function changePassword(currentPassword, newPassword) {
  const res = await api.post("/api/auth/legacy/change-password", { currentPassword, newPassword });
  return getData(res);
}

export async function inviteUser(payload) {
  const res = await api.post("/api/tenant-admin/invite-user", payload);
  return getData(res);
}

export async function resolveTenant(subdomain) {
  const sub = (subdomain || getTenantSubdomain() || "").trim().toLowerCase();
  const res = await api.get("/api/tenants/resolve", {
    params: sub ? { tenant: sub } : {},
  });
  return getData(res);
}

export async function fetchMyOwnershipTransferRequests() {
  const res = await api.get("/api/ownership-transfers/my");
  return getData(res);
}

export async function fetchEligibleOwnershipTargets() {
  const res = await api.get("/api/ownership-transfers/eligible-targets");
  return getData(res);
}

export async function createOwnershipTransferRequest(payload) {
  const res = await api.post("/api/ownership-transfers", payload);
  return getData(res);
}

export async function cancelOwnershipTransferRequest(id) {
  const res = await api.post(`/api/ownership-transfers/${id}/cancel`);
  return getData(res);
}

export async function fetchRoles() {
  const res = await api.get("/api/roles");
  const data = getData(res);
  return data?.roles ?? data ?? [];
}

export async function fetchRolePermissionModules() {
  const res = await api.get("/api/roles/permission-modules");
  const data = getData(res);
  return data?.modules ?? data ?? [];
}

export async function createRole(payload) {
  const res = await api.post("/api/roles", payload);
  const data = getData(res);
  return data?.role ?? data;
}

export async function updateRole(id, payload) {
  const res = await api.patch(`/api/roles/${id}`, payload);
  const data = getData(res);
  return data?.role ?? data;
}

export async function deleteRole(id) {
  const res = await api.delete(`/api/roles/${id}`);
  return getData(res);
}

export async function fetchMasterCategories() {
  const res = await api.get("/api/master-data/categories");
  const data = getData(res);
  return data?.categories ?? data ?? [];
}

export async function fetchMasterData(category, params = {}) {
  const res = await api.get("/api/master-data", { params: { category, ...params } });
  const data = getData(res);
  return data?.items ?? data ?? [];
}

export async function createMasterDataItem(payload) {
  const res = await api.post("/api/master-data", payload);
  const data = getData(res);
  return data?.item ?? data;
}

export async function updateMasterDataItem(id, payload) {
  const res = await api.patch(`/api/master-data/${id}`, payload);
  const data = getData(res);
  return data?.item ?? data;
}

export async function deleteMasterDataItem(id) {
  const res = await api.delete(`/api/master-data/${id}`);
  return getData(res);
}
