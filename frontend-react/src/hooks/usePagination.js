import { useState } from "react";

/**
 * Client-side pagination over an already-filtered list.
 *
 * The current page is clamped to the valid range on every render, so shrinking the
 * list (filtering, deleting) never leaves you on an empty page.
 * Call `setPage(1)` yourself when filters change.
 *
 * @returns {{ page, setPage, pageItems, total, totalPages, pageSize }}
 *          Spread everything except `pageItems` into <Pagination />, with
 *          `onPageChange={setPage}`.
 */
export function usePagination(items, pageSize = 10) {
  const [requestedPage, setPage] = useState(1);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(requestedPage, 1), totalPages);
  const pageItems = items.slice((page - 1) * pageSize, page * pageSize);

  return { page, setPage, pageItems, total, totalPages, pageSize };
}
