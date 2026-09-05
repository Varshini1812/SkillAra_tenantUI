const RESERVED = new Set(["www", "admin", "api"]);

/**
 * Hosting-platform domains that serve the app itself. `skillara-tenant-ui.vercel.app`
 * is the deployment, not a workspace called "skillara-tenant-ui", so hosts under
 * these always resolve to the root app (the workspace finder).
 */
const PLATFORM_DOMAINS = [
  "vercel.app",
  "netlify.app",
  "pages.dev",
  "onrender.com",
  "github.io",
  "web.app",
  "firebaseapp.com",
];

function isPlatformHost(host) {
  return PLATFORM_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
}

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

  if (isPlatformHost(host)) return null;

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

  if (import.meta.env.DEV) {
    return `${protocol}//${subdomain}.localhost${port ? `:${port}` : ""}`;
  }

  if (root) {
    const base = `${protocol}//${subdomain}.${root}`;
    return port && port !== "80" && port !== "443" ? `${base}:${port}` : base;
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

/** Subdomain used for tenant API calls — always from URL first. */
export function getActiveTenantSubdomain(devOverride = "") {
  const fromHost = getTenantFromHostname();
  if (fromHost) return fromHost;
  const dev = (devOverride || localStorage.getItem("skillara_admin_tenant") || localStorage.getItem("skillara_dev_tenant") || "").trim().toLowerCase();
  return dev;
}

export function getTenantSubdomain() {
  return getActiveTenantSubdomain();
}

export function setDevTenantSubdomain(sub) {
  if (sub) localStorage.setItem("skillara_admin_tenant", sub.trim().toLowerCase());
  else localStorage.removeItem("skillara_admin_tenant");
}

export function setDevTenant(sub) {
  if (sub) localStorage.setItem("skillara_dev_tenant", sub.trim().toLowerCase());
  else localStorage.removeItem("skillara_dev_tenant");
}
