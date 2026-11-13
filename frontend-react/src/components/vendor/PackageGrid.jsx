/**
 * ============================================================================
 * VENDOR PRESET PACKAGES GRID (PackageGrid.jsx)
 * ============================================================================
 * Role: Responsive Card Grid Container (Vendor Packages Portal)
 * Location: src/components/vendor/PackageGrid.jsx
 *
 * Parent / Invocation Context:
 *   - Called By: src/pages/vendor/PresetPackage.jsx (Lines 123–129)
 *   - Also Reused In: src/pages/client/BrowsePackages.jsx
 *   - Parent Page: Vendor Preset Packages (src/pages/vendor/PresetPackage.jsx, Component 4)
 *   - Where in Code: Positioned directly below <PackageToolbar> in PresetPackage.jsx
 *     to render the multi-column package card showcase via <PackageCard> iterations.
 *
 * Purpose:
 *   Renders the responsive 3-column / 2-column / 1-column card grid:
 *     1. Handles loading placeholder skeleton state.
 *     2. Renders empty-state fallback when filters yield 0 results.
 *     3. Maps package records to the modular <PackageCard> child component.
 *
 * Reusable Components Utilized:
 *   - <PackageCard>: Visual presentation card for individual bundles.
 *
 * Props:
 *   @param {Array<Object>} packages - Array of filtered package records
 *   @param {boolean} loading - Loading indicator
 *   @param {Function} onEdit - Callback to edit a package
 *   @param {Function} onDelete - Callback to delete a package
 * ============================================================================
 */

import React from "react";
import { Box } from "lucide-react";
import PackageCard from "./PackageCard";

function PackageGrid({ packages = [], loading = false, onEdit, onDelete }) {
  // --------------------------------------------------------------------------
  // 1. LOADING SKELETON STATE
  // --------------------------------------------------------------------------
  // Renders 3 pulse-animated placeholder cards while data is being fetched
  if (loading) {
    return (
      <div className="pp-grid">
        {[1, 2, 3].map((n) => (
          <div key={n} className="pkg-card">
            <div className="pkg-img-placeholder pkg-img-placeholder--general">
              <div className="table-loading-spinner" />
            </div>
            <div className="pkg-body">
              <div className="skeleton-pulse-wave" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // 2. EMPTY STATE FALLBACK
  // --------------------------------------------------------------------------
  // Displayed when no catalogued preset packages match the active search or category filters
  if (packages.length === 0) {
    return (
      <div className="pp-grid">
        <div className="pp-empty">
          <Box className="pp-empty-icon" />
          <p>No preset packages match your search or filter criteria.</p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // 3. RESPONSIVE CARDS GRID RENDER
  // --------------------------------------------------------------------------
  // Maps each package data object into a modular <PackageCard> component
  return (
    <div className="pp-grid">
      {packages.map((pkg) => (
        <PackageCard
          key={pkg.id || Math.random()}
          packageData={pkg}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export default PackageGrid;
