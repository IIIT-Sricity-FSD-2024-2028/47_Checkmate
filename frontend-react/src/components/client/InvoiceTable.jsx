/**
 * ============================================================================
 * INVOICE TABLE (InvoiceTable.jsx)
 * ============================================================================
 * Role: Data Table Section (Client Billing page)
 * Location: src/components/client/InvoiceTable.jsx
 *
 * Purpose:
 *   "Billing History" card built from the team's shared table components:
 *     - <TableToolbar>: title, Paid/Unpaid filter and search box
 *     - <DataTable>: columns are described as data (header + render function)
 *     - <Pagination> + usePagination(): 5 invoices per page
 *   Each row has an "Invoice" download button and, while a balance is left,
 *   a "Pay Now" button.
 *
 * Props:
 *   @param {Array} invoices - Filtered invoices
 *   @param {boolean} loading
 *   @param {string} searchTerm / onSearchChange
 *   @param {string} statusFilter / onStatusChange
 *   @param {Function} onPay - Pay Now handler
 *   @param {string|null} payingId - Disables Pay Now while a payment runs
 * ============================================================================
 */

import React from "react";
import { CreditCard, Download } from "lucide-react";
import DataTable from "../table/DataTable";
import TableToolbar from "../table/TableToolbar";
import Pagination from "../table/Pagination";
import { usePagination } from "../../hooks/usePagination";
import { downloadInvoice, invoiceStatus } from "./useClientBillingData";
import { formatDate, money } from "../../utils/clientHelpers";

const PAGE_SIZE = 5;

function InvoiceTable({ invoices, loading, searchTerm, onSearchChange, statusFilter, onStatusChange, onPay, payingId }) {
  const { pageItems, setPage, ...pagination } = usePagination(invoices, PAGE_SIZE);

  // FACULTY MAY ASK: How does DataTable know what to show in each cell?
  // HOW TO CHANGE: Each column has a `render(row)` function; add an object here to add a column.
  const columns = [
    { key: "number", header: "Invoice #", className: "col-id" },
    { key: "eventName", header: "Event" },
    { key: "issued", header: "Issue Date", render: (row) => formatDate(row.issued) },
    { key: "amount", header: "Amount", render: (row) => <strong>{money(row.amount)}</strong> },
    { key: "balance", header: "Balance", render: (row) => money(row.balance) },
    {
      key: "status",
      header: "Status",
      render: (row) => {
        const status = invoiceStatus(row);
        return <span className={`cl-badge cl-badge--${status.cls}`}>{status.text}</span>;
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (row) => (
        <div className="cl-btn-row cl-btn-row--end">
          <button type="button" className="cl-btn-sm cl-btn-ghost" onClick={() => downloadInvoice(row)}>
            <Download size={14} /> Invoice
          </button>
          {row.balance > 0 && (
            <button type="button" className="cl-btn-sm cl-btn-pink" disabled={payingId !== null} onClick={() => onPay(row)}>
              <CreditCard size={14} /> Pay Now
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="card">
      <TableToolbar
        title="Billing History"
        search={{
          value: searchTerm,
          // Go back to page 1 whenever the search changes
          onChange: (v) => { onSearchChange(v); setPage(1); },
          placeholder: "Search Invoice # or Event...",
        }}
        filters={[{
          label: "Filter invoices by payment status",
          value: statusFilter,
          onChange: (v) => { onStatusChange(v); setPage(1); },
          options: [
            { value: "All", label: "All Invoices" },
            { value: "unpaid", label: "Balance Due" },
            { value: "paid", label: "Paid in Full" },
          ],
        }]}
      />
      <DataTable columns={columns} rows={pageItems} loading={loading} emptyMessage="No invoices found." />
      <Pagination {...pagination} onPageChange={setPage} />
    </div>
  );
}

export default InvoiceTable;
