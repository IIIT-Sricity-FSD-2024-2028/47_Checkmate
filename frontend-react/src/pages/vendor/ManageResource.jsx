/**
 * ============================================================================
 * MODULAR MANAGE RESOURCE PAGE (ManageResource.jsx)
 * ============================================================================
 * Role: Event Coordinator / Vendor
 * Location: src/pages/vendor/ManageResource.jsx
 *
 * Parent / Invocation Context:
 *   - Route: /vendor/resources (Vendor Portal)
 *   - Parent Component: App Router / Vendor Layout
 *
 * Purpose:
 *   High-level orchestrator page for managing vendor equipment, furniture, and decor:
 *     1. Connects to `useVendorResourcesData` custom hook for state & queries.
 *     2. Assembles focused, reusable modular subcomponents:
 *         - <TopHeaderBar>: Unified top header with title and notifications indicator.
 *         - <EventsToastFeedback>: Immediate feedback toast for create, edit, delete, and allocate actions.
 *         - <ResourceStatsGrid>: 4-column KPI metric cards (Total, Available, Low Stock, Out of Stock).
 *         - <ResourceToolbar>: Search input, multi-criteria filter panel, and Add Resource action.
 *         - <ResourceTable>: Tabular list displaying inventory records via <ResourceTableRow>.
 *         - <ResourceFormModal>: Validated modal dialog for adding and editing resources.
 *         - <ResourceAllocationModal>: 2-phase wizard allocating equipment to approved events.
 *         - <ResourceDeleteModal>: Safeguard confirmation dialog for resource deletion.
 *
 * Reusable Components Utilized:
 *   - <TopHeaderBar>: src/components/TopHeaderBar.jsx
 *   - <EventsToastFeedback>: src/components/vendor/EventsToastFeedback.jsx
 *   - <StatisticCard>: Used inside <ResourceStatsGrid>
 *   - <ResourceTableRow>: Used inside <ResourceTable>
 * ============================================================================
 */

import React from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { ArrowLeft, AlertCircle } from "lucide-react";

// Central vendor stylesheet (Zero inline styling)
import "../../styles/vendor.css";

// Global and Shared Reusable UI Components
import VendorTopBar from "../../components/vendor/VendorTopBar";
import EventsToastFeedback from "../../components/vendor/EventsToastFeedback";

// Custom Data Retrieval, Calculation & Mutation Hook
import useVendorResourcesData from "../../components/vendor/useVendorResourcesData";

// Modular Vendor Inventory Subcomponents
import ResourceStatsGrid from "../../components/vendor/ResourceStatsGrid";
import ResourceToolbar from "../../components/vendor/ResourceToolbar";
import ResourceTable from "../../components/vendor/ResourceTable";
import ResourceFormModal from "../../components/vendor/ResourceFormModal";
import ResourceAllocationModal from "../../components/vendor/ResourceAllocationModal";
import ResourceDeleteModal from "../../components/vendor/ResourceDeleteModal";

