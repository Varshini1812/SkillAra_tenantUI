import { useEffect, useId, useRef, useState } from "react";
import Icon from "./Icon.jsx";
import { Button } from "./primitives.jsx";
import { INPUT_SM, SELECT_SM } from "./styles.js";

/**
 * Compact filter bar for list pages.
 *
 * A row of four or five side-by-side selects reads as noise and wraps badly at
 * narrow widths. Instead: search stays visible, every filter collapses behind a
 * single "Filters" button carrying a count, and whatever is actually applied
 * shows underneath as removable chips — so the current state is still readable
 * at a glance without the controls competing with the table
 * (`overflow-menu`, `chip-collection-reflow`).
 *
 * filters: [{ id, label, value, onChange, options: [{value,label}], defaultValue }]
 * sort:    { label, value, onChange, options }
 */
export default function FilterBar({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search",
  searchLabel = "Search",
  filters = [],
  sort,
  actions,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onPointer = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  const isApplied = (f) => String(f.value) !== String(f.defaultValue ?? "");
  const applied = filters.filter(isApplied);
  const appliedCount = applied.length;

  const clearAll = () => {
    filters.forEach((f) => f.onChange(f.defaultValue ?? ""));
    if (onSearchChange) onSearchChange("");
  };

  const anythingSet = appliedCount > 0 || Boolean(searchValue.trim());

  return (
    <div className={`mt-5 rounded-surface border border-line bg-surface p-2.5 ${className}`.trim()}>
      <div className="flex flex-wrap items-center gap-2">
        {onSearchChange && (
          <label className="min-w-[220px] flex-1">
            <span className="sr-only">{searchLabel}</span>
            <span className="relative block">
              <Icon
                name="search"
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle"
              />
              <input
                type="search"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className={`${INPUT_SM} pl-9`}
              />
            </span>
          </label>
        )}

        {filters.length > 0 && (
          <div className="relative" ref={rootRef}>
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls={open ? panelId : undefined}
              className={`inline-flex min-h-9 items-center gap-2 rounded-control border px-3 text-sm font-medium transition-colors duration-200 ease-standard ${
                appliedCount > 0
                  ? "border-brand-border bg-brand-subtle text-brand-hover"
                  : "border-line-strong bg-surface text-ink-muted hover:bg-surface-sunken hover:text-ink"
              }`}
            >
              <Icon name="filter" size={15} />
              Filters
              {appliedCount > 0 && (
                <span className="tabular inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-semibold text-brand-fg">
                  {appliedCount}
                </span>
              )}
              <Icon name={open ? "chevronUp" : "chevronDown"} size={14} />
            </button>

            {open && (
              <div
                id={panelId}
                className="absolute left-0 top-[calc(100%+0.5rem)] z-30 w-72 rounded-surface border border-line bg-surface p-3 shadow-pop"
              >
                <div className="space-y-3">
                  {filters.map((f) => (
                    <label key={f.id} className="block">
                      <span className="mb-1.5 block text-[0.8125rem] font-medium text-ink-muted">
                        {f.label}
                      </span>
                      <select
                        value={f.value}
                        onChange={(e) => f.onChange(e.target.value)}
                        className={SELECT_SM}
                      >
                        {f.options.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>

                {appliedCount > 0 && (
                  <div className="mt-3 border-t border-line pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => filters.forEach((f) => f.onChange(f.defaultValue ?? ""))}
                    >
                      Reset filters
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {sort && (
          <label className="min-w-[150px]">
            <span className="sr-only">{sort.label || "Sort by"}</span>
            <select value={sort.value} onChange={(e) => sort.onChange(e.target.value)} className={SELECT_SM}>
              {sort.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        )}

        {actions && <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>}
      </div>

      {/* Applied filters stay visible as chips so the list's current state is
          readable without opening the popover. */}
      {anythingSet && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <span className="text-xs font-medium text-ink-subtle">Applied</span>

          {searchValue.trim() && (
            <Chip label="Search" value={`"${searchValue.trim()}"`} onRemove={() => onSearchChange("")} />
          )}

          {applied.map((f) => (
            <Chip
              key={f.id}
              label={f.label}
              value={f.options.find((o) => String(o.value) === String(f.value))?.label ?? f.value}
              onRemove={() => f.onChange(f.defaultValue ?? "")}
            />
          ))}

          <button
            type="button"
            onClick={clearAll}
            className="ml-1 inline-flex min-h-7 items-center rounded-control px-2 text-xs font-semibold text-brand transition-colors duration-150 ease-standard hover:bg-brand-subtle"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

function Chip({ label, value, onRemove }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-line bg-surface-sunken py-0.5 pl-2.5 pr-1 text-xs text-ink-muted">
      <span className="truncate">
        <span className="text-ink-subtle">{label}:</span>{" "}
        <span className="font-medium text-ink">{value}</span>
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-ink-subtle transition-colors duration-150 ease-standard hover:bg-line hover:text-ink"
      >
        <Icon name="close" size={12} />
      </button>
    </span>
  );
}
