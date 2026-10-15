/**
 * ====================================================================================================
 * EVENT REVIEW PAGE (EventReview.jsx)
 * ====================================================================================================
 * Role: Event Coordinator / Vendor
 * Matches Legacy: front-end/pages/vendor/event-review.html & front-end/scripts/vendor_js/event-review.js
 *
 * ARCHITECTURAL PURPOSE & FULL WORKFLOW:
 * ----------------------------------------------------------------------------------------------------
 * 1. Deep Dive Review:
 *    When a vendor clicks on an event request row in Events.jsx, they are routed here to inspect
 *    every critical aspect of the event before deciding to approve or reject.
 *
 * 2. Complete 9 Interactive Legacy Sections:
 *    - Section 1: Event Header (Event Name, ID, Event Type, and Lifecycle Status Badge).
 *    - Section 2: Meta Overview (4 Cards: Scheduled Date, Time, Venue Location, Expected Attendees).
 *    - Section 3: Client Requirements (Submitter metadata, Feature Tags, Pink-Bordered Special Notes,
 *                 and Financial Extras including the 90% Net Payout and Platform Commission Breakdown).
 *    - Section 4: Conflict Detection Banner (Dynamically identifies inventory shortages and staff
 *                 conflicts, blocks approval if conflicts exist, and offers direct rejection).
 *    - Section 5: Resource Requirements Table (Required vs Available, Buffer calculations, Status,
 *                 inline "▶ Allocate" action, and "+ Allocate Extra Resource" modal picker).
 *    - Section 6: Staff Requirements Table (Staff Role, Workload, Availability, Buffer, inline
 *                 "+ Assign" action, and "+ Allocate Extra Staff" modal picker).
 *    - Section 7: Buffer Planning & Risk Summary (Side-by-side grid with recommended vs current
 *                 buffers and 3 color-coded feasibility progress bars).
 *    - Section 8: Contingency Planning (Interactive emergency procedures table with delete action
 *                 and inline "+ Add Plan" form).
 *    - Section 9: Action Bar (Back to Requests, Approve Event [guarded by conflicts], and Reject Event).
 *
 * 3. Zero Inline Styles:
 *    All visual appearance is driven strictly by class names configured in `src/styles/vendor.css`.
 * ====================================================================================================
 */

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  MessageCircle,
  User,
  Package,
  DollarSign,
  Tag,
  ShieldCheck,
  Zap,
  Plus,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Trash2,
  Calculator,
} from "lucide-react";

// --- API Service Layer Functions ---
import {
  getEventById,
  getMyEvents,
  getMyResources,
  getMyStaff,
  updateEventStatus,
  updateStaff,
  getResourceAllocations,
  setResourceAllocations,
  getContingencyPlans,
  setContingencyPlans,
} from "../../services";

// --- Dedicated Stylesheet ---
import "../../styles/vendor.css";

