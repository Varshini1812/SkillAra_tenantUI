import { useMemo, useState } from "react";
import { TENANT_PERMISSION_MODULES } from "../../data/tenantRolesPermissions.js";

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
        <p className="text-sm font-medium text-slate-700">Permission matrix</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => expandAll(true)} className="text-xs text-indigo-600 hover:text-indigo-700">
            Expand all
          </button>
          <button type="button" onClick={() => expandAll(false)} className="text-xs text-slate-500 hover:text-slate-700">
            Collapse all
          </button>
        </div>
      </div>

      <div className="max-h-[420px] space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
        {modulesFiltered.map((mod) => {
          const selected = permissions[mod.id] || [];
          const allOn = mod.actions.every((a) => selected.includes(a));
          const someOn = selected.length > 0 && !allOn;
          const isOpen = expanded[mod.id];

          return (
            <div key={mod.id} className="rounded-lg border border-slate-100 bg-white">
              <div className="flex items-center gap-3 px-3 py-2.5">
                {!readOnly && (
                  <input
                    type="checkbox"
                    checked={allOn}
                    ref={(el) => {
                      if (el) el.indeterminate = someOn;
                    }}
                    onChange={() => toggleModule(mod.id, mod.actions)}
                    className="h-4 w-4 rounded border-slate-300 bg-white text-indigo-600"
                  />
                )}
                <button
                  type="button"
                  onClick={() => setExpanded({ ...expanded, [mod.id]: !isOpen })}
                  className="flex flex-1 items-center justify-between text-left"
                >
                  <span className="text-sm font-medium text-slate-800">{mod.label}</span>
                  <span className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-indigo-600">
                      {selected.length}/{mod.actions.length}
                    </span>
                    {isOpen ? "▾" : "▸"}
                  </span>
                </button>
              </div>
              {isOpen && (
                <div className="grid grid-cols-2 gap-2 border-t border-slate-100 px-3 py-3 sm:grid-cols-3 lg:grid-cols-4">
                  {mod.actions.map((action) => (
                    <label
                      key={action}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs capitalize ${
                        readOnly ? "text-slate-500" : "hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={readOnly}
                        checked={selected.includes(action)}
                        onChange={() => toggleAction(mod.id, action)}
                        className="h-3.5 w-3.5 rounded border-slate-300 bg-white text-indigo-600"
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
          <p className="py-8 text-center text-sm text-slate-500">No permissions match your search.</p>
        )}
      </div>
    </div>
  );
}
