import React from "react";
import "../../styles/components/table.css";

/**
 * "Showing X to Y of Z" with Previous / Next buttons.
 * Pair with hooks/usePagination, which supplies every prop here.
 */
function Pagination({ page, pageSize, total, totalPages, onPageChange }) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="table-pagination">
      <div className="table-pagination__info">
        Showing {start} to {end} of {total}
      </div>
      <div className="table-pagination__buttons">
        <button
          type="button"
          className="ui-btn ui-btn--ghost"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>
        <button
          type="button"
          className="ui-btn ui-btn--ghost"
          disabled={page >= totalPages || total === 0}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Pagination;
