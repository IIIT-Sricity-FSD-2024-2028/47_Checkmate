/**
 * ADMIN · MONITOR EVENTS (pages/admin/MonitorEvents.jsx)
 * Replaces legacy: front-end/pages/admin/monitor-events.html + SECTION 3 of
 * scripts/admin_js/admin.js.
 *
 * - Event registry (pending first), filterable by status and searchable by event / client /
 *   vendor / id, 10 per page.
 * - Stat cards: pending, approved/confirmed, live, completed, cancelled/rejected.
 * - View opens the event details (venue, guests, budget, requested resources and staff).
 * - Approve (pending) -> PATCH /events/:id/status { status: "approved" }.
 * - Refund (approved/confirmed) -> asks for confirmation, then sets status "cancelled".
 *
 * Differences from legacy:
 * - Stat cards and the status filter use the statuses the backend actually stores
 *   (legacy had "Staff Assigned" / "Resources Allocated", which no event ever has).
 * - Refund needs confirming and is also offered for confirmed events, not just approved.
 */

import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, CheckCircle2, CheckSquare, Clock, Eye, Radio, RefreshCcw, XCircle } from "lucide-react";

import "../../styles/dashboard.css";
import "../../styles/admin.css";

import AdminTopBar from "../../components/admin/AdminTopBar";
import DetailField from "../../components/admin/DetailField";
import StatisticCard from "../../components/StatisticCard";
import Modal from "../../components/Modal";
import DataTable from "../../components/table/DataTable";
import TableToolbar from "../../components/table/TableToolbar";
import Pagination from "../../components/table/Pagination";
import StatusBadge from "../../components/vendor/StatusBadge";

