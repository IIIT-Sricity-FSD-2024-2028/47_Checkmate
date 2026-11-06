/**
 * ============================================================================
 * MODULAR CLIENT BILLING PAGE (Billing.jsx)
 * ============================================================================
 * Role: Client
 * Purpose:
 *   Billing & Invoices (port of client_billing.html — which had 4 hard-coded
 *   invoices; this version builds them from the client's real bookings):
 *     1. Connects to `useClientBillingData` for loading, filtering and payments.
 *     2. Assembles focused, reusable modular subcomponents:
 *         - <ClientTopbar>: Title + bell.
 *         - <EventsToastFeedback>: "Processing payment..." / "Payment Successful!".
 *         - <BillingStatsGrid>: Outstanding, Total Paid, Active Invoices.
 *         - <InvoiceTable>: Shared DataTable + TableToolbar + Pagination.
 *
 * Connected Backend Endpoints:
 *   - GET /bookings, GET /events
 * ============================================================================
 */

import React from "react";

// Stylesheets
import "../../styles/vendor.css";
import "../../styles/dashboard.css";
import "./client.css";

// Shared components
import ClientTopbar from "../../components/client/ClientTopbar";
import EventsToastFeedback from "../../components/vendor/EventsToastFeedback";

// Custom Data Hook
import useClientBillingData from "../../components/client/useClientBillingData";

// Modular Billing Subcomponents
import BillingStatsGrid from "../../components/client/BillingStatsGrid";
import InvoiceTable from "../../components/client/InvoiceTable";

function Billing() {
  const {
    loading, error, summary, filteredInvoices,
    searchTerm, setSearchTerm, statusFilter, setStatusFilter,
    payNow, payingId, toast, setToast,
  } = useClientBillingData();

  return (
    <div className="vendor-page">
      <ClientTopbar title="Billing & Invoices" subtitle="Manage your event payments and billing history" />

      <div className="vendor-content">
        {error && <div className="cl-client-error">{error}</div>}

        {/* ── Component 1: Payment feedback ── */}
        <EventsToastFeedback toast={toast} onClose={() => setToast(null)} />

        {/* ── Component 2: Summary cards ── */}
        <BillingStatsGrid summary={summary} loading={loading} />

        {/* ── Component 3: Invoice table ── */}
        <InvoiceTable
          invoices={filteredInvoices}
          loading={loading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          onPay={payNow}
          payingId={payingId}
        />
      </div>
    </div>
  );
}

export default Billing;
