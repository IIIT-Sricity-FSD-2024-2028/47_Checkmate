import React from "react";

/**
 * Label + value pair used inside admin detail modals.
 * Put several inside a <div className="detail-grid"> for a two-column layout;
 * pass `wide` to make one span both columns.
 */
function DetailField({ label, children, wide = false }) {
  return (
    <div className={`detail-field${wide ? " detail-field--wide" : ""}`}>
      <span className="detail-field__label">{label}</span>
      <div className="detail-field__value">{children || "—"}</div>
    </div>
  );
}

export default DetailField;
