import { NavLink } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";
import { getRoleLabel } from "../utils/roles.js";
import { PoweredBySkillAra } from "./SkillAraBrand.jsx";
import Icon from "./ui/Icon.jsx";

/**
 * Sidebar footer: profile, log out and the collapse toggle as three separate
 * controls, with the SkillAra credit beneath.
 *
 * Log out is a plain button rather than an item hidden inside a dropdown — one
 * click, always visible — and it sits below a divider in the danger colour so a
 * destructive action is never mistaken for navigation
 * (`destructive-nav-separation`).
 */
export default function SidebarFooter({ compact, onToggleCollapse, onNavigate }) {
  const { user, logout } = useAdminAuth();

  const name = user?.name || user?.email || "Account";
  const initial = (user?.name?.[0] || user?.email?.[0] || "?").toUpperCase();
  const role = getRoleLabel(user);

  const rowBase =
    "flex min-h-9 w-full items-center rounded-control border text-[0.8125rem] font-medium " +
    "transition-colors duration-200 ease-standard";

  return (
    <div className="shrink-0 border-t border-line p-2">
      <div className="space-y-0.5">
        <NavLink
          to="/admin/profile"
          onClick={onNavigate}
          title={compact ? `${name} · ${role}` : undefined}
          className={({ isActive }) =>
            [
              rowBase,
              compact ? "justify-center px-1" : "gap-2.5 px-2",
              isActive
                ? "border-brand-border bg-brand-subtle text-brand-hover"
                : "border-transparent text-ink-muted hover:bg-surface-sunken hover:text-ink",
            ].join(" ")
          }
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-brand-border bg-brand-subtle text-[0.6875rem] font-semibold text-brand-hover">
            {user?.profilePhoto ? (
              <img src={user.profilePhoto} alt="" className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </span>
          {compact ? (
            <span className="sr-only">
              My profile — {name}, {role}
            </span>
          ) : (
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate font-semibold leading-4 text-ink">{name}</span>
              <span className="block truncate text-[0.6875rem] leading-4 text-ink-subtle">
                {role}
              </span>
            </span>
          )}
        </NavLink>

        <button
          type="button"
          onClick={logout}
          title={compact ? "Log out" : undefined}
          className={[
            rowBase,
            "border-transparent text-danger hover:bg-danger-subtle",
            compact ? "justify-center px-1" : "gap-2.5 px-2",
          ].join(" ")}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center">
            <Icon name="logout" size={16} />
          </span>
          <span className={compact ? "sr-only" : ""}>Log out</span>
        </button>

        {/* Expanded, the collapse control lives beside the organization name at
            the top; collapsed, there is no room up there, so the way back out
            lives here. */}
        {compact && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-expanded={false}
            title="Expand sidebar"
            className={[
              rowBase,
              "hidden justify-center border-transparent px-1 text-ink-muted hover:bg-surface-sunken hover:text-ink lg:flex",
            ].join(" ")}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center">
              <Icon name="chevronsRight" size={16} />
            </span>
            <span className="sr-only">Expand sidebar</span>
          </button>
        )}
      </div>

      <div className="mt-2 border-t border-line pt-2">
        <PoweredBySkillAra compact={compact} />
      </div>
    </div>
  );
}
