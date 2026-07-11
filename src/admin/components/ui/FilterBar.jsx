export default function FilterBar({ children, onClear, showClear = false, className = "" }) {
  return (
    <div className={`admin-filter-bar admin-card mt-6 ${className}`.trim()}>
      {children}
      {showClear && onClear ? (
        <button type="button" onClick={onClear} className="admin-btn-secondary ml-auto shrink-0">
          Clear filters
        </button>
      ) : null}
    </div>
  );
}
