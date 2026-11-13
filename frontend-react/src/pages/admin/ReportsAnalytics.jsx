/**
 * ADMIN · REPORTS & ANALYTICS (pages/admin/ReportsAnalytics.jsx)
 * Replaces legacy: front-end/pages/admin/report-analytics.html.
 *
 * Read-only. Loads every event and booking, then works the numbers out in the browser:
 *  - Stat cards: events, completed events, revenue and commission (refunded bookings
 *    don't count, the same rule the backend uses).
 *  - Bars: events per status, revenue per event type.
 *  - Event ledger filterable by type and searchable, 10 per page, with CSV export.
 */

import { useEffect, useState } from "react";
import { Calendar, CheckCircle2, Download, IndianRupee, Percent } from "lucide-react";

import "../../styles/dashboard.css";
import "../../styles/admin.css";

import AdminTopBar from "../../components/admin/AdminTopBar";
import StatisticCard from "../../components/StatisticCard";
import DataTable from "../../components/table/DataTable";
import TableToolbar from "../../components/table/TableToolbar";
import Pagination from "../../components/table/Pagination";
import StatusBadge from "../../components/vendor/StatusBadge";

import { getBookings, getEvents } from "../../services";
import { formatCurrency } from "../../utils/formatCurrency";
import { paginate } from "../../utils/paginate";

const STATUSES = ["pending", "approved", "confirmed", "live", "completed", "rejected", "cancelled"];

const lower = (v) => String(v || "").toLowerCase();
const isRefunded = (b) => lower(b.status) === "cancelled" || b.payoutStatus === "cancelled";
const sum = (list, field) => list.reduce((total, item) => total + Number(item[field] || 0), 0);

function Bar({ label, value, max, text }) {
  const width = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="bar-row">
      <div className="bar-row__label">
        <span style={{ textTransform: "capitalize" }}>{label}</span>
        <span>{text ?? value}</span>
      </div>
      <div className="bar">
        <div className="bar__fill" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

// Builds a CSV file from the rows and makes the browser download it.
function downloadCsv(events) {
  const quote = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = ["ID", "Name", "Type", "Client", "Date", "Budget", "Status"];
  const rows = events.map((e) => [e.id, e.name, e.type, e.client, e.date, e.budget, e.status].map(quote));
  const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");

  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  link.download = `events-report-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function ReportsAnalytics() {
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [typeFilter, setTypeFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  // Load events and bookings once, when the page opens.
  useEffect(() => {
    Promise.all([getEvents(), getBookings()])
      .then(([eventList, bookingList]) => {
        setEvents(eventList || []);
        setBookings(bookingList || []);
      })
      .catch((err) => {
        console.error("Failed to load report data:", err);
        setError("Could not load the report data.");
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Numbers for the cards and bars ──
  const earning = bookings.filter((b) => !isRefunded(b));
  const revenue = sum(earning, "cost");
  const commission = sum(earning, "commissionAmount");

  const perStatus = STATUSES.map((status) => ({
    status,
    count: events.filter((e) => lower(e.status) === status).length,
  }));
  const maxPerStatus = Math.max(0, ...perStatus.map((s) => s.count));

  // Revenue per event type: find each booking's event to learn its type.
  const revenueByType = {};
  earning.forEach((b) => {
    const type = events.find((e) => e.id === b.eventId)?.type || "Other";
    revenueByType[type] = (revenueByType[type] || 0) + Number(b.cost || 0);
  });
  const typeRows = Object.entries(revenueByType).sort((a, b) => b[1] - a[1]);
  const maxRevenue = Math.max(0, ...typeRows.map(([, amount]) => amount));

  // ── The table ──
  const types = [...new Set(events.map((e) => e.type).filter(Boolean))].sort();
  const typeOptions = [{ value: "all", label: "All Types" }, ...types.map((t) => ({ value: t, label: t }))];

  const q = query.trim().toLowerCase();
  const filtered = events.filter(
    (e) =>
      (typeFilter === "all" || e.type === typeFilter) &&
      (!q || [e.id, e.name, e.client, e.venue].some((v) => lower(v).includes(q)))
  );
  const pageInfo = paginate(filtered, page);

  const columns = [
    { key: "id", header: "Event ID" },
    { key: "name", header: "Event", className: "cell-highlight" },
    { key: "type", header: "Type" },
    { key: "client", header: "Client" },
    { key: "date", header: "Date" },
    { key: "budget", header: "Budget", render: (e) => formatCurrency(e.budget) },
    { key: "status", header: "Status", render: (e) => <StatusBadge status={lower(e.status)} /> },
  ];

  const show = (value) => (loading ? "-" : value);

  return (
    <div className="admin-reports">
      <AdminTopBar title="Reports & Analytics" />

      <div className="content">
        {error && <div className="admin-error">{error}</div>}

        <div className="stats-grid">
          <StatisticCard title="Total Events" value={show(events.length)} icon={Calendar} color="blue" />
          <StatisticCard
            title="Completed Events"
            value={show(events.filter((e) => lower(e.status) === "completed").length)}
            icon={CheckCircle2}
            color="green"
          />
          <StatisticCard title="Booked Revenue" value={show(formatCurrency(revenue))} icon={IndianRupee} color="purple" />
          <StatisticCard title="Commission Earned" value={show(formatCurrency(commission))} icon={Percent} color="pink" />
        </div>

        <div className="admin-dashboard-grid">
          <div className="card">
            <h3>Events by Status</h3>
            {perStatus.map((s) => (
              <Bar key={s.status} label={s.status} value={s.count} max={maxPerStatus} />
            ))}
          </div>
          <div className="card">
            <h3>Revenue by Event Type</h3>
            {typeRows.length === 0 && <div className="admin-empty">No bookings yet.</div>}
            {typeRows.map(([type, amount]) => (
              <Bar key={type} label={type} value={amount} max={maxRevenue} text={formatCurrency(amount)} />
            ))}
          </div>
        </div>

        <div className="card admin-table-card">
          <TableToolbar
            title="Event Ledger"
            filters={[
              {
                label: "Type",
                value: typeFilter,
                options: typeOptions,
                onChange: (value) => {
                  setTypeFilter(value);
                  setPage(1);
                },
              },
            ]}
            search={{
              value: query,
              placeholder: "Search events, clients...",
              onChange: (value) => {
                setQuery(value);
                setPage(1);
              },
            }}
          />
          <DataTable columns={columns} rows={pageInfo.items} loading={loading} emptyMessage="No events match." />
          <div className="log-footer">
            <Pagination {...pageInfo} onPageChange={setPage} />
            <button
              type="button"
              className="ui-btn ui-btn--ghost"
              disabled={filtered.length === 0}
              onClick={() => downloadCsv(filtered)}
            >
              <Download size={14} /> Export CSV ({filtered.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportsAnalytics;