import { usePagination } from "../../hooks/usePagination";
import { getEvents, updateEventStatus } from "../../services";
import { formatCurrency } from "../../utils/formatCurrency";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "confirmed", label: "Confirmed" },
  { value: "live", label: "Live" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

const REFUNDABLE = ["approved", "confirmed"];

const lower = (v) => String(v || "").toLowerCase();
const idNumber = (id) => parseInt(String(id).replace(/\D/g, ""), 10) || 0;

// Pending first, then by id.
function sortEvents(events) {
  return [...events].sort(
    (a, b) =>
      Number(lower(b.status) === "pending") - Number(lower(a.status) === "pending") ||
      idNumber(a.id) - idNumber(b.id)
  );
}

function EventDetailsModal({ event, onClose }) {
  const resources = event?.requestedResources || [];
  const staff = event?.requestedStaff || [];

  return (
    <Modal
      open={Boolean(event)}
      title="Event Details"
      onClose={onClose}
      width={620}
      footer={
        <button type="button" className="ui-btn ui-btn--ghost" onClick={onClose}>
          Close
        </button>
      }
    >
      {event && (
        <>
          <div className="detail-grid">
            <DetailField label="Event">
              {event.name} <span className="cell-muted">({event.id})</span>
            </DetailField>
            <DetailField label="Status">
              <StatusBadge status={lower(event.status)} />
            </DetailField>
            <DetailField label="Client">
              {event.client || "—"} {event.clientId && <span className="cell-muted">({event.clientId})</span>}
            </DetailField>
            <DetailField label="Vendor">{event.vendor}</DetailField>
            <DetailField label="Date">
              {event.date} {event.time}
            </DetailField>
            <DetailField label="Venue">{event.venue}</DetailField>
            <DetailField label="Guests">{event.guests ?? event.people}</DetailField>
            <DetailField label="Budget">
              <span className="detail-money">{formatCurrency(event.budget)}</span>
            </DetailField>
            {event.notes && (
              <DetailField label="Notes" wide>
                {event.notes}
              </DetailField>
            )}
          </div>

          <div className="detail-section">
            <h4>Requested Resources</h4>
            {resources.length === 0 ? (
              <div className="cell-muted">None requested.</div>
            ) : (
              <div className="tag-list">
                {resources.map((r, i) => (
                  <span className="tag" key={`${r.resourceId || r.resourceName}-${i}`}>
                    {r.resourceName} × {r.quantity || 1}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="detail-section">
            <h4>Requested Staff</h4>
            {staff.length === 0 ? (
              <div className="cell-muted">None requested.</div>
            ) : (
              <div className="tag-list">
                {staff.map((s, i) => (
                  <span className="tag" key={`${s.staffId || s.staffName}-${i}`}>
                    {s.staffName}
                    {s.role ? ` (${s.role})` : ""}
                  </span>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}

function RefundModal({ event, onClose, onConfirm, saving, error }) {
  return (
    <Modal
      open={Boolean(event)}
      title="Refund Event"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="ui-btn ui-btn--ghost" onClick={onClose} disabled={saving}>
            Keep Event
          </button>
          <button type="button" className="ui-btn ui-btn--danger" onClick={onConfirm} disabled={saving}>
            <RefreshCcw size={14} /> {saving ? "Refunding..." : "Cancel & Refund"}
          </button>
        </>
      }
    >
      {event && (
        <p className="modal-text">
          Cancel <strong>{event.name}</strong> ({event.id}) and refund {formatCurrency(event.budget)} to{" "}
          {event.client || "the client"}? The event will be marked <strong>cancelled</strong>.
        </p>
      )}
      {error && (
        <div className="admin-error" style={{ marginTop: 16 }}>
          {error}
        </div>
      )}
    </Modal>
  );
}

function MonitorEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");

  const [viewId, setViewId] = useState(null);
  const [refundId, setRefundId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getEvents()
      .then((data) => {
        if (!cancelled) setEvents(sortEvents(data || []));
      })
      .catch((err) => {
        console.error("Failed to load events:", err);
        if (!cancelled) setError("Could not load events.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const count = (...statuses) => events.filter((e) => statuses.includes(lower(e.status))).length;
    return {
      pending: count("pending"),
      approved: count("approved", "confirmed"),
      live: count("live"),
      completed: count("completed"),
      cancelled: count("cancelled", "rejected"),
    };
  }, [events]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter(
      (e) =>
        (statusFilter === "all" || lower(e.status) === statusFilter) &&
        (!q || [e.id, e.name, e.client, e.clientId, e.vendor].some((v) => lower(v).includes(q)))
    );
  }, [events, statusFilter, query]);

  const { pageItems, setPage, ...pagination } = usePagination(filtered, 10);

  const setStatus = async (event, status) => {
    setBusyId(event.id);
    setError("");
    try {
      const updated = await updateEventStatus(event.id, status);
      setEvents((prev) =>
        sortEvents(prev.map((e) => (e.id === event.id ? { ...e, ...(updated || { status }) } : e)))
      );
      return true;
    } catch (err) {
      console.error("Event status update failed:", err);
      setError(`Could not update ${event.name}: ${err?.message || "request failed"}.`);
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const confirmRefund = async () => {
    const event = events.find((e) => e.id === refundId);
    if (event && (await setStatus(event, "cancelled"))) setRefundId(null);
  };

  const onFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const columns = [
    { key: "id", header: "Event ID" },
    { key: "name", header: "Event Name", className: "cell-highlight" },
    {
      key: "client",
      header: "Client (ID)",
      render: (e) => (
        <>
          <div>{e.client || "—"}</div>
          <div className="cell-muted">{e.clientId || e.createdBy}</div>
        </>
      ),
    },
    { key: "date", header: "Date" },
    { key: "vendor", header: "Vendor", render: (e) => e.vendor || <span className="cell-muted">—</span> },
    { key: "status", header: "Status", render: (e) => <StatusBadge status={lower(e.status)} /> },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (e) => {
        const status = lower(e.status);
        return (
          <div className="cell-actions">
            <button type="button" className="ui-btn ui-btn--ghost" onClick={() => setViewId(e.id)}>
              <Eye size={14} /> View
            </button>
            {status === "pending" && (
              <button
                type="button"
                className="ui-btn ui-btn--success"
                disabled={busyId === e.id}
                onClick={() => setStatus(e, "approved")}
              >
                <CheckSquare size={14} /> Approve
              </button>
            )}
            {REFUNDABLE.includes(status) && (
              <button
                type="button"
                className="ui-btn ui-btn--danger"
                disabled={busyId === e.id}
                onClick={() => {
                  setError("");
                  setRefundId(e.id);
                }}
              >
                <RefreshCcw size={14} /> Refund
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const statValue = (n) => (loading ? "-" : n);

  return (
    <div className="admin-monitor-events">
      <AdminTopBar title="Monitor Events" />

      <div className="content">
        {error && <div className="admin-error">{error}</div>}

        <div className="stats-grid">
          <StatisticCard title="Pending" value={statValue(stats.pending)} icon={Clock} color="orange" />
          <StatisticCard title="Approved / Confirmed" value={statValue(stats.approved)} icon={CalendarCheck} color="blue" />
          <StatisticCard title="Live Now" value={statValue(stats.live)} icon={Radio} color="purple" />
          <StatisticCard title="Completed" value={statValue(stats.completed)} icon={CheckCircle2} color="green" />
          <StatisticCard title="Cancelled / Rejected" value={statValue(stats.cancelled)} icon={XCircle} color="red" />
        </div>

        <div className="card admin-table-card">
          <TableToolbar
            title="Event Registry"
            filters={[
              { label: "Status", value: statusFilter, options: STATUS_OPTIONS, onChange: onFilter(setStatusFilter) },
            ]}
            search={{ value: query, placeholder: "Search events, clients...", onChange: onFilter(setQuery) }}
          />
          <DataTable columns={columns} rows={pageItems} loading={loading} emptyMessage="No events match your filters." />
          <Pagination {...pagination} onPageChange={setPage} />
        </div>
      </div>

      <EventDetailsModal event={events.find((e) => e.id === viewId) || null} onClose={() => setViewId(null)} />
      <RefundModal
        event={events.find((e) => e.id === refundId) || null}
        onClose={() => setRefundId(null)}
        onConfirm={confirmRefund}
        saving={busyId === refundId}
        error={error}
      />
    </div>
  );
}

export default MonitorEvents;
