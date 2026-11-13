/**
 * ADMIN · FINANCIAL PAYOUTS (pages/admin/FinancialPayouts.jsx)
 * Replaces legacy: front-end/pages/admin/admin-payouts.html.
 *
 * - Ledger of bookings from GET /bookings/commissions: what the client paid, the platform
 *   commission, and what the vendor is owed. Tabs: Pending / Settled / Refunded.
 * - Release Payout -> PATCH /bookings/:id/settle. The backend only allows it once the
 *   client has paid in full and the event is completed; otherwise the row shows why not
 *   (settleBlockReason, worked out by the backend).
 * - Refunded bookings (from Monitor Events -> Refund) are listed but no longer counted
 *   as commission earned or as money owed to the vendor.
 */

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, IndianRupee, RotateCcw } from "lucide-react";

import "../../styles/dashboard.css";
import "../../styles/admin.css";

import AdminTopBar from "../../components/admin/AdminTopBar";
import DetailField from "../../components/admin/DetailField";
import StatisticCard from "../../components/StatisticCard";
import Modal from "../../components/Modal";
import DataTable from "../../components/table/DataTable";
import TableToolbar from "../../components/table/TableToolbar";
import Pagination from "../../components/table/Pagination";

import { getBookingsCommissions, settleBookingPayout } from "../../services";
import { formatCurrency } from "../../utils/formatCurrency";
import { paginate } from "../../utils/paginate";

const TABS = [
  { value: "pending", label: "Pending" },
  { value: "settled", label: "Settled" },
  { value: "cancelled", label: "Refunded" },
];

const lower = (v) => String(v || "").toLowerCase();

// Which tab a booking belongs to.
function tabOf(booking) {
  if (lower(booking.status) === "cancelled" || booking.payoutStatus === "cancelled") return "cancelled";
  if (booking.payoutStatus === "settled") return "settled";
  return "pending";
}

function ReleaseModal({ booking, onClose, onConfirm, saving, error }) {
  return (
    <Modal
      open={Boolean(booking)}
      title="Release Vendor Payout"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="ui-btn ui-btn--ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="ui-btn ui-btn--success" onClick={onConfirm} disabled={saving}>
            <IndianRupee size={14} /> {saving ? "Releasing..." : "Release Payout"}
          </button>
        </>
      }
    >
      {booking && (
        <div className="detail-grid">
          <DetailField label="Booking">{booking.id}</DetailField>
          <DetailField label="Event">{booking.eventName}</DetailField>
          <DetailField label="Vendor">{booking.vendor}</DetailField>
          <DetailField label="Client Paid">{formatCurrency(booking.cost)}</DetailField>
          <DetailField label="Platform Commission">{formatCurrency(booking.commissionAmount)}</DetailField>
          <DetailField label="Vendor Receives">
            <span className="detail-money">{formatCurrency(booking.vendorPayoutAmount)}</span>
          </DetailField>
        </div>
      )}
      {error && (
        <div className="admin-error" style={{ marginTop: 16 }}>
          {error}
        </div>
      )}
    </Modal>
  );
}

