/**
 * ============================================================================
 * MODULAR VENDOR CLIENT ISSUES PAGE (ClientIssues.jsx)
 * ============================================================================
 * Role: Event Coordinator / Vendor  — route /vendor/issues
 * Purpose:
 *   Client <-> vendor bridge: inbox of issues reported on the vendor's events
 *   (from the client's Report Issue page or by staff):
 *     1. Connects to `useVendorIssuesData` (loads, filters, updates status).
 *     2. Assembles shared, reusable components:
 *         - <TopHeaderBar>: Title + number of open issues on the bell.
 *         - <EventsToastFeedback>: "Issue ISS003 marked as resolved."
 *         - <TableToolbar> + <DataTable> + <Pagination>: the issue table.
 *         - <IssueReportModal>: Full issue details (shared with the chat pages).
 *
 * Connected Backend Endpoints:
 *   - GET /events · GET /issues · PATCH /issues/:id
 * ============================================================================
 */

import React, { useState } from "react";
import { Eye } from "lucide-react";

// Stylesheets
import "../../styles/vendor.css";
import "../../styles/dashboard.css";
import "../../styles/bridge.css";
import "../client/client.css"; // IssueReportModal styles are shared with the client portal

// Shared components
import TopHeaderBar from "../../components/TopHeaderBar";
import EventsToastFeedback from "../../components/vendor/EventsToastFeedback";
import DataTable from "../../components/table/DataTable";
import TableToolbar from "../../components/table/TableToolbar";
import Pagination from "../../components/table/Pagination";
import IssueReportModal from "../../components/chat/IssueReportModal";
import { usePagination } from "../../hooks/usePagination";

// Custom Data Hook
import useVendorIssuesData, { normalizeStatus } from "../../components/vendor/useVendorIssuesData";
import { formatDate } from "../../utils/clientHelpers";

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
];

function ClientIssues() {
  const {
    loading, filteredIssues, totalCount, openCount,
    searchTerm, setSearchTerm, statusFilter, setStatusFilter,
    updateStatus, toast, setToast,
  } = useVendorIssuesData();

  const [openIssue, setOpenIssue] = useState(null);
  const { pageItems, setPage, ...pagination } = usePagination(filteredIssues, 8);

  // Column definitions for the shared DataTable
  const columns = [
    { key: "id", header: "Issue", className: "col-id" },
    { key: "title", header: "Title", className: "col-primary" },
    { key: "eventName", header: "Event" },
    { key: "reporter", header: "Reported By", render: (row) => `${row.reporter || "Unknown"} (${row.reporterRole || row.role || "—"})` },
    {
      key: "priority",
      header: "Priority",
      render: (row) => <span className={`issue-pill issue-pill--${String(row.priority || "low").toLowerCase()}`}>{row.priority || "Low"}</span>,
    },
    { key: "createdAt", header: "Reported", render: (row) => formatDate(row.createdAt) },
    {
      key: "status",
      header: "Status",
      align: "right",
      render: (row) => (
        <div className="issue-actions">
          {/* Changing the dropdown saves the new status straight away */}
          <select aria-label={`Status of ${row.id}`} value={normalizeStatus(row.status)}
            onChange={(e) => updateStatus(row.id, e.target.value)}>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button type="button" className="action-btn view" title="View issue" onClick={() => setOpenIssue(row)}>
            <Eye size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="vendor-page">
      <TopHeaderBar title="Client Issues" badge={openCount} />

      <div className="vendor-content">
        <EventsToastFeedback toast={toast} onClose={() => setToast(null)} />

        <div className="card">
          <TableToolbar
            title={`Issues on your events (${totalCount})`}
            search={{
              value: searchTerm,
              onChange: (v) => { setSearchTerm(v); setPage(1); },
              placeholder: "Search title, reporter or event...",
            }}
            filters={[{
              label: "Filter issues by status",
              value: statusFilter,
              onChange: (v) => { setStatusFilter(v); setPage(1); },
              options: [{ value: "All", label: "All Statuses" }, ...STATUS_OPTIONS],
            }]}
          />
          <DataTable columns={columns} rows={pageItems} loading={loading}
            emptyMessage="No issues have been reported on your events." />
          <Pagination {...pagination} onPageChange={setPage} />
        </div>

        <IssueReportModal issue={openIssue} onClose={() => setOpenIssue(null)} />
      </div>
    </div>
  );
}

export default ClientIssues;