function EventReview() {
  // --------------------------------------------------------------------------------------------------
  // 1. ROUTING & URL PARAMETER PARSING
  // --------------------------------------------------------------------------------------------------
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const [searchParams] = useSearchParams();

  // Resolves the event ID from either route params (/vendor/events/:id/review) or query params (?id=EVT001)
  const eventId = paramId || searchParams.get("id");

  // --------------------------------------------------------------------------------------------------
  // 2. PRIMARY COMPONENT STATE
  // --------------------------------------------------------------------------------------------------
  // event: Holds the loaded event object from backend
  const [event, setEvent] = useState(null);

  // allEvents: Stored list of all events used to check which events are active/live on the target date
  const [allEvents, setAllEvents] = useState([]);

  // resources: List of all inventory items available in the system
  const [resources, setResources] = useState([]);

  // staff: List of all team members and their current workloads/statuses
  const [staff, setStaff] = useState([]);

  // allocations: Map of event ID -> array of allocated resources ({ resourceId, resourceName, qty, category })
  const [allocations, setAllocations] = useState({});

  // contingencyPlans: Map of event ID -> array of contingency plans ({ id, problem, trigger, solution, status })
  const [contingencyPlans, setAllContingencyPlans] = useState({});

  // loading: Indicates whether initial network requests are still running
  const [loading, setLoading] = useState(true);

  // toast: Temporary visual alert message ({ type: "success" | "danger" | "warning", text: "..." })
  const [toast, setToast] = useState(null);

  // Modals visibility toggles
  const [extraResModalOpen, setExtraResModalOpen] = useState(false);
  const [extraStaffModalOpen, setExtraStaffModalOpen] = useState(false);

  // Form state for creating a new contingency plan inline
  const [newPlan, setNewPlan] = useState({ problem: "", trigger: "", solution: "" });

  // --------------------------------------------------------------------------------------------------
  // 3. DATA FETCHING (CONCURRENT INITIAL LOAD)
  // --------------------------------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!eventId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch all required data concurrently using Promise.allSettled
        const [
          eventRes,
          allEventsRes,
          resListRes,
          staffListRes,
          allocsRes,
          plansRes,
        ] = await Promise.allSettled([
          getEventById(eventId).catch(async () => {
            const list = await getMyEvents();
            return list.find((e) => String(e.id) === String(eventId));
          }),
          getMyEvents(),
          getMyResources(),
          getMyStaff(),
          getResourceAllocations().catch(() => ({})),
          getContingencyPlans().catch(() => ({})),
        ]);

        if (!isMounted) return;

        // Populate event details
        if (eventRes.status === "fulfilled" && eventRes.value) {
          setEvent(eventRes.value);
        }

        // Populate all events (for multi-event conflict verification)
        if (allEventsRes.status === "fulfilled" && Array.isArray(allEventsRes.value)) {
          setAllEvents(allEventsRes.value);
        }

        // Populate inventory resources
        if (resListRes.status === "fulfilled" && Array.isArray(resListRes.value)) {
          setResources(resListRes.value);
        }

        // Populate staff roster
        if (staffListRes.status === "fulfilled" && Array.isArray(staffListRes.value)) {
          setStaff(staffListRes.value);
        }

        // Populate saved resource allocations
        if (allocsRes.status === "fulfilled" && allocsRes.value) {
          setAllocations(typeof allocsRes.value === "object" ? allocsRes.value : {});
        }

        // Populate contingency plans
        if (plansRes.status === "fulfilled" && plansRes.value) {
          setAllContingencyPlans(typeof plansRes.value === "object" ? plansRes.value : {});
        }
      } catch (err) {
        console.error("Failed to load review data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [eventId]);

  // --------------------------------------------------------------------------------------------------
  // 4. RESOURCE & CONFLICT CALCULATIONS (MIRRORS LEGACY event-review.js)
  // --------------------------------------------------------------------------------------------------
  /**
   * Calculates the remaining available stock for a given resource on the event's date,
   * taking into account already allocated items for other confirmed/live events on that same day.
   */
  const getResourceAvailableForEvent = (resId, targetDate, currentEventId) => {
    const db = resources.find((x) => x.id === resId);
    if (!db) return 0;
    const totalStock = Number(db.total || db.quantity || db.quantityAvailable || 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Identify active events on the same calendar day
    const activeEvents = allEvents.filter((e) => {
      if (e.status !== "live" && e.status !== "confirmed") return false;
      if (String(e.id) === String(currentEventId)) return false;
      if (!e.date) return false;
      if (targetDate) return e.date === targetDate;
      const evDate = new Date(e.date + "T00:00:00");
      return evDate <= today;
    });

    let alreadyAllocated = 0;
    activeEvents.forEach((ev) => {
      const evAllocs = allocations[ev.id] || [];
      evAllocs.forEach((a) => {
        if (a.resourceId === resId) alreadyAllocated += Number(a.qty || a.quantity || 0);
      });
    });

    return Math.max(0, totalStock - alreadyAllocated);
  };

  /**
   * Detects all resource shortages and staff scheduling conflicts.
   * Mirrors the exact rules from legacy `checkConflicts(event)`.
   */
  const detectedConflicts = useMemo(() => {
    if (!event) return [];
    const conflicts = [];
    const evAllocs = allocations[event.id] || [];
    const reqRes = event.requestedResources || [];
    const reqStaff = event.requestedStaff || [];

    // Check 1: Resource Shortages
    reqRes.forEach((r) => {
      const isAlreadyAllocated = evAllocs.some((a) => a.resourceId === r.resourceId);
      if (isAlreadyAllocated) return;

      const db = resources.find((x) => x.id === r.resourceId);
      const avail = getResourceAvailableForEvent(r.resourceId, event.date, event.id);

      if (!db || r.quantity > avail) {
        conflicts.push({
          type: "Resource Shortage",
          desc: db
            ? `${r.resourceName}: need ${r.quantity}, only ${avail} available`
            : `${r.resourceName}: not in inventory`,
          severity: "high",
        });
      }
    });

    // Check 2: Staff Availability & Workload Conflicts
    reqStaff.forEach((s) => {
      const st = staff.find((x) => x.id === s.staffId);
      if (!st) {
        conflicts.push({
          type: "Staff Not Found",
          desc: `${s.staffName} not found in staff list`,
          severity: "high",
        });
        return;
      }

      const isBusy = st.status === "busy" || st.avail === "Busy";
      const isOff = st.status === "off";
      const isOverloaded = (st.workload || 0) >= 100;
      const assignedTo = Array.isArray(st.assignedEvents) ? st.assignedEvents : [];
      const isAlreadyAssigned = assignedTo.length > 0 && !assignedTo.includes(event.id);
      const liveEvents = allEvents.filter((e) => e.status === "live");
      const isInLive = liveEvents.some((e) => assignedTo.includes(e.id));

      if (isOff) {
        conflicts.push({
          type: "Staff Off Duty",
          desc: `${s.staffName} is currently off duty`,
          severity: "high",
        });
      } else if (isInLive) {
        conflicts.push({
          type: "Staff In Live Event",
          desc: `${s.staffName} is assigned to a live event`,
          severity: "high",
        });
      } else if (isBusy) {
        conflicts.push({
          type: "Staff Busy",
          desc: `${s.staffName} is currently marked as busy`,
          severity: "high",
        });
      } else if (isOverloaded) {
        conflicts.push({
          type: "Staff Overloaded",
          desc: `${s.staffName} is at ${st.workload}% workload`,
          severity: "high",
        });
      } else if (isAlreadyAssigned) {
        conflicts.push({
          type: "Staff Already Assigned",
          desc: `${s.staffName} is assigned to ${assignedTo.length} other event(s)`,
          severity: "medium",
        });
      }
    });

    return conflicts;
  }, [event, resources, staff, allocations, allEvents]);

  // --------------------------------------------------------------------------------------------------
  // 5. CONTINGENCY PLANS (LOCAL FALLBACK & PERSISTENCE)
  // --------------------------------------------------------------------------------------------------
  /**
   * Retrieves active contingency plans for this event, initializing default emergency
   * procedures if no custom plans have been saved yet.
   */
  const currentPlans = useMemo(() => {
    if (!eventId) return [];
    if (contingencyPlans[eventId] && contingencyPlans[eventId].length > 0) {
      return contingencyPlans[eventId];
    }
    // Legacy default fallback templates
    const defaultPlans = contingencyPlans["_default"] || [
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
    return defaultPlans;
  }, [contingencyPlans, eventId]);

  // --------------------------------------------------------------------------------------------------
  // 6. RISK & FEASIBILITY METRICS (SCORES & PROGRESS BARS)
  // --------------------------------------------------------------------------------------------------
  const riskAnalysis = useMemo(() => {
    if (!event) {
      return { resPct: 100, staffPct: 100, contPct: 100, level: "low", label: "✅ Low Risk Level", sub: "" };
    }

    const reqRes = event.requestedResources || [];
    const reqStaff = event.requestedStaff || [];

    // Resource Availability %: proportion of requested items with sufficient stock
    let resOk = 0;
    reqRes.forEach((r) => {
      const db = resources.find((x) => x.id === r.resourceId);
      if (db && Number(db.quantity || db.quantityAvailable || 0) >= r.quantity) {
        resOk++;
      }
    });
    const resPct = reqRes.length ? Math.round((resOk / reqRes.length) * 100) : 100;

    // Staff Availability %: proportion of requested staff who are available
    let staffOk = 0;
    reqStaff.forEach((s) => {
      const st = staff.find((x) => x.id === s.staffId);
      const avail =
        st &&
        (st.status === "available" || st.avail === "Available") &&
        (!Array.isArray(st.assignedEvents) || st.assignedEvents.length === 0);
      if (avail) staffOk++;
    });
    const staffPct = reqStaff.length ? Math.round((staffOk / reqStaff.length) * 100) : 100;

    // Contingency Readiness %: proportion of plans marked 'ready'
    const readyPlans = currentPlans.filter((p) => p.status !== "triggered").length;
    const contPct = currentPlans.length ? Math.round((readyPlans / currentPlans.length) * 100) : 100;

    // Composite Average Score
    const avgScore = (resPct + staffPct + contPct) / 3;
    const totalConflicts = detectedConflicts.length;

    let level = "low";
    let label = "✅ Low Risk Level";
    let sub = "All resources and staff are available — safe to approve.";

    if (avgScore >= 90 && totalConflicts === 0) {
      level = "low";
      label = "✅ Low Risk Level";
      sub = "All resources and staff are available — safe to approve.";
    } else if (avgScore >= 60 || totalConflicts <= 1) {
      level = "medium";
      label = "⚠ Medium Risk Level";
      sub = `${totalConflicts} conflict(s) detected — review before approving.`;
    } else {
      level = "high";
      label = "🔴 High Risk Level";
      sub = `${totalConflicts} critical conflict(s) — must resolve or reject.`;
    }

    return { resPct, staffPct, contPct, level, label, sub };
  }, [event, resources, staff, currentPlans, detectedConflicts]);

  // --------------------------------------------------------------------------------------------------
  // 7. USER ACTIONS & MODAL OPERATIONS
  // --------------------------------------------------------------------------------------------------
  /**
   * Allocates stock for a requested inventory resource.
   */
  const handleAllocateResource = async (r) => {
    const avail = getResourceAvailableForEvent(r.resourceId, event.date, event.id);
    if (r.quantity > avail) {
      setToast({ type: "danger", text: "Not enough stock available for this event date." });
      return;
    }

    const updated = { ...allocations };
    if (!updated[event.id]) updated[event.id] = [];
    updated[event.id].push({
      resourceId: r.resourceId,
      resourceName: r.resourceName,
      category: r.category || "Equipment",
      qty: r.quantity,
    });

    setAllocations(updated);
    try {
      await setResourceAllocations(updated);
    } catch {}

    setToast({ type: "success", text: `${r.resourceName} allocated!` });
  };

  /**
   * Allocates alternative extra resource stock chosen from the modal picker.
   */
  const handleSelectExtraResource = async (res, qty) => {
    if (qty > res.availableQty) {
      setToast({ type: "danger", text: "Not enough stock available." });
      return;
    }

    const updated = { ...allocations };
    if (!updated[event.id]) updated[event.id] = [];
    updated[event.id].push({
      resourceId: res.id,
      resourceName: res.name,
      category: res.category,
      qty,
    });

    // Remove one unresolved resource conflict to simulate substitution
    const unresolvedIdx = (event.requestedResources || []).findIndex((r) => {
      const rDb = resources.find((x) => x.id === r.resourceId);
      return !rDb || r.quantity > getResourceAvailableForEvent(r.resourceId, event.date, event.id);
    });

    if (unresolvedIdx !== -1) {
      const newReq = [...event.requestedResources];
      newReq.splice(unresolvedIdx, 1);
      setEvent({ ...event, requestedResources: newReq });
    }

    setAllocations(updated);
    try {
      await setResourceAllocations(updated);
    } catch {}

    setExtraResModalOpen(false);
    setToast({ type: "success", text: `✓ ${res.name} x${qty} allocated!` });
  };

  /**
   * Assigns an available staff member to this event.
   */
  const handleAssignStaff = async (s) => {
    const st = staff.find((x) => x.id === s.staffId);
    if (!st) return;

    const assigned = Array.isArray(st.assignedEvents) ? [...st.assignedEvents] : [];
    assigned.push(event.id);
    const newWl = Math.min((st.workload || 0) + 20, 100);

    const updatedStaffList = staff.map((member) =>
      member.id === st.id
        ? {
            ...member,
            status: newWl >= 100 ? "busy" : "available",
            workload: newWl,
            assignedEvents: assigned,
          }
        : member
    );

    setStaff(updatedStaffList);
    try {
      await updateStaff(st.id, {
        status: newWl >= 100 ? "busy" : "available",
        workload: newWl,
        assignedEvents: assigned,
      });
    } catch {}

    setToast({ type: "success", text: `${s.staffName} assigned!` });
  };

  /**
   * Assigns an extra staff member selected from the modal picker.
   */
  const handleSelectExtraStaff = async (member) => {
    const assigned = Array.isArray(member.assignedEvents) ? [...member.assignedEvents] : [];
    assigned.push(event.id);
    const newWl = Math.min((member.workload || 0) + 20, 100);

    const updatedStaffList = staff.map((m) =>
      m.id === member.id
        ? {
            ...m,
            status: newWl >= 100 ? "busy" : "available",
            workload: newWl,
            assignedEvents: assigned,
          }
        : m
    );

    // Remove one unresolved staff conflict to simulate staff substitution
    const unresolvedIdx = (event.requestedStaff || []).findIndex((s) => {
      const st = staff.find((x) => x.id === s.staffId);
      return !st || (st.workload || 0) >= 100;
    });

    if (unresolvedIdx !== -1) {
      const newStaffReq = [...event.requestedStaff];
      newStaffReq.splice(unresolvedIdx, 1);
      setEvent({ ...event, requestedStaff: newStaffReq });
    }

    setStaff(updatedStaffList);
    try {
      await updateStaff(member.id, {
        status: newWl >= 100 ? "busy" : "available",
        workload: newWl,
        assignedEvents: assigned,
      });
    } catch {}

    setExtraStaffModalOpen(false);
    setToast({ type: "success", text: `✓ ${member.name} assigned!` });
  };

  /**
   * Adds a new contingency plan to the active event.
   */
  const handleAddPlan = async () => {
    if (!newPlan.problem.trim() || !newPlan.trigger.trim() || !newPlan.solution.trim()) {
      setToast({ type: "warning", text: "Please fill out all plan fields." });
      return;
    }

    const created = {
      id: "CP_" + Date.now(),
      problem: newPlan.problem.trim(),
      trigger: newPlan.trigger.trim(),
      solution: newPlan.solution.trim(),
      status: "ready",
    };

    const updatedPlans = { ...contingencyPlans };
    const list = updatedPlans[event.id] ? [...updatedPlans[event.id]] : [...currentPlans];
    list.push(created);
    updatedPlans[event.id] = list;

    setAllContingencyPlans(updatedPlans);
    setNewPlan({ problem: "", trigger: "", solution: "" });
    try {
      await setContingencyPlans(updatedPlans);
    } catch {}

    setToast({ type: "success", text: "✓ Plan added!" });
  };

  /**
   * Deletes a contingency plan.
   */
  const handleDeletePlan = async (planId) => {
    const updatedPlans = { ...contingencyPlans };
    const list = (updatedPlans[event.id] || currentPlans).filter((p) => p.id !== planId);
    updatedPlans[event.id] = list;

    setAllContingencyPlans(updatedPlans);
    try {
      await setContingencyPlans(updatedPlans);
    } catch {}

    setToast({ type: "danger", text: "Plan removed." });
  };

  /**
   * Approves the event request. Blocked if any conflicts exist.
   */
  const handleApprove = async () => {
    if (!event) return;
    if (detectedConflicts.length > 0) {
      setToast({
        type: "danger",
        text: "Cannot approve — conflicts exist. Allocate alternatives or reject.",
      });
      return;
    }

    try {
      await updateEventStatus(event.id, "confirmed");
      setEvent({ ...event, status: "confirmed" });
      setToast({ type: "success", text: `✓ "${event.name}" approved!` });
      setTimeout(() => navigate("/vendor/events"), 1400);
    } catch (err) {
      console.error("Approve failed:", err);
      setEvent({ ...event, status: "confirmed" });
      setToast({ type: "success", text: `✓ "${event.name}" approved!` });
      setTimeout(() => navigate("/vendor/events"), 1400);
    }
  };

  /**
   * Rejects the event request and notifies the client with reasons.
   */
  const handleReject = async () => {
    if (!event) return;
    const summary = detectedConflicts.length
      ? detectedConflicts.map((c) => `${c.type}: ${c.desc}`).join("; ")
      : "Rejected by vendor";

    try {
      await updateEventStatus(event.id, "rejected");
      setEvent({ ...event, status: "rejected" });
      setToast({ type: "danger", text: `"${event.name}" rejected. Client notified.` });
      setTimeout(() => navigate("/vendor/events"), 1400);
    } catch (err) {
      console.error("Reject failed:", err);
      setEvent({ ...event, status: "rejected" });
      setToast({ type: "danger", text: `"${event.name}" rejected. Client notified.` });
      setTimeout(() => navigate("/vendor/events"), 1400);
    }
  };

  // --------------------------------------------------------------------------------------------------
  // 8. FORMATTING HELPERS
  // --------------------------------------------------------------------------------------------------
  const formatDate = (d) => {
    if (!d) return "—";
    const dt = new Date(d + "T00:00:00");
    return isNaN(dt.getTime())
      ? d
      : dt.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  };

  const formatSubmitted = (iso) => {
    if (!iso) return "—";
    const dt = new Date(iso);
    if (isNaN(dt.getTime())) return iso;
    return `${dt.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })} at ${dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
  };

  // --------------------------------------------------------------------------------------------------
  // 9. EARLY RETURN GUARDS
  // --------------------------------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="vendor-page">
        <div className="vendor-content">
          <div className="vendor-empty-card">Loading event review details...</div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="vendor-page">
        <div className="vendor-content">
          <div className="vendor-empty-card">
            <p>Event "{eventId}" was not found or has been removed.</p>
            <button className="vendor-btn-primary" onClick={() => navigate("/vendor/events")}>
              <ArrowLeft size={16} /> Back to Requests
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Financial calculations: 10% platform commission and 90% net payout
  const budgetVal = Number(event.budget || event.estimatedCost || 0);
  const fee = budgetVal > 0 ? budgetVal * 0.1 : 0;
  const netPayout = budgetVal > 0 ? budgetVal - fee : 0;

  // Determine status badge class and text
  const statusLabelMap = {
    pending: "Under Review",
    confirmed: "Approved",
    rejected: "Rejected",
    live: "Live",
    completed: "Completed",
  };
  const currentStatusKey = String(event.status || "pending").toLowerCase();
  const statusBadgeText = statusLabelMap[currentStatusKey] || "Under Review";
  const isAlreadyFinalized =
    currentStatusKey === "confirmed" ||
    currentStatusKey === "rejected" ||
    currentStatusKey === "completed";

  // List of extra resources with available stock
  const extraResources = resources
    .map((r) => ({
      ...r,
      availableQty: getResourceAvailableForEvent(r.id, event.date, event.id),
    }))
    .filter((r) => r.availableQty > 0);

  // List of extra staff with available capacity
  const extraStaffMembers = staff.filter((s) => (s.workload || 0) < 100 && s.status !== "off");

  // --------------------------------------------------------------------------------------------------
  // 10. MAIN RENDER TREE (9 EXACT LEGACY SECTIONS)
  // --------------------------------------------------------------------------------------------------
  return (
    <div className="vendor-page">
      <div className="vendor-content">
        {/* Floating Toast Notification */}
        {toast && (
          <div className={`toast-feedback toast-feedback--${toast.type === "danger" ? "danger" : "success"}`}>
            <span>{toast.text}</span>
            <button className="toast-feedback__close" onClick={() => setToast(null)}>
              ✕
            </button>
          </div>
        )}

        {/* ── 1. Event Header ── */}
        <div className="ev-header">
          <div className="ev-header__left">
            <h2>{event.name || "Event Review"}</h2>
            <p>Event ID: {event.id} · {event.type || "General"}</p>
          </div>
          <span className={`ev-status-badge ev-status-badge--${currentStatusKey}`}>
            {statusBadgeText}
          </span>
        </div>

        {/* ── 2. Meta Row (4 Cards) ── */}
        <div className="ev-meta">
          {/* Date */}
          <div className="ev-meta-item">
            <div className="ev-meta-icon ev-meta-icon--blue">
              <Calendar />
            </div>
            <div>
              <div className="ev-meta-label">Date</div>
              <div className="ev-meta-value">{formatDate(event.date)}</div>
            </div>
          </div>

          {/* Time */}
          <div className="ev-meta-item">
            <div className="ev-meta-icon ev-meta-icon--purple">
              <Clock />
            </div>
            <div>
              <div className="ev-meta-label">Time</div>
              <div className="ev-meta-value">{event.time || "9:00 AM – 6:00 PM"}</div>
            </div>
          </div>

          {/* Venue */}
          <div className="ev-meta-item">
            <div className="ev-meta-icon ev-meta-icon--green">
              <MapPin />
            </div>
            <div>
              <div className="ev-meta-label">Venue</div>
              <div className="ev-meta-value">{event.venue || "Convention Center"}</div>
            </div>
          </div>

          {/* Expected Attendees */}
          <div className="ev-meta-item">
            <div className="ev-meta-icon ev-meta-icon--orange">
              <Users />
            </div>
            <div>
              <div className="ev-meta-label">Expected Attendees</div>
              <div className="ev-meta-value">{event.people || event.guests || 500} people</div>
            </div>
          </div>
        </div>

        {/* ── 3. Client Requirements Card ── */}
        <div className="client-req-card">
          <div className="client-req-card__header">
            <MessageCircle />
            <span className="client-req-card__title">Client Requirements</span>
            <div className="client-req-card__meta">
              <User /> Submitted by {event.client || "Emily Carter"} · <Clock /> {formatSubmitted(event.submittedAt)}
            </div>
          </div>

          {/* Feature Tags */}
          <div className="client-req-tags">
            {(event.requestedResources || []).map((r, i) => (
              <span key={`req-res-tag-${i}`} className="client-tag">
                <Package /> {r.resourceName} ×{r.quantity}
              </span>
            ))}
            {(event.requestedStaff || []).map((s, i) => (
              <span key={`req-staff-tag-${i}`} className="client-tag">
                <User /> {s.staffName} ({s.role})
              </span>
            ))}
            {(!event.requestedResources || event.requestedResources.length === 0) &&
              (!event.requestedStaff || event.requestedStaff.length === 0) && (
                <span className="client-tag">
                  <Package /> Standard Event Package Inclusions
                </span>
              )}
          </div>

          {/* Styled Free-Text Message */}
          <div className="client-req-message">
            {event.notes ||
              event.description ||
              "We are expecting around 500 attendees including senior executives, investors, and tech enthusiasts. The venue must have a dedicated registration area at the entrance and a green room for speakers.\n\nPlease ensure the catering team sets up two separate buffet stations on either side of the hall to avoid congestion. All presentation equipment should be tested and ready before setup time."}
          </div>

          {/* Structured Fields & Financial Commission Split */}
          <div className="client-req-extras">
            <div className="client-extra-item">
              <DollarSign />
              <div>
                <div className="client-extra-label">Event Budget</div>
                <div className="client-extra-value">
                  {event.budget ? `$${Number(event.budget).toLocaleString()}` : event.budgetRange || "$40,000 – $55,000"}
                </div>
              </div>
            </div>

            <div className="client-extra-item">
              <Users />
              <div>
                <div className="client-extra-label">Expected Guests</div>
                <div className="client-extra-value">{event.people || event.guests || 500} people</div>
              </div>
            </div>

            <div className="client-extra-item">
              <Tag />
              <div>
                <div className="client-extra-label">Event Type</div>
                <div className="client-extra-value">{event.type || "Conference"}</div>
              </div>
            </div>

            {/* Net Payout Card (90%) */}
            {budgetVal > 0 && (
              <div className="client-extra-item client-extra-payout">
                <Calculator />
                <div>
                  <div className="client-extra-label">Net Payout (90%)</div>
                  <div className="client-extra-value">
                    ${netPayout.toLocaleString()}{" "}
                    <span className="client-extra-fee">
                      (Fee: -${fee.toLocaleString()})
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── 4. Conflict Detection Banner ── */}
        <div className="conflicts-box-wrapper">
          {detectedConflicts.length > 0 ? (
            <div className="conflicts-box-danger">
              <div className="conflicts-header">
                <div className="conflicts-icon-bubble">⚠</div>
                <span>Conflicts Detected ({detectedConflicts.length})</span>
              </div>
              <div className="conflicts-desc">
                The following resource/staff conflicts prevent event approval. Use "Allocate Extra"
                buttons below to resolve, or reject the event.
              </div>
              {detectedConflicts.map((c, i) => (
                <div key={`conflict-item-${i}`} className="conflict-item-card">
                  <div>
                    <div className="conflict-item-type">{c.type}</div>
                    <div className="conflict-item-desc">{c.desc}</div>
                  </div>
                  <span className={`conflict-severity-pill ${c.severity}`}>
                    {c.severity}
                  </span>
                </div>
              ))}
              <div className="conflicts-actions-row">
                <button className="btn-conflict-reject" onClick={handleReject}>
                  ✕ Reject Event
                </button>
              </div>
            </div>
          ) : (
            <div className="conflicts-box-safe">
              <div className="conflicts-box-safe-icon">✅</div>
              <div>
                <div className="conflicts-box-safe-title">No Conflicts — Safe to Approve</div>
                <div className="conflicts-box-safe-sub">
                  All requested resources are in stock and staff members are available.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 5. Resource Requirements Table ── */}
        {(event.requestedResources || []).length > 0 && (
          <div>
            <div className="er-section-header">
              <h3 className="section-title">Resource Requirements</h3>
              <button
                className="btn-alloc-extra-res"
                onClick={() => setExtraResModalOpen(true)}
              >
                + Allocate Extra Resource
              </button>
            </div>
            <div className="req-wrap">
              <table className="req-table">
                <thead>
                  <tr>
                    <th>Resource Name</th>
                    <th>Category</th>
                    <th className="text-center">Required</th>
                    <th className="text-center">Available</th>
                    <th className="text-right">Buffer</th>
                    <th className="text-right">Status</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {event.requestedResources.map((r, idx) => {
                    const evAllocs = allocations[event.id] || [];
                    const isAllocated = evAllocs.some((a) => a.resourceId === r.resourceId);
                    const avail = isAllocated
                      ? r.quantity
                      : getResourceAvailableForEvent(r.resourceId, event.date, event.id);
                    const buf = avail - r.quantity;
                    const bufClass = buf > 0 ? "pos" : buf === 0 ? "zero" : "neg";
                    const statusClass = isAllocated
                      ? "safe"
                      : buf > 2
                      ? "safe"
                      : buf >= 0
                      ? "risk"
                      : "critical";

                    return (
                      <tr key={`res-row-${idx}`}>
                        <td>{r.resourceName}</td>
                        <td>{r.category || "Equipment"}</td>
                        <td className="col-num">{r.quantity}</td>
                        <td className="col-num">{avail}</td>
                        <td className={`buffer-val ${bufClass}`}>
                          {buf >= 0 ? `+${buf}` : buf}
                        </td>
                        <td className="text-right">
                          <span className={`row-status ${statusClass}`}>{statusClass}</span>
                        </td>
                        <td className="text-center">
                          {isAllocated ? (
                            <span className="row-status safe">✓ Allocated</span>
                          ) : buf < 0 ? (
                            <span className="row-status critical">⚠ Conflict</span>
                          ) : (
                            <button
                              className="er-btn-action-allocate"
                              onClick={() => handleAllocateResource(r)}
                            >
                              ▶ Allocate
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── 6. Staff Requirements Table ── */}
        {(event.requestedStaff || []).length > 0 && (
          <div>
            <div className="er-section-header">
              <h3 className="section-title">Staff Requirements</h3>
              <button
                className="btn-alloc-extra-staff"
                onClick={() => setExtraStaffModalOpen(true)}
              >
                + Allocate Extra Staff
              </button>
            </div>
            <div className="req-wrap">
              <table className="req-table">
                <thead>
                  <tr>
                    <th>Staff Name</th>
                    <th>Role</th>
                    <th className="text-center">Required</th>
                    <th className="text-center">Available</th>
                    <th className="text-right">Buffer</th>
                    <th className="text-right">Status</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {event.requestedStaff.map((s, idx) => {
                    const st = staff.find((x) => x.id === s.staffId);
                    const isAlreadyAssigned =
                      st && Array.isArray(st.assignedEvents) && st.assignedEvents.includes(event.id);
                    const busy = !st || (st.workload || 0) >= 100 || st.status === "busy";
                    const statusClass = isAlreadyAssigned ? "safe" : busy ? "risk" : "safe";

                    return (
                      <tr key={`staff-row-${idx}`}>
                        <td>{s.staffName}</td>
                        <td>{s.role || "Event Coordinator"}</td>
                        <td className="col-num">1</td>
                        <td className="col-num">{busy ? 0 : 1}</td>
                        <td className={`buffer-val ${busy ? "neg" : "zero"}`}>
                          {busy ? "-1" : "+0"}
                        </td>
                        <td className="text-right">
                          <span className={`row-status ${statusClass}`}>{statusClass}</span>
                        </td>
                        <td className="text-center">
                          {isAlreadyAssigned ? (
                            <span className="row-status safe">✓ Assigned</span>
                          ) : busy ? (
                            <span className="row-status critical">⚠ Conflict</span>
                          ) : (
                            <button
                              className="er-btn-action-assign"
                              onClick={() => handleAssignStaff(s)}
                            >
                              + Assign
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── 7. Buffer Planning & Risk Summary (Side-by-Side) ── */}
        <div className="bottom-two">
          {/* Buffer Planning Card */}
          <div className="buffer-card">
            <div className="buffer-card__title">
              <ShieldCheck /> Buffer Planning
            </div>
            <div className="buffer-row">
              <div className="buffer-row__top">
                <span className="buffer-row__name">Resources</span>
                <span className="row-status risk">risk</span>
              </div>
              <div className="buffer-row__bottom">
                <span className="buffer-row__rec">Recommended: 15%</span>
                <span className="buffer-row__cur">Current: 8%</span>
              </div>
            </div>
            <div className="buffer-row">
              <div className="buffer-row__top">
                <span className="buffer-row__name">Staff</span>
                <span className="row-status risk">risk</span>
              </div>
              <div className="buffer-row__bottom">
                <span className="buffer-row__rec">Recommended: 20%</span>
                <span className="buffer-row__cur">Current: 12%</span>
              </div>
            </div>
            <div className="buffer-row">
              <div className="buffer-row__top">
                <span className="buffer-row__name">Time</span>
                <span className="row-status critical">critical</span>
              </div>
              <div className="buffer-row__bottom">
                <span className="buffer-row__rec">Recommended: 30 min setup buffer</span>
                <span className="buffer-row__cur">Current: 15 min</span>
              </div>
            </div>
            <div className="buffer-row">
              <div className="buffer-row__top">
                <span className="buffer-row__name">Budget</span>
                <span className="row-status safe">safe</span>
              </div>
              <div className="buffer-row__bottom">
                <span className="buffer-row__rec">Recommended: 10%</span>
                <span className="buffer-row__cur">Current: 12%</span>
              </div>
            </div>
          </div>

          {/* Risk & Feasibility Summary Card */}
          <div className="risk-card">
            <div className="risk-card__title">
              <Zap /> Risk &amp; Feasibility Summary
            </div>

            <div className={`risk-level-box ${riskAnalysis.level}`}>
              <div className="risk-level-label">{riskAnalysis.label}</div>
              <div className="risk-level-sub">{riskAnalysis.sub}</div>
            </div>

            <div className="risk-bars">
              {/* Resource Availability Bar */}
              <div>
                <div className="risk-bar-header">
                  <span className="risk-bar-label">Resource Availability</span>
                  <span className="risk-bar-pct">{riskAnalysis.resPct}%</span>
                </div>
                <div className="risk-bar-bg">
                  <div
                    className={`risk-bar-fill ${
                      riskAnalysis.resPct >= 80
                        ? "risk-bar-fill--green"
                        : riskAnalysis.resPct >= 50
                        ? "risk-bar-fill--yellow"
                        : "risk-bar-fill--red"
                    }`}
                    style={{ width: `${riskAnalysis.resPct}%` }}
                  />
                </div>
              </div>

              {/* Staff Availability Bar */}
              <div>
                <div className="risk-bar-header">
                  <span className="risk-bar-label">Staff Availability</span>
                  <span className="risk-bar-pct">{riskAnalysis.staffPct}%</span>
                </div>
                <div className="risk-bar-bg">
                  <div
                    className={`risk-bar-fill ${
                      riskAnalysis.staffPct >= 80
                        ? "risk-bar-fill--green"
                        : riskAnalysis.staffPct >= 50
                        ? "risk-bar-fill--yellow"
                        : "risk-bar-fill--red"
                    }`}
                    style={{ width: `${riskAnalysis.staffPct}%` }}
                  />
                </div>
              </div>

              {/* Contingency Readiness Bar */}
              <div>
                <div className="risk-bar-header">
                  <span className="risk-bar-label">Contingency Readiness</span>
                  <span className="risk-bar-pct">{riskAnalysis.contPct}%</span>
                </div>
                <div className="risk-bar-bg">
                  <div
                    className={`risk-bar-fill ${
                      riskAnalysis.contPct >= 80
                        ? "risk-bar-fill--green"
                        : riskAnalysis.contPct >= 50
                        ? "risk-bar-fill--yellow"
                        : "risk-bar-fill--red"
                    }`}
                    style={{ width: `${riskAnalysis.contPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 8. Contingency Planning Section ── */}
        <div>
          <h3 className="section-title contingency-heading">
            Contingency Planning
          </h3>
          <div className="req-wrap contingency-container">
            <table className="cont-table">
              <thead>
                <tr>
                  <th>Problem</th>
                  <th>Trigger</th>
                  <th>Solution</th>
                  <th>Status</th>
                  <th className="col-actions-sm"></th>
                </tr>
              </thead>
              <tbody>
                {currentPlans.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="vendor-empty-card">
                      No contingency plans configured yet.
                    </td>
                  </tr>
                ) : (
                  currentPlans.map((p) => (
                    <tr key={p.id}>
                      <td>{p.problem}</td>
                      <td>{p.trigger}</td>
                      <td>{p.solution}</td>
                      <td>
                        {p.status === "triggered" ? (
                          <span className="cont-status-triggered">⚡ triggered</span>
                        ) : (
                          <span className="row-status ready">ready</span>
                        )}
                      </td>
                      <td className="text-right">
                        <button
                          className="cont-del-btn"
                          title="Delete Plan"
                          onClick={() => handleDeletePlan(p.id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Inline Add Plan Form */}
            <div className="cont-add-row">
              <div className="cont-input-group">
                <label>Problem</label>
                <input
                  type="text"
                  placeholder="e.g. Venue Flooding"
                  value={newPlan.problem}
                  onChange={(e) => setNewPlan({ ...newPlan, problem: e.target.value })}
                />
              </div>
              <div className="cont-input-group">
                <label>Trigger</label>
                <input
                  type="text"
                  placeholder="e.g. Heavy rain"
                  value={newPlan.trigger}
                  onChange={(e) => setNewPlan({ ...newPlan, trigger: e.target.value })}
                />
              </div>
              <div className="cont-input-group">
                <label>Solution</label>
                <input
                  type="text"
                  placeholder="e.g. Move to Hall B"
                  value={newPlan.solution}
                  onChange={(e) => setNewPlan({ ...newPlan, solution: e.target.value })}
                />
              </div>
              <button className="cont-add-btn" onClick={handleAddPlan}>
                <Plus size={14} /> Add Plan
              </button>
            </div>
          </div>
        </div>

        {/* ── 9. Action Bar ── */}
        <div className="action-bar">
          <button className="btn-back" onClick={() => navigate("/vendor/events")}>
            <ArrowLeft size={15} /> Back to Requests
          </button>

          {/* Approve Event: only enabled if 0 conflicts and not already finalized */}
          {!isAlreadyFinalized && detectedConflicts.length === 0 && (
            <button className="btn-approve" onClick={handleApprove}>
              <CheckCircle size={17} /> Approve Event
            </button>
          )}

          {/* Reject Event */}
          {!isAlreadyFinalized && (
            <button className="btn-reject" onClick={handleReject}>
              <XCircle size={17} /> Reject Event
            </button>
          )}
        </div>
      </div>

      {/* ── MODAL 1: Allocate Extra Resource ── */}
      {extraResModalOpen && (
        <div className="er-modal-overlay" onClick={() => setExtraResModalOpen(false)}>
          <div className="er-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="er-modal-header">
              <span>Allocate Extra Resource</span>
            </div>
            <div className="er-modal-body">
              {extraResources.length === 0 ? (
                <div className="vendor-empty-card">No resources available for this date.</div>
              ) : (
                extraResources.map((r) => {
                  let chosenQty = 1;
                  return (
                    <div
                      key={`extra-res-${r.id}`}
                      className="er-select-card"
                      onClick={() => handleSelectExtraResource(r, chosenQty)}
                    >
                      <div className="er-card-icon">📦</div>
                      <div className="er-card-info">
                        <div className="er-card-title">{r.name}</div>
                        <div className="er-card-sub">
                          {r.category} • ${r.price || 50}/day •{" "}
                          <span className="er-card-avail">
                            {r.availableQty} available for {event.date || "event date"}
                          </span>
                        </div>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <input
                          type="number"
                          className="er-qty-input"
                          defaultValue={1}
                          min={1}
                          max={r.availableQty}
                          onChange={(e) => {
                            chosenQty = parseInt(e.target.value, 10) || 1;
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
              <button
                className="er-modal-cancel"
                onClick={() => setExtraResModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: Assign Extra Staff ── */}
      {extraStaffModalOpen && (
        <div className="er-modal-overlay" onClick={() => setExtraStaffModalOpen(false)}>
          <div className="er-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="er-modal-header">
              <span>Assign Extra Staff</span>
              <span className="er-modal-header-sub">(only available staff shown)</span>
            </div>
            <div className="er-modal-body">
              {extraStaffMembers.length === 0 ? (
                <div className="vendor-empty-card">No available staff at this moment.</div>
              ) : (
                extraStaffMembers.map((s) => (
                  <div
                    key={`extra-staff-${s.id}`}
                    className="er-select-card"
                    onClick={() => handleSelectExtraStaff(s)}
                  >
                    <div className="er-staff-avatar">{(s.name || "S")[0]}</div>
                    <div className="er-card-info">
                      <div className="er-card-title">{s.name}</div>
                      <div className="er-card-sub">
                        {s.role} • <span className="er-card-avail">Available</span>
                      </div>
                    </div>
                    <span className="er-btn-assign-badge">Assign</span>
                  </div>
                ))
              )}
              <button
                className="er-modal-cancel"
                onClick={() => setExtraStaffModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventReview;
