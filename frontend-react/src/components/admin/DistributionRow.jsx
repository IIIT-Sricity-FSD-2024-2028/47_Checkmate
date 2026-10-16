import React from "react";

/**
 * One row in the "User Distribution" card: tinted icon, label and a count.
 * `color` is one of "blue" | "purple" | "green" (see admin.css).
 */
function DistributionRow({ icon: Icon, label, value, color = "blue" }) {
  return (
    <div className="distribution-row">
      <div className="distribution-row__label">
        <div className={`distribution-icon distribution-icon--${color}`}>
          {Icon && <Icon size={18} />}
        </div>
        <span>{label}</span>
      </div>
      <span className="distribution-row__value">{value}</span>
    </div>
  );
}

export default DistributionRow;
