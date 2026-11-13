/**
 * ============================================================================
 * MODULAR EVENT REVIEW PAGE (EventReview.jsx)
 * ============================================================================
 * Role: Event Coordinator / Vendor
 * Location: src/pages/vendor/EventReview.jsx
 *
 * Full Legacy Parity Architecture:
 *   1. EventReviewHeader: Title, event ID, event type, status pill badge.
 *   2. EventReviewStats: 4-column Meta Overview (Date, Time, Venue, Expected Attendees).
 *   3. ClientRequirementsCard: Submitted by, client tags, notes message box,
 *      budget, guests, event type, and Net Payout calculation (90% vendor split).
 *   4. EventFeasibilityBanner: Prominent red conflict alert box with itemized
 *      conflict cards (severity pills) and quick rejection button, or green safe box.
 *   4B. EventVenueAllocationCard: Confirm the client's venue, keep their own venue,
 *      or choose a listed venue through EventVenueModal.
 *   5. EventResourceRequirementsTable: Required vs available stock, buffer deltas,
 *      direct '▶ Allocate' action, and '+ Allocate Resource' modal trigger.
 *   6. EventStaffRequirementsTable: Required roles vs active members, buffer deltas,
 *      direct '+ Assign' action, and '+ Allocate Extra Staff' modal trigger.
 *   6B. EventQuoteCard: Final price the client is billed, set before approval.
 *   7. EventBufferAndRiskSection: Dynamic Risk & Feasibility summary.
 *   8. EventContingencyPlanning: Interactive CRUD table with problem, trigger, solution.
 *   9. EventReviewActionBar: Conditional Approve and Reject decision buttons.
 *  10. Extra Resource, Extra Staff, Keep Waiting & Reject Reason Modals.
 *
 * Resource availability is date-based: GET /api/resources/availability?eventId=
 * returns the units free in THIS event's date/time window (stock booked on
 * other dates is free). The backend re-checks every allocation and answers
 * 400 with a readable message if it would over-book that date.
 * ============================================================================
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

// Top Header Bar
import VendorTopBar from "../../components/vendor/VendorTopBar";

// Modular Subcomponents
import EventReviewHeader from "../../components/vendor/EventReviewHeader";
import EventReviewStats from "../../components/vendor/EventReviewStats";
import ClientRequirementsCard from "../../components/vendor/ClientRequirementsCard";
import EventFeasibilityBanner from "../../components/vendor/EventFeasibilityBanner";
import EventVenueAllocationCard from "../../components/vendor/EventVenueAllocationCard";
import EventVenueModal from "../../components/vendor/EventVenueModal";
import EventResourceRequirementsTable from "../../components/vendor/EventResourceRequirementsTable";
import EventStaffRequirementsTable from "../../components/vendor/EventStaffRequirementsTable";
import EventQuoteCard from "../../components/vendor/EventQuoteCard";
import EventBufferAndRiskSection from "../../components/vendor/EventBufferAndRiskSection";
import EventContingencyPlanning from "../../components/vendor/EventContingencyPlanning";
import EventReviewActionBar from "../../components/vendor/EventReviewActionBar";
import EventExtraResourceModal from "../../components/vendor/EventExtraResourceModal";
import EventExtraStaffModal from "../../components/vendor/EventExtraStaffModal";
import EventKeepWaitingModal from "../../components/vendor/EventKeepWaitingModal";
import RejectReasonModal from "../../components/vendor/RejectReasonModal";

// Backend API services
import {
  findEventCollisions,
  getEventById,
  getEvents,
  getMyEvents,
  updateEventStatus,
  patchEvent,
} from "../../services/eventService";
import { getResources, getResourceAvailabilityMap } from "../../services/resourceService";
import {
  createStaffAssignment,
  deleteStaffAssignment,
  getStaff,
  getStaffAssignments,
  getStaffById,
  patchStaff,
} from "../../services/staffService";
import {
  getResourceAllocations,
  setResourceAllocations,
  getContingencyPlans,
  setContingencyPlans,
  getVenues,
  getVenueAllocations,
  setVenueAllocations,
  getStateKey,
  setStateKey,
} from "../../services/stateService";

// Central vendor stylesheet
import "../../styles/vendor.css";
import "../../styles/bridge.css";

// Default contingency plans fallback
const DEFAULT_CONTINGENCY_PLANS = [
  {
    id: "CP_DEF_001",
    problem: "Weather Emergency",
    trigger: "Severe weather alert",
    solution: "Move to indoor backup ballroom",
    status: "ready",
  },
  {
    id: "CP_DEF_002",
    problem: "Power Outage",
    trigger: "Electrical failure",
    solution: "Activate backup generators and battery AV pack",
    status: "ready",
  },
  {
    id: "CP_DEF_003",
    problem: "Staff No-Show",
    trigger: "Staff absence >30min",
    solution: "Deploy backup staff from reserve pool",
    status: "ready",
  },
];

const DEFAULT_COMMISSION_PERCENT = 10;
const normalizeVenueName = (name) => String(name || "").trim().toLowerCase();
const UNSET_VENUE_NAMES = ["", "tbd", "venue tbd"];
const VENUE_LOCKED_STATUSES = ["confirmed", "approved", "live", "rejected", "completed"];
// Staff on an event in any other status are still working and cannot be allocated.
const FINISHED_EVENT_STATUSES = ["rejected", "completed", "cancelled"];
const APPROVED_EVENT_STATUSES = ["confirmed", "approved", "live"];
const CLOSED_ASSIGNMENT_STATUSES = ["rejected", "declined", "completed"];

function EventReview() {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const [searchParams] = useSearchParams();

  // Resolves event ID from route param (/vendor/events/:id/review) or query param (?id=EVT001)
  const eventId = paramId || searchParams.get("id");

  // --------------------------------------------------------------------------
  // 1. STATE DEFINITIONS
  // --------------------------------------------------------------------------
  const [event, setEvent] = useState(null);
  const [allEvents, setAllEvents] = useState([]);
  const [resources, setResources] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [resourceAllocations, setLocalResourceAllocations] = useState({});
  // Free units per resource in this event's window, from the backend ({ resourceId: units }).
  // null until loaded; the local estimate below is used meanwhile.
  const [eventAvailability, setEventAvailability] = useState(null);
  const [contingencyMap, setLocalContingencyMap] = useState({});
  const [venues, setVenues] = useState([]);
  const [venueAllocations, setLocalVenueAllocations] = useState({});
  const [quoteInput, setQuoteInput] = useState(null);
  const [commissionPercent, setCommissionPercent] = useState(DEFAULT_COMMISSION_PERCENT);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Immediate and safe toast notification handler
  const showToast = useCallback((text, type = "info") => {
    setToast({ text, type });
    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  // Modal visibility states
  const [isExtraResOpen, setIsExtraResOpen] = useState(false);
  const [isExtraStaffOpen, setIsExtraStaffOpen] = useState(false);
  const [replacingStaff, setReplacingStaff] = useState(null);
  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);
  const [isKeepWaitingOpen, setIsKeepWaitingOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  // --------------------------------------------------------------------------
  // 2. FETCH EVENT, INVENTORY, STAFF, ALLOCATIONS & CONTINGENCY PLANS
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
        const cleanId = String(eventId || "").trim();
        const normalizedId = cleanId.replace(/^EVT-/, "EVT");

        const fetchEvent = async () => {
          try {
            return await getEventById(normalizedId);
          } catch {
            try {
              return await getEventById(cleanId);
            } catch {
              const all = await getMyEvents().catch(() => []);
              const found = all.find(
                (e) =>
                  String(e.id).toLowerCase() === cleanId.toLowerCase() ||
                  String(e.id).toLowerCase() === normalizedId.toLowerCase()
              );
              if (found) return found;

              const allEventsGlobal = await getEvents().catch(() => []);
              return (
                allEventsGlobal.find(
                  (e) =>
                    String(e.id).toLowerCase() === cleanId.toLowerCase() ||
                    String(e.id).toLowerCase() === normalizedId.toLowerCase()
                ) || null
              );
            }
          }
        };

        const [
          eventData,
          eventsList,
          resData,
          staffData,
          assignmentsData,
          allocsData,
          plansData,
          venueData,
          venueAllocsData,
          platformSettings,
        ] = await Promise.all([
          fetchEvent(),
          getEvents().catch(() => getMyEvents().catch(() => [])),
          getResources().catch(() => []),
          getStaff().catch(() => []),
          getStaffAssignments().catch(() => []),
          getResourceAllocations().catch(() => ({})),
          getContingencyPlans().catch(() => {
            try {
              const local = localStorage.getItem("eventpro_contingencyPlans");
              return local ? JSON.parse(local) : {};
            } catch {
              return {};
            }
          }),
          getVenues().catch(() => []),
          getVenueAllocations().catch(() => ({})),
          getStateKey("platformSettings").catch(() => null),
        ]);

        if (isMounted) {
          setEvent(eventData);
          setAllEvents(Array.isArray(eventsList) ? eventsList : []);
          setResources(Array.isArray(resData) ? resData : []);
          setStaffList(Array.isArray(staffData) ? staffData : []);
          setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
          setVenues(Array.isArray(venueData) ? venueData : []);
          setCommissionPercent(Number(platformSettings?.commissionRate ?? DEFAULT_COMMISSION_PERCENT));
          setLocalVenueAllocations(
            venueAllocsData && typeof venueAllocsData === "object" ? venueAllocsData : {}
          );

          // Normalize resource allocations
          const safeAllocs =
            allocsData && typeof allocsData === "object" ? allocsData : {};
          setLocalResourceAllocations(safeAllocs);

          // Normalize contingency plans
          const safePlans =
            plansData && typeof plansData === "object" ? plansData : {};
          setLocalContingencyMap(safePlans);
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

  // Re-asks the backend what is free for this event whenever its date or the
  // allocations change. The backend leaves this event's own units out.
  useEffect(() => {
    let isMounted = true;
    async function loadAvailability() {
      if (!event?.id || !event?.date) return;
      try {
        const map = await getResourceAvailabilityMap({ eventId: event.id });
        if (isMounted) setEventAvailability(map);
      } catch (err) {
        console.error("Failed to load date availability:", err);
        if (isMounted) setEventAvailability(null);
      }
    }
    loadAvailability();
    return () => {
      isMounted = false;
    };
  }, [event?.id, event?.date, event?.time, event?.endTime, resourceAllocations]);

  // --------------------------------------------------------------------------
  // 3. DATE-BASED RESOURCE AVAILABILITY CALCULATOR (Legacy Parity)
  // --------------------------------------------------------------------------
  // Units of a resource free for an event. For this page's own event the
  // backend answer is used; otherwise a local same-date estimate.
  const getResourceAvailableForEvent = useCallback(
    (resId, targetDate, currentEventId) => {
      if (
        eventAvailability &&
        event &&
        currentEventId === event.id &&
        targetDate === event.date &&
        eventAvailability[resId] !== undefined
      ) {
        return eventAvailability[resId];
      }
      const db = resources.find((x) => x.id === resId);
      if (!db) return 0;
      const totalStock = Number(db.total || db.quantity || db.avail || 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Other active events contending for stock on this date
      const activeEvents = allEvents.filter((e) => {
        if (FINISHED_EVENT_STATUSES.includes(String(e.status).toLowerCase())) return false;
        if (e.id === currentEventId) return false;
        if (!e.date) return false;

        if (targetDate) {
          return e.date === targetDate;
        }

        const evDate = new Date(e.date + "T00:00:00");
        return evDate <= today;
      });

      let allocated = 0;
      activeEvents.forEach((ev) => {
        const evAllocs = resourceAllocations[ev.id] || [];
        evAllocs.forEach((a) => {
          if (a.resourceId === resId && a.status !== "released") {
            allocated += Number(a.qty || a.quantity || 0);
          }
        });
      });

      return Math.max(0, totalStock - allocated);
    },
    [resources, allEvents, resourceAllocations, eventAvailability, event]
  );

  // --------------------------------------------------------------------------
  // 4. RESOURCE REQUIREMENTS EVALUATION
  // --------------------------------------------------------------------------
  const resourceRequirements = useMemo(() => {
    if (!event) return [];
    const rawList = event.requestedResources || event.resources || [];
    const list = Array.isArray(rawList) ? [...rawList] : [];
    const evAllocs = resourceAllocations[event.id] || [];

    // Case 2 & dynamic additions: merge any allocations from evAllocs into list
    evAllocs.forEach((a) => {
      const alreadyInList = list.some((item) => {
        const id = typeof item === "string" ? item : (item.resourceId || item.id);
        const name = typeof item === "string" ? item : (item.resourceName || item.name);
        return (a.resourceId && id === a.resourceId) ||
               (a.resourceName && name?.toLowerCase() === a.resourceName?.toLowerCase());
      });
      if (!alreadyInList) {
        list.push({
          id: a.resourceId || `alloc_${a.resourceName}`,
          resourceId: a.resourceId,
          resourceName: a.resourceName || "Allocated Resource",
          quantity: a.qty || a.quantity || 1,
          category: a.category || "Equipment",
        });
      }
    });

    return list.map((item) => {
      let name = "";
      let requiredQty = 1;
      let category = "Equipment";
      let resourceId = null;

      if (typeof item === "string") {
        const match = item.match(/^(.*?)(?:\s*\((\d+)\))?$/);
        name = match ? match[1].trim() : item;
        requiredQty = match && match[2] ? parseInt(match[2], 10) : 1;
        const matchRes = resources.find(
          (r) => r.name?.toLowerCase() === name.toLowerCase()
        );
        resourceId = matchRes?.id || name;
        category = matchRes?.category || "Equipment";
      } else {
        name = item.resourceName || item.name || "Resource";
        requiredQty = Number(item.quantity || item.qty || 1);
        resourceId = item.resourceId || item.id;
        const matchRes = resources.find(
          (r) =>
            (resourceId && r.id === resourceId) ||
            r.name?.toLowerCase() === name.toLowerCase()
        );
        category = item.category || matchRes?.category || "Equipment";
      }

      // Check if already allocated for this specific event
      const isAllocated = evAllocs.some(
        (a) => a.resourceId === resourceId || a.resourceName?.toLowerCase() === name.toLowerCase()
      );

      const avail = isAllocated
        ? requiredQty
        : getResourceAvailableForEvent(resourceId, event.date, event.id);

      return {
        id: resourceId || name,
        resourceId,
        name,
        category,
        required: requiredQty,
        available: avail,
        isAllocated,
        isSufficient: isAllocated || avail >= requiredQty,
      };
    });
  }, [event, resources, resourceAllocations, getResourceAvailableForEvent]);

  // --------------------------------------------------------------------------
  // 4B. STAFF AVAILABILITY RULES
  // --------------------------------------------------------------------------
  // Every event a member is tied to, from their staff record and open assignments.
  const getAssignedEventRefs = useCallback(
    (member) => {
      const refs = new Set(Array.isArray(member.assignedEvents) ? member.assignedEvents : []);
      assignments.forEach((a) => {
        const isOpen = !CLOSED_ASSIGNMENT_STATUSES.includes(String(a.status).toLowerCase());
        if (a.staffId === member.id && isOpen) refs.add(a.eventId || a.eventName);
      });
      return refs;
    },
    [assignments]
  );

  const isOnThisEvent = useCallback(
    (member) => Boolean(event) && getAssignedEventRefs(member).has(event.id),
    [event, getAssignedEventRefs]
  );

  // The unfinished event, other than this one, that a member is working on.
  // Read from the events themselves: status on the staff record can go stale.
  const getOtherActiveEvent = useCallback(
    (member) => {
      const refs = getAssignedEventRefs(member);
      return (
        allEvents.find(
          (e) =>
            e.id !== event?.id &&
            !FINISHED_EVENT_STATUSES.includes(String(e.status).toLowerCase()) &&
            (refs.has(e.id) || refs.has(e.name))
        ) || null
      );
    },
    [event, allEvents, getAssignedEventRefs]
  );

  // Why a member cannot be allocated to this event, or null when they are free.
  const getAssignBlockReason = useCallback(
    (member) => {
      if (isOnThisEvent(member)) return "already assigned to this event";
      if (member.status === "off") return "off duty";
      const otherEvent = getOtherActiveEvent(member);
      if (otherEvent) return `already assigned to ${otherEvent.name}`;
      if (member.status === "busy" || member.avail === "Busy") return "marked as busy";
      const workload = Number(member.workload || 0);
      if (workload >= 80) return `workload is at ${workload}% (limit 80%)`;
      return null;
    },
    [isOnThisEvent, getOtherActiveEvent]
  );

  // Id and name are exact requests. Role alone can be filled by anyone in that
  // role, so a free member is preferred.
  const findRequestedMember = useCallback(
    (staffId, name, role) => {
      const sameRole = staffList.filter(
        (s) => s.role?.toLowerCase() === role.toLowerCase() && s.status !== "Inactive"
      );
      return (
        staffList.find((s) => staffId && s.id === staffId) ||
        staffList.find((s) => name && s.name?.toLowerCase() === name.toLowerCase()) ||
        sameRole.find((s) => !getOtherActiveEvent(s)) ||
        sameRole[0]
      );
    },
    [staffList, getOtherActiveEvent]
  );

  // --------------------------------------------------------------------------
  // 5. STAFF REQUIREMENTS EVALUATION
  // --------------------------------------------------------------------------
  const staffRequirements = useMemo(() => {
    if (!event) return [];
    const rawList = event.requestedStaff || event.staff || [];
    const list = Array.isArray(rawList) ? [...rawList] : [];

    // Case 2 & dynamic additions: merge any staff in staffList assigned to this event
    const assignedStaffMembers = staffList.filter((s) => isOnThisEvent(s));
    assignedStaffMembers.forEach((member) => {
      const alreadyInList = list.some((item) => {
        const id = typeof item === "string" ? item : (item.staffId || item.id);
        const name = typeof item === "string" ? item : (item.staffName || item.name);
        return (member.id && id === member.id) ||
               (member.name && name?.toLowerCase() === member.name?.toLowerCase());
      });
      if (!alreadyInList) {
        list.push({
          id: member.id,
          staffId: member.id,
          name: member.name,
          role: member.role || "Event Staff",
        });
      }
    });

    return list.map((item, requestIndex) => {
      let name = "";
      let role = "Event Staff";
      let staffId = null;

      if (typeof item === "string") {
        const match = item.match(/^(.*?)(?:\s*\((.*?)\))?$/);
        name = match ? match[1].trim() : item;
        role = match && match[2] ? match[2].trim() : "Event Staff";
        const member = findRequestedMember(null, name, role);
        staffId = member?.id || name;
        name = member?.name || name;
      } else {
        role = item.role || "Event Staff";
        name = item.staffName || item.name || "";
        staffId = item.staffId || item.id;
        const member = findRequestedMember(staffId, name, role);
        staffId = member?.id || staffId;
        name = member?.name || name || "Unassigned Member";
      }

      const st = staffList.find((s) => s.id === staffId || s.name?.toLowerCase() === name?.toLowerCase());
      const isAssigned = Boolean(st) && isOnThisEvent(st);
      const isConflicted = !st || Boolean(getAssignBlockReason(st));

      return {
        id: staffId || role,
        requestIndex,
        staffId,
        role,
        name,
        isBusy: isConflicted && !isAssigned,
        isAssigned,
        isAvailable: isAssigned || !isConflicted,
      };
    });
  }, [event, staffList, isOnThisEvent, getAssignBlockReason, findRequestedMember]);

  // --------------------------------------------------------------------------
  // 5B. VENUE OPTIONS & ALLOCATION STATE
  // --------------------------------------------------------------------------
  const guestCount = Number(event?.people || event?.guests || 0);
  const isVenueUnset = UNSET_VENUE_NAMES.includes(normalizeVenueName(event?.venue));
  const isVenueLocked = VENUE_LOCKED_STATUSES.includes(
    String(event?.status || "").toLowerCase()
  );

  // Every venue with what stops it being used for this event. fitIssues are the
  // venue's own limits; issues add bookings by other events on the same date.
  const venueOptions = useMemo(() => {
    if (!event) return [];
    return venues.map((v) => {
      const fitIssues = [];
      if (v.status !== "AVAILABLE") {
        fitIssues.push({
          type: "Venue Unavailable",
          category: "venue",
          desc: `${v.name} is marked ${String(v.status).toLowerCase()}`,
          severity: "high",
        });
      }
      if (Number(v.capacity) < guestCount) {
        fitIssues.push({
          type: "Venue Capacity Exceeded",
          category: "venue",
          desc: `${v.name} holds ${v.capacity} people, but this event expects ${guestCount}`,
          severity: "high",
        });
      }
      const bookings = findEventCollisions({ ...event, venue: v.name }, allEvents);
      return { ...v, fitIssues, issues: [...fitIssues, ...bookings] };
    });
  }, [event, venues, allEvents, guestCount]);

  const currentVenueOption = useMemo(
    () =>
      venueOptions.find(
        (v) => normalizeVenueName(v.name) === normalizeVenueName(event?.venue)
      ) || null,
    [venueOptions, event]
  );

  // Price of what is allocated so far, the starting point for the final price
  const resourcesTotal = useMemo(() => {
    if (!event) return 0;
    return (resourceAllocations[event.id] || []).reduce((sum, a) => {
      const resource = resources.find((r) => r.id === a.resourceId);
      return sum + Number(a.qty || a.quantity || 0) * Number(resource?.price || 0);
    }, 0);
  }, [event, resources, resourceAllocations]);
  const venueTotal = Number(currentVenueOption?.pricePerDay || 0);
  const quote = quoteInput ?? String(event?.quotedPrice || resourcesTotal + venueTotal || "");

  // A confirmation only counts for the venue it was made for, so a venue edited
  // afterwards needs confirming again. Closed events are past this check.
  const isVenueConfirmed =
    !isVenueUnset &&
    normalizeVenueName(venueAllocations[event?.id]?.venueName) ===
      normalizeVenueName(event?.venue);
  const hasAllocatedVenue = isVenueLocked || isVenueConfirmed;

  // --------------------------------------------------------------------------
  // 6. CONFLICT CHECK ENGINE (Legacy Parity & Dynamic Prevention)
  // --------------------------------------------------------------------------
  const detectedConflicts = useMemo(() => {
    if (!event) return [];
    const conflicts = [];
    const evAllocs = resourceAllocations[event.id] || [];

    // 1. Resource Conflicts
    resourceRequirements.forEach((r) => {
      const isAlreadyAllocated =
        evAllocs.some(
          (a) =>
            a.resourceId === r.resourceId ||
            a.resourceName?.toLowerCase() === r.name?.toLowerCase()
        ) || r.isAllocated;
      if (isAlreadyAllocated) return;

      const db = resources.find(
        (x) => x.id === r.resourceId || x.name?.toLowerCase() === r.name?.toLowerCase()
      );
      const avail = getResourceAvailableForEvent(r.resourceId, event.date, event.id);

      if (!db || r.required > avail) {
        conflicts.push({
          type: "Resource Shortage",
          desc: db
            ? `${r.name}: need ${r.required}, only ${avail} available`
            : `${r.name}: not in inventory`,
          severity: "high",
        });
      }
    });

    // 2. Staff Conflicts
    staffRequirements.forEach((s) => {
      const st = staffList.find(
        (x) => x.id === s.staffId || x.name?.toLowerCase() === s.name?.toLowerCase()
      );
      if (!st) {
        if (!s.isAssigned) {
          conflicts.push({
            type: "Staff Not Found",
            desc: `${s.name} not found in staff roster`,
            severity: "high",
          });
        }
        return;
      }

      if (isOnThisEvent(st)) return; // Assigned to this event, no conflict

      const isOff = st.status === "off";
      const isBusy = st.status === "busy" || st.avail === "Busy";
      const isOverloaded = (st.workload || 0) >= 80;
      const otherEvent = getOtherActiveEvent(st);

      if (isOff) {
        conflicts.push({
          type: "Staff Off Duty",
          desc: `${s.name} is currently off duty`,
          severity: "high",
        });
      } else if (otherEvent) {
        conflicts.push({
          type: "Staff Already Assigned",
          desc: `${s.name} is already assigned to ${otherEvent.name}`,
          severity: "high",
        });
      } else if (isBusy) {
        conflicts.push({
          type: "Staff Busy",
          desc: `${s.name} is marked as busy`,
          severity: "high",
        });
      } else if (isOverloaded) {
        conflicts.push({
          type: "Staff Overloaded",
          desc: `${s.name} is at ${st.workload}% workload capacity (max limit 80%)`,
          severity: "high",
        });
      }
    });

    // 3. Venue & Time Collision Check (Same Venue + Same Date + Overlapping Time)
    const venueCollisions = findEventCollisions(event, allEvents);
    venueCollisions.forEach((col) => {
      conflicts.push(col);
    });

    // 4. Venue Fit Check (Capacity & Availability of the current venue)
    if (!isVenueLocked && currentVenueOption) {
      conflicts.push(...currentVenueOption.fitIssues);
    }

    return conflicts;
  }, [
    event,
    isVenueLocked,
    currentVenueOption,
    resources,
    staffList,
    allEvents,
    resourceRequirements,
    staffRequirements,
    resourceAllocations,
    getResourceAvailableForEvent,
    isOnThisEvent,
    getOtherActiveEvent,
  ]);

  // --------------------------------------------------------------------------
  // 6B. ALLOCATION PREREQUISITES FOR APPROVAL (Strict Workflow Gate)
  // --------------------------------------------------------------------------
  // Everything on the request must be allocated. A request with nothing on it
  // needs nothing allocated.
  const hasAllocatedResources = resourceRequirements.every((r) => r.isAllocated);
  const hasAllocatedStaff = staffRequirements.every((s) => s.isAssigned);

  // --------------------------------------------------------------------------
  // 7. CONTINGENCY PLANS FOR CURRENT EVENT
  // --------------------------------------------------------------------------
  const currentEventPlans = useMemo(() => {
    if (!event) return [];
    if (contingencyMap[event.id]) return contingencyMap[event.id];

    // Fallback: seed default plans for this event
    const defaults = contingencyMap._default || DEFAULT_CONTINGENCY_PLANS;
    return defaults.map((p, i) => ({
      ...p,
      id: `CP_${event.id}_${i + 1}`,
    }));
  }, [event, contingencyMap]);

  // --------------------------------------------------------------------------
  // 8. SUMMARY PERCENTAGES (Resource, Staff, Contingency)
  // --------------------------------------------------------------------------
  const resPct = useMemo(() => {
    if (!resourceRequirements.length) return 100;
    const ok = resourceRequirements.filter((r) => r.isSufficient || r.isAllocated).length;
    return Math.round((ok / resourceRequirements.length) * 100);
  }, [resourceRequirements]);

  const staffPct = useMemo(() => {
    if (!staffRequirements.length) return 100;
    const ok = staffRequirements.filter((s) => s.isAvailable || s.isAssigned).length;
    return Math.round((ok / staffRequirements.length) * 100);
  }, [staffRequirements]);

  const contPct = useMemo(() => {
    if (!currentEventPlans.length) return 100;
    const ready = currentEventPlans.filter((p) => p.status !== "triggered").length;
    return Math.round((ready / currentEventPlans.length) * 100);
  }, [currentEventPlans]);

  // --------------------------------------------------------------------------
  // 9. WORKFLOW ACTIONS (Allocate, Assign, Extra Modals, Contingency CRUD)
  // --------------------------------------------------------------------------
  // Direct Allocate button on requested resource row
  const handleAllocateResource = useCallback(
    async (res) => {
      if (!event) return;
      const avail = getResourceAvailableForEvent(res.resourceId, event.date, event.id);
      if (avail <= 0 || res.required > avail) {
        showToast(
          `Cannot allocate ${res.name}: Insufficient stock (${avail} available, ${res.required} needed).`,
          "danger"
        );
        return;
      }

      const updatedAllocs = {
        ...resourceAllocations,
        [event.id]: [
          ...(resourceAllocations[event.id] || []).filter(
            (a) =>
              a.resourceId !== res.resourceId &&
              a.resourceName?.toLowerCase() !== res.name?.toLowerCase()
          ),
          {
            resourceId: res.resourceId,
            resourceName: res.name,
            category: res.category || "Equipment",
            quantity: res.required,
          },
        ],
      };

      try {
        await setResourceAllocations(updatedAllocs);
      } catch (err) {
        console.error("Failed to allocate resource:", err);
        // A 400 carries the backend's reason, e.g. "Only 2 of 5 Projectors are free on 2026-04-15"
        showToast(err?.status === 400 && err.message ? err.message : `Could not allocate ${res.name}. Please try again.`, "danger");
        return;
      }
      setLocalResourceAllocations(updatedAllocs);

      showToast(`✓ ${res.name} allocated!`, "success");
    },
    [event, resourceAllocations, getResourceAvailableForEvent, showToast]
  );

  // Saves the venue on the event, then records the vendor's confirmation
  const saveVenueAllocation = useCallback(
    async (venueName, venueId) => {
      if (!event) return;
      const updatedAllocs = {
        ...venueAllocations,
        [event.id]: { venueId, venueName, allocatedAt: new Date().toISOString() },
      };

      try {
        if (event.venue !== venueName) {
          await patchEvent(event.id, { venue: venueName });
          setEvent((prev) => ({ ...prev, venue: venueName }));
        }
        await setVenueAllocations(updatedAllocs);
        setLocalVenueAllocations(updatedAllocs);
        showToast(`✓ ${venueName} allocated!`, "success");
      } catch (err) {
        console.error("Failed to allocate venue:", err);
        showToast(`Could not allocate ${venueName}. Please try again.`, "danger");
      }
    },
    [event, venueAllocations, showToast]
  );

  // Undoes the confirmation; the event keeps its venue name until it is changed
  const handleRemoveVenue = useCallback(async () => {
    if (!event) return;
    const updatedAllocs = { ...venueAllocations };
    delete updatedAllocs[event.id];

    try {
      await setVenueAllocations(updatedAllocs);
      setLocalVenueAllocations(updatedAllocs);
      showToast("Venue allocation removed.", "info");
    } catch (err) {
      console.error("Failed to remove venue:", err);
      showToast("Could not remove the venue. Please try again.", "danger");
    }
  }, [event, venueAllocations, showToast]);

  const handleAllocateVenue = useCallback(
    (venue) => {
      if (venue.issues.length > 0) {
        showToast(`Cannot allocate ${venue.name}: ${venue.issues[0].desc}.`, "danger");
        return;
      }
      saveVenueAllocation(venue.name, venue.id);
    },
    [saveVenueAllocation, showToast]
  );

  // Saves an assignment record, so the allocation survives a backend restart and
  // reaches the staff portal. The backend recomputes the workload from it.
  const saveStaffAssignment = useCallback(
    async (member) => {
      const role = member.role || "Event Staff";
      const created = await createStaffAssignment({
        staffId: member.id,
        staffName: member.name,
        staffRole: role,
        role,
        eventId: event.id,
        eventName: event.name,
        eventDate: event.date || undefined,
        eventVenue: event.venue || undefined,
        eventPeople: Number(event.people || event.guests || 0),
        taskDesc: `Assigned as ${role}`,
      });
      const refreshed = await getStaffById(member.id).catch(() => null);

      setAssignments((prev) => [...prev, created]);
      if (refreshed) {
        setStaffList((prev) => prev.map((s) => (s.id === member.id ? refreshed : s)));
      }
    },
    [event]
  );

  // Direct Assign button on requested staff row
  const handleAssignStaff = useCallback(
    async (st) => {
      if (!event) return;
      const db = staffList.find(
        (x) => x.id === st.staffId || x.name?.toLowerCase() === st.name?.toLowerCase()
      );
      if (!db) {
        showToast(`Staff member not found in roster.`, "danger");
        return;
      }

      const reason = getAssignBlockReason(db);
      if (reason) {
        showToast(`Cannot assign ${db.name}: ${reason}.`, "danger");
        return;
      }

      try {
        await saveStaffAssignment(db);
      } catch (err) {
        console.error("Failed to assign staff:", err);
        showToast(err.message || `Could not assign ${db.name}. Please try again.`, "danger");
        return;
      }

      showToast(`✓ ${db.name} assigned!`, "success");
    },
    [event, staffList, getAssignBlockReason, saveStaffAssignment, showToast]
  );

  // Allocate Extra Resource via Modal
  const handleAllocateExtraResource = useCallback(
    async (resource, qty) => {
      if (!event) return;
      const numQty = Number(qty) || 1;
      const avail = getResourceAvailableForEvent(resource.id, event.date, event.id);

      if (avail <= 0 || numQty > avail) {
        showToast(
          `Cannot allocate ${resource.name}: Insufficient stock (${avail} available on ${event.date || "this date"}).`,
          "danger"
        );
        return;
      }

      const updatedAllocs = {
        ...resourceAllocations,
        [event.id]: [
          ...(resourceAllocations[event.id] || []).filter(
            (a) =>
              a.resourceId !== resource.id &&
              a.resourceName?.toLowerCase() !== resource.name?.toLowerCase()
          ),
          {
            resourceId: resource.id,
            resourceName: resource.name,
            category: resource.category || "Equipment",
            quantity: numQty,
          },
        ],
      };

      // Ensure this resource is recorded in event.requestedResources
      const currentReqs = Array.isArray(event.requestedResources)
        ? [...event.requestedResources]
        : [];
      const isSameResource = (r) => {
        const rId = typeof r === "string" ? r : (r.resourceId || r.id);
        const rName = typeof r === "string" ? r : (r.resourceName || r.name);
        return (
          (rId && rId === resource.id) ||
          (rName && rName.toLowerCase() === resource.name?.toLowerCase())
        );
      };

      const updatedReqs = currentReqs.some(isSameResource)
        ? currentReqs.map((r) =>
            typeof r !== "string" && isSameResource(r) ? { ...r, quantity: numQty } : r
          )
        : [
            ...currentReqs,
            {
              resourceId: resource.id,
              resourceName: resource.name,
              category: resource.category || "Equipment",
              quantity: numQty,
            },
          ];

      try {
        await setResourceAllocations(updatedAllocs);
      } catch (err) {
        console.error("Failed to allocate resource:", err);
        showToast(err?.status === 400 && err.message ? err.message : `Could not allocate ${resource.name}. Please try again.`, "danger");
        return;
      }

      setLocalResourceAllocations(updatedAllocs);
      setEvent((prev) => ({
        ...prev,
        requestedResources: updatedReqs,
      }));

      try {
        await patchEvent(event.id, { requestedResources: updatedReqs });
      } catch {
        // The allocation is saved; the row is rebuilt from it
      }

      showToast(`✓ ${resource.name} ×${numQty} allocated!`, "success");
    },
    [event, resourceAllocations, getResourceAvailableForEvent, showToast]
  );

  // Assign Extra Staff via Modal
  const handleAssignExtraStaff = useCallback(
    async (member) => {
      if (!event) return;

      const reason = getAssignBlockReason(member);
      if (reason) {
        showToast(`Cannot assign ${member.name}: ${reason}.`, "danger");
        return;
      }

      try {
        await saveStaffAssignment(member);
      } catch (err) {
        console.error("Failed to assign staff:", err);
        showToast(`Could not assign ${member.name}. Please try again.`, "danger");
        return;
      }

      const currentReqs = Array.isArray(event.requestedStaff)
        ? [...event.requestedStaff]
        : [];
      const existsInReqs = currentReqs.some((s) => {
        const sId = typeof s === "string" ? s : (s.staffId || s.id);
        const sName = typeof s === "string" ? s : (s.staffName || s.name);
        return (
          (sId && sId === member.id) ||
          (sName && sName.toLowerCase() === member.name?.toLowerCase())
        );
      });

      let updatedReqs = currentReqs;
      if (!existsInReqs) {
        updatedReqs = [
          ...currentReqs,
          {
            staffId: member.id,
            staffName: member.name,
            role: member.role || "Event Staff",
          },
        ];
      }

      setEvent((prev) => ({
        ...prev,
        requestedStaff: updatedReqs,
      }));

      try {
        await patchEvent(event.id, { requestedStaff: updatedReqs });
      } catch {
        // Fallback
      }

      showToast(`✓ ${member.name} assigned!`, "success");
    },
    [event, getAssignBlockReason, saveStaffAssignment, showToast]
  );

  // Tells the client their requested staff member changed, through the bell in
  // the client portal. Returns false if they could not be told.
  const notifyClientOfStaffChange = useCallback(
    async (replacedName, member) => {
      const clientId = event.clientId || event.userId;
      if (!clientId) return false;

      const notification = {
        id: `NOTIF_${Date.now()}`,
        userId: clientId,
        eventId: event.id,
        title: `Staff Change for ${event.name}`,
        message: `${replacedName} is not available for ${event.name}, so ${member.name} (${member.role || "Event Staff"}) will take their place.`,
        type: "info",
        isRead: false,
        linkUrl: `/client/track/${event.id}`,
        createdAt: new Date().toISOString(),
      };

      try {
        const existing = await getStateKey("notifications");
        await setStateKey("notifications", [
          notification,
          ...(Array.isArray(existing) ? existing : []),
        ]);
        return true;
      } catch (err) {
        console.error("Failed to notify client:", err);
        return false;
      }
    },
    [event]
  );

  // Swaps a conflicted row for a free member, then allocates them. The swap is
  // saved first, so a failed allocation leaves them in the row with + Assign.
  const handleReplaceStaff = useCallback(
    async (member) => {
      if (!event || !replacingStaff) return;

      const reason = getAssignBlockReason(member);
      if (reason) {
        showToast(`Cannot assign ${member.name}: ${reason}.`, "danger");
        return;
      }

      const index = replacingStaff.requestIndex;
      const requested = event.requestedStaff || event.staff;
      const updatedReqs = (Array.isArray(requested) ? requested : [])
        .map((item, i) =>
          i === index
            ? { staffId: member.id, staffName: member.name, role: member.role || "Event Staff" }
            : item
        )
        // Drop any other request for the same member, so they get a single row
        .filter((item, i) => {
          if (i === index) return true;
          const id = typeof item === "string" ? null : item.staffId || item.id;
          const name = typeof item === "string" ? item : item.staffName || item.name;
          return id !== member.id && name?.toLowerCase() !== member.name?.toLowerCase();
        });

      try {
        await patchEvent(event.id, { requestedStaff: updatedReqs });
      } catch (err) {
        console.error("Failed to replace staff:", err);
        showToast(`Could not replace ${replacingStaff.name}. Please try again.`, "danger");
        return;
      }
      setEvent((prev) => ({ ...prev, requestedStaff: updatedReqs }));
      const isClientNotified = await notifyClientOfStaffChange(replacingStaff.name, member);

      try {
        await saveStaffAssignment(member);
      } catch (err) {
        console.error("Failed to assign staff:", err);
        showToast(`${member.name} added, but not assigned. Use + Assign to retry.`, "danger");
        return;
      }

      if (isClientNotified) {
        showToast(`✓ ${replacingStaff.name} replaced by ${member.name}. Client notified.`, "success");
      } else {
        showToast(`${replacingStaff.name} replaced by ${member.name}, but the client could not be notified.`, "warning");
      }
    },
    [
      event,
      replacingStaff,
      getAssignBlockReason,
      notifyClientOfStaffChange,
      saveStaffAssignment,
      showToast,
    ]
  );

  // Takes a resource off the event and its request, and returns the stock
  const handleRemoveResource = useCallback(
    async (resource) => {
      if (!event) return;
      const updatedAllocs = {
        ...resourceAllocations,
        [event.id]: (resourceAllocations[event.id] || []).filter((a) => a.resourceId !== resource.id),
      };
      const updatedReqs = (event.requestedResources || []).filter(
        (r) => typeof r === "string" || (r.resourceId || r.id) !== resource.id
      );

      try {
        await setResourceAllocations(updatedAllocs);
        await patchEvent(event.id, { requestedResources: updatedReqs });
      } catch (err) {
        console.error("Failed to remove resource:", err);
        showToast(`Could not remove ${resource.name}. Please try again.`, "danger");
        return;
      }
      setLocalResourceAllocations(updatedAllocs);
      setEvent((prev) => ({ ...prev, requestedResources: updatedReqs }));
    },
    [event, resourceAllocations, showToast]
  );

  // Takes a staff member off the event and its request
  const handleUnassignStaff = useCallback(
    async (st) => {
      if (!event) return;
      const member = staffList.find((s) => s.id === st.staffId);
      if (!member) return;
      const open = assignments.filter((a) => a.staffId === member.id && a.eventId === event.id);
      const updatedReqs = (event.requestedStaff || []).filter(
        (s) => typeof s === "string" || (s.staffId || s.id) !== member.id
      );

      try {
        await Promise.all(open.map((a) => deleteStaffAssignment(a.id)));
        const assignedEvents = (member.assignedEvents || []).filter((id) => id !== event.id);
        const updated = await patchStaff(member.id, { assignedEvents });
        await patchEvent(event.id, { requestedStaff: updatedReqs });
        setStaffList((prev) => prev.map((s) => (s.id === member.id ? updated : s)));
      } catch (err) {
        console.error("Failed to unassign staff:", err);
        showToast(`Could not remove ${member.name}. Please try again.`, "danger");
        return;
      }
      setAssignments((prev) => prev.filter((a) => !open.includes(a)));
      setEvent((prev) => ({ ...prev, requestedStaff: updatedReqs }));
      showToast(`${member.name} removed from this event.`, "info");
    },
    [event, staffList, assignments, showToast]
  );

  // Add Contingency Plan
  const handleAddContingencyPlan = useCallback(
    async (planData) => {
      if (!event) return;

      const newPlan = {
        id: `CP_${Date.now()}`,
        problem: planData.problem,
        trigger: planData.trigger,
        solution: planData.solution,
        status: "ready",
      };

      const updatedPlans = [...currentEventPlans, newPlan];
      const updatedMap = {
        ...contingencyMap,
        [event.id]: updatedPlans,
      };

      setLocalContingencyMap(updatedMap);
      try {
        await setContingencyPlans(updatedMap);
        localStorage.setItem(
          "eventpro_contingencyPlans",
          JSON.stringify(updatedMap)
        );
      } catch {
        localStorage.setItem(
          "eventpro_contingencyPlans",
          JSON.stringify(updatedMap)
        );
      }

      showToast("✓ Contingency plan added!", "success");
    },
    [event, currentEventPlans, contingencyMap, showToast]
  );

  // Delete Contingency Plan
  const handleDeleteContingencyPlan = useCallback(
    async (planId) => {
      if (!event) return;
      const confirmDelete = window.confirm(
        "Are you sure you want to remove this contingency plan?"
      );
      if (!confirmDelete) return;

      const updatedPlans = currentEventPlans.filter((p) => p.id !== planId);
      const updatedMap = {
        ...contingencyMap,
        [event.id]: updatedPlans,
      };

      setLocalContingencyMap(updatedMap);
      try {
        await setContingencyPlans(updatedMap);
        localStorage.setItem(
          "eventpro_contingencyPlans",
          JSON.stringify(updatedMap)
        );
      } catch {
        localStorage.setItem(
          "eventpro_contingencyPlans",
          JSON.stringify(updatedMap)
        );
      }

      showToast("Plan removed.", "danger");
    },
    [event, currentEventPlans, contingencyMap, showToast]
  );

  // --------------------------------------------------------------------------
  // 10. DECISION ACTIONS: RESOLVE NAV, KEEP WAITING, APPROVE & REJECT
  // --------------------------------------------------------------------------
  // Navigate to Manage Resources (/vendor/resources) or Manage Staff (/vendor/staff) with review return context
  const handleNavigateResolve = useCallback(
    (targetPath) => {
      if (!event) {
        navigate(targetPath);
        return;
      }
      navigate(`${targetPath}?fromReview=${encodeURIComponent(event.id)}`, {
        state: {
          fromReviewEventId: event.id,
          fromReviewEventName: event.name,
        },
      });
    },
    [navigate, event]
  );

  // Keep Waiting: Puts event on wait, records reason, notifies client
  const handleSubmitKeepWaiting = useCallback(
    async (reason) => {
      if (!event) return;

      // The backend saves the reason and notifies the client
      try {
        await updateEventStatus(event.id, { status: "waiting", note: reason });
      } catch (err) {
        console.error("Failed to put event on hold:", err);
        showToast("Could not put this event on hold. Please try again.", "danger");
        return;
      }
      setEvent((prev) => ({ ...prev, status: "waiting", waitingReason: reason }));

      showToast(`Event placed on wait. Client notified: "${reason}"`, "warning");
      setTimeout(() => navigate("/vendor/events"), 1600);
    },
    [event, navigate, showToast]
  );

  // Approve Event: Only possible when conflicts are resolved AND resources & staff are allocated
  const handleApproveEvent = useCallback(async () => {
    if (!event) return;
    if (event.status === "confirmed") {
      showToast("Event is already approved.", "info");
      return;
    }
    if (!hasAllocatedResources || !hasAllocatedStaff) {
      showToast(
        "Cannot approve — both resources and staff must be allocated to this event before approval.",
        "danger"
      );
      return;
    }
    if (!hasAllocatedVenue) {
      showToast("Cannot approve — confirm a venue for this event first.", "danger");
      return;
    }
    if (detectedConflicts.length > 0) {
      showToast(
        "Cannot approve — active conflicts exist. Allocate alternatives or reject.",
        "danger"
      );
      return;
    }

    const quotedPrice = Number(quote);
    if (!(quotedPrice > 0)) {
      showToast("Cannot approve — enter the final price for this event first.", "danger");
      return;
    }

    try {
      await updateEventStatus(event.id, { status: "confirmed", quotedPrice });
      setEvent((prev) => ({ ...prev, status: "confirmed", quotedPrice }));

      // Notify client of approval
      const clientApproveNotif = {
        id: `NOTIF_${Date.now()}`,
        eventId: event.id,
        eventName: event.name,
        clientId: event.clientId || event.client,
        title: "Event Approved & Confirmed",
        message: `Your event "${event.name}" has been accepted and confirmed by the vendor!`,
        status: "confirmed",
        type: "success",
        createdAt: new Date().toISOString(),
        isRead: false,
      };
      try {
        const existing = JSON.parse(
          localStorage.getItem("client_notifications") || "[]"
        );
        existing.unshift(clientApproveNotif);
        localStorage.setItem(
          "client_notifications",
          JSON.stringify(existing)
        );
        window.dispatchEvent(
          new CustomEvent("client_notifications_updated", {
            detail: clientApproveNotif,
          })
        );
      } catch {
        // Fallback
      }

      showToast(`✓ "${event.name}" approved!`, "success");
      setTimeout(() => navigate("/vendor/events"), 1400);
    } catch (err) {
      console.error("Failed to approve event:", err);
      showToast(`Could not approve "${event.name}". Please try again.`, "danger");
    }
  }, [event, quote, hasAllocatedResources, hasAllocatedStaff, hasAllocatedVenue, detectedConflicts, navigate, showToast]);

  // Reject Event: Confirms and notifies client with summary
  const handleRejectEvent = useCallback(
    async (customReason) => {
      if (!event) return;
      if (event.status === "rejected") {
        showToast("Event is already rejected.", "info");
        return;
      }

      const reason = typeof customReason === 'string' && customReason.trim()
        ? customReason.trim()
        : detectedConflicts.length
        ? detectedConflicts.map((c) => `${c.type}: ${c.desc}`).join("; ")
        : "Rejected by vendor";

      try {
        await updateEventStatus(event.id, "rejected", reason);
        setEvent((prev) => (prev ? { ...prev, status: "rejected", rejectionReason: reason } : null));
        setRejectOpen(false);
        showToast(`Event rejected: ${reason}`, "info");
      } catch (err) {
        showToast(err.message || "Failed to reject event.", "error");
      }
    },
    [event, detectedConflicts, showToast]
  );

  // Extra available resources for modals (all resources with computed date availability)
  const extraAvailableResources = useMemo(() => {
    if (!event) return [];
    const evAllocs = resourceAllocations[event.id] || [];
    return resources.map((r) => {
      const allocation = evAllocs.find((a) => a.resourceId === r.id);
      return {
        ...r,
        availableQty: getResourceAvailableForEvent(r.id, event.date, event.id),
        allocatedQty: Number(allocation?.qty || allocation?.quantity || 0),
      };
    });
  }, [resources, event, resourceAllocations, getResourceAvailableForEvent]);

  // Roster for the extra staff modal, each member with what blocks them, if anything
  const staffOptions = useMemo(
    () => staffList.map((s) => ({ ...s, blockReason: getAssignBlockReason(s) })),
    [staffList, getAssignBlockReason]
  );

  // --------------------------------------------------------------------------
  // 11. LOADING & NOT FOUND GUARDS
  // --------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="dashboard-page">
        <VendorTopBar title="Event Review" />
        <div className="content">
          <div className="vendor-table-message text-center" style={{ padding: "48px" }}>
            Loading event review details...
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="dashboard-page">
        <VendorTopBar title="Event Review" />
        <div className="content">
          <div
            className="vendor-table-message text-center"
            style={{ padding: "48px" }}
          >
            <p>Event request not found.</p>
            <button
              type="button"
              className="btn-back"
              onClick={() => navigate("/vendor/events")}
              style={{ marginTop: "16px" }}
            >
              <ArrowLeft size={14} /> Back to Requests
            </button>
          </div>
        </div>
      </div>
    );
  }

  // "Extra" only means something once the event is approved or has resources
  const eventStatus = String(event.status || "").toLowerCase();
  const canAllocateResources = !FINISHED_EVENT_STATUSES.includes(eventStatus);
  const hasResources = (resourceAllocations[event.id] || []).length > 0;
  const resourceActionLabel =
    APPROVED_EVENT_STATUSES.includes(eventStatus) || hasResources
      ? "Allocate Extra Resource"
      : "Allocate Resource";

  // --------------------------------------------------------------------------
  // 12. COMPLETE MODULAR RENDER TREE (Legacy Parity)
  // --------------------------------------------------------------------------
  return (
    <div className="dashboard-page">
      {/* ── Topbar with Notifications ── */}
      <VendorTopBar title="Event Review" />

      <div className="content">
        {/* ── Transient Feedback Toast ── */}
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

        {/* ── Section 1: Event Header & Status Pill ── */}
        <EventReviewHeader event={event} />

        {/* ── Section 2: Meta Overview Grid (Date, Time, Venue, Guests) ── */}
        <EventReviewStats event={event} />

        {/* ── Section 3: Client Requirements (Notes, Tags, 90% Net Payout) ── */}
        <ClientRequirementsCard event={event} commissionPercent={commissionPercent} />

        {/* ── Section 4: Feasibility & Conflict Detection Banner ── */}
        <EventFeasibilityBanner
          conflicts={detectedConflicts}
          hasAllocatedResources={hasAllocatedResources}
          hasAllocatedStaff={hasAllocatedStaff}
          hasAllocatedVenue={hasAllocatedVenue}
          onNavigateResolve={handleNavigateResolve}
          onResolveVenue={isVenueLocked ? undefined : () => setIsVenueModalOpen(true)}
          onOpenKeepWaiting={() => setIsKeepWaitingOpen(true)}
          onReject={handleRejectEvent}
          onAccept={handleApproveEvent}
          eventStatus={event.status}
        />

        {/* ── Section 4B: Venue Allocation ── */}
        <EventVenueAllocationCard
          venueName={event.venue}
          isUnset={isVenueUnset}
          venue={currentVenueOption}
          guests={guestCount}
          isAllocated={isVenueConfirmed}
          isLocked={isVenueLocked}
          onConfirm={() => handleAllocateVenue(currentVenueOption)}
          onKeepClientVenue={() => saveVenueAllocation(event.venue.trim(), null)}
          onRemove={handleRemoveVenue}
          onOpenPicker={() => setIsVenueModalOpen(true)}
        />

        {/* ── Section 5: Resource Requirements Table & Direct Allocate ── */}
        <EventResourceRequirementsTable
          requirements={resourceRequirements}
          onAllocate={handleAllocateResource}
          actionLabel={resourceActionLabel}
          canAllocate={canAllocateResources}
          onOpenExtraModal={() => setIsExtraResOpen(true)}
        />

        {/* ── Section 6: Staff Requirements Table & Direct Assign ── */}
        <EventStaffRequirementsTable
          requirements={staffRequirements}
          onAssign={handleAssignStaff}
          onUnassign={canAllocateResources ? handleUnassignStaff : undefined}
          onReplace={setReplacingStaff}
          onOpenExtraModal={() => setIsExtraStaffOpen(true)}
        />

        {/* ── Section 6B: Final Price (billed to the client on approval) ── */}
        {event.status !== "rejected" && (
          <EventQuoteCard
            resourcesTotal={resourcesTotal}
            venueTotal={venueTotal}
            budget={Number(event.budget || 0)}
            quote={isVenueLocked ? String(event.quotedPrice || event.budget || 0) : quote}
            commissionPercent={commissionPercent}
            isLocked={isVenueLocked}
            onChange={setQuoteInput}
          />
        )}

        {/* ── Section 7: Risk & Feasibility Summary ── */}
        <EventBufferAndRiskSection
          resPct={resPct}
          staffPct={staffPct}
          contPct={contPct}
          conflictsCount={detectedConflicts.length}
        />

        {/* ── Section 8: Contingency Planning Table & Add Form ── */}
        <EventContingencyPlanning
          plans={currentEventPlans}
          onAddPlan={handleAddContingencyPlan}
          onDeletePlan={handleDeleteContingencyPlan}
        />

        {/* ── Section 9: Conditional Decision Action Bar ── */}
        <EventReviewActionBar
          eventStatus={event.status}
          hasConflicts={detectedConflicts.length > 0}
          hasAllocatedResources={hasAllocatedResources}
          hasAllocatedStaff={hasAllocatedStaff}
          hasAllocatedVenue={hasAllocatedVenue}
          onBack={() => navigate("/vendor/events")}
          onApprove={handleApproveEvent}
          onReject={() => setRejectOpen(true)}
          onOpenKeepWaiting={() => setIsKeepWaitingOpen(true)}
        />

        {/* ── Modal 1: Extra Resource Allocation Dialog ── */}
        <EventExtraResourceModal
          isOpen={isExtraResOpen}
          onClose={() => setIsExtraResOpen(false)}
          title={resourceActionLabel}
          availableResources={extraAvailableResources}
          eventDate={event.date}
          onAllocate={handleAllocateExtraResource}
          onRemove={handleRemoveResource}
        />

        {/* ── Modal 2: Extra Staff Assignment Dialog ── */}
        <EventExtraStaffModal
          isOpen={isExtraStaffOpen || Boolean(replacingStaff)}
          onClose={() => {
            setIsExtraStaffOpen(false);
            setReplacingStaff(null);
          }}
          availableStaff={staffOptions}
          replacingName={replacingStaff?.name}
          onAssign={replacingStaff ? handleReplaceStaff : handleAssignExtraStaff}
        />

        {/* ── Modal: Venue Picker ── */}
        <EventVenueModal
          isOpen={isVenueModalOpen}
          onClose={() => setIsVenueModalOpen(false)}
          venues={venueOptions}
          currentVenueId={currentVenueOption?.id}
          guests={guestCount}
          eventDate={event.date}
          onAllocate={handleAllocateVenue}
        />

        {/* ── Modal 3: Keep Waiting Reason & Client Notification Dialog ── */}
        <EventKeepWaitingModal
          isOpen={isKeepWaitingOpen}
          onClose={() => setIsKeepWaitingOpen(false)}
          eventName={event.name}
          eventId={event.id}
          onSubmit={handleSubmitKeepWaiting}
        />

        {/* ── Modal 4: Rejection Reason Dialog (shown to Client) ── */}
        <RejectReasonModal
          event={rejectOpen ? event : null}
          onClose={() => setRejectOpen(false)}
          onConfirm={handleRejectEvent}
        />
      </div>
    </div>
  );
}

export default EventReview;
