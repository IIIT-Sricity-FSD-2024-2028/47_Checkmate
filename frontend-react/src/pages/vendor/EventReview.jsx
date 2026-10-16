/**
 * ============================================================================
 * MODULAR EVENT REVIEW PAGE (EventReview.jsx)
 * ============================================================================
 * Role: Event Coordinator / Vendor
 * Purpose:
 *   Parent page coordinating event review state, inventory/staffing evaluation,
 *   and accept/reject actions.
 *
 * Modular Architecture (Divided into Subcomponents):
 *   - <TopHeaderBar>: Top app header bar.
 *   - <EventReviewHeader>: Navigation back button, event title, and status badge.
 *   - <EventReviewStats>: 4 KPI summary cards (Date, Attendees, Resource Feasibility, Staffing).
 *   - <EventFeasibilityBanner>: High-visibility decision banner (Safe vs Shortage).
 *   - <EventResourceRequirementsTable>: Required resources vs available inventory table.
 *   - <EventStaffRequirementsTable>: Required staff roles vs active staff table.
 *   - <EventReviewActionBar>: Decision action buttons (Back, Reject, Accept).
 *
 * Connected Backend Endpoints:
 *   - GET   /events/:id (via getEventById) -> Loads event details.
 *   - GET   /resources  (via getMyResources) -> Loads available inventory.
 *   - GET   /staff      (via getMyStaff) -> Loads available team members.
 *   - PATCH /events/:id/status (via updateEventStatus) -> Approves or rejects event.
 * ============================================================================
 */

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

// Top Header Bar
import TopHeaderBar from "../../components/TopHeaderBar";

// Modular Vendor Components
import EventReviewHeader from "../../components/vendor/EventReviewHeader";
import EventReviewStats from "../../components/vendor/EventReviewStats";
import EventFeasibilityBanner from "../../components/vendor/EventFeasibilityBanner";
import EventResourceRequirementsTable from "../../components/vendor/EventResourceRequirementsTable";
import EventStaffRequirementsTable from "../../components/vendor/EventStaffRequirementsTable";
import EventReviewActionBar from "../../components/vendor/EventReviewActionBar";

// Backend API services
import { getEventById, getMyEvents, updateEventStatus } from "../../services/eventService";
import { getMyResources } from "../../services/resourceService";
import { getMyStaff } from "../../services/staffService";

// Central vendor stylesheet (Zero inline styling)
import "../../styles/vendor.css";

