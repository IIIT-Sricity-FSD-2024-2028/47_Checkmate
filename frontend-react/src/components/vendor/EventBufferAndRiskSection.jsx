/**
 * ============================================================================
 * EVENT BUFFER & RISK SECTION COMPONENT (EventBufferAndRiskSection.jsx)
 * ============================================================================
 * Role: Reusable Component (Vendor Portal)
 * Location: src/components/vendor/EventBufferAndRiskSection.jsx
 *
 * Purpose:
 *   Replicates legacy Event Review 2-column bottom layout:
 *     1. Buffer Planning Card: Tracks recommended vs. current safety margins
 *        across Resources, Staff, Time, and Budget.
 *     2. Risk & Feasibility Summary Card: Computes weighted overall risk level
 *        (Low / Medium / High) and renders 3 dynamic colored progress bars:
 *          - Resource Availability %
 *          - Staff Availability %
 *          - Contingency Readiness %
 * ============================================================================
 */

import React from "react";
import { ShieldCheck, Zap } from "lucide-react";

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
    <div className="bottom-two" aria-label="Buffer and Risk Feasibility Evaluation">
      {/* ── CARD 1: BUFFER PLANNING ── */}
      <div className="buffer-card">
        <div className="buffer-card__title">
          <ShieldCheck size={16} /> Buffer Planning
        </div>

        {/* Resources Margin */}
        <div className="buffer-row">
          <div className="buffer-row__top">
            <span className="buffer-row__name">Resources</span>
            <span className={`row-status ${resPct >= 80 ? "safe" : "risk"}`}>
              {resPct >= 80 ? "safe" : "risk"}
            </span>
          </div>
          <div className="buffer-row__bottom">
            <span className="buffer-row__rec">Recommended: 15%</span>
            <span className="buffer-row__cur">
              Current: {Math.max(5, Math.round(resPct * 0.15))}%
            </span>
          </div>
        </div>

        {/* Staff Margin */}
        <div className="buffer-row">
          <div className="buffer-row__top">
            <span className="buffer-row__name">Staff</span>
            <span className={`row-status ${staffPct >= 80 ? "safe" : "risk"}`}>
              {staffPct >= 80 ? "safe" : "risk"}
            </span>
          </div>
          <div className="buffer-row__bottom">
            <span className="buffer-row__rec">Recommended: 20%</span>
            <span className="buffer-row__cur">
              Current: {Math.max(8, Math.round(staffPct * 0.2))}%
            </span>
          </div>
        </div>

        {/* Time Setup Margin */}
        <div className="buffer-row">
          <div className="buffer-row__top">
            <span className="buffer-row__name">Time</span>
            <span className="row-status critical">critical</span>
          </div>
          <div className="buffer-row__bottom">
            <span className="buffer-row__rec">Recommended: 30 min setup buffer</span>
            <span className="buffer-row__cur">Current: 15 min</span>
          </div>
        </div>

        {/* Budget Contingency Margin */}
        <div className="buffer-row">
          <div className="buffer-row__top">
            <span className="buffer-row__name">Budget</span>
            <span className="row-status safe">safe</span>
          </div>
          <div className="buffer-row__bottom">
            <span className="buffer-row__rec">Recommended: 10%</span>
            <span className="buffer-row__cur">Current: 12%</span>
          </div>
        </div>
      </div>

      {/* ── CARD 2: RISK & FEASIBILITY SUMMARY ── */}
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