function FinancialPayouts() {
  const [ledger, setLedger] = useState({ items: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [tab, setTab] = useState("pending");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const [releaseId, setReleaseId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [releaseError, setReleaseError] = useState("");

  // Load the ledger once, when the page opens.
  useEffect(() => {
    getBookingsCommissions()
      .then((data) => setLedger(data || { items: [], summary: {} }))
      .catch((err) => {
        console.error("Failed to load payouts:", err);
        setError("Could not load the payout ledger.");
      })
      .finally(() => setLoading(false));
  }, []);

  const bookings = ledger.items || [];
  const summary = ledger.summary || {};
  const countIn = (name) => bookings.filter((b) => tabOf(b) === name).length;

  const q = query.trim().toLowerCase();
  const filtered = bookings.filter(
    (b) =>
      tabOf(b) === tab &&
      (!q || [b.id, b.eventName, b.eventId, b.vendor, b.client].some((v) => lower(v).includes(q)))
  );
  const pageInfo = paginate(filtered, page);

  const release = async () => {
    setSaving(true);
    setReleaseError("");
    try {
      await settleBookingPayout(releaseId, { note: "Released from Financial Payouts" });
      // The totals change too, so fetch the whole ledger again.
      setLedger(await getBookingsCommissions());
      setReleaseId(null);
    } catch (err) {
      console.error("Payout release failed:", err);
      setReleaseError(err?.message || "Could not release the payout.");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: "id", header: "Booking" },
    {
      key: "event",
      header: "Event",
      render: (b) => (
        <>
          <div className="cell-highlight">{b.eventName}</div>
          <div className="cell-muted">{b.client}</div>
        </>
      ),
    },
    { key: "vendor", header: "Vendor" },
    { key: "cost", header: "Total", render: (b) => formatCurrency(b.cost) },
    { key: "commission", header: "Commission", render: (b) => formatCurrency(b.commissionAmount) },
    { key: "payout", header: "Vendor Gets", render: (b) => formatCurrency(b.vendorPayoutAmount) },
    {
      key: "actions",
      header: "Payout",
      align: "right",
      render: (b) => {
        if (tabOf(b) === "settled") return <span className="cell-muted">Settled {b.settledAt?.slice(0, 10)}</span>;
        if (tabOf(b) === "cancelled") {
          return (
            <span className="cell-muted">
              {b.refundedAmount > 0 ? `Refunded ${formatCurrency(b.refundedAmount)} to client` : "Cancelled before payment"}
            </span>
          );
        }
        if (b.settleBlockReason) return <span className="cell-muted">{b.settleBlockReason}</span>;
        return (
          <button
            type="button"
            className="ui-btn ui-btn--success"
            onClick={() => {
              setReleaseError("");
              setReleaseId(b.id);
            }}
          >
            <IndianRupee size={14} /> Release
          </button>
        );
      },
    },
  ];

  const money = (n) => (loading ? "-" : formatCurrency(n));

  return (
    <div className="admin-financial-payouts">
      <AdminTopBar title="Financial Payouts" />

      <div className="content">
        {error && <div className="admin-error">{error}</div>}

        <div className="stats-grid">
          <StatisticCard title="Owed to Vendors" value={money(summary.pendingVendorPayouts)} icon={Clock} color="orange" />
          <StatisticCard title="Paid to Vendors" value={money(summary.settledVendorPayouts)} icon={CheckCircle2} color="green" />
          <StatisticCard title="Commission Earned" value={money(summary.platformCommissionEarned)} icon={IndianRupee} color="pink" />
          <StatisticCard title="Refunded Bookings" value={loading ? "-" : countIn("cancelled")} icon={RotateCcw} color="red" />
        </div>

        <div className="card admin-table-card">
          <div className="admin-tabs">
            {TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                className={`admin-tab ${tab === t.value ? "admin-tab--active" : ""}`}
                onClick={() => {
                  setTab(t.value);
                  setPage(1);
                }}
              >
                {t.label} ({countIn(t.value)})
              </button>
            ))}
          </div>
          <TableToolbar
            title="Payout Ledger"
            search={{
              value: query,
              placeholder: "Search bookings, events, vendors...",
              onChange: (value) => {
                setQuery(value);
                setPage(1);
              },
            }}
          />
          <DataTable columns={columns} rows={pageInfo.items} loading={loading} emptyMessage="No bookings here." />
          <Pagination {...pageInfo} onPageChange={setPage} />
        </div>
      </div>

      <ReleaseModal
        booking={bookings.find((b) => b.id === releaseId) || null}
        onClose={() => setReleaseId(null)}
        onConfirm={release}
        saving={saving}
        error={releaseError}
      />
    </div>
  );
}

export default FinancialPayouts;
