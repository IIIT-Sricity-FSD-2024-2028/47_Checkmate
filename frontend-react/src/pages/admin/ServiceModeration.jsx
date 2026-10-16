/**
 * ADMIN · SERVICE MODERATION (pages/admin/ServiceModeration.jsx)
 * Replaces legacy: front-end/pages/admin/service-moderation.html + SECTION 4 of
 * scripts/admin_js/admin.js.
 *
 * - Vendor packages (pending first), filterable by status and searchable by package / vendor /
 *   category, 10 per page.
 * - Stat cards: pending, approved, rejected.
 * - Review opens the package (price, capacity, description, resources, staff) with the same
 *   decision buttons as the row.
 * - Decisions -> PATCH /packages/:id/decision { status }:
 *     pending  -> Approve / Reject
 *     approved -> Terminate (sets rejected, takes it off the client marketplace)
 *     rejected -> Approve
 *
 * Differences from legacy: adds filter, search and pagination; decisions can also be made
 * from inside the review modal.
 */

import { useEffect, useMemo, useState } from "react";
import { Ban, Check, CheckCircle2, Clock, Eye, X, XCircle } from "lucide-react";

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
import { decidePackage, getPackages } from "../../services";
import { formatCurrency } from "../../utils/formatCurrency";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

// Packages without a status were created before moderation existed; treat them as pending.
const statusOf = (pkg) => String(pkg?.status || "pending").toLowerCase();

const inclusionCount = (pkg) => (pkg.resources || []).length + (pkg.staff || []).length;

function sortPendingFirst(packages) {
  return [...packages].sort(
    (a, b) => Number(statusOf(b) === "pending") - Number(statusOf(a) === "pending")
  );
}

/** The buttons that apply to a package in its current status. Shared by the row and the modal. */
function DecisionButtons({ pkg, onDecide, busy }) {
  const status = statusOf(pkg);
  return (
    <>
      {status !== "approved" && (
        <button
          type="button"
          className="ui-btn ui-btn--success"
          disabled={busy}
          onClick={() => onDecide(pkg, "approved")}
        >
          <Check size={14} /> Approve
        </button>
      )}
      {status === "pending" && (
        <button
          type="button"
          className="ui-btn ui-btn--danger"
          disabled={busy}
          onClick={() => onDecide(pkg, "rejected")}
        >
          <X size={14} /> Reject
        </button>
      )}
      {status === "approved" && (
        <button
          type="button"
          className="ui-btn ui-btn--danger"
          disabled={busy}
          onClick={() => onDecide(pkg, "rejected")}
        >
          <Ban size={14} /> Terminate
        </button>
      )}
    </>
  );
}

