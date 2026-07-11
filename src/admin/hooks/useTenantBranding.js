import { useEffect, useState } from "react";
import { resolveTenant } from "../api/admin.js";
import { getTenantDisplayHost, getTenantSubdomain } from "../../utils/tenant.js";
import { getTenantLogoUrl } from "../utils/tenantLogo.js";

export function useTenantBranding() {
  const [tenant, setTenant] = useState(null);
  const subdomain = getTenantSubdomain();

  useEffect(() => {
    if (!subdomain) {
      setTenant(null);
      return;
    }

    resolveTenant(subdomain)
      .then((data) => setTenant(data?.tenant || null))
      .catch(() => setTenant(null));
  }, [subdomain]);

  return {
    loading: Boolean(subdomain) && !tenant,
    tenantName: tenant?.tenant_name || subdomain || "Your organization",
    logoUrl: getTenantLogoUrl(tenant?.logo),
    primaryColor: tenant?.branding?.primary_color || "#4F46E5",
    host: getTenantDisplayHost(subdomain),
    subdomain,
  };
}
