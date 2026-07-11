const RESERVED = new Set(["www", "admin", "api"]);

export function getRootDomain() {
  return (import.meta.env.VITE_ROOT_DOMAIN || "").trim().toLowerCase();
}

/**
 * Extract tenant subdomain from the browser hostname.
 * Examples:
 *   acme.skillara.com  → acme
 *   acme.localhost     → acme  (local dev)
 *   skillara.com       → null  (marketing / org finder)
 *   localhost          → null  (plain local dev)
 */
export function getTenantFromHostname() {
  const host = window.location.hostname.toLowerCase();

  if (host.endsWith(".localhost")) {
    const sub = host.slice(0, -".localhost".length);
    if (sub && !sub.includes(".") && !RESERVED.has(sub)) return sub;
    return null;
  }

  if (host === "localhost" || host === "127.0.0.1" || /^[0-9.]+$/.test(host)) {
    return null;
  }

  const root = getRootDomain();
  if (root) {
    if (host === root) return null;
    if (host.endsWith(`.${root}`)) {
      const prefix = host.slice(0, -(root.length + 1));
      const sub = prefix.split(".")[0];
      if (sub && !RESERVED.has(sub)) return sub;
    }
    return null;
  }

  const parts = host.split(".");
  if (parts.length >= 3) {
    const sub = parts[0];
    if (!RESERVED.has(sub)) return sub;
  }
  return null;
}

export function isReservedSubdomain(sub) {
  return RESERVED.has(sub);
}

export function buildTenantUrl(subdomain) {
  const root = getRootDomain();
  const port = window.location.port;
  const protocol = window.location.protocol;

  if (root) {
    const base = `${protocol}//${subdomain}.${root}`;
    return port && port !== "80" && port !== "443" ? `${base}:${port}` : base;
  }

  if (import.meta.env.DEV) {
    return `${protocol}//${subdomain}.localhost${port ? `:${port}` : ""}`;
  }

  return `${protocol}//${subdomain}.${window.location.hostname}`;
}

export function getTenantDisplayHost(subdomain) {
  const root = getRootDomain();
  if (root) return `${subdomain}.${root}`;
  if (import.meta.env.DEV) return `${subdomain}.localhost`;
  return subdomain;
}

export function buildRootUrl(path = "/") {
  const root = getRootDomain();
  const port = window.location.port;
  const protocol = window.location.protocol;

  if (root) {
    const base = `${protocol}//${root}`;
    const withPort = port && port !== "80" && port !== "443" ? `${base}:${port}` : base;
    return `${withPort}${path}`;
  }

  if (import.meta.env.DEV) {
    return `${protocol}//localhost${port ? `:${port}` : ""}${path}`;
  }

  return path;
}

/** True when on root domain (skillara.com or plain localhost without tenant subdomain). */
export function isRootApp() {
  const fromHost = getTenantFromHostname();
  if (fromHost) return false;

  if (import.meta.env.DEV) {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      const devTenant =
        localStorage.getItem("skillara_dev_tenant") || import.meta.env.VITE_DEFAULT_TENANT;
      return !devTenant;
    }
  }

  return true;
}
