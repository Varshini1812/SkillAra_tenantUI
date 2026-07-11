import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { applyTenantAccessToken } from "../../api/tenantSessionRefresh.js";
import api, {
  clearAccessToken,
  getAccessToken,
  getData,
  refreshAccessToken,
} from "../api/client.js";
import { decodeJwtClaims } from "../../lib/jwtClaims.js";

async function getMe() {
  const res = await api.get("/api/auth/me");
  return getData(res);
}

async function logoutRequest() {
  try {
    await api.post("/api/auth/logout");
  } finally {
    clearAccessToken();
  }
}

async function loginRequest(email, password) {
  const res = await api.post("/api/auth/login", { email, password });
  const data = getData(res);
  if (data?.accessToken) applyTenantAccessToken(data.accessToken);
  return data;
}

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [sessionClaims, setSessionClaims] = useState(null);
  const [loading, setLoading] = useState(true);

  const syncClaims = useCallback(() => {
    setSessionClaims(decodeJwtClaims(getAccessToken()));
  }, []);

  const establishSession = useCallback(
    (data) => {
      if (data?.accessToken) applyTenantAccessToken(data.accessToken);
      if (data?.user) setUser(data.user);
      syncClaims();
      setLoading(false);
    },
    [syncClaims]
  );

  const refresh = useCallback(async () => {
    try {
      if (getAccessToken()) {
        const data = await getMe();
        setUser(data?.user || data);
        syncClaims();
        return;
      }

      const refreshed = await refreshAccessToken();
      if (!refreshed?.accessToken) {
        setUser(null);
        setSessionClaims(null);
        return;
      }
      const data = await getMe();
      setUser(data?.user || data);
      syncClaims();
    } catch {
      try {
        const refreshed = await refreshAccessToken();
        if (!refreshed?.accessToken) throw new Error("refresh failed");
        const data = await getMe();
        setUser(data?.user || data);
        syncClaims();
      } catch {
        setUser(null);
        setSessionClaims(null);
      }
    } finally {
      setLoading(false);
    }
  }, [syncClaims]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email, password) => {
    const data = await loginRequest(email, password);
    establishSession(data);
    return data;
  };

  const logout = async () => {
    await logoutRequest();
    setUser(null);
    setSessionClaims(null);
  };

  const value = useMemo(
    () => ({
      user,
      sessionClaims,
      loading,
      isAuthenticated: Boolean(user),
      login,
      logout,
      refresh,
      establishSession,
    }),
    [user, sessionClaims, loading, refresh, establishSession]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
