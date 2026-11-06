/**
 * COMPONENT: DataTable.jsx
 * WHAT IT DOES:
 *   Reusable table wrapper that standardizes headers, column styling,
 *   scroll handling, and empty placeholder states across all superuser views.
 *
 * PROPS:
 *   - icon: Emoji or icon displayed in the table top bar
 *   - title: Header label including total/filtered count
 *   - headers: Array of column header strings
 *   - isEmpty: Boolean indicating whether matching results exist
 *   - emptyMessage: Text shown when no rows match filter criteria
 *   - emptyIcon: Emoji displayed in the empty state
 *   - children: Table body <tr> rows rendered inside <tbody>
 */

import React from 'react';

export default function DataTable({
  icon = '📋',
  title = 'Records',
  headers = [],
  isEmpty = false,
  emptyMessage = 'No records found',
  emptyIcon = '📋',
  children,
}) {
  // FACULTY MAY ASK: How do you adjust the table header border or add zebra striping?
  // HOW TO CHANGE: In superuser.css, check the "thead th" and "tbody tr:nth-child(even)" rules.
  return (
    <div className="tw">
      <div className="th">
        <span>{icon}</span>
        <span>{title}</span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              {headers.map((h, idx) => (
                <th key={idx}>{h}</th>
              ))}
            </tr>
          </thead>
          {!isEmpty && <tbody>{children}</tbody>}
        </table>
      </div>

      {isEmpty && (
        <div className="empty">
          <div className="empty-i">{emptyIcon}</div>
          <p>{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}
