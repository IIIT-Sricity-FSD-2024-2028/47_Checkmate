/**
 * ============================================================================
 * MODULAR MANAGE STAFF PAGE (ManageStaff.jsx)
 * ============================================================================
 * Role: Event Coordinator / Vendor
 * Location: src/pages/vendor/ManageStaff.jsx
 *
 * Parent / Invocation Context:
 *   - Route: /vendor/staff and /vendor/manage-staff (Vendor Portal)
 *   - Parent Component: App Router / Vendor Layout
 *
 * Purpose:
 *   High-level orchestrator page for managing vendor workforce and event staffing:
 *     1. Connects to `useVendorStaffData` custom hook for state & queries.
 *     2. Assembles focused, reusable modular subcomponents:
 *         - <TopHeaderBar>: Unified top header with title and notifications indicator.
 *         - <EventsToastFeedback>: Immediate feedback toast for create, edit, assign, and delete actions.
 *         - <StaffStatsGrid>: 4-column KPI metric cards (Total Staff, Available, Busy, High Workload).
 *         - <StaffToolbar>: Search input, multi-criteria filters, Add Staff, and Request Recruitment triggers.
 *         - <StaffGrid>: Responsive cards grid rendering individual team members via <StaffCard>.
 *         - <StaffFormModal>: Validated dialog for adding and editing staff profiles.
 *         - <StaffAssignModal>: Task assignment wizard with single-event exclusivity safeguard.
 *         - <StaffScheduleModal>: Schedule inspection view displaying assigned events and tasks.
 *         - <StaffDeleteModal>: Safeguard confirmation dialog for removing staff members.
 *         - <StaffRecruitModal>: Administrative requisition dialog for recruiting new positions.
 *
 * Reusable Components Utilized:
 *   - <TopHeaderBar>: src/components/TopHeaderBar.jsx
 *   - <EventsToastFeedback>: src/components/vendor/EventsToastFeedback.jsx
 *   - <StatisticCard>: Used inside <StaffStatsGrid>
 *   - <StaffCard>: Used inside <StaffGrid>
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
import useVendorStaffData from "../../components/vendor/useVendorStaffData";

// Modular Vendor Staff Subcomponents
import StaffStatsGrid from "../../components/vendor/StaffStatsGrid";
import StaffToolbar from "../../components/vendor/StaffToolbar";
import StaffGrid from "../../components/vendor/StaffGrid";
import StaffFormModal from "../../components/vendor/StaffFormModal";
import StaffAssignModal from "../../components/vendor/StaffAssignModal";
import StaffScheduleModal from "../../components/vendor/StaffScheduleModal";
import StaffDeleteModal from "../../components/vendor/StaffDeleteModal";
import StaffRecruitModal from "../../components/vendor/StaffRecruitModal";

function ManageStaff() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Retrieve review return context if navigated via "Resolve Conflict"
  const returnEventId =
    searchParams.get("fromReview") || location.state?.fromReviewEventId || null;
  const returnEventName = location.state?.fromReviewEventName || "";

  const {
    // Primary Data State
    loading,
    toast,
    setToast,

    // KPI Metrics
    kpiStats,

    // Search & Filtering
    searchQuery,
    setSearchQuery,
    activeFilters,
    filteredStaff,
    handleApplyFilters,
    handleResetFilters,

    // Pagination
    currentPage,
    setCurrentPage,
    itemsPerPage,
    totalPages,
    paginatedStaff,

    // Add / Edit Modal
    isFormOpen,
    editingStaffId,
    formData,
    formErrors,
    handleOpenAddModal,
    handleOpenEditModal,
    handleCloseFormModal,
    handleFormFieldChange,
    handleSaveStaff,

    // Assign Task Modal
    isAssignOpen,
    assigningStaff,
    actionableEvents,
    restrictedEventId,
    assignEventId,
    setAssignEventId,
    assignTaskName,
    setAssignTaskName,
    assignPriority,
    setAssignPriority,
    assignError,
    handleOpenAssignModal,
    handleCloseAssignModal,
    handleConfirmAssign,

    // Schedule Modal
    isScheduleOpen,
    schedulingStaff,
    staffScheduleEvents,
    formatDateReadable,
    handleOpenScheduleModal,
    handleCloseScheduleModal,

    // Delete Modal
    isDeleteOpen,
    staffToDelete,
    handleOpenDeleteModal,
    handleCloseDeleteModal,
    handleConfirmDelete,

    // Recruitment Modal
    isRecruitOpen,
    recruitData,
    recruitErrors,
    handleOpenRecruitModal,
    handleCloseRecruitModal,
    handleRecruitFieldChange,
    handleSubmitRecruit,
  } = useVendorStaffData();

  return (
    <div className="dashboard-page">
      {/* ── TOP HEADER BAR WITH WORKING NOTIFICATIONS (Reusable Component) ── */}
      <VendorTopBar title="Manage Staff" />

      <div className="content">
        {/* ── CONFLICT RESOLUTION RETURN BANNER (Shown ONLY when navigated from Event Review) ── */}
        {returnEventId && (
          <div className="return-to-review-banner">
            <div className="return-to-review-info">
              <AlertCircle size={18} />
              <span>
                Resolving staffing conflicts for{" "}
                <strong>{returnEventName ? `"${returnEventName}"` : "Event"}</strong>.
                Adjust assignments or recruit staff, then return to review to finalize and approve.
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
        <StaffStatsGrid
          stats={kpiStats}
          loading={loading}
        />

        {/* ── COMPONENT 3: TOOLBAR (SEARCH, MULTI-CRITERIA FILTERS & ACTIONS) ── */}
        <StaffToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClearSearch={() => setSearchQuery("")}
          activeFilters={activeFilters}
          onApplyFilters={handleApplyFilters}
          onResetFilters={handleResetFilters}
          onOpenAddModal={handleOpenAddModal}
          onOpenRecruitModal={handleOpenRecruitModal}
        />

        {/* ── COMPONENT 4: RESPONSIVE STAFF CARDS GRID WITH PAGINATION ── */}
        <StaffGrid
          staffList={paginatedStaff}
          loading={loading}
          totalFiltered={filteredStaff.length}
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onAssign={handleOpenAssignModal}
          onSchedule={handleOpenScheduleModal}
          onEdit={handleOpenEditModal}
          onDelete={handleOpenDeleteModal}
        />
      </div>

      {/* ── COMPONENT 5: ADD / EDIT STAFF MODAL DIALOG ── */}
      <StaffFormModal
        isOpen={isFormOpen}
        editingStaffId={editingStaffId}
        formData={formData}
        formErrors={formErrors}
        onChange={handleFormFieldChange}
        onSubmit={handleSaveStaff}
        onClose={handleCloseFormModal}
      />

      {/* ── COMPONENT 6: ASSIGN TASK TO EVENT MODAL DIALOG ── */}
      <StaffAssignModal
        isOpen={isAssignOpen}
        staff={assigningStaff}
        actionableEvents={actionableEvents}
        restrictedEventId={restrictedEventId}
        selectedEventId={assignEventId}
        taskName={assignTaskName}
        priority={assignPriority}
        errorMsg={assignError}
        onSelectEvent={setAssignEventId}
        onTaskNameChange={setAssignTaskName}
        onPriorityChange={setAssignPriority}
        onConfirm={handleConfirmAssign}
        onClose={handleCloseAssignModal}
      />

      {/* ── COMPONENT 7: SCHEDULE INSPECTION MODAL DIALOG ── */}
      <StaffScheduleModal
        isOpen={isScheduleOpen}
        staff={schedulingStaff}
        assignedEvents={staffScheduleEvents}
        formatDate={formatDateReadable}
        onClose={handleCloseScheduleModal}
      />

      {/* ── COMPONENT 8: DELETE CONFIRMATION SAFEGUARD MODAL ── */}
      <StaffDeleteModal
        isOpen={isDeleteOpen}
        staff={staffToDelete}
        onConfirm={handleConfirmDelete}
        onClose={handleCloseDeleteModal}
      />

      {/* ── COMPONENT 9: RECRUITMENT REQUISITION MODAL DIALOG ── */}
      <StaffRecruitModal
        isOpen={isRecruitOpen}
        formData={recruitData}
        errors={recruitErrors}
        onChange={handleRecruitFieldChange}
        onSubmit={handleSubmitRecruit}
        onClose={handleCloseRecruitModal}
      />
    </div>
  );
}

export default ManageStaff;
