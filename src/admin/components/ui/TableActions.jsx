const VARIANTS = {
  view: "admin-table-action admin-table-action-view",
  edit: "admin-table-action admin-table-action-edit",
  success: "admin-table-action admin-table-action-success",
  warn: "admin-table-action admin-table-action-warn",
  muted: "admin-table-action admin-table-action-muted",
};

export function TableAction({ children, onClick, variant = "muted", disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={VARIANTS[variant] || VARIANTS.muted}
    >
      {children}
    </button>
  );
}

export function TableActions({ children }) {
  return <div className="flex flex-wrap items-center justify-end gap-1.5">{children}</div>;
}
