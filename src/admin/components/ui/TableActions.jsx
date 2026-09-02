const BASE =
  "inline-flex min-h-8 items-center gap-1 rounded-control border px-2.5 text-[0.8125rem] " +
  "font-medium transition-colors duration-200 ease-standard " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const VARIANTS = {
  view: "border-brand-border bg-brand-subtle text-brand-hover hover:bg-brand-muted",
  edit: "border-brand-border bg-brand-subtle text-brand-hover hover:bg-brand-muted",
  success: "border-success-border bg-success-subtle text-success hover:bg-success-border",
  warn: "border-warning-border bg-warning-subtle text-warning hover:bg-warning-border",
  danger: "border-danger-border bg-danger-subtle text-danger hover:bg-danger-border",
  muted: "border-line-strong bg-surface text-ink-muted hover:bg-surface-sunken hover:text-ink",
};

export function TableAction({ children, onClick, variant = "muted", disabled = false, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${BASE} ${VARIANTS[variant] || VARIANTS.muted}`}
    >
      {children}
    </button>
  );
}

export function TableActions({ children }) {
  return (
    <div className="inline-flex flex-nowrap items-center justify-end gap-1.5">{children}</div>
  );
}
