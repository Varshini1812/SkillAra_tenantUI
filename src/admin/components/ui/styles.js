/**
 * Shared class strings for the handful of places that style a raw element
 * rather than use a component from primitives.jsx — a bare `<input>` inside a
 * filter bar, a plain card wrapper, a submit button attached to a form by id.
 *
 * These are token-only. Do not add colour literals here.
 */

export const INPUT =
  "w-full rounded-control border border-line-strong bg-surface px-2.5 py-1.5 text-base sm:text-[0.8125rem] text-ink " +
  "transition-[border-color,box-shadow] duration-200 ease-standard " +
  "focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand-muted " +
  "disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:opacity-60";

/** Compact variant for toolbars, where 36px is the target height. */
export const INPUT_SM =
  "min-h-9 w-full rounded-control border border-line-strong bg-surface px-2.5 text-base sm:text-[0.8125rem] text-ink " +
  "transition-[border-color,box-shadow] duration-200 ease-standard " +
  "focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand-muted";

export const SELECT_SM =
  "min-h-9 w-full rounded-control border border-line-strong bg-surface px-2 text-[0.8125rem] text-ink " +
  "focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand-muted";

export const CARD = "rounded-surface border border-line bg-surface";

export const BTN_PRIMARY =
  "inline-flex min-h-9 items-center justify-center gap-2 rounded-control bg-brand px-4 text-sm " +
  "font-semibold text-brand-fg transition-colors duration-200 ease-standard " +
  "hover:bg-brand-hover active:bg-brand-active disabled:cursor-not-allowed disabled:opacity-50";

export const BTN_SECONDARY =
  "inline-flex min-h-9 items-center justify-center gap-2 rounded-control border border-line-strong " +
  "bg-surface px-3.5 text-sm font-medium text-ink-muted transition-colors duration-200 ease-standard " +
  "hover:bg-surface-sunken hover:text-ink disabled:cursor-not-allowed disabled:opacity-50";

/** Outer shell for a table: clips the corners and owns the border. */
export const TABLE_SHELL = "overflow-hidden rounded-surface border border-line bg-surface";

export const FILTER_SEARCH = "min-w-[200px] flex-1";
export const FILTER_SELECT = "min-w-[150px]";
