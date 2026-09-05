import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  bootstrapSession,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  resolveTenant,
  checkWorkspace,
} from "../api/auth.js";
import { decodeJwtClaims } from "../lib/jwtClaims.js";
import { getAccessToken } from "../api/client.js";
import {
  getTenantDisplayHost,
  getTenantSubdomain,
  isReservedSubdomain,
  setDevTenant,
} from "../utils/tenant.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [sessionClaims, setSessionClaims] = useState(null);
  const [tenantSubdomain, setTenantSubdomain] = useState(getTenantSubdomain() || "");
  const [tenantInfo, setTenantInfo] = useState(null);
  const [tenantError, setTenantError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  // expose raw access token for components that need it directly
  const accessToken = getAccessToken();

  const syncClaimsFromToken = useCallback(() => {
    setSessionClaims(decodeJwtClaims(getAccessToken()));
  }, []);

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

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    /**
     * Only the backend answering "no such tenant" means the workspace is missing.
     * A dead connection, a misconfigured API base URL or a 5xx is our problem,
     * not a bad link — reporting those as "doesn't exist" sends users chasing a
     * typo that isn't there.
     */
    const isMissing = (err) => err?.response?.status === 404;

    let unreachable = false;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const data = await resolveTenant(sub);
        if (data?.tenant) {
          setTenantInfo(data.tenant);
          setTenantError(null);
          return;
        }
      } catch (err) {
        const status = err?.response?.status;
        if (status === 503 && attempt < 2) {
          await sleep(600);
          continue;
        }
        unreachable = !isMissing(err);
        break;
      }
    }

    try {
      const check = await checkWorkspace(sub);
      if (check?.exists && !check?.inactive) {
        const data = await resolveTenant(sub);
        if (data?.tenant) {
          setTenantInfo(data.tenant);
          setTenantError(null);
          return;
        }
        setTenantInfo({
          tenant_name: check.tenant_name,
          sub_domain: check.sub_domain,
          subdomain: check.sub_domain,
          logo: check.logo,
          status: true,
        });
        setTenantError(null);
        return;
      }
      unreachable = false;
    } catch (err) {
      if (!isMissing(err)) unreachable = true;
    }

    setTenantInfo(null);
    setTenantError(unreachable ? "unreachable" : "not_found");
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await bootstrapSession();
      if (data?.user) {
        setUser(data.user);
        syncClaimsFromToken();
      } else {
        setUser(null);
        setSessionClaims(null);
      }
    } catch {
      setUser(null);
      setSessionClaims(null);
    } finally {
      setLoading(false);
    }
  }, [syncClaimsFromToken]);

  const establishSession = useCallback(
    (data) => {
      if (data?.user) {
        setUser(data.user);
        syncClaimsFromToken();
      }
      setLoading(false);
    },
    [syncClaimsFromToken]
  );

  useEffect(() => {
    resolveTenantContext().then(refreshUser);
  }, [resolveTenantContext, refreshUser]);

  const login = async (email, password) => {
    const data = await apiLogin(email, password);
    setUser(data.user);
    syncClaimsFromToken();
    return data;
  };

  const register = async (payload) => apiRegister(payload);

  /**
   * Deliberately does NOT null `user` before navigating. Clearing it re-renders the
   * whole tree as signed-out while the browser is still fetching /login, which flashed
   * a stripped sidebar and a dashboard that could never load. The hard navigation
   * discards all React state anyway, so the overlay below is the only thing that needs
   * to change. `replace` keeps /dashboard out of history, so Back can't return to it.
   */
  const logout = async () => {
    setLoggingOut(true);
    try {
      await apiLogout();
    } finally {
      window.location.replace("/login");
    }
  };

  const updateDevTenant = (subdomain) => {
    setDevTenant(subdomain);
    window.location.reload();
  };

  const value = useMemo(
    () => ({
      user,
      sessionClaims,
      tenantSubdomain,
      tenantInfo,
      tenantError,
      tenantHost: tenantSubdomain ? getTenantDisplayHost(tenantSubdomain) : "",
      hasTenantSubdomain: Boolean(tenantSubdomain),
      loading,
      isAuthenticated: Boolean(user),
      accessToken,
      login,
      register,
      logout,
      refreshUser,
      establishSession,
      updateDevTenant,
      resolveTenantContext,
    }),
    [user, sessionClaims, tenantSubdomain, tenantInfo, tenantError, loading, accessToken, resolveTenantContext, refreshUser, establishSession]
  );

  if (loggingOut) {
    return (
      <div
        className="flex min-h-dvh items-center justify-center bg-canvas"
        role="status"
        aria-label="Signing out"
      >
        <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-line-strong border-t-brand" />
        <span className="sr-only">Signing out…</span>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
