/**
 * ============================================================================
 * VENDOR QUICK ACTIONS SECTION COMPONENT (VendorQuickActionsSection.jsx)
 * ============================================================================
 * Role: Reusable Component (Vendor Portal)
 * Location: src/components/vendor/VendorQuickActionsSection.jsx
 *
 * Purpose:
 *   Renders the Quick Actions card on the Vendor Dashboard:
 *     - Provides one-click access into primary coordinator workflows:
 *         1. Review Event -> Navigates to /vendor/events
 *         2. Manage Resources -> Navigates to /vendor/resources
 *         3. Assign Staff -> Navigates to /vendor/staff
 *         4. Add Package -> Navigates to /vendor/packages
 *
 * Reusable Components:
 *   - <QuickActionButton>: Branded action button with contextual iconography and theme colors.
 *
 * Props:
 *   @param {Function} props.onNavigate - Callback invoked with destination path string
 * ============================================================================
 */

import React from "react";
import QuickActionButton from "./QuickActionButton";

function VendorQuickActionsSection({ onNavigate }) {
  return (
    <div className="card Quckaction-card">
      {/* ── Card Header ── */}
      <div className="card__header">
        <h3>Quick Actions</h3>
      </div>

      {/* ── Grid of 4 Quick Action Buttons ── */}
      <div className="quick-actions" role="toolbar" aria-label="Vendor Quick Actions">
        {/* Action 1: Review Incoming Event Requests */}
        <QuickActionButton
          button="1"
          button_type="Review Event"
          onClick={() => onNavigate && onNavigate("/vendor/events")}
        />

        {/* Action 2: Manage Equipment & Inventory */}
        <QuickActionButton
          button="2"
          button_type="Manage Resources"
          onClick={() => onNavigate && onNavigate("/vendor/resources")}
        />

        {/* Action 3: Assign Staff Members */}
        <QuickActionButton
          button="3"
          button_type="Assign Staff"
          onClick={() => onNavigate && onNavigate("/vendor/staff")}
        />

        {/* Action 4: Configure Preset Packages */}
        <QuickActionButton
          button="4"
          button_type="Add Package"
          onClick={() => onNavigate && onNavigate("/vendor/packages")}
        />
      </div>
    </div>
  );
}

export default VendorQuickActionsSection;
