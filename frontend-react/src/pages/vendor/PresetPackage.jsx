/**
 * ============================================================================
 * MODULAR VENDOR PRESET PACKAGES PAGE (PresetPackage.jsx)
 * ============================================================================
 * Role: Event Coordinator / Vendor
 * Purpose:
 *   High-level orchestrator page for managing turnkey event service bundles:
 *     1. Connects to `useVendorPackagesData` custom hook for state & queries.
 *     2. Assembles focused, reusable modular subcomponents:
 *         - <TopHeaderBar>: Unified top header with page title.
 *         - <EventsToastFeedback>: Action feedback banner for save/delete operations.
 *         - <PackageStatsGrid>: 4-column KPI cards (Total, Active, Avg Price, Category).
 *         - <PackageToolbar>: Search box, multi-criteria filters, and category tabs.
 *         - <PackageGrid>: Responsive card grid mapping <PackageCard> elements.
 *         - <PackageFormModal>: Interactive Add / Edit package configuration wizard.
 *         - <PackageDeleteModal>: Deletion confirmation safeguard dialog.
 * ============================================================================
 */

import React, { useState } from "react";

// Stylesheets
import "../../styles/vendor.css";
import "../../styles/dashboard.css";

// Global Reusable UI Components
import TopHeaderBar from "../../components/TopHeaderBar";

// Custom Data Retrieval & Mutation Hook
import useVendorPackagesData from "../../components/vendor/useVendorPackagesData";

// Modular Vendor Package Subcomponents
import EventsToastFeedback from "../../components/vendor/EventsToastFeedback";
import PackageStatsGrid from "../../components/vendor/PackageStatsGrid";
import PackageToolbar from "../../components/vendor/PackageToolbar";
import PackageGrid from "../../components/vendor/PackageGrid";
import PackageFormModal from "../../components/vendor/PackageFormModal";
import PackageDeleteModal from "../../components/vendor/PackageDeleteModal";

function PresetPackage() {
  // Connect to custom data hook handling queries, search filtering, and CRUD operations
  const {
    packages,
    availableResources,
    availableStaff,
    loading,
    filteredPackages,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    priceFilter,
    setPriceFilter,
    capacityFilter,
    setCapacityFilter,
    stats,
    toast,
    setToast,
    handleSavePackage,
    handleDeletePackage,
    handleResetFilters,
  } = useVendorPackagesData();

  // Modal visibility and targeted record states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingPackage, setDeletingPackage] = useState(null);

  // Modal Open Handlers
  const handleOpenAdd = () => {
    setEditingPackage(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (pkg) => {
    setEditingPackage(pkg);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (pkg) => {
    setDeletingPackage(pkg);
    setIsDeleteOpen(true);
  };

  return (
    <div className="vendor-page">
      {/* ── Top Header Navigation Bar ── */}
      <TopHeaderBar title="Preset Package" />

      <div className="vendor-content">
        {/* ── Component 1: Transient Action Feedback Toast Banner ── */}
        <EventsToastFeedback
          toast={toast}
          onClose={() => setToast(null)}
        />

        {/* ── Component 2: 4-Column KPI Summary Metric Cards ── */}
        <PackageStatsGrid
          stats={stats}
          loading={loading}
        />

        {/* ── Component 3: Search, Multi-Criteria Filters & Category Tabs Toolbar ── */}
        <PackageToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          priceFilter={priceFilter}
          onPriceChange={setPriceFilter}
          capacityFilter={capacityFilter}
          onCapacityChange={setCapacityFilter}
          matchingCount={filteredPackages.length}
          totalCount={packages.length}
          onAdd={handleOpenAdd}
          onReset={handleResetFilters}
        />

        {/* ── Component 4: Responsive Package Cards Grid ── */}
        <PackageGrid
          packages={filteredPackages}
          loading={loading}
          onEdit={handleOpenEdit}
          onDelete={handleOpenDelete}
        />

        {/* ── Component 5: Add / Edit Package Modal Wizard ── */}
        <PackageFormModal
          isOpen={isFormOpen}
          initialData={editingPackage}
          availableResources={availableResources}
          availableStaff={availableStaff}
          onClose={() => setIsFormOpen(false)}
          onSave={handleSavePackage}
        />

        {/* ── Component 6: Permanent Deletion Confirmation Dialog ── */}
        <PackageDeleteModal
          isOpen={isDeleteOpen}
          packageData={deletingPackage}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={handleDeletePackage}
        />
      </div>
    </div>
  );
}

export default PresetPackage;
