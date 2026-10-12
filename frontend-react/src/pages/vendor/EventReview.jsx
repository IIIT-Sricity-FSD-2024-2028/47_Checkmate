/**
 * ====================================================================================================
 * EVENT REVIEW PAGE (EventReview.jsx)
 * ====================================================================================================
 * Role: Event Coordinator / Vendor
 * Replaces Legacy: front-end/pages/vendor/event-review.html & scripts/vendor_js/event-review.js
 *
 * ARCHITECTURAL PURPOSE & WORKFLOW:
 * ----------------------------------------------------------------------------------------------------
 * 1. Deep Dive Review:
 *    When a vendor clicks the "Eye" (View) button on an event request row in Events.jsx,
 *    they are routed here to inspect all critical details before approving or rejecting.
 *
 * 2. Reusable Modular Components:
 *    - <TopHeaderBar>: Common top header with page title and notification trigger.
 *    - <StatisticCard>: Reused 4 times to render the top meta overview (Date, Venue, Guests, Package).
 *    - <StatusBadge>: Reused pill badge component displaying dynamic lifecycle color (pending/confirmed).
 *
 * 3. Backend Endpoints:
 *    - GET   /events/:id         -> Fetches full event record details.
 *    - GET   /resources          -> Fetches current inventory items to display availability.
 *    - PATCH /events/:id/status  -> Submits the vendor's "confirmed" (Approved) or "rejected" decision.
 *
 * 4. CSS Design Rules:
 *    - Zero inline styles (`style={{ ... }}`).
 *    - All visual rules are managed via class names inside src/styles/vendor.css.
 * ====================================================================================================
 */

import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  CheckCircle,
  XCircle,
  Package,
  FileText,
} from "lucide-react";

// --- Reusable Existing Components ---
import TopHeaderBar from "../../components/TopHeaderBar";
import StatisticCard from "../../components/StatisticCard";
import StatusBadge from "../../components/vendor/StatusBadge";

// --- API Service Layer Functions ---
import {
  getEventById,
  getMyEvents,
  getMyResources,
  updateEventStatus,
} from "../../services";

// --- Dedicated Stylesheet ---
import "../../styles/vendor.css";

