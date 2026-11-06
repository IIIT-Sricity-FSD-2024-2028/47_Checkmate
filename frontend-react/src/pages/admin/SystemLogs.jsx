/**
 * ADMIN · SYSTEM LOGS (pages/admin/SystemLogs.jsx)
 * Replaces legacy: front-end/pages/admin/audit-logs.html (inline script).
 *
 * - Reads the audit trail from GET /state/activityLogs. The backend's DataService appends a
 *   row on every event status change, vendor decision and audited API mutation.
 * - Newest first, filterable by type (events / vendor approvals / API calls / system) and
 *   searchable by title or details.
 * - Shows 10 entries, then "Load Older Logs (N more)" adds 10 at a time.
 *
 * Read-only: nothing on this page changes data.
 */

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, RefreshCw } from "lucide-react";

import "../../styles/dashboard.css";
import "../../styles/admin.css";

import AdminTopBar from "../../components/admin/AdminTopBar";
import LogItem from "../../components/admin/LogItem";
import TableToolbar from "../../components/table/TableToolbar";

import { getStateKey } from "../../services";
import { logDescription, logTitle } from "../../utils/logText";

const PAGE = 10;

const TYPE_OPTIONS = [
  { value: "all", label: "All Activity" },
  { value: "EVENT", label: "Events" },
  { value: "VENDOR_APPLICATION", label: "Vendor Approvals" },
  { value: "HTTP", label: "API Calls" },
  { value: "SYSTEM", label: "System" },
];

const newestFirst = (logs) =>
  [...logs].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [typeFilter, setTypeFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);

  useEffect(() => {
    let cancelled = false;
    getStateKey("activityLogs")
      .then((data) => {
        if (cancelled) return;
        setLogs(newestFirst(Array.isArray(data) ? data : []));
        setError("");
      })
      .catch((err) => {
        console.error("Failed to load activity logs:", err);
        if (!cancelled) setError("Could not load system logs.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return logs.filter(
      (log) =>
        (typeFilter === "all" || log.entityType === typeFilter) &&
        (!q || `${logTitle(log)} ${logDescription(log)}`.toLowerCase().includes(q))
    );
  }, [logs, typeFilter, query]);

  const visible = matches.slice(0, shown);
  const remaining = matches.length - visible.length;

  const onFilter = (setter) => (value) => {
    setter(value);
    setShown(PAGE);
  };

  const refresh = () => {
    setLoading(true);
    setShown(PAGE);
    setReloadKey((k) => k + 1);
  };

  return (
    <div className="admin-system-logs">
      <AdminTopBar title="System Logs" />

      <div className="content">
        {error && <div className="admin-error">{error}</div>}

        <div className="card admin-table-card">
          <TableToolbar
            title="System Security Audit Log"
            filters={[{ label: "Type", value: typeFilter, options: TYPE_OPTIONS, onChange: onFilter(setTypeFilter) }]}
            search={{ value: query, placeholder: "Search logs...", onChange: onFilter(setQuery) }}
          />

          <div className="log-list">
            {loading && <div className="admin-empty">Loading...</div>}
            {!loading && visible.length === 0 && (
              <div className="admin-empty">
                {logs.length ? "No activity matches this filter." : "No activity recorded yet."}
              </div>
            )}
            {!loading && visible.map((log) => <LogItem key={log.id} log={log} />)}
          </div>

          <div className="log-footer">
            <span className="cell-muted">
              {loading ? "" : `Showing ${visible.length} of ${matches.length}`}
            </span>
            <div className="cell-actions">
              <button type="button" className="ui-btn ui-btn--ghost" onClick={refresh} disabled={loading}>
                <RefreshCw size={14} /> Refresh
              </button>
              <button
                type="button"
                className="ui-btn ui-btn--ghost"
                disabled={loading || remaining <= 0}
                onClick={() => setShown((n) => n + PAGE)}
              >
                <ArrowDown size={14} /> {remaining > 0 ? `Load Older Logs (${remaining} more)` : "No older logs"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SystemLogs;
