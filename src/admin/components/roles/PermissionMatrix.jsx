import { useMemo, useState } from "react";
import { TENANT_PERMISSION_MODULES } from "../../data/tenantRolesPermissions.js";
import Icon from "../ui/Icon.jsx";

export default function PermissionMatrix({
  permissions,
  onChange,
  readOnly = false,
  search = "",
  modules = TENANT_PERMISSION_MODULES,
}) {
  const [expanded, setExpanded] = useState(() =>
    Object.fromEntries(modules.map((m) => [m.id, true]))
  );

  const q = search.trim().toLowerCase();

  const modulesFiltered = useMemo(() => {
    if (!q) return modules;
    return modules.filter(
      (m) =>
        m.label.toLowerCase().includes(q) ||
        m.actions.some((a) => a.includes(q))
    );
  }, [q, modules]);

  const toggleModule = (moduleId, actions) => {
    if (readOnly) return;
    const current = permissions[moduleId] || [];
    const allSelected = actions.every((a) => current.includes(a));
    onChange({
      ...permissions,
      [moduleId]: allSelected ? [] : [...actions],
    });
  };

  const toggleAction = (moduleId, action) => {
    if (readOnly) return;
    const current = permissions[moduleId] || [];
    const next = current.includes(action)
      ? current.filter((a) => a !== action)
      : [...current, action];
    onChange({ ...permissions, [moduleId]: next });
  };

  const expandAll = (open) => {
    setExpanded(Object.fromEntries(modules.map((m) => [m.id, open])));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-ink-muted">Permission matrix</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => expandAll(true)} className="text-xs text-brand hover:text-brand-hover">
            Expand all
          </button>
          <button type="button" onClick={() => expandAll(false)} className="text-xs text-ink-subtle hover:text-ink-muted">
            Collapse all
          </button>
        </div>
      </div>

      <div className="max-h-[420px] space-y-2 overflow-y-auto rounded-surface border border-line bg-surface-sunken p-3">
        {modulesFiltered.map((mod) => {
          const selected = permissions[mod.id] || [];
          const allOn = mod.actions.every((a) => selected.includes(a));
          const someOn = selected.length > 0 && !allOn;
          const isOpen = expanded[mod.id];

          return (
            <div key={mod.id} className="rounded-control border border-line bg-surface">
              <div className="flex items-center gap-3 px-3 py-2.5">
                {!readOnly && (
                  <input
                    type="checkbox"
                    checked={allOn}
                    ref={(el) => {
                      if (el) el.indeterminate = someOn;
                    }}
                    onChange={() => toggleModule(mod.id, mod.actions)}
                    className="h-4 w-4 rounded border-line-strong bg-surface text-brand"
                  />
                )}
                <button
                  type="button"
                  onClick={() => setExpanded({ ...expanded, [mod.id]: !isOpen })}
                  className="flex flex-1 items-center justify-between text-left"
                >
                  <span className="text-sm font-medium text-ink">{mod.label}</span>
                  <span className="flex items-center gap-2 text-xs text-ink-subtle">
                    <span className="rounded-full bg-brand-muted px-2 py-0.5 text-brand">
                      {selected.length}/{mod.actions.length}
                    </span>
                    <Icon name={isOpen ? "chevronDown" : "chevronRight"} size={14} />
                  </span>
                </button>
              </div>
              {isOpen && (
                <div className="grid grid-cols-2 gap-2 border-t border-line px-3 py-3 sm:grid-cols-3 lg:grid-cols-4">
                  {mod.actions.map((action) => (
                    <label
                      key={action}
                      className={`flex cursor-pointer items-center gap-2 rounded-control px-2 py-1.5 text-xs capitalize ${
                        readOnly ? "text-ink-subtle" : "hover:bg-surface-sunken text-ink-muted"
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={readOnly}
                        checked={selected.includes(action)}
                        onChange={() => toggleAction(mod.id, action)}
                        className="h-3.5 w-3.5 rounded border-line-strong bg-surface text-brand"
                      />
                      {action.replace(/-/g, " ")}
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {modulesFiltered.length === 0 && (
          <p className="py-8 text-center text-sm text-ink-subtle">No permissions match your search.</p>
        )}
      </div>
    </div>
  );
}
