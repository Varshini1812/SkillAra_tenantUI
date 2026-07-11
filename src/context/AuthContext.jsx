import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  getMe,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  resolveTenant,
} from "../api/auth.js";
import { setDevTenantSubdomain, getTenantSubdomain } from "../api/client.js";
import {
  getTenantDisplayHost,
  getTenantFromHostname,
  isReservedSubdomain,
} from "../utils/tenant.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tenantSubdomain, setTenantSubdomain] = useState(getTenantSubdomain() || "");
  const [tenantInfo, setTenantInfo] = useState(null);
  const [tenantError, setTenantError] = useState(null);
  const [loading, setLoading] = useState(true);

  const resolveTenantContext = useCallback(async () => {
    const sub = getTenantSubdomain();
    setTenantSubdomain(sub || "");

    if (!sub) {
      setTenantInfo(null);
      setTenantError(null);
      return;
    }

    if (isReservedSubdomain(sub)) {
      setTenantInfo(null);
      setTenantError("reserved");
      return;
    }

    try {
      const data = await resolveTenant();
      if (data?.tenant) {
        setTenantInfo(data.tenant);
        setTenantError(null);
      } else {
        setTenantInfo(null);
        setTenantError("not_found");
      }
    } catch {
      setTenantInfo(null);
      setTenantError("not_found");
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await getMe();
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    resolveTenantContext().then(refreshUser);
  }, [resolveTenantContext, refreshUser]);

  const login = async (email, password) => {
    const data = await apiLogin(email, password);
    setUser(data.user);
    return data;
  };

  const register = async (payload) => {
    const data = await apiRegister(payload);
    return data;
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  const updateDevTenant = (subdomain) => {
    setDevTenantSubdomain(subdomain);
    window.location.reload();
  };

  const value = useMemo(
    () => ({
      user,
      tenantSubdomain,
      tenantInfo,
      tenantError,
      tenantHost: tenantSubdomain ? getTenantDisplayHost(tenantSubdomain) : "",
      hasTenantSubdomain: Boolean(tenantSubdomain),
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      refreshUser,
      updateDevTenant,
      resolveTenantContext,
    }),
    [user, tenantSubdomain, tenantInfo, tenantError, loading, resolveTenantContext, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
