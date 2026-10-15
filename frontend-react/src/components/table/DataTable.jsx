import React from "react";
import "../../styles/components/table.css";

/**
 * Plain data table.
 *
 * @param {Array<{key: string, header: string, render?: (row) => React.ReactNode,
 *                align?: "left"|"right", className?: string}>} columns
 *        `render` defaults to `row[key]`.
 * @param {Array<Object>} rows
 * @param {(row) => string} rowKey - Defaults to `row.id`.
 * @param {boolean} loading
 * @param {string} emptyMessage
 */
function DataTable({
  columns,
  rows,
  rowKey = (row) => row.id,
  loading = false,
  emptyMessage = "No records found.",
}) {
  return (
    <div className="data-table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={col.align ? { textAlign: col.align } : undefined}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(loading || rows.length === 0) && (
            <tr>
              <td colSpan={columns.length} className="data-table__empty">
                {loading ? "Loading..." : emptyMessage}
              </td>
            </tr>
          )}
          {!loading &&
            rows.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={col.className}
                    style={col.align ? { textAlign: col.align } : undefined}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
