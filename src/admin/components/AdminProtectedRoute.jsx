import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";
import { isOrganizationOwner } from "../utils/tenantUsers.js";
import { canAccessAdminPanel } from "../../utils/permissions.js";

/**
 * UI route guard only — NOT a security boundary. The API re-checks every request.
 *
 * Admission is decided by the permission matrix, not by a role name — keying on
 * ORG_ADMIN/TENANT_ADMIN used to lock out any custom role that legitimately held users:view,
 * because every such role reports the TUTOR tier.
 *
 * The gate names administrative permissions explicitly rather than asking whether any nav
 * item renders: dashboard:view and courses:view are part of the baseline every colleague
 * holds, so "has a visible menu entry" would have admitted learners.
 */
function canAccessAdminPortal(user) {
  if (isOrganizationOwner(user)) return true;
  return canAccessAdminPanel(user);
}

export default function AdminProtectedRoute({ children }) {
  const { user, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!canAccessAdminPortal(user)) return <Navigate to="/dashboard" replace />;

  return children;
}
