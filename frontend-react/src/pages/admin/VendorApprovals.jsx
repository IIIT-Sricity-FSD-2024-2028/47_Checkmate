/**
 * ADMIN · VENDOR APPROVALS (pages/admin/VendorApprovals.jsx)
 * Replaces legacy: front-end/pages/admin/vendor-approvals.html + SECTION 1 of
 * scripts/admin_js/admin.js.
 *
 * - Lists vendor applications (pending first), filterable by status and searchable by
 *   vendor name / business name / email, 10 per page.
 * - "Review" opens the application: business profile, submitted documents, optional note.
 *   Approve / Reject call PATCH /vendor-applications/:id/decision. Approving makes the
 *   backend create the vendor + user account, so it is not undoable from the UI.
 * - Processed applications open read-only (who/when decided, note).
 * - Deep links: ?review=<id> opens that application; ?action=review (legacy) opens the
 *   first pending one. The query param is cleared when the modal closes.
 */

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle, Eye, FileText, XCircle } from "lucide-react";

import "../../styles/dashboard.css";
import "../../styles/admin.css";

import AdminTopBar from "../../components/admin/AdminTopBar";
import Modal from "../../components/Modal";
import DataTable from "../../components/table/DataTable";
import TableToolbar from "../../components/table/TableToolbar";
import Pagination from "../../components/table/Pagination";
import StatusBadge from "../../components/vendor/StatusBadge";

import { usePagination } from "../../hooks/usePagination";
import { decideVendorApplication, getVendorApplications } from "../../services";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const DOC_ICON_COLORS = ["var(--pink)", "#3b82f6", "#10b981"];

