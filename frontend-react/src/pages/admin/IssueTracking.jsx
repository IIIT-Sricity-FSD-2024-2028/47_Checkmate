/**
 * ADMIN · ISSUE TRACKING (pages/admin/IssueTracking.jsx)
 * Replaces legacy: front-end/pages/admin/issue-tracking.html (inline script).
 *
 * - Support tickets, sorted open -> investigating -> resolved, newest first within each.
 *   Filterable by status and by who the ticket is addressed to (admin / vendor), searchable
 *   by subject / reporter / event / id, 10 per page.
 * - Stat cards: open, investigating, resolved.
 * - Workflow: Open --Investigate--> Investigating --Resolve--> Resolved
 *   via PATCH /issues/:id { status }.
 * - Each status change also drops a "System" message into the reporter's support chat.
 *   The backend does that (IssuesService.update), so it can't be lost or overwritten.
 * - "Message Reporter" opens their conversation in the Coordination Hub.
 *
 * Differences from legacy:
 * - Legacy only listed tickets addressed to admin (target === "admin"); this page shows all
 *   tickets with an "Addressed To" filter, so admins can oversee vendor-handled issues too.
 * - Buttons are named for what they do (legacy's "Resolve" moved a ticket to investigating).
 * - "in_progress" (used by the vendor portal) is treated as Investigating.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowDown, ArrowUp, CheckCircle2, Eye, MessageSquare, Minus, Search, Wrench } from "lucide-react";

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

import { getIssues, patchIssue } from "../../services";
import { paginate } from "../../utils/paginate";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "open", label: "Open" },
  { value: "investigating", label: "Investigating" },
  { value: "resolved", label: "Resolved" },
];

const TARGET_OPTIONS = [
  { value: "all", label: "Addressed To: All" },
  { value: "admin", label: "Admin" },
  { value: "vendor", label: "Vendor" },
];

const STATUS_ORDER = { open: 0, investigating: 1, resolved: 2 };

const lower = (v) => String(v || "").toLowerCase();

// Collapse the different spellings the portals use into three workflow states.
function statusOf(issue) {
  const s = lower(issue.status) || "open";
  if (s === "in_progress" || s === "in progress") return "investigating";
  if (s === "closed") return "resolved";
  return s;
}

function sortIssues(issues) {
  return [...issues].sort(
    (a, b) =>
      (STATUS_ORDER[statusOf(a)] ?? 3) - (STATUS_ORDER[statusOf(b)] ?? 3) ||
      new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
}

function Priority({ value }) {
  const p = lower(value);
  const [Icon, tone] =
    p === "critical" || p === "high" ? [ArrowUp, "high"] : p === "medium" ? [Minus, "medium"] : [ArrowDown, "low"];
  return (
    <span className={`priority priority--${tone}`}>
      <Icon size={14} /> {value || "Low"}
    </span>
  );
}

function RoleTag({ role }) {
  const r = lower(role);
  if (!["vendor", "staff", "client"].includes(r)) return null;
  return <span className={`role-tag role-tag--${r}`}>{r}</span>;
}

/** The next workflow step for an issue, shared by the row and the modal. */
function NextStepButton({ issue, onAdvance, busy }) {
  const status = statusOf(issue);
  if (status === "open") {
    return (
      <button type="button" className="ui-btn ui-btn--blue" disabled={busy} onClick={() => onAdvance(issue, "investigating")}>
        <Search size={14} /> Investigate
      </button>
    );
  }
  if (status === "investigating") {
    return (
      <button type="button" className="ui-btn ui-btn--success" disabled={busy} onClick={() => onAdvance(issue, "resolved")}>
        <Wrench size={14} /> Resolve
      </button>
    );
  }
  return null;
}

