import { Link } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";
import { getTenantDisplayHost, getTenantSubdomain } from "../../utils/tenant.js";
import { getRoleLabel } from "../utils/roles.js";

export default function Dashboard() {
  const { user } = useAdminAuth();
  const tenant = getTenantSubdomain();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Organization dashboard</h1>
      <p className="mt-1 text-slate-500">
        {getTenantDisplayHost(tenant)} — {user?.email}
        {user ? (
          <span className="ml-2 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
            {getRoleLabel(user)}
          </span>
        ) : null}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link to="/admin/users" className="admin-card admin-card-interactive p-6">
          <h2 className="font-semibold text-slate-900">Manage users</h2>
          <p className="mt-1 text-sm text-slate-500">View students and tutors</p>
        </Link>
        <Link to="/admin/users/new" className="admin-card admin-card-interactive p-6">
          <h2 className="font-semibold text-slate-900">+ Create user</h2>
          <p className="mt-1 text-sm text-slate-500">Add a student or tutor account</p>
        </Link>
      </div>
    </div>
  );
}
