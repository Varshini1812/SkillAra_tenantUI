import { PAGE_SIZE_OPTIONS } from "../../constants/pagination.js";

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
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);
  const label = totalItems === 1 ? itemLabel : `${itemLabel}s`;

  return (
    <div className="admin-pagination">
      <p className="admin-pagination-summary">
        {totalItems === 0
          ? `0 ${label}`
          : `Showing ${from}–${to} of ${totalItems} ${label}`}
      </p>

      <div className="admin-pagination-controls">
        <label className="admin-pagination-size">
          <span className="sr-only">Items per page</span>
          <span aria-hidden className="admin-pagination-size-label">
            Rows per page
          </span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="admin-input admin-pagination-select"
            aria-label="Items per page"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <span className="admin-pagination-page">
          Page {page} of {totalPages}
        </span>

        <div className="admin-pagination-buttons flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(1)}
            className="admin-pagination-btn inline-flex items-center justify-center p-1.5"
            aria-label="First page"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="admin-pagination-btn inline-flex items-center justify-center p-1.5"
            aria-label="Previous page"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="admin-pagination-btn inline-flex items-center justify-center p-1.5"
            aria-label="Next page"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(totalPages)}
            className="admin-pagination-btn inline-flex items-center justify-center p-1.5"
            aria-label="Last page"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
