import { useId } from "react";
import { PAGE_SIZE_OPTIONS } from "../../constants/pagination.js";
import Icon from "./Icon.jsx";

const BTN =
  "inline-flex min-h-9 min-w-9 items-center justify-center gap-1 rounded-control border " +
  "border-line-strong bg-surface px-3 text-sm text-ink-muted transition-colors duration-200 " +
  "ease-standard hover:bg-surface-sunken hover:text-ink disabled:cursor-not-allowed disabled:opacity-50";

export default function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  onPageChange,
  onPageSizeChange,
  itemLabel = "item",
}) {
  const sizeId = useId();
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);
  const label = totalItems === 1 ? itemLabel : `${itemLabel}s`;

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
    >
      <p className="text-sm text-ink-subtle">
        {totalItems === 0 ? (
          `0 ${label}`
        ) : (
          <>
            Showing <span className="tabular font-medium text-ink">{from}–{to}</span> of{" "}
            <span className="tabular font-medium text-ink">{totalItems}</span> {label}
          </>
        )}
      </p>

      <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor={sizeId} className="whitespace-nowrap text-sm text-ink-subtle">
            Rows per page
          </label>
          <select
            id={sizeId}
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="min-h-9 w-auto min-w-[4.5rem] rounded-control border border-line-strong bg-surface px-2 py-1.5 text-sm text-ink transition-[border-color,box-shadow] duration-200 ease-standard focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand-muted"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <span className="tabular whitespace-nowrap text-sm text-ink-subtle">
          Page {page} of {totalPages}
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(1)}
            className={BTN}
            aria-label="First page"
          >
            <Icon name="chevronsLeft" size={16} />
          </button>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className={BTN}
          >
            <Icon name="chevronLeft" size={16} />
            <span className="hidden sm:inline">Prev</span>
            <span className="sr-only sm:hidden">Previous page</span>
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className={BTN}
          >
            <span className="hidden sm:inline">Next</span>
            <span className="sr-only sm:hidden">Next page</span>
            <Icon name="chevronRight" size={16} />
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(totalPages)}
            className={BTN}
            aria-label="Last page"
          >
            <Icon name="chevronsRight" size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
}
