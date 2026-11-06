/**
 * ============================================================================
 * ISSUE REPORT MODAL (IssueReportModal.jsx)
 * ============================================================================
 * Role: Popup Dialog (shared by Client Messages + Vendor Event Coordination)
 * Location: src/components/chat/IssueReportModal.jsx
 *
 * Purpose:
 *   Opened by "View Report" in the event chat. Shows the issue's title,
 *   priority (coloured dot), status, category, severity, description,
 *   reporter, date/time and contact email.
 *
 * Reusable Components Utilized:
 *   - <Modal>: Shared dialog.
 *
 * Props:
 *   @param {Object|null} issue - Issue to show (null = closed)
 *   @param {Function} onClose
 * ============================================================================
 */

import React from "react";
import Modal from "../Modal";
import { formatClock, formatDate } from "../../utils/clientHelpers";

const PRIORITY_COLORS = { Critical: "#ef4444", High: "#f97316", Medium: "#eab308", Low: "#22c55e" };

function IssueReportModal({ issue, onClose }) {
  return (
    <Modal
      open={Boolean(issue)}
      title={issue ? `Issue Report · ${issue.id}` : ""}
      onClose={onClose}
      width={520}
      footer={<button type="button" className="cl-btn-ghost" onClick={onClose}>Close</button>}
    >
      {issue && (
        <>
          <h4 className="cl-issue-title">{issue.title}</h4>
          <div className="cl-chip-list">
            <span className="cl-chip">
              <span className="cl-dot" style={{ background: PRIORITY_COLORS[issue.priority] || "#22c55e" }} />
              {issue.priority || "Normal"} Priority
            </span>
            <span className="cl-chip">Status: {issue.status || "open"}</span>
            {issue.category && <span className="cl-chip">{issue.category}</span>}
            {issue.severity && <span className="cl-chip">Severity: {issue.severity}</span>}
          </div>

          <div className="cl-label">Description</div>
          <div className="cl-reason-box cl-reason-box--neutral">
            {issue.desc || issue.description || "No description provided."}
          </div>

          <div className="cl-reporter__grid">
            <div>Reported By: <span>{issue.reporter || "Unknown"}</span> ({issue.reporterRole || issue.role || "N/A"})</div>
            <div>Date: <span>{formatDate(issue.createdAt)} {formatClock(issue.createdAt)}</span></div>
            {issue.email && <div className="cl-full">Contact: <span>{issue.email}</span></div>}
          </div>
        </>
      )}
    </Modal>
  );
}

export default IssueReportModal;
