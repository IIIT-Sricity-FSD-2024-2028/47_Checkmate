/**
 * ============================================================================
 * VENDOR QUICK ACTION BUTTON COMPONENT (QuickActionButton.jsx)
 * ============================================================================
 * Role: Reusable Interactive Trigger Component (Vendor Dashboard Portal)
 * Location: src/components/vendor/QuickActionButton.jsx
 *
 * Parent / Invocation Context:
 *   - Called By: src/components/vendor/VendorQuickActionsSection.jsx (Lines 38–63)
 *   - Parent Page: Vendor Dashboard (src/pages/vendor/Dashboard.jsx, Component 6 in right-col)
 *   - Where in Code: Rendered inside the <div className="quick-actions"> grid container
 *     to represent each one-click navigation tile (Review Event, Manage Resources, Assign Staff, Add Package).
 *
 * Purpose:
 *   Renders an individual actionable quick-nav card button on the dashboard:
 *     1. Contextually maps button label/type keywords to an appropriate Lucide icon:
 *        - "resource" -> Package icon (Purple)
 *        - "staff" / "assign" -> UserPlus icon (Green)
 *        - "package" / "add" -> Box icon (Orange)
 *        - "trend" -> TrendingUp icon (Orange)
 *        - "review" / "event" -> FileText icon (Blue)
 *        - Fallback -> Sparkles icon (Blue)
 *     2. Renders high-contrast icon badges with subtle background glow rings.
 *     3. Triggers navigation or action handler upon click.
 *
 * Props:
 *   @param {string} [props.button] - Fallback button identifier
 *   @param {string} [props.button_type] - Semantic action label (e.g. "Review Event", "Add Package")
 *   @param {Function} props.onClick - Click handler callback triggered on selection
 * ============================================================================
 */

import React from "react";
import { FileText, Package, UserPlus, TrendingUp, Sparkles, Box } from "lucide-react";
import "../../styles/dashboard.css";

function QuickActionButton({ button, button_type, onClick }) {
  // --------------------------------------------------------------------------
  // 1. LABEL & INTENT RESOLUTION
  // --------------------------------------------------------------------------
  const label = button_type || button || "Action";
  const key = (label || "").toLowerCase();

  // --------------------------------------------------------------------------
  // 2. ICON & ACCENT THEME MAPPING
  // --------------------------------------------------------------------------
  let Icon = FileText;
  let colorClass = "qa-icon--blue";

  // Manage Inventory / Equipment Workflows
  if (key.includes("resource")) {
    Icon = Package;
    colorClass = "qa-icon--purple";
  // Staff Assignment / Workforce Workflows
  } else if (key.includes("staff") || key.includes("assign") || key.includes("user")) {
    Icon = UserPlus;
    colorClass = "qa-icon--green";
  // Preset Package Configuration Workflows
  } else if (key.includes("package") || key.includes("add")) {
    Icon = Box;
    colorClass = "qa-icon--orange";
  // Trend & Analytics Workflows
  } else if (key.includes("trend")) {
    Icon = TrendingUp;
    colorClass = "qa-icon--orange";
  // Event Review / Request Workflows
  } else if (key.includes("review") || key.includes("event")) {
    Icon = FileText;
    colorClass = "qa-icon--blue";
  // Default / Catch-All
  } else {
    Icon = Sparkles;
    colorClass = "qa-icon--blue";
  }

  // --------------------------------------------------------------------------
  // 3. RENDER COMPONENT
  // --------------------------------------------------------------------------
  return (
    <button className="qa-btn" onClick={onClick} type="button">
      {/* ── Contextual Icon Badge with Accent Ring ── */}
      <div className={`qa-icon ${colorClass}`}>
        <Icon size={19} />
      </div>

      {/* ── Action Label Text ── */}
      <span>{label}</span>
    </button>
  );
}

export default QuickActionButton;