function IssueDetailsModal({ issue, onClose, onAdvance, busy, error }) {
  return (
    <Modal
      open={Boolean(issue)}
      title={issue ? `Ticket ${issue.id}` : "Ticket"}
      onClose={onClose}
      width={600}
      footer={
        issue && (
          <>
            <button type="button" className="ui-btn ui-btn--ghost" onClick={onClose} disabled={busy}>
              Close
            </button>
            {issue.email && (
              <Link className="ui-btn ui-btn--ghost" to={`/admin/coordination?email=${encodeURIComponent(issue.email)}`}>
                <MessageSquare size={14} /> Message Reporter
              </Link>
            )}
            <NextStepButton issue={issue} onAdvance={onAdvance} busy={busy} />
          </>
        )
      }
    >
      {issue && (
        <>
          <div className="detail-grid">
            <DetailField label="Subject" wide>
              {issue.title}
            </DetailField>
            <DetailField label="Status">
              <StatusBadge status={statusOf(issue)} />
            </DetailField>
            <DetailField label="Priority">
              <Priority value={issue.priority} />
            </DetailField>
            <DetailField label="Category">{issue.category}</DetailField>
            <DetailField label="Event">
              {issue.event} {issue.eventId && <span className="cell-muted">({issue.eventId})</span>}
            </DetailField>
            <DetailField label="Reported By">
              {issue.reporter || "Unknown"} <RoleTag role={issue.role || issue.reporterRole} />
            </DetailField>
            <DetailField label="Contact">
              {issue.email ? <a className="admin-link" href={`mailto:${issue.email}`}>{issue.email}</a> : null}
            </DetailField>
            <DetailField label="Addressed To">
              <span style={{ textTransform: "capitalize" }}>{issue.target}</span>
            </DetailField>
            <DetailField label="Reported">
              {issue.createdAt ? new Date(issue.createdAt).toLocaleString() : null}
            </DetailField>
            <DetailField label="Description" wide>
              {issue.description}
            </DetailField>
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

function IssueTracking() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const [targetFilter, setTargetFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const [viewId, setViewId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  // Load the tickets once, when the page opens.
  useEffect(() => {
    getIssues()
      .then((data) => setIssues(sortIssues(data || [])))
      .catch((err) => {
        console.error("Failed to load issues:", err);
        setError("Could not load issues.");
      })
      .finally(() => setLoading(false));
  }, []);

  const count = (status) => issues.filter((i) => statusOf(i) === status).length;
  const stats = { open: count("open"), investigating: count("investigating"), resolved: count("resolved") };

  const q = query.trim().toLowerCase();
  const filtered = issues.filter(
    (i) =>
      (statusFilter === "all" || statusOf(i) === statusFilter) &&
      (targetFilter === "all" || lower(i.target) === targetFilter) &&
      (!q || [i.id, i.title, i.reporter, i.email, i.event, i.eventId].some((v) => lower(v).includes(q)))
  );
  const pageInfo = paginate(filtered, page);

  const advance = async (issue, status) => {
    setBusyId(issue.id);
    setError("");
    try {
      const updated = await patchIssue(issue.id, { status });
      setIssues((prev) => sortIssues(prev.map((i) => (i.id === issue.id ? { ...i, ...updated } : i))));
    } catch (err) {
      console.error("Issue update failed:", err);
      setError(`Could not update ${issue.id}: ${err?.message || "request failed"}.`);
    } finally {
      setBusyId(null);
    }
  };

  const onFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const columns = [
    { key: "id", header: "Ticket ID" },
    {
      key: "title",
      header: "Subject",
      render: (i) => (
        <>
          <div className="cell-highlight">{i.title}</div>
          <div className="cell-muted">{i.category || "Issue"}</div>
        </>
      ),
    },
    {
      key: "reporter",
      header: "Reported By",
      render: (i) => (
        <>
          {i.reporter || i.email || "Unknown"} <RoleTag role={i.role || i.reporterRole} />
        </>
      ),
    },
    { key: "priority", header: "Priority", render: (i) => <Priority value={i.priority} /> },
    { key: "status", header: "Status", render: (i) => <StatusBadge status={statusOf(i)} /> },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (i) => (
        <div className="cell-actions">
          <button
            type="button"
            className="ui-btn ui-btn--ghost"
            onClick={() => {
              setError("");
              setViewId(i.id);
            }}
          >
            <Eye size={14} /> View
          </button>
          <NextStepButton issue={i} onAdvance={advance} busy={busyId === i.id} />
        </div>
      ),
    },
  ];

  const statValue = (n) => (loading ? "-" : n);
  const viewing = issues.find((i) => i.id === viewId) || null;

  return (
    <div className="admin-issue-tracking">
      <AdminTopBar title="Issue Tracking" />

      <div className="content">
        {error && !viewing && <div className="admin-error">{error}</div>}

        <div className="stats-grid stats-grid--three">
          <StatisticCard title="Open Issues" value={statValue(stats.open)} icon={AlertCircle} color="red" />
          <StatisticCard title="Investigating" value={statValue(stats.investigating)} icon={Search} color="blue" />
          <StatisticCard title="Resolved" value={statValue(stats.resolved)} icon={CheckCircle2} color="green" />
        </div>

        <div className="card admin-table-card">
          <TableToolbar
            title="Support Tickets"
            filters={[
              { label: "Status", value: statusFilter, options: STATUS_OPTIONS, onChange: onFilter(setStatusFilter) },
              { label: "Addressed to", value: targetFilter, options: TARGET_OPTIONS, onChange: onFilter(setTargetFilter) },
            ]}
            search={{ value: query, placeholder: "Search tickets, reporters...", onChange: onFilter(setQuery) }}
          />
          <DataTable columns={columns} rows={pageInfo.items} loading={loading} emptyMessage="No tickets match your filters." />
          <Pagination {...pageInfo} onPageChange={setPage} />
        </div>
      </div>

      <IssueDetailsModal
        issue={viewing}
        onClose={() => setViewId(null)}
        onAdvance={advance}
        busy={busyId === viewId}
        error={error}
      />
    </div>
  );
}

export default IssueTracking;
