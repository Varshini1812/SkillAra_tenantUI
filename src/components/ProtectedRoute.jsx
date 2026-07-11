import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * UI route guard only — role checks here are NOT a security boundary.
 * The API enforces authorization on every request.
 */
export default function ProtectedRoute({ children, roles }) {
  const { user, sessionClaims, loading } = useAuth();
  const role = user?.role || sessionClaims?.role;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(role)) return <Navigate to="/" replace />;

  return children;
}
