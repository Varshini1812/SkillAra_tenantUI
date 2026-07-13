import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";
import { isOrganizationOwner } from "../utils/tenantUsers.js";

const ADMIN_PORTAL_ROLES = new Set([
  "tenant_admin",
  "TENANT_ADMIN",
  "ORG_ADMIN",
  "org_admin",
]);

function canAccessAdminPortal(user, sessionClaims, allowedRoles) {
  if (isOrganizationOwner(user)) return true;
  const role = String(user?.role || sessionClaims?.role || "").toLowerCase();
  if (allowedRoles?.some((r) => String(r).toLowerCase() === role)) return true;
  return ADMIN_PORTAL_ROLES.has(role);
}

/**
 * UI route guard only — role checks here are NOT a security boundary.
 * The API enforces authorization on every request.
 */
export default function AdminProtectedRoute({ children, roles }) {
  const { user, sessionClaims, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !canAccessAdminPortal(user, sessionClaims, roles)) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
