import { useEffect, useMemo, useState } from "react";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "../constants/pagination.js";

/**
 * Client-side pagination for filtered/sorted lists.
 * Resets to page 1 when resetDeps or pageSize changes.
 */
export function usePagination(items, { resetDeps = [], initialPageSize = DEFAULT_PAGE_SIZE } = {}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalItems = items?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    setPage(1);
  }, [pageSize, ...resetDeps]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pagedItems = useMemo(
    () => (items ?? []).slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize]
  );

  const setPageSizeAndReset = (nextSize) => {
    setPageSize(Number(nextSize));
    setPage(1);
  };

  return {
    page,
    setPage,
    pageSize,
    setPageSize: setPageSizeAndReset,
    totalPages,
    totalItems,
    pagedItems,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
  };
}
