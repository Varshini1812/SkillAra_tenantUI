import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar, { useSidebarCollapsed } from "./Sidebar.jsx";
import Icon from "./ui/Icon.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { useTenantBranding } from "../hooks/useTenantBranding.js";

const PAGE_TITLES = {
  "/admin": "Dashboard",
  "/admin/courses": "Courses",
  "/admin/enrollment-requests": "Access requests",
  "/admin/content-reviews": "Content reviews",
  "/admin/monitoring": "Community monitoring",
  "/admin/mentorship": "Mentorship queue",
  "/admin/users": "Users",
  "/admin/roles": "Roles and permissions",
  "/admin/master-data": "Master data",
  "/admin/profile": "My profile",
};

export default function AdminLayout() {
  const { tenantName } = useTenantBranding();
  const { pathname } = useLocation();
  const [collapsed, toggleCollapsed] = useSidebarCollapsed();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mainRef = useRef(null);

  const pageTitle = PAGE_TITLES[pathname] || "Admin";
  useDocumentTitle(`${pageTitle} · ${tenantName} Admin`);

  /* Move focus to the main region after a route change so screen reader users
     land on the new content rather than back at the top of the document
     (`focus-on-route-change`). */
  useEffect(() => {
    mainRef.current?.focus();
  }, [pathname]);

  /* The shell owns scrolling: <main> is the only scroll container. Locking the
     body while the shell is mounted guarantees a single scrollbar whatever a
     page renders, and it is restored on unmount so the learner app — a normal
     scrolling document — is unaffected. */
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div className="slim-scroll font-sans flex h-dvh overflow-hidden bg-canvas text-ink">
      <a
        href="#admin-main"
        className="sr-only z-[100] focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:rounded-control focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-fg"
      >
        Skip to main content
      </a>

      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={toggleCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile only: the sidebar is off-canvas below lg, so the menu needs a
            way in. On desktop there is no header — the page's own <PageHeader>
            carries the title, and an empty bar was just wasted height. */}
        <div className="flex h-12 shrink-0 items-center gap-2.5 border-b border-line bg-surface px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-line bg-surface text-ink-muted transition-colors duration-200 ease-standard hover:bg-surface-sunken hover:text-ink"
          >
            <Icon name="menu" size={17} />
          </button>
          <p className="truncate text-[0.8125rem] font-semibold text-ink">{pageTitle}</p>
        </div>

        <main
          id="admin-main"
          ref={mainRef}
          tabIndex={-1}
          className="min-h-0 flex-1 overflow-y-auto p-4 focus:outline-none sm:p-5 lg:p-6"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