// Pending first; otherwise keep server order.
function sortPendingFirst(apps) {
  return [...apps].sort(
    (a, b) => Number(b.status === "pending") - Number(a.status === "pending")
  );
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  return isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

function ReviewModal({ application, onClose, onDecide, saving, error }) {
  const [note, setNote] = useState("");
  const isPending = application?.status === "pending";
  const docs = application?.documents || [];

  return (
    <Modal
      open={Boolean(application)}
      title="Vendor Application Review"
      onClose={onClose}
      width={650}
      footer={
        isPending ? (
          <>
            <button type="button" className="ui-btn ui-btn--ghost" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button
              type="button"
              className="ui-btn ui-btn--danger"
              disabled={saving}
              onClick={() => onDecide("rejected", note)}
            >
              <XCircle size={15} /> Reject Application
            </button>
            <button
              type="button"
              className="ui-btn ui-btn--success"
              disabled={saving}
              onClick={() => onDecide("approved", note)}
            >
              <CheckCircle size={15} /> Approve Vendor
            </button>
          </>
        ) : (
          <button type="button" className="ui-btn ui-btn--ghost" onClick={onClose}>
            Close
          </button>
        )
      }
    >
      {application && (
        <>
          <div className="review-grid">
            <div className="review-section">
              <h4>Business Profile</h4>
              <div className="review-field">
                <strong>Business Name</strong>
                {application.businessName}
              </div>
              <div className="review-field">
                <strong>Primary Contact</strong>
                {application.vendorName} ({application.email})
                <br />
                {application.phone}
              </div>
              <div className="review-field">
                <strong>Service Category</strong>
                <span className="status-badge active">{application.category || "General"}</span>
              </div>
            </div>

            <div className="review-section">
              <h4>Submitted Documents</h4>
              <div className="doc-list">
                {docs.length === 0 && <div className="cell-muted">No documents submitted.</div>}
                {docs.map((doc, i) => (
                  <div className="doc-item" key={`${doc.name}-${i}`}>
                    <span className="doc-item__name">
                      <FileText size={17} style={{ color: DOC_ICON_COLORS[i % 3], flexShrink: 0 }} />
                      {doc.name}
                    </span>
                    <span className="doc-item__type">{doc.type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {isPending ? (
            <div className="modal-field" style={{ marginTop: 20, marginBottom: 0 }}>
              <label htmlFor="decision-note">Note (optional)</label>
              <textarea
                id="decision-note"
                value={note}
                placeholder="Reason for approval or rejection"
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          ) : (
            <div className="review-decided">
              <StatusBadge status={application.status} />{" "}
              {application.decidedAt && <>on {formatDateTime(application.decidedAt)}</>}
              {application.note && <div style={{ marginTop: 8 }}>Note: {application.note}</div>}
            </div>
          )}

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

function VendorApprovals() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");

  const [activeId, setActiveId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [decisionError, setDecisionError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getVendorApplications()
      .then((data) => {
        if (!cancelled) setApplications(sortPendingFirst(data || []));
      })
      .catch((err) => {
        console.error("Failed to load vendor applications:", err);
        if (!cancelled) setLoadError("Could not load vendor applications.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return applications.filter(
      (a) =>
        (statusFilter === "all" || a.status === statusFilter) &&
        (!q ||
          [a.vendorName, a.businessName, a.email].some((v) =>
            String(v || "").toLowerCase().includes(q)
          ))
    );
  }, [applications, statusFilter, query]);

  const { pageItems, setPage, ...pagination } = usePagination(filtered, 10);

  // Deep links are derived, not copied into state: ?review=<id> or legacy ?action=review.
  const reviewParam = searchParams.get("review");
  const legacyReview = searchParams.get("action") === "review";
  const hasDeepLink = Boolean(reviewParam || legacyReview);
  const deepLinked = loading
    ? null
    : reviewParam
      ? applications.find((a) => a.id === reviewParam)
      : legacyReview
        ? applications.find((a) => a.status === "pending")
        : null;

  const selectedId = activeId ?? deepLinked?.id ?? null;
  const activeApplication = applications.find((a) => a.id === selectedId) || null;

  const closeReview = () => {
    setActiveId(null);
    setDecisionError("");
    if (hasDeepLink) setSearchParams({}, { replace: true });
  };

  const decide = async (status, note) => {
    setSaving(true);
    setDecisionError("");
    try {
      const updated = await decideVendorApplication(selectedId, status, note.trim() || undefined);
      setApplications((prev) =>
        sortPendingFirst(
          prev.map((a) => (a.id === selectedId ? { ...a, ...(updated || { status }) } : a))
        )
      );
      closeReview();
    } catch (err) {
      console.error("Vendor decision failed:", err);
      setDecisionError(err?.message || "Could not save the decision. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: "vendorName", header: "Vendor Name", className: "cell-highlight" },
    { key: "businessName", header: "Business Name" },
    { key: "email", header: "Email" },
    { key: "phone", header: "Phone" },
    {
      key: "documents",
      header: "Documents",
      render: (a) => {
        const count = a.documents?.length || 0;
        return count > 0 ? (
          <span className="doc-count-badge">
            {count} file{count > 1 ? "s" : ""} uploaded
          </span>
        ) : (
          <span className="cell-muted">—</span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (a) => (
        <div className="cell-actions">
          <StatusBadge status={a.status} />
          <button
            type="button"
            className={`ui-btn ${a.status === "pending" ? "ui-btn--blue" : "ui-btn--ghost"}`}
            onClick={() => setActiveId(a.id)}
          >
            <Eye size={14} /> {a.status === "pending" ? "Review Application" : "View"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="admin-vendor-approvals">
      <AdminTopBar title="Vendor Approvals" />

      <div className="content">
        {loadError && <div className="admin-error">{loadError}</div>}

        <div className="card admin-table-card">
          <TableToolbar
            title="Vendor Applications"
            filters={[
              {
                label: "Status",
                value: statusFilter,
                options: STATUS_OPTIONS,
                onChange: (v) => {
                  setStatusFilter(v);
                  setPage(1);
                },
              },
            ]}
            search={{
              value: query,
              placeholder: "Search vendors...",
              onChange: (v) => {
                setQuery(v);
                setPage(1);
              },
            }}
          />
          <DataTable
            columns={columns}
            rows={pageItems}
            loading={loading}
            emptyMessage="No vendor applications match your filters."
          />
          <Pagination {...pagination} onPageChange={setPage} />
        </div>
      </div>

      <ReviewModal
        key={selectedId || "none"}
        application={activeApplication}
        onClose={closeReview}
        onDecide={decide}
        saving={saving}
        error={decisionError}
      />
    </div>
  );
}

export default VendorApprovals;
