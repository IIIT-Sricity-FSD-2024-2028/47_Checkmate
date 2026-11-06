/**
 * ============================================================================
 * CREATE EVENT WIZARD HOOK (useCreateEventWizard.js)
 * ============================================================================
 * Role: Custom State & Mutation Hook (Client Create Event page)
 * Location: src/components/client/useCreateEventWizard.js
 *
 * Purpose:
 *   Holds every piece of state and logic for the 4-step Create Event wizard,
 *   so the step components only display things and call these handlers:
 *     1. Loads the resource catalogue, staff list, events and allocations.
 *     2. Step 1: form values, required-field validation, budget limit maths.
 *     3. Step 2: resource search / category filter, +/- quantity limited by
 *        real availability on the chosen date, subtotal and over-budget check.
 *     4. Step 3: staff search and select / unselect.
 *     5. Step 4: builds the event payload and POSTs it, with submit states.
 *
 * Connected Backend Endpoints:
 *   - GET  /api/resources                 -> resource catalogue
 *   - GET  /api/snapshot                  -> staff list (clients can't call /api/staff)
 *   - GET  /api/events                    -> confirmed/live events (for availability)
 *   - GET  /api/state/resourceAllocations -> units those events already use
 *   - POST /api/events                    -> creates the request (status "pending")
 * ============================================================================
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getResources } from "../../services/resourceService";
import { getSnapshot } from "../../services/analyticsService";
import { getEvents, createEvent } from "../../services/eventService";
import { getResourceAllocations } from "../../services/stateService";
import { getCurrentUser, formatTime12 } from "../../utils/clientHelpers";

export const STEP_LABELS = ["Event Details", "Resources", "Staff", "Review"];

const REQUIRED_FIELDS = {
  name: "Event name is required.",
  type: "Please select an event type.",
  date: "Please select a date.",
  people: "Please enter guest count.",
};

const EMPTY_FORM = {
  name: "", type: "", date: "", time: "09:00", people: "",
  venue: "", budget: "", customBudget: "", notes: "",
};

export function useCreateEventWizard() {
  const navigate = useNavigate();

  // --------------------------------------------------------------------------
  // 1. STATE
  // --------------------------------------------------------------------------
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  // Data from the backend
  const [resources, setResources] = useState([]);
  const [staff, setStaff] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [allocations, setAllocations] = useState({});

  // Selections: { resourceId: quantity } and { staffId: true }
  // FACULTY MAY ASK: Why store selections as objects instead of arrays?
  // HOW TO CHANGE: Looking up / deleting by id is one line (obj[id], delete obj[id]);
  // with an array you'd need find() and filter() every time.
  const [selectedQty, setSelectedQty] = useState({});
  const [selectedStaff, setSelectedStaff] = useState({});

  // Search / filter boxes
  const [resSearch, setResSearch] = useState("");
  const [resCategory, setResCategory] = useState("All");
  const [staffSearch, setStaffSearch] = useState("");

  // "idle" | "submitting" | "success" | "error"
  const [submitState, setSubmitState] = useState("idle");
  const [toast, setToast] = useState(null);

  // --------------------------------------------------------------------------
  // 2. LOAD CATALOGUE DATA
  // --------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      // allSettled: one failing request (e.g. snapshot) shouldn't break the others
      const [res, snap, evs, allocs] = await Promise.allSettled([
        getResources(), getSnapshot(), getEvents(), getResourceAllocations(),
      ]);
      if (!isMounted) return;
      if (res.status === "fulfilled") setResources(res.value || []);
      if (snap.status === "fulfilled") setStaff(snap.value?.staff || []);
      if (evs.status === "fulfilled") setAllEvents(evs.value || []);
      if (allocs.status === "fulfilled") setAllocations(allocs.value || {});
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = (text, type = "info") => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };

  // --------------------------------------------------------------------------
  // 3. STEP 1 — FORM + VALIDATION + BUDGET
  // --------------------------------------------------------------------------
  // Updates one field and clears its error as soon as it has a value
  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field] && String(value).trim()) {
      const remaining = { ...errors };
      delete remaining[field];
      setErrors(remaining);
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    Object.entries(REQUIRED_FIELDS).forEach(([field, message]) => {
      if (!String(form[field]).trim()) newErrors[field] = message;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Upper limit of the chosen budget: "$5,000 - $15,000" -> 15000, "$50,000+" -> 50000
  const getMaxBudget = () => {
    if (form.budget === "custom") return Number(form.customBudget) || 0;
    if (!form.budget) return Infinity; // no budget chosen = no limit
    const upper = form.budget.includes("-") ? form.budget.split("-")[1] : form.budget;
    return Number(upper.replace(/[^0-9]/g, ""));
  };

  // Budget text shown on the review step and sent to the backend
  const budgetText = form.budget === "custom"
    ? (form.customBudget ? `$${form.customBudget}` : "")
    : form.budget;

  // --------------------------------------------------------------------------
  // 4. STEP 2 — RESOURCES
  // --------------------------------------------------------------------------
  // Units free = total minus what confirmed/live events already use.
  // With a date chosen we only count events on that same date.
  const getAvailable = (resource) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const busyEvents = allEvents.filter((e) => {
      if (e.status !== "live" && e.status !== "confirmed") return false;
      if (!e.date) return false;
      if (form.date) return e.date === form.date;
      return new Date(e.date + "T00:00:00") <= today;
    });
    let used = 0;
    busyEvents.forEach((ev) => {
      (allocations[ev.id] || []).forEach((a) => {
        if (a.resourceId === resource.id) used += a.quantity || a.qty || 0;
      });
    });
    const total = resource.total || resource.quantity || 0;
    return Math.max(0, total - used);
  };

  const categories = ["All", ...new Set(resources.map((r) => r.category))];
  const visibleResources = resources.filter((r) => {
    const q = resSearch.trim().toLowerCase();
    const categoryOk = resCategory === "All" || r.category === resCategory;
    const searchOk = !q || r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q);
    return categoryOk && searchOk;
  });

  // Chosen resources with their cost (used by summary, review and submit)
  const chosenResources = resources
    .filter((r) => selectedQty[r.id] > 0)
    .map((r) => ({ ...r, qty: selectedQty[r.id], cost: selectedQty[r.id] * (r.price || 0) }));
  const subtotal = chosenResources.reduce((sum, r) => sum + r.cost, 0);
  const maxBudget = getMaxBudget();
  const overBudget = subtotal > maxBudget;

  const changeQty = (resource, change) => {
    const current = selectedQty[resource.id] || 0;
    const available = getAvailable(resource);
    if (change > 0 && current >= available) {
      showToast(`Only ${available} unit(s) available for this resource.`, "danger");
      return;
    }
    const next = Math.max(0, current + change);
    const updated = { ...selectedQty, [resource.id]: next };
    if (next === 0) delete updated[resource.id];
    setSelectedQty(updated);
  };

  const removeResource = (id) => {
    const updated = { ...selectedQty };
    delete updated[id];
    setSelectedQty(updated);
  };

  // --------------------------------------------------------------------------
  // 5. STEP 3 — STAFF
  // --------------------------------------------------------------------------
  const visibleStaff = staff.filter((s) => {
    const q = staffSearch.trim().toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || (s.role || "").toLowerCase().includes(q);
  });
  const chosenStaff = staff.filter((s) => selectedStaff[s.id]);

  const toggleStaff = (id) => {
    const updated = { ...selectedStaff };
    if (updated[id]) delete updated[id];
    else updated[id] = true;
    setSelectedStaff(updated);
  };

  // --------------------------------------------------------------------------
  // 6. NAVIGATION BETWEEN STEPS
  // --------------------------------------------------------------------------
  const goToStep = (next) => {
    if (step === 1 && next > 1 && !validateStep1()) return;
    setStep(next);
    // The layout's <main> is the element that scrolls, not the window
    document.querySelector(".main-content")?.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --------------------------------------------------------------------------
  // 7. SUBMIT
  // --------------------------------------------------------------------------
  const handleSubmit = async () => {
    const user = getCurrentUser();
    const people = Number(form.people) > 0 ? Number(form.people) : 1;

    const requestedResources = chosenResources.map((r) => ({
      resourceId: r.id,
      resourceName: r.name,
      category: r.category,
      quantity: r.qty,
      pricePerDay: r.price,
      vendor: r.vendor || "Elite Events Co.",
      vendorId: r.vendorId || "V001",
      vendorEmail: r.vendorEmail || "",
    }));
    const requestedStaff = chosenStaff.map((s) => ({
      staffId: s.id,
      staffName: s.name,
      role: s.role,
      vendor: s.vendor || "Elite Events Co.",
      vendorId: s.vendorId || "V001",
      vendorEmail: s.vendorEmail || "",
    }));

    // Every vendor whose resources/staff were picked
    const picked = [...requestedResources, ...requestedStaff];
    const vendorIds = [...new Set(picked.map((x) => x.vendorId))];
    const vendors = [...new Set(picked.map((x) => x.vendor))];
    const numericBudget = budgetText ? Number(budgetText.replace(/[^0-9]/g, "")) : undefined;

    // FACULTY MAY ASK: Why is there no "id" in this object?
    // HOW TO CHANGE: The backend gives the next number (EVT008, EVT009, ...) itself,
    // so two clients submitting at once can't create the same id.
    const newEvent = {
      name: form.name.trim(),
      type: form.type,
      date: form.date,
      time: formatTime12(form.time),
      venue: form.venue.trim() || "TBD",
      people,
      guests: people,
      status: "pending",
      notes: form.notes.trim() || undefined,
      createdBy: "client",
      client: user.name,
      clientId: user.id,
      clientEmail: user.email,
      vendor: vendors.length > 0 ? vendors.join(", ") : "Elite Events Co.",
      vendorId: vendorIds[0] || "V001",
      vendorIds: vendorIds.length > 0 ? vendorIds : undefined,
      vendors: vendors.length > 0 ? vendors : undefined,
      categories: [form.type, ...new Set(requestedResources.map((r) => r.category))],
      budget: numericBudget,
      budgetRange: budgetText || undefined,
      requestedResources: requestedResources.length > 0 ? requestedResources : undefined,
      requestedStaff: requestedStaff.length > 0 ? requestedStaff : undefined,
      estimatedCost: subtotal > 0 ? subtotal : undefined,
      submittedAt: new Date().toISOString(),
    };

    setSubmitState("submitting");
    try {
      await createEvent(newEvent);
      setSubmitState("success");
      setTimeout(() => navigate("/client/events"), 1500);
    } catch {
      // Only claim success when the backend actually saved it
      setSubmitState("error");
      setTimeout(() => setSubmitState("idle"), 3000);
    }
  };

  return {
    // wizard
    step, goToStep, toast, setToast,
    // step 1
    form, errors, updateField, budgetText,
    // step 2
    categories, visibleResources, resSearch, setResSearch, resCategory, setResCategory,
    selectedQty, changeQty, removeResource, chosenResources, subtotal, maxBudget, overBudget,
    // step 3
    visibleStaff, staffSearch, setStaffSearch, selectedStaff, toggleStaff, chosenStaff,
    // step 4
    submitState, handleSubmit,
  };
}

export default useCreateEventWizard;
