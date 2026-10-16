/**
 * ============================================================================
 * CLIENT PACKAGE GRID (ClientPackageGrid.jsx)
 * ============================================================================
 * Role: Responsive Card Grid Container (Client Browse Packages page)
 * Location: src/components/client/ClientPackageGrid.jsx
 *
 * Purpose:
 *   1. Loading state while packages are fetched.
 *   2. Empty state when the search / category returns nothing.
 *   3. One <ClientPackageCard> per package.
 *
 * Props:
 *   @param {Array} packages - Filtered packages
 *   @param {boolean} loading - Loading indicator
 *   @param {Function} onQuickCreate - Opens the Quick Create popup for a package
 * ============================================================================
 */

import React from "react";
import ClientPackageCard from "./ClientPackageCard";

function ClientPackageGrid({ packages = [], loading = false, onQuickCreate }) {
  return (
    <div className="cl-pkg-grid">
      {loading && <div className="cl-client-muted cl-full">Loading packages...</div>}
      {!loading && packages.length === 0 && <div className="cl-client-muted cl-full">No packages matched your search.</div>}
      {packages.map((pkg) => (
        <ClientPackageCard key={pkg.id} pkg={pkg} onQuickCreate={onQuickCreate} />
      ))}
    </div>
  );
}

export default ClientPackageGrid;
