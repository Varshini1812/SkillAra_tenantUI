import { useId, useRef } from "react";

/**
 * Segmented tabs for filtering one list in place.
 *
 * Implemented as a real `tablist` so it is announced as tabs and supports the
 * arrow-key navigation the pattern requires — a row of plain buttons looks the
 * same but tells assistive tech nothing about the grouping or the selection.
 *
 * tabs: [{ value, label, count }]
 */
export default function Tabs({ tabs = [], value, onChange, panelId, ariaLabel = "Filter" }) {
  const baseId = useId();
  const refs = useRef([]);

  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => String(t.value) === String(value))
  );

  const focusTab = (index) => {
    const next = (index + tabs.length) % tabs.length;
    onChange(tabs[next].value);
    refs.current[next]?.focus();
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      focusTab(activeIndex + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusTab(activeIndex - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusTab(0);
    } else if (e.key === "End") {
      e.preventDefault();
      focusTab(tabs.length - 1);
    }
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className="flex flex-wrap items-center gap-1 rounded-control border border-line bg-surface-sunken p-1"
    >
      {tabs.map((tab, i) => {
        const selected = String(tab.value) === String(value);
        return (
          <button
            key={tab.value || "all"}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            type="button"
            id={`${baseId}-tab-${i}`}
            aria-selected={selected}
            aria-controls={panelId}
            /* Roving tabindex: one stop for the whole group, arrows move within. */
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.value)}
            className={`inline-flex min-h-9 items-center gap-2 rounded-control px-3 text-sm font-medium transition-colors duration-200 ease-standard ${
              selected
                ? "border border-line bg-surface text-ink"
                : "border border-transparent text-ink-muted hover:bg-surface hover:text-ink"
            }`}
          >
            {tab.label}
            {typeof tab.count === "number" && (
              <span
                className={`tabular inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
                  selected ? "bg-brand text-brand-fg" : "bg-line text-ink-muted"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