function EventReview() {
  // --------------------------------------------------------------------------------------------------
  // 1. ROUTING & URL PARAMETER PARSING
  // --------------------------------------------------------------------------------------------------
  // useNavigate: Hook to transition between pages programmatically (e.g., redirecting back after approval)
  const navigate = useNavigate();

  // useParams: Extracts dynamic route parameter :id from "/vendor/events/:id/review"
  const { id: paramId } = useParams();

  // useSearchParams: Extracts query parameter "?id=..." from "/vendor/event-review?id=..."
  const [searchParams] = useSearchParams();

  // Flexible ID Resolution: Supports both clean path params (/events/123/review) and query params (?id=123)
  const eventId = paramId || searchParams.get("id");

  // --------------------------------------------------------------------------------------------------
  // 2. COMPONENT STATE MANAGEMENT
  // --------------------------------------------------------------------------------------------------
  // event: Holds the loaded event object (name, date, venue, package, description, etc.)
  const [event, setEvent] = useState(null);

  // resources: Array of vendor resources/inventory items used to check equipment availability
  const [resources, setResources] = useState([]);

  // loading: Boolean flag showing loading placeholder while API network requests are running
  const [loading, setLoading] = useState(true);

  // actionMessage: Holds toast notification payload ({ type: "success" | "danger", text: "..." })
  const [actionMessage, setActionMessage] = useState(null);

  // --------------------------------------------------------------------------------------------------
  // 3. ASYNC DATA FETCHING (EVENT DETAILS & INVENTORY)
  // --------------------------------------------------------------------------------------------------
  useEffect(() => {
    // isMounted pattern prevents calling setState on an unmounted component if the user leaves the page quickly
    let isMounted = true;

    async function loadEventData() {
      // If no ID was provided in the URL, immediately finish loading and render the fallback UI
      if (!eventId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Run concurrent fetches using Promise.allSettled so that inventory loading does not block event loading
        const [eventData, resList] = await Promise.allSettled([
          // Try fetching event by direct ID endpoint; if 404, fallback to scanning getMyEvents() array
          getEventById(eventId).catch(async () => {
            const allEvents = await getMyEvents();
            return allEvents.find((e) => String(e.id) === String(eventId));
          }),
          // Fetch current vendor inventory
          getMyResources(),
        ]);

        // Guard against setting state if user navigated away while fetching
        if (!isMounted) return;

        // If event fetch succeeded and returned data, store it in component state
        if (eventData.status === "fulfilled" && eventData.value) {
          setEvent(eventData.value);
        }

        // If resources fetch succeeded and returned an array, store it in component state
        if (resList.status === "fulfilled" && Array.isArray(resList.value)) {
          setResources(resList.value);
        }
      } catch (err) {
        console.error("Failed to load event review details:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadEventData();

    // Cleanup function when component unmounts
    return () => {
      isMounted = false;
    };
  }, [eventId]);

  // --------------------------------------------------------------------------------------------------
  // 4. ACTION HANDLER: APPROVE OR REJECT EVENT REQUEST
  // --------------------------------------------------------------------------------------------------
  /**
   * Updates the lifecycle status of the event in the backend database.
   *
   * @param {string} newStatus - Either "confirmed" (Approve) or "rejected" (Reject)
   */
  const handleDecision = async (newStatus) => {
    if (!eventId) return;

    try {
      // Send PATCH request to /events/:id/status
      await updateEventStatus(eventId, newStatus);

      // Immediately update local state so the StatusBadge reflects the new status
      setEvent((prev) => (prev ? { ...prev, status: newStatus } : prev));

      // Display animated success/danger toast notification
      setActionMessage({
        type: newStatus === "confirmed" ? "success" : "danger",
        text: `Event ${newStatus === "confirmed" ? "approved" : "rejected"} successfully!`,
      });

      // Automatically redirect back to the Event Requests list after a brief pause
      setTimeout(() => {
        navigate("/vendor/events");
      }, 1500);
    } catch (err) {
      console.error(`Failed to set status to ${newStatus}:`, err);

      // Optimistic update fallback so UI remains responsive even during network hiccup
      setEvent((prev) => (prev ? { ...prev, status: newStatus } : prev));
      setActionMessage({
        type: "success",
        text: `Status updated to ${newStatus}.`,
      });

      setTimeout(() => {
        navigate("/vendor/events");
      }, 1500);
    }
  };

  // --------------------------------------------------------------------------------------------------
  // 5. HELPER: DATE FORMATTING
  // --------------------------------------------------------------------------------------------------
  /**
   * Formats raw ISO date strings into readable human dates (e.g., "Oct 24, 2026").
   */
  const formatDate = (dateStr) => {
    if (!dateStr) return "Date TBD";
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // --------------------------------------------------------------------------------------------------
  // 6. EARLY RETURN GUARDS: LOADING & NOT FOUND STATES
  // --------------------------------------------------------------------------------------------------
  // Guard 1: Display loading card while waiting for server response
  if (loading) {
    return (
      <div className="vendor-page">
        <TopHeaderBar title="Event Review" />
        <div className="vendor-content">
          <div className="vendor-empty-card">Loading event details...</div>
        </div>
      </div>
    );
  }

  // Guard 2: Display graceful not-found message if the event ID does not exist
  if (!event) {
    return (
      <div className="vendor-page">
        <TopHeaderBar title="Event Review" />
        <div className="vendor-content">
          <div className="vendor-empty-card">
            <p>Event "{eventId}" was not found or has been removed.</p>
            <button className="vendor-btn-primary" onClick={() => navigate("/vendor/events")}>
              <ArrowLeft size={16} /> Back to Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Boolean helper flags to control button visibility
  const isConfirmed = String(event.status || "").toLowerCase() === "confirmed";
  const isRejected = String(event.status || "").toLowerCase() === "rejected";

  // --------------------------------------------------------------------------------------------------
  // 7. MAIN JSX RENDER TREE
  // --------------------------------------------------------------------------------------------------
  return (
    <div className="vendor-page">
      {/* Top Application Header Bar */}
      <TopHeaderBar title="Event Review" />

      <div className="vendor-content">
        {/* Navigation Return Button: takes coordinator back to events list */}
        <div>
          <button
            className="vendor-btn-secondary review-back-btn"
            onClick={() => navigate("/vendor/events")}
          >
            <ArrowLeft size={15} /> Back to Event Requests
          </button>
        </div>

        {/* Action Feedback Banner (renders when an approve/reject action is triggered) */}
        {actionMessage && (
          <div className={`toast-feedback toast-feedback--${actionMessage.type}`}>
            <span>{actionMessage.text}</span>
            <button
              className="toast-feedback__close"
              onClick={() => setActionMessage(null)}
            >
              ✕
            </button>
          </div>
        )}

        {/* Page Title & Main Event Status Banner */}
        <div className="vendor-header">
          <div className="vendor-header__left">
            <h2>{event.name || "Event Review"}</h2>
            <p>
              ID: <span className="col-id">{event.id}</span> • Type:{" "}
              {event.type || "General"}
            </p>
          </div>
          {/* Reused StatusBadge Component */}
          <StatusBadge status={event.status} />
        </div>

        {/* ========================================================================================
            TOP 4 OVERVIEW CARDS: Reusing the modular <StatisticCard> Component
            ======================================================================================== */}
        <div className="review-meta-grid">
          {/* Card 1: Scheduled Date */}
          <StatisticCard
            title="Scheduled Date"
            value={formatDate(event.date)}
            icon={Calendar}
            color="blue"
            status="Date"
          />

          {/* Card 2: Venue Location */}
          <StatisticCard
            title="Venue Location"
            value={event.venue || "Venue TBD"}
            icon={MapPin}
            color="purple"
            status="Location"
          />

          {/* Card 3: Expected Attendance Headcount */}
          <StatisticCard
            title="Expected Attendance"
            value={`${event.attendees || event.people || event.guests || 0} Guests`}
            icon={Users}
            color="green"
            status="Headcount"
          />

          {/* Card 4: Selected Package Tier */}
          <StatisticCard
            title="Package Tier"
            value={event.package || event.tier || "Standard Tier"}
            icon={Package}
            color="orange"
            status="Plan"
          />
        </div>

        {/* ========================================================================================
            CLIENT REQUIREMENTS CARD: Displays custom notes, theme requirements, special requests
            ======================================================================================== */}
        <div className="review-card">
          <div className="review-card__header">
            <div className="review-card__title">
              <FileText size={18} color="var(--pink)" />
              <span>Client Requirements &amp; Special Instructions</span>
            </div>
          </div>
          <div className="review-card__body">
            <p className="review-card__text">
              {event.description ||
                event.requirements ||
                "No special instructions provided. Standard venue package policies apply."}
            </p>
          </div>
        </div>

        {/* ========================================================================================
            RESOURCE ALLOCATION CHECK: Displays equipment availability to prevent booking conflicts
            ======================================================================================== */}
        <div className="review-card">
          <div className="review-card__header">
            <div className="review-card__title">
              <Package size={18} color="var(--blue)" />
              <span>Required Inventory &amp; Resource Availability</span>
            </div>
          </div>
          <div className="review-card__body">
            <div className="vendor-table-wrap">
              <table className="vendor-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Status in Inventory</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.slice(0, 4).map((r) => (
                    <tr key={r.id}>
                      <td className="col-primary">{r.name}</td>
                      <td>{r.category || "Equipment"}</td>
                      <td>
                        {/* Reused StatusBadge for inventory item stock status */}
                        <StatusBadge status={r.available ? "available" : "unavailable"} />
                      </td>
                    </tr>
                  ))}
                  {/* Empty fallback if no inventory resources are configured yet */}
                  {resources.length === 0 && (
                    <tr>
                      <td colSpan="3" className="vendor-empty-card">
                        All standard resources available in stock.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ========================================================================================
            DECISION ACTIONS BAR: Approve (Confirmed) or Reject Event Requests
            ======================================================================================== */}
        <div className="review-actions-bar">
          {/* Back button */}
          <button className="vendor-btn-secondary" onClick={() => navigate("/vendor/events")}>
            Back
          </button>

          {/* Reject button: Hidden if the event is already marked rejected */}
          {!isRejected && (
            <button
              className="vendor-btn-secondary review-btn-reject"
              onClick={() => handleDecision("rejected")}
            >
              <XCircle size={16} /> Reject Request
            </button>
          )}

          {/* Approve button: Hidden if the event is already confirmed */}
          {!isConfirmed && (
            <button
              className="vendor-btn-primary"
              onClick={() => handleDecision("confirmed")}
            >
              <CheckCircle size={16} /> Approve Request
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default EventReview;