function PackageReviewModal({ pkg, onClose, onDecide, busy, error }) {
  return (
    <Modal
      open={Boolean(pkg)}
      title={pkg?.name || "Package Details"}
      onClose={onClose}
      width={620}
      footer={
        pkg && (
          <>
            <button type="button" className="ui-btn ui-btn--ghost" onClick={onClose} disabled={busy}>
              Close
            </button>
            <DecisionButtons pkg={pkg} onDecide={onDecide} busy={busy} />
          </>
        )
      }
    >
      {pkg && (
        <>
          <div className="detail-grid">
            <DetailField label="Vendor">{pkg.vendorName || pkg.vendorId || "Unknown"}</DetailField>
            <DetailField label="Status">
              <StatusBadge status={statusOf(pkg)} />
            </DetailField>
            <DetailField label="Category">{pkg.category || "Package"}</DetailField>
            <DetailField label="Price">
              <span className="detail-money">{formatCurrency(pkg.price)}</span>
            </DetailField>
            <DetailField label="Capacity">{pkg.capacity}</DetailField>
            <DetailField label="Duration">{pkg.duration ? `${pkg.duration} hrs` : null}</DetailField>
            <DetailField label="Description" wide>
              {pkg.desc}
            </DetailField>
          </div>

          <div className="detail-section">
            <h4>Included Resources</h4>
            <TagList items={pkg.resources} empty="No resources listed." />
          </div>
          <div className="detail-section">
            <h4>Required Staff</h4>
            <TagList items={pkg.staff} empty="No staff listed." />
          </div>

          {error && (
            <div className="admin-error" style={{ marginTop: 16 }}>
              {error}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}

function TagList({ items, empty }) {
  if (!items?.length) return <div className="cell-muted">{empty}</div>;
  return (
    <div className="tag-list">
      {items.map((item, i) => (
        <span className="tag" key={`${item}-${i}`}>
          {item}
        </span>
      ))}
    </div>
  );
}

function ServiceModeration() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");

  const [reviewId, setReviewId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getPackages()
      .then((data) => {
        if (!cancelled) setPackages(sortPendingFirst(data || []));
      })
      .catch((err) => {
        console.error("Failed to load packages:", err);
        if (!cancelled) setError("Could not load packages.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const count = (status) => packages.filter((p) => statusOf(p) === status).length;
    return { pending: count("pending"), approved: count("approved"), rejected: count("rejected") };
  }, [packages]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return packages.filter(
      (p) =>
        (statusFilter === "all" || statusOf(p) === statusFilter) &&
        (!q ||
          [p.name, p.vendorName, p.vendorId, p.category].some((v) =>
            String(v || "").toLowerCase().includes(q)
          ))
    );
  }, [packages, statusFilter, query]);

  const { pageItems, setPage, ...pagination } = usePagination(filtered, 10);

  const decide = async (pkg, status) => {
    setBusyId(pkg.id);
    setError("");
    try {
      const updated = await decidePackage(pkg.id, status);
      setPackages((prev) =>
        sortPendingFirst(prev.map((p) => (p.id === pkg.id ? { ...p, ...(updated || { status }) } : p)))
      );
    } catch (err) {
      console.error("Package decision failed:", err);
      setError(`Could not update ${pkg.name}: ${err?.message || "request failed"}.`);
    } finally {
      setBusyId(null);
    }
  };

  const onFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const columns = [
    { key: "name", header: "Package Name", className: "cell-highlight" },
    { key: "vendor", header: "Vendor", render: (p) => p.vendorName || p.vendorId || "Unknown Vendor" },
    { key: "category", header: "Category", render: (p) => p.category || "—" },
    { key: "price", header: "Price", render: (p) => formatCurrency(p.price) },
    { key: "inclusions", header: "Features", render: (p) => `${inclusionCount(p)} inclusions` },
    { key: "status", header: "Status", render: (p) => <StatusBadge status={statusOf(p)} /> },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (p) => (
        <div className="cell-actions">
          <button
            type="button"
            className="ui-btn ui-btn--ghost"
            onClick={() => {
              setError("");
              setReviewId(p.id);
            }}
          >
            <Eye size={14} /> Review
          </button>
          <DecisionButtons pkg={p} onDecide={decide} busy={busyId === p.id} />
        </div>
      ),
    },
  ];

  const statValue = (n) => (loading ? "-" : n);
  const reviewing = packages.find((p) => p.id === reviewId) || null;

  return (
    <div className="admin-service-moderation">
      <AdminTopBar title="Service Moderation" />

      <div className="content">
        {error && !reviewing && <div className="admin-error">{error}</div>}

        <div className="stats-grid stats-grid--three">
          <StatisticCard title="Pending Review" value={statValue(stats.pending)} icon={Clock} color="orange" />
          <StatisticCard title="Approved" value={statValue(stats.approved)} icon={CheckCircle2} color="green" />
          <StatisticCard title="Rejected" value={statValue(stats.rejected)} icon={XCircle} color="red" />
        </div>

        <div className="card admin-table-card">
          <TableToolbar
            title="Package Reviews"
            filters={[
              { label: "Status", value: statusFilter, options: STATUS_OPTIONS, onChange: onFilter(setStatusFilter) },
            ]}
            search={{ value: query, placeholder: "Search packages, vendors...", onChange: onFilter(setQuery) }}
          />
          <DataTable columns={columns} rows={pageItems} loading={loading} emptyMessage="No packages match your filters." />
          <Pagination {...pagination} onPageChange={setPage} />
        </div>
      </div>

      <PackageReviewModal
        pkg={reviewing}
        onClose={() => setReviewId(null)}
        onDecide={decide}
        busy={busyId === reviewId}
        error={error}
      />
    </div>
  );
}

export default ServiceModeration;
