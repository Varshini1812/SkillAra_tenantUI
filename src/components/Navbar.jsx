import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import DevTenantBanner from "./DevTenantBanner.jsx";
import { getTenantFromHostname } from "../utils/tenant.js";

const linkClass = ({ isActive }) =>
  `block rounded-lg px-3 py-2 text-sm font-medium transition md:inline md:rounded-none md:px-0 md:py-0 ${
    isActive ? "bg-indigo-50 text-indigo-600 md:bg-transparent" : "text-slate-600 hover:text-indigo-600"
  }`;

export default function Navbar() {
  const { user, tenantHost, tenantInfo, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const isPlainLocalhost =
    import.meta.env.DEV &&
    !getTenantFromHostname() &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="border-b border-slate-200 bg-white">
      {isPlainLocalhost && (
        <div className="border-b border-amber-100 bg-amber-50 px-4 py-3">
          <DevTenantBanner />
        </div>
      )}
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:py-4">
        <Link to="/" className="shrink-0 text-xl font-bold text-indigo-600" onClick={closeMenu}>
          SkillAra
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <NavLink to="/courses" className={linkClass}>
            Courses
          </NavLink>
          {user && (
            <NavLink to="/my-learning" className={linkClass}>
              My Learning
            </NavLink>
          )}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {tenantHost && (
            <span className="hidden max-w-[160px] truncate rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 lg:inline">
              {tenantInfo?.tenant_name || tenantHost}
            </span>
          )}
          {user ? (
            <>
              <span className="hidden max-w-[180px] truncate text-sm text-slate-600 lg:inline">{user.email}</span>
              <button
                type="button"
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

        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 md:hidden"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-100 px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            <NavLink to="/courses" className={linkClass} onClick={closeMenu}>
              Courses
            </NavLink>
            {user && (
              <NavLink to="/my-learning" className={linkClass} onClick={closeMenu}>
                My Learning
              </NavLink>
            )}
          </nav>
          <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
            {tenantHost && (
              <p className="truncate text-xs font-medium text-indigo-700">
                {tenantInfo?.tenant_name || tenantHost}
              </p>
            )}
            {user ? (
              <>
                <p className="truncate text-sm text-slate-600">{user.email}</p>
                <button
                  type="button"
                  onClick={() => {
                    closeMenu();
                    logout();
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-center text-sm font-medium text-slate-700"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="rounded-lg bg-indigo-600 px-3 py-2 text-center text-sm font-medium text-white"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
