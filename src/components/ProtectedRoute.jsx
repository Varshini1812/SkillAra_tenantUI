import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { can } from "../utils/permissions.js";

/**
 * UI route guard only — these checks are NOT a security boundary. The API re-checks every
 * request against the permission matrix.
 *
 * Prefer `requires` over `roles`. Role names are the legacy client-routing tier, and several
 * very different roles share one: Instructor, Mentor, Teaching Assistant, Support and Content
 * Reviewer all report TUTOR. Guarding on that let a mentor open the course-authoring screens
 * and only discover he could not create a course when the API rejected the save.
 *
 * @param {object} props
 * @param {[string, string] | [string, string][]} [props.requires] one `[moduleId, action]`
 *   pair, or several — the user needs ANY of them.
 * @param {string[]} [props.roles] legacy role-name allow-list; used only when `requires` is
 *   absent.
 */
export default function ProtectedRoute({ children, roles, requires }) {
  const { user, sessionClaims, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (requires) {
    const pairs = Array.isArray(requires[0]) ? requires : [requires];
    if (!pairs.some(([moduleId, action]) => can(user, moduleId, action))) {
      return <Navigate to="/dashboard" replace />;
    }
    return children;
  }

  if (roles) {
    const role = user?.role || sessionClaims?.role;
    if (!roles.includes(role)) return <Navigate to="/dashboard" replace />;
  }

  return children;
}
