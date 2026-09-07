const RESERVED = new Set(["www", "admin", "api"]);

/**
 * A workspace slug is a single DNS label. Validating it here stops a malformed
 * value — most often a URL path that leaked into ?tenant= — from being stored
 * and then replayed on every subsequent page load.
 */
const SUBDOMAIN_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

function isValidSubdomain(sub) {
  return Boolean(sub) && SUBDOMAIN_RE.test(sub) && !RESERVED.has(sub);
}

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

/**
 * Workspace selected by `?tenant=acme` rather than by hostname.
 *
 * Subdomain routing needs a wildcard domain (*.skillara.com). On a bare
 * hosting URL like skillara-tenant-ui.vercel.app there are no subdomains to
 * be had, so a single origin has to serve every workspace. The value is
 * remembered so the choice survives in-app navigation and reloads.
 */
const TENANT_QUERY_KEY = "tenant";
const TENANT_STORAGE_KEY = "skillara_active_tenant";

function readTenantParam() {
  try {
    const raw = new URLSearchParams(window.location.search).get(TENANT_QUERY_KEY);
    const sub = String(raw || "").trim().toLowerCase();
    return isValidSubdomain(sub) ? sub : null;
  } catch {
    return null;
  }
}

export function getTenantOverride() {
  const fromQuery = readTenantParam();
  if (fromQuery) {
    try {
      localStorage.setItem(TENANT_STORAGE_KEY, fromQuery);
    } catch {
      // private mode — the query param still carries this page load
    }
    return fromQuery;
  }
  try {
    const stored = String(localStorage.getItem(TENANT_STORAGE_KEY) || "").trim().toLowerCase();
    if (isValidSubdomain(stored)) return stored;
    // A value stored before this validation existed (e.g. "acme-bootcamp/login")
    // would otherwise break every load until the user cleared their site data.
    if (stored) localStorage.removeItem(TENANT_STORAGE_KEY);
    return null;
  } catch {
    return null;
  }
}

export function clearTenantOverride() {
  try {
    localStorage.removeItem(TENANT_STORAGE_KEY);
  } catch {
    // nothing to clear
  }
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

  for (const domain of PLATFORM_DOMAINS) {
    if (host.endsWith(`.${domain}`)) {
      const prefix = host.slice(0, -(domain.length + 1));
      if (!prefix.includes(".")) return null;
      const sub = prefix.split(".")[0];
      if (sub && !RESERVED.has(sub)) return sub;
      return null;
    }
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

/**
 * `path` is built in here rather than appended by the caller.
 */
export function buildTenantUrl(subdomain, path = "/") {
  const root = getRootDomain();
  const port = window.location.port;
  const protocol = window.location.protocol;
  const host = window.location.hostname.toLowerCase();
  const suffix = path.startsWith("/") ? path : `/${path}`;

  if (import.meta.env.DEV) {
    return `${protocol}//${subdomain}.localhost${port ? `:${port}` : ""}${suffix}`;
  }

  if (root) {
    const base = `${protocol}//${subdomain}.${root}`;
    const withPort = port && port !== "80" && port !== "443" ? `${base}:${port}` : base;
    return `${withPort}${suffix}`;
  }

  for (const domain of PLATFORM_DOMAINS) {
    if (host.endsWith(`.${domain}`)) {
      const parts = host.split(".");
      const baseAppHost = parts.length >= 3 ? parts.slice(-3).join(".") : host;
      return `${protocol}//${subdomain}.${baseAppHost}${suffix}`;
    }
  }

  return `${protocol}//${subdomain}.${host}${suffix}`;
}

export function getTenantDisplayHost(subdomain) {
  const root = getRootDomain();
  if (root) return `${subdomain}.${root}`;
  if (import.meta.env.DEV) return `${subdomain}.localhost`;
  const host = window.location.hostname.toLowerCase();
  for (const domain of PLATFORM_DOMAINS) {
    if (host.endsWith(`.${domain}`)) {
      const parts = host.split(".");
      const baseAppHost = parts.length >= 3 ? parts.slice(-3).join(".") : host;
      return `${subdomain}.${baseAppHost}`;
    }
  }
  return `${subdomain}.${host}`;
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

  // Without a wildcard domain the workspace can only come from ?tenant=.
  if (getTenantOverride()) return false;

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
  const override = getTenantOverride();
  if (override) return override;
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
