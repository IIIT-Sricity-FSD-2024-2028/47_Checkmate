/**
 * ============================================================================
 * MODULAR CLIENT BROWSE PACKAGES PAGE (BrowsePackages.jsx)
 * ============================================================================
 * Role: Client
 * Purpose:
 *   Marketplace of approved vendor packages (port of client_browsepackages.html):
 *     1. Connects to `useClientPackagesData` for loading, filtering and Quick Create.
 *     2. Assembles focused, reusable modular subcomponents:
 *         - <ClientTopbar>: Title + bell.
 *         - <ClientPackageToolbar>: Category pills + search.
 *         - <ClientPackageGrid>: Grid of <ClientPackageCard>.
 *         - <QuickCreateModal>: Turns a package into an event request.
 *
 * Connected Backend Endpoints:
 *   - GET /packages, /resources, /snapshot  ·  POST /events
 * ============================================================================
 */

import React, { useState } from "react";

// Stylesheets
import "../../styles/dashboard.css";
import "./client.css";

// Shared components
import ClientTopbar from "../../components/client/ClientTopbar";

// Custom Data Hook
import useClientPackagesData from "../../components/client/useClientPackagesData";

// Modular Packages Subcomponents
import ClientPackageToolbar from "../../components/client/ClientPackageToolbar";
import ClientPackageGrid from "../../components/client/ClientPackageGrid";
import QuickCreateModal from "../../components/client/QuickCreateModal";

function BrowsePackages() {
  const {
    filteredPackages,
    loading,
    error,
    category,
    setCategory,
    searchTerm,
    setSearchTerm,
    quickCreate,
  } = useClientPackagesData();

  // Package chosen for Quick Create (null = popup closed)
  const [quickPackage, setQuickPackage] = useState(null);

  return (
    <div className="dashboard-page">
      <ClientTopbar title="Browse Event Packages" subtitle="Select from our curated event packages" />

      <div className="content">
        {error && <div className="cl-client-error">{error}</div>}

        {/* ── Component 1: Category pills + search ── */}
        <ClientPackageToolbar
          category={category}
          onCategoryChange={setCategory}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        {/* ── Component 2: Package cards ── */}
        <ClientPackageGrid packages={filteredPackages} loading={loading} onQuickCreate={setQuickPackage} />

        {/* ── Component 3: Quick Create popup (key resets the form per package) ── */}
        {quickPackage && (
          <QuickCreateModal
            key={quickPackage.id}
            pkg={quickPackage}
            onClose={() => setQuickPackage(null)}
            onSubmit={quickCreate}
          />
        )}
      </div>
    </div>
  );
}

export default BrowsePackages;
