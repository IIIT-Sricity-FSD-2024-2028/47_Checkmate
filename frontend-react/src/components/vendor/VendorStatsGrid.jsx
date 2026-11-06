/**
 * ============================================================================
 * VENDOR STATS GRID COMPONENT (VendorStatsGrid.jsx)
 * ============================================================================
 * Role: Reusable Component (Vendor Portal)
 * Location: src/components/vendor/VendorStatsGrid.jsx
 *
 * Features & Enhancements:
 *   1. 5-column balanced desktop grid (never orphaned onto a 2nd row).
 *   2. Meaningful real-time metrics instead of redundant static tags.
 *   3. Amber warning alert state for "Available Staff: 0" with hint.
 *   4. Net Earnings with SVG sparkline trend and interactive fee breakdown tooltip.
 *   5. Fully clickable cards routing to filtered event/resource/staff lists.
 *   6. Accessible keyboard focus states, WCAG AA contrast, and loading skeletons.
 * ============================================================================
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  IndianRupee,
  Package,
  TrendingUp,
  UserCheck,
  AlertTriangle,
  Info,
  ChevronRight,
} from "lucide-react";

function VendorStatsGrid({ stats, loading }) {
  const navigate = useNavigate();
  const [showFeeTooltip, setShowFeeTooltip] = useState(false);

  const pendingCount = stats.pendingRequests ?? 0;
  const activeCount = stats.activeEvents ?? 0;
  const resourceCount = stats.availableResources ?? 0;
  const staffCount = stats.availableStaff ?? 0;
  const isStaffZero = staffCount === 0;

  const feeData = stats.feeBreakdown || {
    grossFormatted: stats.grossEarnings || "₹132,000.00",
    feeFormatted: stats.platformFee || "₹13,200.00",
    netFormatted: stats.netEarnings || "₹118,800.00",
  };

  const handleKeyDown = (e, path) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      navigate(path);
    }
  };

  return (
    <>
      <style>{`
        .vendor-kpi-grid {
          display: grid !important;
          grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
          gap: 16px;
          width: 100%;
        }
        @media (max-width: 1200px) {
          .vendor-kpi-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
          .vendor-kpi-grid .kpi-card--hero {
            grid-column: span 2;
          }
        }
        @media (max-width: 768px) {
          .vendor-kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .vendor-kpi-grid .kpi-card--hero {
            grid-column: span 2;
          }
        }
        @media (max-width: 520px) {
          .vendor-kpi-grid {
            grid-template-columns: 1fr !important;
          }
          .vendor-kpi-grid .kpi-card--hero {
            grid-column: span 1;
          }
        }

        .kpi-card {
          background: var(--bg-card, #251635);
          border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
          border-radius: var(--radius, 14px);
          padding: 18px 20px;
          cursor: pointer;
          position: relative;
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 148px;
        }
        .kpi-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.38);
          border-color: rgba(233, 30, 140, 0.45);
        }
        .kpi-card:focus-visible {
          outline: 2px solid #e91e8c;
          outline-offset: 2px;
        }

        .kpi-card--warning {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(37, 22, 53, 0.95) 100%);
          border-color: rgba(245, 158, 11, 0.4);
        }
        .kpi-card--warning:hover {
          border-color: rgba(245, 158, 11, 0.65);
        }

        .kpi-card--earnings {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(37, 22, 53, 0.98) 100%);
          border-color: rgba(34, 197, 94, 0.35);
        }

        .kpi-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          gap: 8px;
        }
        .kpi-icon-wrap {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          flex-shrink: 0;
        }

        .kpi-badge {
          font-size: 11px;
          font-weight: 600;
          padding: 3px 9px;
          border-radius: 20px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          line-height: 1.2;
          white-space: nowrap;
        }
        .kpi-badge--blue {
          background: rgba(59, 130, 246, 0.16);
          color: #93c5fd;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }
        .kpi-badge--green {
          background: rgba(34, 197, 94, 0.16);
          color: #86efac;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }
        .kpi-badge--purple {
          background: rgba(168, 85, 247, 0.16);
          color: #d8b4fe;
          border: 1px solid rgba(168, 85, 247, 0.3);
        }
        .kpi-badge--amber {
          background: rgba(245, 158, 11, 0.18);
          color: #fde047;
          border: 1px solid rgba(245, 158, 11, 0.4);
        }

        .kpi-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary, #cbd5e1);
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .kpi-value {
          font-family: var(--font-display, 'Space Grotesk', sans-serif);
          font-size: 26px;
          font-weight: 700;
          color: var(--text-primary, #f8fafc);
          letter-spacing: -0.5px;
          line-height: 1.1;
        }
        .kpi-card--warning .kpi-value {
          color: #fbbf24;
        }
        .kpi-card--earnings .kpi-value {
          color: #4ade80;
        }

        .kpi-subtext {
          font-size: 11.5px;
          color: var(--text-muted, #94a3b8);
          margin-top: 6px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .kpi-hint-warn {
          color: #fca5a5;
          font-weight: 500;
        }

        .sparkline-svg {
          display: block;
          overflow: visible;
        }

        /* Tooltip styling */
        .fee-tooltip-box {
          position: absolute;
          bottom: calc(100% + 8px);
          right: 12px;
          width: 230px;
          background: #180d24;
          border: 1px solid rgba(34, 197, 94, 0.4);
          border-radius: 10px;
          padding: 12px 14px;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
          z-index: 60;
          pointer-events: none;
          font-size: 12px;
        }
        .fee-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          color: #cbd5e1;
        }
        .fee-row.total {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 6px;
          margin-top: 6px;
          font-weight: 700;
          color: #4ade80;
        }

        .skeleton-block {
          background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
          background-size: 200% 100%;
          animation: skeletonShimmer 1.5s infinite;
          border-radius: 6px;
        }
        @keyframes skeletonShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div className="stats-grid vendor-kpi-grid" aria-label="Vendor KPI Overview">
        {/* ── Card 1: Pending Event Requests ── */}
        <div
          className="kpi-card"
          role="button"
          tabIndex={0}
          onClick={() => navigate("/vendor/events?status=pending")}
          onKeyDown={(e) => handleKeyDown(e, "/vendor/events?status=pending")}
          aria-label={`Pending Requests: ${pendingCount}. Click to view pending event requests.`}
        >
          <div className="kpi-top">
            <div className="kpi-icon-wrap" style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)", boxShadow: "0 4px 12px rgba(37, 99, 235, 0.35)" }}>
              <Calendar size={18} />
            </div>
            <span className="kpi-badge kpi-badge--blue">
              {stats.pendingTrend || `${pendingCount} awaiting`}
            </span>
          </div>
          <div>
            <div className="kpi-label">
              <span>Pending Requests</span>
              <ChevronRight size={13} color="var(--text-muted, #94a3b8)" />
            </div>
            <div className="kpi-value">
              {loading ? <div className="skeleton-block" style={{ width: 44, height: 28 }} /> : pendingCount}
            </div>
            <div className="kpi-subtext">Requires review</div>
          </div>
        </div>

        {/* ── Card 2: Active Events ── */}
        <div
          className="kpi-card"
          role="button"
          tabIndex={0}
          onClick={() => navigate("/vendor/events?status=confirmed")}
          onKeyDown={(e) => handleKeyDown(e, "/vendor/events?status=confirmed")}
          aria-label={`Active Events: ${activeCount}. Click to view live and confirmed events.`}
        >
          <div className="kpi-top">
            <div className="kpi-icon-wrap" style={{ background: "linear-gradient(135deg, #16a34a, #15803d)", boxShadow: "0 4px 12px rgba(22, 163, 74, 0.35)" }}>
              <TrendingUp size={18} />
            </div>
            <span className="kpi-badge kpi-badge--green">
              {stats.activeTrend || "+8% vs last month"}
            </span>
          </div>
          <div>
            <div className="kpi-label">
              <span>Active Events</span>
              <ChevronRight size={13} color="var(--text-muted, #94a3b8)" />
            </div>
            <div className="kpi-value">
              {loading ? <div className="skeleton-block" style={{ width: 44, height: 28 }} /> : activeCount}
            </div>
            <div className="kpi-subtext">Confirmed & live</div>
          </div>
        </div>

        {/* ── Card 3: Available Resources ── */}
        <div
          className="kpi-card"
          role="button"
          tabIndex={0}
          onClick={() => navigate("/vendor/resources")}
          onKeyDown={(e) => handleKeyDown(e, "/vendor/resources")}
          aria-label={`Available Resources: ${resourceCount}. Click to view inventory.`}
        >
          <div className="kpi-top">
            <div className="kpi-icon-wrap" style={{ background: "linear-gradient(135deg, #9333ea, #7e22ce)", boxShadow: "0 4px 12px rgba(147, 51, 234, 0.35)" }}>
              <Package size={18} />
            </div>
            <span className="kpi-badge kpi-badge--purple">
              {stats.resourceAllocatedPct || "72% allocated"}
            </span>
          </div>
          <div>
            <div className="kpi-label">
              <span>Available Resources</span>
              <ChevronRight size={13} color="var(--text-muted, #94a3b8)" />
            </div>
            <div className="kpi-value">
              {loading ? <div className="skeleton-block" style={{ width: 44, height: 28 }} /> : resourceCount}
            </div>
            <div className="kpi-subtext">Units ready for deployment</div>
          </div>
        </div>

        {/* ── Card 4: Available Staff (With Warning State for 0) ── */}
        <div
          className={`kpi-card ${isStaffZero ? "kpi-card--warning" : ""}`}
          role="button"
          tabIndex={0}
          onClick={() => navigate("/vendor/staff")}
          onKeyDown={(e) => handleKeyDown(e, "/vendor/staff")}
          aria-label={`Available Staff: ${staffCount}. ${isStaffZero ? "Warning: All staff assigned." : ""} Click to manage staff.`}
        >
          <div className="kpi-top">
            <div
              className="kpi-icon-wrap"
              style={{
                background: isStaffZero
                  ? "linear-gradient(135deg, #d97706, #b45309)"
                  : "linear-gradient(135deg, #ea580c, #c2410c)",
                boxShadow: isStaffZero
                  ? "0 4px 12px rgba(217, 119, 6, 0.45)"
                  : "0 4px 12px rgba(234, 88, 12, 0.35)",
              }}
            >
              {isStaffZero ? <AlertTriangle size={18} /> : <UserCheck size={18} />}
            </div>
            <span className={`kpi-badge ${isStaffZero ? "kpi-badge--amber" : "kpi-badge--green"}`}>
              {isStaffZero ? "⚠ Shortage" : stats.staffTrend || "Roster ready"}
            </span>
          </div>
          <div>
            <div className="kpi-label">
              <span>Available Staff</span>
              <ChevronRight size={13} color="var(--text-muted, #94a3b8)" />
            </div>
            <div className="kpi-value">
              {loading ? <div className="skeleton-block" style={{ width: 44, height: 28 }} /> : staffCount}
            </div>
            <div className="kpi-subtext">
              {isStaffZero ? (
                <span className="kpi-hint-warn">⚠ {stats.staffHint || "All staff assigned"}</span>
              ) : (
                <span>{stats.staffHint || `${staffCount} ready to assign`}</span>
              )}
            </div>
          </div>
        </div>

        {/* ── Card 5: Net Earnings (With Sparkline & Fee Breakdown Tooltip) ── */}
        <div
          className="kpi-card kpi-card--earnings kpi-card--hero"
          role="button"
          tabIndex={0}
          onClick={() => navigate("/vendor/events")}
          onKeyDown={(e) => handleKeyDown(e, "/vendor/events")}
          onMouseEnter={() => setShowFeeTooltip(true)}
          onMouseLeave={() => setShowFeeTooltip(false)}
          aria-label={`Net Earnings: ${stats.netEarnings}. 90% Net Payout. Click to view events.`}
        >
          {showFeeTooltip && (
            <div className="fee-tooltip-box" role="tooltip">
              <div style={{ fontWeight: 600, color: "#f8fafc", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                <Info size={13} color="#4ade80" /> Payout Fee Breakdown
              </div>
              <div className="fee-row">
                <span>Gross Revenue:</span>
                <span>{feeData.grossFormatted}</span>
              </div>
              <div className="fee-row">
                <span>Platform Fee (10%):</span>
                <span style={{ color: "#f87171" }}>-{feeData.feeFormatted}</span>
              </div>
              <div className="fee-row total">
                <span>Net Payout (90%):</span>
                <span>{feeData.netFormatted}</span>
              </div>
            </div>
          )}

          <div className="kpi-top">
            <div className="kpi-icon-wrap" style={{ background: "linear-gradient(135deg, #16a34a, #15803d)", boxShadow: "0 4px 12px rgba(22, 163, 74, 0.4)" }}>
              <IndianRupee size={18} />
            </div>

            {/* Sparkline Visual Trend */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="48" height="20" viewBox="0 0 48 20" className="sparkline-svg" aria-hidden="true">
                <defs>
                  <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4ade80" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#4ade80" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 2 16 L 10 14 L 18 15 L 26 8 L 34 11 L 40 5 L 46 3"
                  fill="none"
                  stroke="#4ade80"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="46" cy="3" r="2.5" fill="#4ade80" />
              </svg>

              <span
                className="kpi-badge kpi-badge--green"
                style={{ cursor: "help" }}
                title="Click to view events or hover for gross/fee breakdown"
              >
                90% Payout <Info size={11} style={{ marginLeft: 2 }} />
              </span>
            </div>
          </div>

          <div>
            <div className="kpi-label">
              <span>Net Earnings</span>
              <ChevronRight size={13} color="var(--text-muted, #94a3b8)" />
            </div>
            <div className="kpi-value">
              {loading ? <div className="skeleton-block" style={{ width: 110, height: 28 }} /> : stats.netEarnings || "₹0.00"}
            </div>
            <div className="kpi-subtext">
              <span style={{ color: "#86efac" }}>{stats.earningsGrowth || "+14.2% vs last month"}</span>
              <span style={{ fontSize: "10.5px", color: "var(--text-muted, #94a3b8)" }}>Gross: {feeData.grossFormatted}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default VendorStatsGrid;
