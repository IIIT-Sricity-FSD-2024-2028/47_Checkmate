/**
 * ============================================================================
 * EVENT RISK & FEASIBILITY SECTION COMPONENT (EventBufferAndRiskSection.jsx)
 * ============================================================================
 * Role: Reusable Component (Vendor Portal)
 * Location: src/components/vendor/EventBufferAndRiskSection.jsx
 *
 * Purpose:
 *   Renders the dynamic Risk & Feasibility Summary card:
 *     - Computes weighted overall risk level (Low / Medium / High)
 *     - Renders 3 dynamic colored progress bars:
 *         * Resource Availability %
 *         * Staff Availability %
 *         * Contingency Readiness %
 * ============================================================================
 */

import React from "react";
import { Zap } from "lucide-react";

function EventBufferAndRiskSection({
  resPct = 100,
  staffPct = 100,
  contPct = 100,
  conflictsCount = 0,
}) {
  // Overall Risk Level calculation
  const avgScore = (resPct + staffPct + contPct) / 3;

  let riskCategory = "low";
  let riskLabel = "✅ Low Risk Level";
  let riskSub = "All resources and staff are available — safe to approve.";

  if (avgScore >= 90 && conflictsCount === 0) {
    riskCategory = "low";
    riskLabel = "✅ Low Risk Level";
    riskSub = "All resources and staff are available — safe to approve.";
  } else if (avgScore >= 60 || conflictsCount <= 1) {
    riskCategory = "medium";
    riskLabel = "⚠ Medium Risk Level";
    riskSub = `${conflictsCount} conflict(s) detected — review before approving.`;
  } else {
    riskCategory = "high";
    riskLabel = "🔴 High Risk Level";
    riskSub = `${conflictsCount} critical conflict(s) — must resolve or reject.`;
  }

  // Dynamic progress bar color classes
  const getBarColorClass = (pct) => {
    if (pct >= 80) return "risk-bar-fill--green";
    if (pct >= 50) return "risk-bar-fill--yellow";
    return "risk-bar-fill--red";
  };

  return (
    <div className="bottom-two single-col" style={{ gridTemplateColumns: "1fr" }} aria-label="Risk Feasibility Evaluation">
      {/* ── RISK & FEASIBILITY SUMMARY ── */}
      <div className="risk-card">
        <div className="risk-card__title">
          <Zap size={16} /> Risk &amp; Feasibility Summary
        </div>

        {/* Dynamic Risk Box */}
        <div className={`risk-level-box ${riskCategory}`}>
          <div className="risk-level-label">{riskLabel}</div>
          <div className="risk-level-sub">{riskSub}</div>
        </div>

        {/* Dynamic Progress Bars */}
        <div className="risk-bars">
          {/* Resource Availability Bar */}
          <div>
            <div className="risk-bar-header">
              <span className="risk-bar-label">Resource Availability</span>
              <span className="risk-bar-pct">{resPct}%</span>
            </div>
            <div className="risk-bar-bg">
              <div
                className={`risk-bar-fill ${getBarColorClass(resPct)}`}
                style={{ width: `${resPct}%` }}
              />
            </div>
          </div>

          {/* Staff Availability Bar */}
          <div>
            <div className="risk-bar-header">
              <span className="risk-bar-label">Staff Availability</span>
              <span className="risk-bar-pct">{staffPct}%</span>
            </div>
            <div className="risk-bar-bg">
              <div
                className={`risk-bar-fill ${getBarColorClass(staffPct)}`}
                style={{ width: `${staffPct}%` }}
              />
            </div>
          </div>

          {/* Contingency Readiness Bar */}
          <div>
            <div className="risk-bar-header">
              <span className="risk-bar-label">Contingency Readiness</span>
              <span className="risk-bar-pct">{contPct}%</span>
            </div>
            <div className="risk-bar-bg">
              <div
                className={`risk-bar-fill ${getBarColorClass(contPct)}`}
                style={{ width: `${contPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(EventBufferAndRiskSection);
