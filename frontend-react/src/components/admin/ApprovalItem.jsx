import React from "react";

const AVATAR_COLORS = ["var(--pink)", "var(--blue)", "var(--purple)"];

/**
 * One row in the "Pending Vendor Approvals" list.
 * `index` picks the avatar colour so consecutive rows differ.
 */
function ApprovalItem({ businessName, submitted, index = 0, onReview }) {
  const initial = (businessName || "?").charAt(0).toUpperCase();

  return (
    <div className="approval-item">
      <div className="vendor-info">
        <div
          className="vendor-avatar"
          style={{ background: AVATAR_COLORS[index % AVATAR_COLORS.length] }}
        >
          {initial}
        </div>
        <div>
          <h4>{businessName}</h4>
          <p>Submitted {submitted}</p>
        </div>
      </div>
      <button type="button" className="admin-review-btn" onClick={onReview}>
        Review
      </button>
    </div>
  );
}

export default ApprovalItem;
