/**
 * ============================================================================
 * VENDOR DASHBOARD WIDGETS SECTION (VendorWidgetsSection.jsx)
 * ============================================================================
 * Role: Modular Dashboard Component (Vendor Portal)
 * Location: src/components/vendor/VendorWidgetsSection.jsx
 *
 * Features:
 *   1. Mini Week Calendar / Timeline: 7 days of venue bookings with overlap highlighting.
 *   2. Resource Utilization: Ring / segmented bar (allocated vs available by category).
 *   3. Staff Allocation Snapshot: Assigned / Free / Awaiting Response breakdown.
 *   4. Monthly Earnings Trend Chart: Lightweight inline SVG area / bar chart.
 *   5. Compact, consistent with dark-mode theme, collapsible toggle per widget.
 * ============================================================================
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Layers,
  Users,
  TrendingUp,
  Clock,
  ArrowRight,
} from "lucide-react";

function VendorWidgetsSection({ widgetsData, loading = false }) {
  const navigate = useNavigate();

  const {
    resourceUtilization = { allocatedUnits: 0, totalUnits: 0, utilizationPct: 0, categories: [] },
    staffSnapshot = { assigned: 0, free: 0, awaiting: 0, total: 0 },
    monthlyEarnings = [],
  } = widgetsData || {};

  // Maximum gross value for SVG chart scaling
  const maxGross = Math.max(...monthlyEarnings.map((m) => m.gross || 0), 10000);

  return (
    <>
      <style>{`
        .widgets-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
        }

        .widgets-bottom-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1.2fr;
          gap: 18px;
        }
        @media (max-width: 1100px) {
          .widgets-bottom-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 720px) {
          .widgets-bottom-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="widgets-container" aria-label="Vendor Operational Widgets">
        {/* ── OPERATIONAL WIDGETS (Resource Utilization, Staff Snapshot, Monthly Earnings Trend) ── */}
        <div className="widgets-bottom-grid">
          {/* ── WIDGET 2: RESOURCE UTILIZATION ── */}
          <div className="card" style={{ padding: "18px 20px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
                borderBottom: "1px solid var(--border, rgba(255, 255, 255, 0.08))",
                paddingBottom: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "6px",
                    background: "rgba(168, 85, 247, 0.18)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#c084fc",
                  }}
                >
                  <Layers size={14} />
                </div>
                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>Resource Utilization</h4>
              </div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#d8b4fe",
                  background: "rgba(168, 85, 247, 0.15)",
                  padding: "2px 7px",
                  borderRadius: "10px",
                }}
              >
                {resourceUtilization.utilizationPct}% Booked
              </span>
            </div>

            {/* Overall Ring / Progress Bar */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: 6 }}>
                <span style={{ color: "var(--text-secondary, #cbd5e1)" }}>Allocated vs Available</span>
                <span style={{ fontWeight: 600, color: "var(--text-primary, #f8fafc)" }}>
                  {resourceUtilization.allocatedUnits} / {resourceUtilization.totalUnits} Units
                </span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "8px",
                  background: "rgba(255, 255, 255, 0.08)",
                  borderRadius: "99px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${resourceUtilization.utilizationPct}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, #9333ea, #a855f7)",
                    borderRadius: "99px",
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
            </div>

            {/* Category Bars */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {resourceUtilization.categories.slice(0, 3).map((cat, idx) => (
                <div key={idx}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", marginBottom: 3 }}>
                    <span style={{ color: "var(--text-muted, #94a3b8)" }}>{cat.name}</span>
                    <span style={{ color: "var(--text-secondary, #cbd5e1)", fontWeight: 500 }}>
                      {cat.allocated}/{cat.total} ({cat.pct}%)
                    </span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: "5px",
                      background: "rgba(255, 255, 255, 0.05)",
                      borderRadius: "99px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${cat.pct}%`,
                        height: "100%",
                        background: cat.pct >= 85 ? "#f97316" : "#c084fc",
                        borderRadius: "99px",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => navigate("/vendor/resources")}
              style={{
                marginTop: 14,
                width: "100%",
                background: "transparent",
                border: "1px dashed rgba(255, 255, 255, 0.12)",
                borderRadius: "8px",
                color: "#c084fc",
                padding: "6px",
                fontSize: "11.5px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
              }}
            >
              <span>Manage Inventory</span>
              <ArrowRight size={12} />
            </button>
          </div>

          {/* ── WIDGET 3: STAFF ALLOCATION SNAPSHOT ── */}
          <div className="card" style={{ padding: "18px 20px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
                borderBottom: "1px solid var(--border, rgba(255, 255, 255, 0.08))",
                paddingBottom: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "6px",
                    background: "rgba(34, 197, 94, 0.18)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#4ade80",
                  }}
                >
                  <Users size={14} />
                </div>
                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>Staff Allocation</h4>
              </div>
              <span style={{ fontSize: "11px", color: "var(--text-muted, #94a3b8)" }}>
                {staffSnapshot.total} Members
              </span>
            </div>

            {/* 3 Metric Summary Boxes */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
              <div
                style={{
                  background: "rgba(59, 130, 246, 0.1)",
                  border: "1px solid rgba(59, 130, 246, 0.25)",
                  borderRadius: "8px",
                  padding: "8px 6px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#93c5fd" }}>{staffSnapshot.assigned}</div>
                <div style={{ fontSize: "10.5px", color: "var(--text-muted, #94a3b8)", marginTop: 2 }}>Assigned</div>
              </div>

              <div
                style={{
                  background: "rgba(34, 197, 94, 0.1)",
                  border: "1px solid rgba(34, 197, 94, 0.25)",
                  borderRadius: "8px",
                  padding: "8px 6px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#86efac" }}>{staffSnapshot.free}</div>
                <div style={{ fontSize: "10.5px", color: "var(--text-muted, #94a3b8)", marginTop: 2 }}>Free</div>
              </div>

              <div
                style={{
                  background: "rgba(245, 158, 11, 0.1)",
                  border: "1px solid rgba(245, 158, 11, 0.25)",
                  borderRadius: "8px",
                  padding: "8px 6px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#fde047" }}>{staffSnapshot.awaiting}</div>
                <div style={{ fontSize: "10.5px", color: "var(--text-muted, #94a3b8)", marginTop: 2 }}>Awaiting</div>
              </div>
            </div>

            {/* Segmented Status Bar */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted, #94a3b8)", marginBottom: 5 }}>Roster Breakdown</div>
              <div
                style={{
                  display: "flex",
                  width: "100%",
                  height: "8px",
                  borderRadius: "99px",
                  overflow: "hidden",
                  background: "rgba(255, 255, 255, 0.05)",
                  gap: 2,
                }}
              >
                <div
                  style={{
                    width: `${staffSnapshot.total > 0 ? (staffSnapshot.assigned / staffSnapshot.total) * 100 : 0}%`,
                    background: "#3b82f6",
                  }}
                  title={`Assigned: ${staffSnapshot.assigned}`}
                />
                <div
                  style={{
                    width: `${staffSnapshot.total > 0 ? (staffSnapshot.free / staffSnapshot.total) * 100 : 0}%`,
                    background: "#22c55e",
                  }}
                  title={`Free: ${staffSnapshot.free}`}
                />
                <div
                  style={{
                    width: `${staffSnapshot.total > 0 ? (staffSnapshot.awaiting / staffSnapshot.total) * 100 : 0}%`,
                    background: "#f59e0b",
                  }}
                  title={`Awaiting: ${staffSnapshot.awaiting}`}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/vendor/staff")}
              style={{
                marginTop: 10,
                width: "100%",
                background: "transparent",
                border: "1px dashed rgba(255, 255, 255, 0.12)",
                borderRadius: "8px",
                color: "#86efac",
                padding: "6px",
                fontSize: "11.5px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
              }}
            >
              <span>Manage Staff Shifts</span>
              <ArrowRight size={12} />
            </button>
          </div>

          {/* ── WIDGET 4: MONTHLY EARNINGS TREND CHART (Inline SVG) ── */}
          <div className="card" style={{ padding: "18px 20px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
                borderBottom: "1px solid var(--border, rgba(255, 255, 255, 0.08))",
                paddingBottom: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "6px",
                    background: "rgba(34, 197, 94, 0.18)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#4ade80",
                  }}
                >
                  <TrendingUp size={14} />
                </div>
                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>Earnings Growth</h4>
              </div>
              <span style={{ fontSize: "11.5px", fontWeight: 600, color: "#4ade80" }}>
                +18.4% YTD
              </span>
            </div>

            {/* Lightweight Inline SVG Trend Bar Chart */}
            <div style={{ height: "130px", width: "100%", position: "relative" }}>
              <svg width="100%" height="100%" viewBox="0 0 260 110" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4ade80" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity="0.4" />
                  </linearGradient>
                </defs>

                {/* Gridlines */}
                <line x1="10" y1="20" x2="250" y2="20" stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="3 3" />
                <line x1="10" y1="55" x2="250" y2="55" stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="3 3" />
                <line x1="10" y1="90" x2="250" y2="90" stroke="rgba(255, 255, 255, 0.08)" />

                {/* Monthly Bars */}
                {monthlyEarnings.map((m, idx) => {
                  const x = 20 + idx * 40;
                  const barHeight = Math.max(12, Math.round((m.gross / maxGross) * 75));
                  const y = 90 - barHeight;

                  return (
                    <g key={idx}>
                      {/* Bar */}
                      <rect
                        x={x}
                        y={y}
                        width="22"
                        height={barHeight}
                        rx="4"
                        fill="url(#barGrad)"
                        style={{ cursor: "pointer", transition: "opacity 0.2s" }}
                      >
                        <title>{`${m.month}: Gross ₹${m.gross.toLocaleString("en-IN")}, Net ₹${m.net.toLocaleString("en-IN")}`}</title>
                      </rect>
                      {/* Month label */}
                      <text
                        x={x + 11}
                        y="104"
                        fill="var(--text-muted, #94a3b8)"
                        fontSize="9.5"
                        textAnchor="middle"
                        fontWeight="600"
                      >
                        {m.month}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, fontSize: "11px", color: "var(--text-secondary, #cbd5e1)" }}>
              <span>Average Payout: ₹42,500/mo</span>
              <span style={{ color: "#4ade80", fontWeight: 600 }}>90% Verified</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default React.memo(VendorWidgetsSection);

