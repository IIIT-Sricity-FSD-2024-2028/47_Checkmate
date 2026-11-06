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
 *   5. EventResourceRequirementsTable: Required vs available stock, buffer deltas,
 *      direct '▶ Allocate' action, and '+ Allocate Extra Resource' modal trigger.
 *   6. EventStaffRequirementsTable: Required roles vs active members, buffer deltas,
 *      direct '+ Assign' action, and '+ Allocate Extra Staff' modal trigger.
 *   7. EventBufferAndRiskSection: Dynamic Risk & Feasibility summary.
 *   8. EventContingencyPlanning: Interactive CRUD table with problem, trigger, solution.
 *   9. EventReviewActionBar: Conditional Approve and Reject decision buttons.
 *  10. Extra Resource, Extra Staff, Keep Waiting & Reject Reason Modals.
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
import EventResourceRequirementsTable from "../../components/vendor/EventResourceRequirementsTable";
import EventStaffRequirementsTable from "../../components/vendor/EventStaffRequirementsTable";
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
} from "../../services/eventService";
import { getMyResources } from "../../services/resourceService";
import { getMyStaff, updateStaff } from "../../services/staffService";
import {
  getResourceAllocations,
  setResourceAllocations,
  getContingencyPlans,
  setContingencyPlans,
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
  const [resourceAllocations, setLocalResourceAllocations] = useState({});
  const [contingencyMap, setLocalContingencyMap] = useState({});
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
          allocsData,
          plansData,
        ] = await Promise.all([
          fetchEvent(),
          getEvents().catch(() => getMyEvents().catch(() => [])),
          getMyResources().catch(() => []),
          getMyStaff().catch(() => []),
          getResourceAllocations().catch(() => {
            try {
              const local = localStorage.getItem("eventpro_resourceAllocations");
              return local ? JSON.parse(local) : {};
            } catch {
              return {};
            }
          }),
          getContingencyPlans().catch(() => {
            try {
              const local = localStorage.getItem("eventpro_contingencyPlans");
              return local ? JSON.parse(local) : {};
            } catch {
              return {};
            }
          }),
        ]);

        if (isMounted) {
          setEvent(eventData);
          setAllEvents(Array.isArray(eventsList) ? eventsList : []);
          setResources(Array.isArray(resData) ? resData : []);
          setStaffList(Array.isArray(staffData) ? staffData : []);

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

  // --------------------------------------------------------------------------
  // 3. DATE-BASED RESOURCE AVAILABILITY CALCULATOR (Legacy Parity)
  // --------------------------------------------------------------------------
  const getResourceAvailableForEvent = useCallback(
    (resId, targetDate, currentEventId) => {
      const db = resources.find((x) => x.id === resId);
      if (!db) return 0;
      const totalStock = Number(db.total || db.quantity || db.avail || 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Other active events contending for stock on this date
      const activeEvents = allEvents.filter((e) => {
        if (e.status !== "live" && e.status !== "confirmed") return false;
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
          if (a.resourceId === resId) allocated += Number(a.qty || a.quantity || 0);
        });
      });

      return Math.max(0, totalStock - allocated);
    },
    [resources, allEvents, resourceAllocations]
  );

  // --------------------------------------------------------------------------
  // 4. RESOURCE REQUIREMENTS EVALUATION
  // --------------------------------------------------------------------------
  const resourceRequirements = useMemo(() => {
    if (!event) return [];
    const list = event.requestedResources || event.resources || [];
    const evAllocs = resourceAllocations[event.id] || [];

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
        isSufficient: avail >= requiredQty,
      };
    });
  }, [event, resources, resourceAllocations, getResourceAvailableForEvent]);

  // --------------------------------------------------------------------------
  // 5. STAFF REQUIREMENTS EVALUATION
  // --------------------------------------------------------------------------
  const staffRequirements = useMemo(() => {
    if (!event) return [];
    const list = event.requestedStaff || event.staff || [];

    return list.map((item) => {
      let name = "";
      let role = "Event Staff";
      let staffId = null;

      if (typeof item === "string") {
        const match = item.match(/^(.*?)(?:\s*\((.*?)\))?$/);
        name = match ? match[1].trim() : item;
        role = match && match[2] ? match[2].trim() : "Event Staff";
        const member = staffList.find(
          (s) =>
            (s.name?.toLowerCase() === name.toLowerCase() ||
              s.role?.toLowerCase() === role.toLowerCase()) &&
            s.status !== "Inactive"
        );
        staffId = member?.id || name;
        name = member?.name || name;
      } else {
        role = item.role || "Event Staff";
        name = item.staffName || item.name || "";
        staffId = item.staffId || item.id;
        const member = staffList.find(
          (s) =>
            (staffId && s.id === staffId) ||
            (name && s.name?.toLowerCase() === name.toLowerCase()) ||
            s.role?.toLowerCase() === role.toLowerCase()
        );
        staffId = member?.id || staffId;
        name = member?.name || name || "Unassigned Member";
      }

      const st = staffList.find((s) => s.id === staffId);
      const isBusy = !st || (st.workload || 0) >= 100 || st.status === "busy";
      const isAssigned =
        Array.isArray(st?.assignedEvents) && st.assignedEvents.includes(event.id);

      return {
        id: staffId || role,
        staffId,
        role,
        name,
        isBusy,
        isAssigned,
        isAvailable: !isBusy || isAssigned,
      };
    });
  }, [event, staffList]);

  // --------------------------------------------------------------------------
  // 6. CONFLICT CHECK ENGINE (Legacy Parity)
  // --------------------------------------------------------------------------
  const detectedConflicts = useMemo(() => {
    if (!event) return [];
    const conflicts = [];
    const evAllocs = resourceAllocations[event.id] || [];

    // 1. Resource Conflicts
    resourceRequirements.forEach((r) => {
      const isAlreadyAllocated = evAllocs.some(
        (a) => a.resourceId === r.resourceId || a.resourceName?.toLowerCase() === r.name.toLowerCase()
      );
      if (isAlreadyAllocated) return;

      const db = resources.find(
        (x) => x.id === r.resourceId || x.name?.toLowerCase() === r.name.toLowerCase()
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
        (x) => x.id === s.staffId || x.name?.toLowerCase() === s.name.toLowerCase()
      );
      if (!st) {
        conflicts.push({
          type: "Staff Not Found",
          desc: `${s.name} not found in staff roster`,
          severity: "high",
        });
        return;
      }

      const isOff = st.status === "off";
      const isBusy = st.status === "busy" || st.avail === "Busy";
      const isOverloaded = (st.workload || 0) >= 100;
      const assignedTo = Array.isArray(st.assignedEvents) ? st.assignedEvents : [];
      const isAlreadyAssigned =
        assignedTo.length > 0 && !assignedTo.includes(event.id);
      const liveEvents = allEvents.filter((e) => e.status === "live");
      const isInLive = liveEvents.some((e) => assignedTo.includes(e.id));

      if (isOff) {
        conflicts.push({
          type: "Staff Off Duty",
          desc: `${s.name} is currently off duty`,
          severity: "high",
        });
      } else if (isInLive) {
        conflicts.push({
          type: "Staff In Live Event",
          desc: `${s.name} is currently working a live event`,
          severity: "high",
        });
      } else if (isBusy && !assignedTo.includes(event.id)) {
        conflicts.push({
          type: "Staff Busy",
          desc: `${s.name} is marked as busy`,
          severity: "high",
        });
      } else if (isOverloaded && !assignedTo.includes(event.id)) {
        conflicts.push({
          type: "Staff Overloaded",
          desc: `${s.name} is at ${st.workload}% workload capacity`,
          severity: "high",
        });
      } else if (isAlreadyAssigned) {
        conflicts.push({
          type: "Staff Already Assigned",
          desc: `${s.name} is assigned to ${assignedTo.length} other event(s)`,
          severity: "medium",
        });
      }
    });

    // 3. Venue & Time Collision Check (Same Venue + Same Date + Overlapping Time)
    const venueCollisions = findEventCollisions(event, allEvents);
    venueCollisions.forEach((col) => {
      conflicts.push(col);
    });

    return conflicts;
  }, [
    event,
    resources,
    staffList,
    allEvents,
    resourceRequirements,
    staffRequirements,
    resourceAllocations,
    getResourceAvailableForEvent,
  ]);

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
      if (res.required > avail) {
        showToast("Not enough stock available for this event date.", "danger");
        return;
      }

      const updatedAllocs = {
        ...resourceAllocations,
        [event.id]: [
          ...(resourceAllocations[event.id] || []),
          {
            resourceId: res.resourceId,
            resourceName: res.name,
            category: res.category,
            qty: res.required,
          },
        ],
      };

      setLocalResourceAllocations(updatedAllocs);
      try {
        await setResourceAllocations(updatedAllocs);
        localStorage.setItem(
          "eventpro_resourceAllocations",
          JSON.stringify(updatedAllocs)
        );
      } catch {
        localStorage.setItem(
          "eventpro_resourceAllocations",
          JSON.stringify(updatedAllocs)
        );
      }

      showToast(`✓ ${res.name} allocated!`, "success");
    },
    [event, resourceAllocations, getResourceAvailableForEvent, showToast]
  );

  // Direct Assign button on requested staff row
  const handleAssignStaff = useCallback(
    async (st) => {
      if (!event) return;
      const db = staffList.find((x) => x.id === st.staffId || x.name === st.name);
      if (!db) return;

      const assigned = Array.isArray(db.assignedEvents) ? [...db.assignedEvents] : [];
      if (!assigned.includes(event.id)) {
        assigned.push(event.id);
      }

      const newWl = Math.min((db.workload || 0) + 20, 100);
      const updatedMember = {
        ...db,
        status: newWl >= 100 ? "busy" : "available",
        workload: newWl,
        assignedEvents: assigned,
      };

      setStaffList((prev) =>
        prev.map((s) => (s.id === db.id ? updatedMember : s))
      );

      try {
        await updateStaff(db.id, updatedMember);
      } catch {
        // Local fallback
      }

      showToast(`✓ ${st.name} assigned!`, "success");
    },
    [event, staffList, showToast]
  );

  // Allocate Extra Resource via Modal
  const handleAllocateExtraResource = useCallback(
    async (resource, qty) => {
      if (!event) return;

      const updatedAllocs = {
        ...resourceAllocations,
        [event.id]: [
          ...(resourceAllocations[event.id] || []),
          {
            resourceId: resource.id,
            resourceName: resource.name,
            category: resource.category,
            qty,
          },
        ],
      };

      // Remove one unresolved resource conflict to simulate substitution
      const updatedRequested = [...(event.requestedResources || [])];
      const unresolvedIdx = updatedRequested.findIndex((r) => {
        const rDb = resources.find((x) => x.id === r.resourceId);
        return (
          !rDb ||
          r.quantity > getResourceAvailableForEvent(r.resourceId, event.date, event.id)
        );
      });
      if (unresolvedIdx !== -1) {
        updatedRequested.splice(unresolvedIdx, 1);
        setEvent((prev) => ({ ...prev, requestedResources: updatedRequested }));
      }

      setLocalResourceAllocations(updatedAllocs);
      try {
        await setResourceAllocations(updatedAllocs);
        localStorage.setItem(
          "eventpro_resourceAllocations",
          JSON.stringify(updatedAllocs)
        );
      } catch {
        localStorage.setItem(
          "eventpro_resourceAllocations",
          JSON.stringify(updatedAllocs)
        );
      }

      showToast(`✓ ${resource.name} ×${qty} allocated!`, "success");
    },
    [event, resourceAllocations, resources, getResourceAvailableForEvent, showToast]
  );

  // Assign Extra Staff via Modal
  const handleAssignExtraStaff = useCallback(
    async (member) => {
      if (!event) return;

      const assigned = Array.isArray(member.assignedEvents)
        ? [...member.assignedEvents]
        : [];
      if (!assigned.includes(event.id)) {
        assigned.push(event.id);
      }

      const newWl = Math.min((member.workload || 0) + 20, 100);
      const updatedMember = {
        ...member,
        status: newWl >= 100 ? "busy" : "available",
        workload: newWl,
        assignedEvents: assigned,
      };

      // Remove one unresolved staff conflict to simulate substitution
      const updatedRequested = [...(event.requestedStaff || [])];
      const unresolvedIdx = updatedRequested.findIndex((s) => {
        const st = staffList.find((x) => x.id === s.staffId);
        return !st || (st.workload || 0) >= 100;
      });
      if (unresolvedIdx !== -1) {
        updatedRequested.splice(unresolvedIdx, 1);
        setEvent((prev) => ({ ...prev, requestedStaff: updatedRequested }));
      }

      setStaffList((prev) =>
        prev.map((s) => (s.id === member.id ? updatedMember : s))
      );

      try {
        await updateStaff(member.id, updatedMember);
      } catch {
        // Local fallback
      }

      showToast(`✓ ${member.name} assigned!`, "success");
    },
    [event, staffList, showToast]
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

      const updatePayload = {
        status: "waiting",
        note: reason,
        reviewStatus: "waiting",
        waitingReason: reason,
        reviewedAt: new Date().toISOString(),
      };

      try {
        await updateEventStatus(event.id, updatePayload);
      } catch {
        // Fallback
      }

      setEvent((prev) => ({ ...prev, ...updatePayload }));

      // Send structured notification to client in shared notifications store
      const clientId = event.clientId || event.userId || event.client;
      const clientNotif = {
        id: `NOTIF_${Date.now()}`,
        eventId: event.id,
        eventName: event.name,
        userId: clientId,
        clientId,
        title: `${event.name} Placed on Hold`,
        message: `Your event "${event.name}" was reviewed by the vendor and placed on hold. Reason: ${reason}`,
        reason,
        status: "waiting",
        type: "warning",
        linkUrl: `/client/track/${event.id}`,
        createdAt: new Date().toISOString(),
        isRead: false,
      };

      try {
        const notifs = await getStateKey("notifications").catch(() => []);
        const list = Array.isArray(notifs) ? notifs : [];
        await setStateKey("notifications", [clientNotif, ...list]);

        const existing = JSON.parse(
          localStorage.getItem("client_notifications") || "[]"
        );
        existing.unshift(clientNotif);
        localStorage.setItem(
          "client_notifications",
          JSON.stringify(existing)
        );
        window.dispatchEvent(
          new CustomEvent("client_notifications_updated", {
            detail: clientNotif,
          })
        );
      } catch {
        // Local storage fallback
      }

      showToast(`Event placed on wait. Client notified: "${reason}"`, "warning");
      setTimeout(() => navigate("/vendor/events"), 1600);
    },
    [event, navigate, showToast]
  );

  // Approve Event: Only possible when conflicts are resolved
  const handleApproveEvent = useCallback(async () => {
    if (!event) return;
    if (event.status === "confirmed") {
      showToast("Event is already approved.", "info");
      return;
    }
    if (detectedConflicts.length > 0) {
      showToast(
        "Cannot approve — active conflicts exist. Allocate alternatives or reject.",
        "danger"
      );
      return;
    }

    try {
      await updateEventStatus(event.id, "confirmed");
      setEvent((prev) => ({ ...prev, status: "confirmed" }));

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
      setEvent((prev) => ({ ...prev, status: "confirmed" }));
      showToast(`✓ "${event.name}" confirmed locally!`, "success");
      setTimeout(() => navigate("/vendor/events"), 1400);
    }
  }, [event, detectedConflicts, navigate, showToast]);

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
        await updateEventStatus(event.id, "rejected", { note: reason, rejectionReason: reason });
        setEvent((prev) => (prev ? { ...prev, status: "rejected", rejectionReason: reason } : null));
        setRejectOpen(false);
        showToast(`Event rejected: ${reason}`, "info");
      } catch (err) {
        showToast(err.message || "Failed to reject event.", "error");
      }
    },
    [event, detectedConflicts, showToast]
  );

  // Extra available resources and staff for modals
  const extraAvailableResources = useMemo(() => {
    if (!event) return [];
    return resources
      .map((r) => ({
        ...r,
        availableQty: getResourceAvailableForEvent(r.id, event.date, event.id),
      }))
      .filter((r) => r.availableQty > 0);
  }, [resources, event, getResourceAvailableForEvent]);

  const extraAvailableStaff = useMemo(() => {
    return staffList.filter((s) => (s.workload || 0) < 100);
  }, [staffList]);

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
        <ClientRequirementsCard event={event} />

        {/* ── Section 4: Feasibility & Conflict Detection Banner ── */}
        <EventFeasibilityBanner
          conflicts={detectedConflicts}
          onNavigateResolve={handleNavigateResolve}
          onOpenKeepWaiting={() => setIsKeepWaitingOpen(true)}
          onReject={handleRejectEvent}
          onAccept={handleApproveEvent}
          eventStatus={event.status}
        />

        {/* ── Section 5: Resource Requirements Table & Direct Allocate ── */}
        <EventResourceRequirementsTable
          requirements={resourceRequirements}
          onAllocate={handleAllocateResource}
          onOpenExtraModal={() => setIsExtraResOpen(true)}
        />

        {/* ── Section 6: Staff Requirements Table & Direct Assign ── */}
        <EventStaffRequirementsTable
          requirements={staffRequirements}
          onAssign={handleAssignStaff}
          onOpenExtraModal={() => setIsExtraStaffOpen(true)}
        />

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
          onBack={() => navigate("/vendor/events")}
          onApprove={handleApproveEvent}
          onReject={() => setRejectOpen(true)}
          onOpenKeepWaiting={() => setIsKeepWaitingOpen(true)}
        />

        {/* ── Modal 1: Extra Resource Allocation Dialog ── */}
        <EventExtraResourceModal
          isOpen={isExtraResOpen}
          onClose={() => setIsExtraResOpen(false)}
          availableResources={extraAvailableResources}
          eventDate={event.date}
          onAllocate={handleAllocateExtraResource}
        />

        {/* ── Modal 2: Extra Staff Assignment Dialog ── */}
        <EventExtraStaffModal
          isOpen={isExtraStaffOpen}
          onClose={() => setIsExtraStaffOpen(false)}
          availableStaff={extraAvailableStaff}
          onAssign={handleAssignExtraStaff}
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
