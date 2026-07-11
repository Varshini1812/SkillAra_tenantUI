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

        <div className="admin-pagination-buttons">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(1)}
            className="admin-pagination-btn"
            aria-label="First page"
          >
            «
          </button>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="admin-pagination-btn"
          >
            Prev
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="admin-pagination-btn"
          >
            Next
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(totalPages)}
            className="admin-pagination-btn"
            aria-label="Last page"
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
}