function ManageResource() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Retrieve review return context if navigated via "Resolve Conflict"
  const returnEventId =
    searchParams.get("fromReview") || location.state?.fromReviewEventId || null;
  const returnEventName = location.state?.fromReviewEventName || "";

  // Connect to custom data hook handling queries, availability calculations, and modal state
  const {
    // Inventory & Events State
    loading,
    toast,
    setToast,

    // Availability & KPI Metrics
    getEffectiveAvail,
    kpiStats,

    // Search & Filtering
    searchQuery,
    setSearchQuery,
    activeFilters,
    filteredResources,
    handleApplyFilters,
    handleResetFilters,

    // Pagination
    currentPage,
    setCurrentPage,
    itemsPerPage,
    totalPages,
    paginatedResources,

    // Form Modal (Add / Edit)
    isFormModalOpen,
    editingResourceId,
    formData,
    formErrors,
    handleOpenAddModal,
    handleOpenEditModal,
    handleCloseFormModal,
    handleFormFieldChange,
    handleSaveResource,

    // Allocation Modal Wizard
    isAllocModalOpen,
    allocStep,
    allocatingResource,
    effectiveGlobalStock,
    approvedEvents,
    selectedEventId,
    selectedEvent,
    availableForSelectedEvent,
    allocUnits,
    allocError,
    formatDateReadable,
    handleOpenAllocateModal,
    handleCloseAllocModal,
    handleSelectEvent,
    handleProceedToAllocStep2,
    handleBackToAllocStep1,
    handleAllocQtyChange,
    handleConfirmAllocation,

    // Delete Modal
    isDeleteModalOpen,
    resourceToDelete,
    handleOpenDeleteModal,
    handleCloseDeleteModal,
    handleConfirmDelete,
  } = useVendorResourcesData();

  return (
    <div className="dashboard-page">
      {/* ── TOP HEADER BAR WITH WORKING NOTIFICATIONS (Reusable Component) ── */}
      <VendorTopBar title="Manage Resource" />

      <div className="content">
        {/* ── CONFLICT RESOLUTION RETURN BANNER (Shown ONLY when navigated from Event Review) ── */}
        {returnEventId && (
          <div className="return-to-review-banner">
            <div className="return-to-review-info">
              <AlertCircle size={18} />
              <span>
                Resolving conflicts for{" "}
                <strong>{returnEventName ? `"${returnEventName}"` : "Event"}</strong>.
                Adjust inventory or stock levels, then return to review to finalize and approve.
              </span>
            </div>
            <button
              type="button"
              className="btn-back-to-review"
              onClick={() => navigate(`/vendor/events/${returnEventId}/review`)}
              title="Return to Event Feasibility Review"
            >
              <ArrowLeft size={15} />
              <span>Back to Event Review</span>
            </button>
          </div>
        )}

        {/* ── COMPONENT 1: TRANSIENT ACTION FEEDBACK TOAST BANNER (Reusable Component) ── */}
        <EventsToastFeedback
          toast={toast}
          onClose={() => setToast(null)}
        />

        {/* ── COMPONENT 2: KPI METRIC CARDS ROW (Using reusable StatisticCard) ── */}
        <ResourceStatsGrid
          stats={kpiStats}
          loading={loading}
        />

        {/* ── COMPONENT 3: TOOLBAR (SEARCH, MULTI-CRITERIA FILTERS & ADD RESOURCE) ── */}
        <ResourceToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClearSearch={() => setSearchQuery("")}
          activeFilters={activeFilters}
          onApplyFilters={handleApplyFilters}
          onResetFilters={handleResetFilters}
          onOpenAddModal={handleOpenAddModal}
        />

        {/* ── COMPONENT 4: INVENTORY DATA TABLE WITH MODULAR ROWS & PAGINATION ── */}
        <ResourceTable
          resources={paginatedResources}
          loading={loading}
          totalFiltered={filteredResources.length}
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          getEffectiveAvail={getEffectiveAvail}
          onAllocate={handleOpenAllocateModal}
          onEdit={handleOpenEditModal}
          onDelete={handleOpenDeleteModal}
        />
      </div>

      {/* ── COMPONENT 5: ADD / EDIT RESOURCE MODAL DIALOG ── */}
      <ResourceFormModal
        isOpen={isFormModalOpen}
        editingResourceId={editingResourceId}
        formData={formData}
        formErrors={formErrors}
        onChange={handleFormFieldChange}
        onSubmit={handleSaveResource}
        onClose={handleCloseFormModal}
      />

      {/* ── COMPONENT 6: 2-PHASE ALLOCATE RESOURCE WIZARD MODAL ── */}
      <ResourceAllocationModal
        isOpen={isAllocModalOpen}
        allocStep={allocStep}
        allocatingResource={allocatingResource}
        effectiveGlobalStock={effectiveGlobalStock}
        approvedEvents={approvedEvents}
        selectedEventId={selectedEventId}
        selectedEvent={selectedEvent}
        availableForSelectedEvent={availableForSelectedEvent}
        allocUnits={allocUnits}
        allocError={allocError}
        formatDateReadable={formatDateReadable}
        onSelectEvent={handleSelectEvent}
        onProceedStep2={handleProceedToAllocStep2}
        onBackStep1={handleBackToAllocStep1}
        onAllocQtyChange={handleAllocQtyChange}
        onConfirmAllocation={handleConfirmAllocation}
        onClose={handleCloseAllocModal}
      />

      {/* ── COMPONENT 7: DELETE CONFIRMATION SAFEGUARD MODAL ── */}
      <ResourceDeleteModal
        isOpen={isDeleteModalOpen}
        resource={resourceToDelete}
        onConfirm={handleConfirmDelete}
        onClose={handleCloseDeleteModal}
      />
    </div>
  );
}

export default ManageResource;