function EventReview() {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const [searchParams] = useSearchParams();

  // Resolves event ID from either route param (/vendor/events/:id/review) or query param (?id=EVT001)
  const eventId = paramId || searchParams.get("id");

  // --------------------------------------------------------------------------
  // 1. COMPONENT STATE
  // --------------------------------------------------------------------------
  // The event data object loaded from backend
  const [event, setEvent] = useState(null);

  // Vendor's active inventory catalog
  const [resources, setResources] = useState([]);

  // Vendor's active team members
  const [staffList, setStaffList] = useState([]);

  // Loading flag while performing initial asynchronous data fetches
  const [loading, setLoading] = useState(true);

  // Transient feedback toast banner
  const [toast, setToast] = useState(null);

  // --------------------------------------------------------------------------
  // 2. FETCH EVENT, RESOURCES, AND STAFF ON COMPONENT MOUNT
  // --------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!eventId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch event, resources, and staff concurrently for maximum speed
        const [eventData, resData, staffData] = await Promise.all([
          getEventById(eventId).catch(async () => {
            // Fallback: search in all vendor events if direct ID lookup fails
            const all = await getMyEvents();
            return all.find((e) => String(e.id) === String(eventId)) || null;
          }),
          getMyResources().catch(() => []),
          getMyStaff().catch(() => []),
        ]);

        if (isMounted) {
          setEvent(eventData);
          if (Array.isArray(resData)) setResources(resData);
          if (Array.isArray(staffData)) setStaffList(staffData);
        }
      } catch (error) {
        console.error("Failed to load event review details:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [eventId]);

  // Helper to trigger an auto-expiring feedback toast
  const showToast = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  // --------------------------------------------------------------------------
  // 3. RESOURCE REQUIREMENTS & AVAILABILITY EVALUATION
  // --------------------------------------------------------------------------
  // Normalizes requested resources and checks stock levels in inventory
  const resourceRequirements = useMemo(() => {
    if (!event) return [];
    const list = event.requestedResources || event.resources || [];

    return list.map((item) => {
      // Format A: String e.g. "Audio System Premium (2)"
      if (typeof item === "string") {
        const match = item.match(/^(.*?)(?:\s*\((\d+)\))?$/);
        const name = match ? match[1].trim() : item;
        const requiredQty = match && match[2] ? parseInt(match[2], 10) : 1;
        const matchRes = resources.find((r) => r.name?.toLowerCase() === name.toLowerCase());
        const avail = matchRes ? (matchRes.avail ?? matchRes.quantity ?? 0) : 0;

        return {
          id: matchRes?.id || name,
          name,
          category: matchRes?.category || "Equipment",
          required: requiredQty,
          available: avail,
          isSufficient: avail >= requiredQty,
        };
      }

      // Format B: Object e.g. { resourceId, resourceName, quantity, category }
      const name = item.resourceName || item.name || "Resource";
      const requiredQty = item.quantity || item.qty || 1;
      const matchRes = resources.find(
        (r) => (item.resourceId && r.id === item.resourceId) || r.name?.toLowerCase() === name.toLowerCase()
      );
      const avail = matchRes ? (matchRes.avail ?? matchRes.quantity ?? 0) : 0;

      return {
        id: item.resourceId || matchRes?.id || name,
        name,
        category: item.category || matchRes?.category || "Equipment",
        required: requiredQty,
        available: avail,
        isSufficient: avail >= requiredQty,
      };
    });
  }, [event, resources]);

  // --------------------------------------------------------------------------
  // 4. STAFF REQUIREMENTS & AVAILABILITY EVALUATION
  // --------------------------------------------------------------------------
  // Normalizes requested staff roles and checks member availability
  const staffRequirements = useMemo(() => {
    if (!event) return [];
    const list = event.requestedStaff || event.staff || [];

    return list.map((item) => {
      // Format A: String e.g. "Mike Johnson (Event Coordinator)"
      if (typeof item === "string") {
        const match = item.match(/^(.*?)(?:\s*\((.*?)\))?$/);
        const name = match ? match[1].trim() : item;
        const role = match && match[2] ? match[2].trim() : "Event Staff";
        const member = staffList.find(
          (s) =>
            (s.name?.toLowerCase() === name.toLowerCase() || s.role?.toLowerCase() === role.toLowerCase()) &&
            s.status !== "Inactive"
        );

        return {
          id: member?.id || name,
          role,
          name: member?.name || name,
          isAvailable: !!member,
        };
      }

      // Format B: Object e.g. { staffId, staffName, role }
      const role = item.role || "Event Staff";
      const name = item.staffName || item.name || "";
      const member = staffList.find(
        (s) =>
          (item.staffId && s.id === item.staffId) ||
          (name && s.name?.toLowerCase() === name.toLowerCase()) ||
          s.role?.toLowerCase() === role.toLowerCase()
      );

      return {
        id: item.staffId || member?.id || role,
        role,
        name: member?.name || name || "Unassigned Member",
        isAvailable: !!member && member.status !== "Inactive",
      };
    });
  }, [event, staffList]);

  // Boolean flags for overall feasibility
  const allResourcesAvailable =
    resourceRequirements.length === 0 || resourceRequirements.every((r) => r.isSufficient);

  const allStaffAvailable =
    staffRequirements.length === 0 || staffRequirements.every((s) => s.isAvailable);

  const isFullyFeasible = allResourcesAvailable && allStaffAvailable;

  // --------------------------------------------------------------------------
  // 5. ACTION HANDLER: ACCEPT EVENT
  // --------------------------------------------------------------------------
  const handleAcceptEvent = async () => {
    if (!event) return;

    // Guard warning if accepting with stock or staffing shortages
    if (!isFullyFeasible) {
      const confirmApproval = window.confirm(
        "Warning: Some requested resources or staff members are currently not available. Do you still want to accept this event?"
      );
      if (!confirmApproval) return;
    }

    try {
      await updateEventStatus(event.id, "confirmed");
      setEvent((prev) => ({ ...prev, status: "confirmed" }));
      showToast(`Event "${event.name}" accepted and confirmed successfully!`, "success");
    } catch (err) {
      console.error("Failed to approve event:", err);
      setEvent((prev) => ({ ...prev, status: "confirmed" }));
      showToast(`Event "${event.name}" confirmed locally!`, "success");
    }
  };

  // --------------------------------------------------------------------------
  // 6. ACTION HANDLER: REJECT EVENT
  // --------------------------------------------------------------------------
  const handleRejectEvent = async () => {
    if (!event) return;

    const confirmReject = window.confirm(`Are you sure you want to reject "${event.name}"?`);
    if (!confirmReject) return;

    try {
      await updateEventStatus(event.id, "rejected");
      setEvent((prev) => ({ ...prev, status: "rejected" }));
      showToast(`Event "${event.name}" rejected.`, "danger");
    } catch (err) {
      console.error("Failed to reject event:", err);
      setEvent((prev) => ({ ...prev, status: "rejected" }));
      showToast(`Event "${event.name}" marked as rejected locally.`, "danger");
    }
  };

  // --------------------------------------------------------------------------
  // 7. LOADING & NOT FOUND GUARDS
  // --------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="vendor-page">
        <TopHeaderBar title="Event Review" />
        <div className="vendor-content">
          <div className="card-empty-placeholder">Loading event review details...</div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="vendor-page">
        <TopHeaderBar title="Event Review" />
        <div className="vendor-content">
          <div className="card-empty-placeholder">
            Event request not found.
            <div className="er-empty-actions">
              <button
                type="button"
                className="btn-back"
                onClick={() => navigate("/vendor/events")}
              >
                <ArrowLeft size={14} /> Back to Events
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // 8. MODULAR JSX RENDER TREE
  // --------------------------------------------------------------------------
  return (
    <div className="vendor-page">
      {/* ── Reusable Top Header Bar ── */}
      <TopHeaderBar
        title="Event Review"
        onNotificationClick={() => showToast("No new review alerts.", "info")}
      />

      <div className="vendor-content">
        {/* ── Toast Notification Banner ── */}
        {toast && (
          <div className={`toast-feedback toast-feedback--${toast.type}`}>
            <span>{toast.text}</span>
            <button
              type="button"
              className="toast-feedback__close"
              onClick={() => setToast(null)}
            >
              ✕
            </button>
          </div>
        )}

        {/* ── Component 1: Event Title, Navigation & Status Header ── */}
        <EventReviewHeader
          event={event}
          onBack={() => navigate("/vendor/events")}
        />

        {/* ── Component 2: Summary Metric Statistics Cards ── */}
        <EventReviewStats
          event={event}
          allResourcesAvailable={allResourcesAvailable}
          allStaffAvailable={allStaffAvailable}
          resourceRequirements={resourceRequirements}
          staffRequirements={staffRequirements}
        />

        {/* ── Component 3: Overall Feasibility Decision Guide Banner ── */}
        <EventFeasibilityBanner isFullyFeasible={isFullyFeasible} />

        {/* ── Component 4: Required Resources Inspection Table ── */}
        <EventResourceRequirementsTable requirements={resourceRequirements} />

        {/* ── Component 5: Required Staff Inspection Table ── */}
        <EventStaffRequirementsTable requirements={staffRequirements} />

        {/* ── Component 6: Accept or Reject Decision Action Bar ── */}
        <EventReviewActionBar
          eventStatus={event.status}
          onBack={() => navigate("/vendor/events")}
          onReject={handleRejectEvent}
          onAccept={handleAcceptEvent}
        />
      </div>
    </div>
  );
}

export default EventReview;
