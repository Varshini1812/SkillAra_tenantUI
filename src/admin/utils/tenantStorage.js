import { getTenantSubdomain } from "../../utils/tenant.js";

export function tenantStorageKey(base) {
  const sub = getTenantSubdomain() || "default";
  return `${base}_${sub}`;
}

export function loadFromTenantStorage(key, fallback = []) {
  try {
    const raw = localStorage.getItem(tenantStorageKey(key));
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveToTenantStorage(key, data) {
  localStorage.setItem(tenantStorageKey(key), JSON.stringify(data));
}
