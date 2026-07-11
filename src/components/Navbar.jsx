import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import DevTenantBanner from "./DevTenantBanner.jsx";
import { getTenantFromHostname } from "../utils/tenant.js";

const linkClass = ({ isActive }) =>
  `text-sm font-medium transition ${isActive ? "text-indigo-600" : "text-slate-600 hover:text-indigo-600"}`;

export default function Navbar() {
  const { user, tenantHost, tenantInfo, logout } = useAuth();
  const isPlainLocalhost =
    import.meta.env.DEV &&
    !getTenantFromHostname() &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  return (
    <header className="border-b border-slate-200 bg-white">
      {isPlainLocalhost && (
        <div className="border-b border-amber-100 bg-amber-50 px-4 py-3">
          <DevTenantBanner />
        </div>
      )}
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="text-xl font-bold text-indigo-600">
          SkillAra
        </Link>

        <nav className="flex items-center gap-6">
          <NavLink to="/courses" className={linkClass}>
            Courses
          </NavLink>
          {user && (
            <NavLink to="/my-learning" className={linkClass}>
              My Learning
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {tenantHost && (
            <span className="hidden rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 sm:inline">
              {tenantInfo?.tenant_name || tenantHost}
            </span>
          )}
          {user ? (
            <>
              <span className="text-sm text-slate-600">{user.email}</span>
              <button
                onClick={logout}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-indigo-600">
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
