/**
 * ============================================================================
 * EVENT QUOTE CARD (EventQuoteCard.jsx)
 * ============================================================================
 * Role: Reusable Component (Vendor Portal)
 * Location: src/components/vendor/EventQuoteCard.jsx
 *
 * Purpose:
 *   Lets the vendor set the final price of an event before approving it. The
 *   price starts at the allocated resources plus the venue; staff and labour
 *   are added by the vendor. The client is billed this amount, and the vendor
 *   receives it minus the platform commission.
 * ============================================================================
 */

import React from "react";
import { IndianRupee } from "lucide-react";
import { formatCurrency } from "../../utils/formatCurrency";

function EventQuoteCard({
  resourcesTotal = 0,
  venueTotal = 0,
  budget = 0,
  quote = "",
  commissionPercent = 10,
  isLocked = false,
  onChange,
}) {
  const price = Number(quote) > 0 ? Number(quote) : 0;
  const platformFee = Number(((price * commissionPercent) / 100).toFixed(2));
  const isOverBudget = !isLocked && budget > 0 && price > budget;

  return (
    <div className="client-req-card er-card-section" id="eventQuoteSection">
      <div className="er-section-header">
        <h3 className="section-title">
          <IndianRupee size={16} className="er-title-icon er-title-icon--blue" />
          Event Price
        </h3>
      </div>

      <div className="client-req-extras">
        <div className="client-extra-item">
          <div>
            <div className="client-extra-label">Allocated Resources</div>
            <div className="client-extra-value">{formatCurrency(resourcesTotal)}</div>
          </div>
        </div>

        <div className="client-extra-item">
          <div>
            <div className="client-extra-label">Venue</div>
            <div className="client-extra-value">{formatCurrency(venueTotal)}</div>
          </div>
        </div>

        <div className="client-extra-item">
          <div style={{ width: "100%" }}>
            <label className="client-extra-label" htmlFor="eventQuoteInput">
              {isLocked ? "Agreed Price" : "Final Price (₹)"}
            </label>
            {isLocked ? (
              <div className="client-extra-value">{formatCurrency(price)}</div>
            ) : (
              <input
                id="eventQuoteInput"
                type="number"
                min="1"
                value={quote}
                onChange={(e) => onChange && onChange(e.target.value)}
                style={{
                  width: "100%",
                  marginTop: "4px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid var(--border, rgba(255, 255, 255, 0.1))",
                  background: "rgba(255, 255, 255, 0.04)",
                  color: "var(--text-primary, #f0e8ff)",
                }}
              />
            )}
          </div>
        </div>

        <div className="client-extra-item client-extra-payout">
          <div>
            <div className="client-extra-label">You Receive ({100 - commissionPercent}%)</div>
            <div className="client-extra-value">
              {formatCurrency(price - platformFee)}{" "}
              <span className="client-extra-fee">(Fee: -{formatCurrency(platformFee)})</span>
            </div>
          </div>
        </div>
      </div>

      {!isLocked && (
        <p style={{ margin: "12px 0 0", fontSize: "12px", color: "var(--text-muted, #6b5d7e)" }}>
          Add staff and labour costs to this price. The client is billed this amount when you approve.
        </p>
      )}
      {isOverBudget && (
        <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#fde047" }}>
          This is above the client's budget of {formatCurrency(budget)}.
        </p>
      )}
    </div>
  );
}

export default React.memo(EventQuoteCard);
