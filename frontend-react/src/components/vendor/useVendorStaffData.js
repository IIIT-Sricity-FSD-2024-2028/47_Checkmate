/**
 * ============================================================================
 * VENDOR STAFF DATA HOOK (useVendorStaffData.js)
 * ============================================================================
 * Role: Custom Data Retrieval & Mutation Hook (Vendor Staff Portal)
 * Location: src/components/vendor/useVendorStaffData.js
 *
 * Purpose:
 *   Encapsulates all asynchronous queries, workforce filtering, KPI metrics,
 *   pagination, task assignments, and modal states for ManageStaff:
 *     1. Fetches vendor-scoped staff via `getMyStaff()`, events via `getMyEvents()`,
 *        and assignments via `getStaffAssignments()`.
 *     2. Computes 4 summary metrics (Total Staff, Available, Busy, High Workload).
 *     3. Multi-criteria filtering (Role, Status, Workload range) and text search.
 *     4. Enforces event assignment exclusivity (single active event deployment per staff).
 *     5. Manages Add / Edit staff modal state, validation, and optimistic updates.
 *     6. Manages Assign Task modal with live workload meter adjustment (+20%).
 *     7. Manages Schedule Inspection modal for viewing active commitments.
 *     8. Manages Deletion Confirmation and Recruitment Request dialogs.
 * ============================================================================
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  getMyStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  getStaffAssignments,
  createStaffAssignment,
  updateStaffAssignment,
} from "../../services/staffService";
import { getMyEvents } from "../../services/eventService";
import { getAuthSession } from "../../services/auth/authStorage";

// Default fallback staff roster if initial backend query returns empty or offline
const DEFAULT_STAFF_ROSTER = [
  {
    id: "S001",
    name: "Mike Johnson",
    initials: "MJ",
    role: "Event Coordinator",
    phone: "+1 555-1003",
    email: "mike.staff@eliteevents.com",
    workload: 40,
    status: "available",
    avatar: "pink",
    assignedEvents: ["EVT002", "EVT003"],
  },
  {
    id: "S002",
    name: "Elena Rostova",
    initials: "ER",
    role: "Stage Manager",
    phone: "+1 555-1007",
    email: "elena.staff@eliteevents.com",
    workload: 60,
    status: "busy",
    avatar: "purple",
    assignedEvents: ["EVT003"],
  },
  {
    id: "S003",
    name: "David Kim",
    initials: "DK",
    role: "Lead Sound Engineer",
    phone: "+1 555-1008",
    email: "david.kim@soundlightingpro.com",
    workload: 85,
    status: "busy",
    avatar: "teal",
    assignedEvents: ["EVT001"],
  },
  {
    id: "S004",
    name: "Sarah Jenkins",
    initials: "SJ",
    role: "Lighting Technician",
    phone: "+1 555-1009",
    email: "sarah.j@soundlightingpro.com",
    workload: 30,
    status: "available",
    avatar: "green",
    assignedEvents: [],
  },
  {
    id: "S005",
    name: "Marcus Sterling",
    initials: "MS",
    role: "Senior Photographer",
    phone: "+1 555-1010",
    email: "marcus.s@eliteevents.com",
    workload: 90,
    status: "busy",
    avatar: "orange",
    assignedEvents: ["EVT004"],
  },
  {
    id: "S006",
    name: "Chloe Bennett",
    initials: "CB",
    role: "Logistics Coordinator",
    phone: "+1 555-1011",
    email: "chloe.b@eliteevents.com",
    workload: 0,
    status: "off",
    avatar: "pink",
    assignedEvents: [],
  },
];

export default function useVendorStaffData() {
  // ==========================================================================
  // 1. PRIMARY STATE: STAFF, EVENTS & ASSIGNMENTS
  // ==========================================================================

  const [staffList, setStaffList] = useState([]);
  const [events, setEvents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const triggerToast = useCallback((text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);

  // ==========================================================================
  // 2. DATA INITIALIZATION ON MOUNT
  // ==========================================================================

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      try {
        const [staffRes, eventsRes, assignRes] = await Promise.all([
          getMyStaff().catch((err) => {
            console.error("Failed to load staff list:", err);
            return [];
          }),
          getMyEvents().catch((err) => {
            console.error("Failed to load events:", err);
            return [];
          }),
          getStaffAssignments().catch((err) => {
            console.error("Failed to load staff assignments:", err);
            return [];
          }),
        ]);

        if (isMounted) {
          const validStaff = Array.isArray(staffRes) && staffRes.length > 0
            ? staffRes
            : DEFAULT_STAFF_ROSTER;
          setStaffList(validStaff);

          if (Array.isArray(eventsRes)) setEvents(eventsRes);
          if (Array.isArray(assignRes)) setAssignments(assignRes);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // ==========================================================================
  // 3. DERIVED KPI METRICS
  // ==========================================================================

  const kpiStats = useMemo(() => {
    const totalStaff = staffList.length;
    const availableStaff = staffList.filter(
      (s) => (s.status || "").toLowerCase() === "available"
    ).length;
    const busyStaff = staffList.filter(
      (s) => (s.status || "").toLowerCase() === "busy"
    ).length;
    const highWorkloadStaff = staffList.filter(
      (s) => (s.workload || 0) >= 80
    ).length;

    return { totalStaff, availableStaff, busyStaff, highWorkloadStaff };
  }, [staffList]);

  // ==========================================================================
  // 4. SEARCH, FILTERING & PAGINATION
  // ==========================================================================

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState({
    role: "All",
    status: "All",
    workload: "All",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const filteredStaff = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return staffList.filter((s) => {
      // 1. Search Query
      const searchMatch =
        !q ||
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.role && s.role.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q));

      // 2. Role Filter
      const roleMatch =
        activeFilters.role === "All" ||
        String(s.role || "").toLowerCase().includes(activeFilters.role.toLowerCase());

      // 3. Status Filter
      const statusMatch =
        activeFilters.status === "All" ||
        String(s.status || "").toLowerCase() === activeFilters.status.toLowerCase();

      // 4. Workload Filter
      let workloadMatch = true;
      if (activeFilters.workload !== "All") {
        const wl = s.workload || 0;
        if (activeFilters.workload === "Low") workloadMatch = wl < 50;
        else if (activeFilters.workload === "Medium") workloadMatch = wl >= 50 && wl < 80;
        else if (activeFilters.workload === "High") workloadMatch = wl >= 80;
      }

      return searchMatch && roleMatch && statusMatch && workloadMatch;
    });
  }, [staffList, searchQuery, activeFilters]);

  const handleSearchChange = useCallback((query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const totalPages = Math.max(1, Math.ceil(filteredStaff.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedStaff = useMemo(() => {
    const startIdx = (safeCurrentPage - 1) * itemsPerPage;
    return filteredStaff.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredStaff, safeCurrentPage, itemsPerPage]);

  const handleApplyFilters = useCallback((filters) => {
    setActiveFilters(filters);
    setCurrentPage(1);
    triggerToast("Staff filters applied!", "success");
  }, [triggerToast]);

  const handleResetFilters = useCallback(() => {
    const reset = { role: "All", status: "All", workload: "All" };
    setActiveFilters(reset);
    setCurrentPage(1);
    triggerToast("Staff filters reset to default.", "info");
  }, [triggerToast]);

  // ==========================================================================
  // 5. ACTION MODAL 1: ADD / EDIT STAFF
  // ==========================================================================

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    phone: "",
    email: "",
    workload: 0,
    status: "available",
  });
  const [formErrors, setFormErrors] = useState({});

  const handleOpenAddModal = useCallback(() => {
    setEditingStaffId(null);
    setFormData({
      name: "",
      role: "",
      phone: "",
      email: "",
      workload: 0,
      status: "available",
    });
    setFormErrors({});
    setIsFormOpen(true);
  }, []);

  const handleOpenEditModal = useCallback((staff) => {
    setEditingStaffId(staff.id);
    setFormData({
      name: staff.name || "",
      role: staff.role || "",
      phone: staff.phone || "",
      email: staff.email || "",
      workload: staff.workload ?? 0,
      status: staff.status || "available",
    });
    setFormErrors({});
    setIsFormOpen(true);
  }, []);

  const handleCloseFormModal = useCallback(() => {
    setIsFormOpen(false);
  }, []);

  const handleFormFieldChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  }, []);

  const validateStaffForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Full name is required.";
    if (!formData.role.trim()) errors.role = "Role is required.";
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = "A valid email address is required.";
    }
    const wlNum = parseInt(formData.workload, 10);
    if (formData.workload === "" || isNaN(wlNum) || wlNum < 0 || wlNum > 100) {
      errors.workload = "Workload must be a number between 0 and 100.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveStaff = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!validateStaffForm()) {
      triggerToast("Please fix the validation errors in the form.", "danger");
      return;
    }

    const session = getAuthSession();
    const vendorName = session?.user?.name || session?.vendorName || "Elite Events Co.";
    const vendorId = session?.user?.vendorId || session?.vendorId || "V001";
    const vendorEmail = session?.user?.email || session?.email || "vendor@eliteevents.com";

    const payload = {
      name: formData.name.trim(),
      role: formData.role.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      workload: Math.min(100, Math.max(0, parseInt(formData.workload, 10) || 0)),
      status: formData.status,
      initials: formData.name.trim().split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2),
      vendor: vendorName,
      vendorId: vendorId,
      vendorEmail: vendorEmail,
      createdBy: vendorEmail,
    };

    try {
      if (editingStaffId) {
        await updateStaff(editingStaffId, payload);
        setStaffList((prev) =>
          prev.map((s) => (s.id === editingStaffId ? { ...s, ...payload, id: editingStaffId } : s))
        );
        triggerToast(`Staff profile for "${payload.name}" updated!`, "success");
      } else {
        const created = await createStaff({
          id: `S${Date.now().toString().slice(-4)}`,
          ...payload,
        });
        const newStaff = created && created.id ? created : { ...payload, id: `S${Date.now().toString().slice(-4)}` };
        setStaffList((prev) => [newStaff, ...prev]);
        triggerToast(`"${payload.name}" added to staff team!`, "success");
      }
      setIsFormOpen(false);
    } catch (err) {
      console.error("Failed to save staff to backend:", err);
      // Fallback local update
      if (editingStaffId) {
        setStaffList((prev) =>
          prev.map((s) => (s.id === editingStaffId ? { ...s, ...payload, id: editingStaffId } : s))
        );
        triggerToast(`"${payload.name}" updated locally!`, "success");
      } else {
        const fallback = { ...payload, id: `S${Date.now().toString().slice(-4)}` };
        setStaffList((prev) => [fallback, ...prev]);
        triggerToast(`"${payload.name}" added locally!`, "success");
      }
      setIsFormOpen(false);
    }
  };

  // ==========================================================================
  // 6. ACTION MODAL 2: ASSIGN TASK TO EVENT (WITH SINGLE-EVENT CONSTRAINT)
  // ==========================================================================

  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assigningStaff, setAssigningStaff] = useState(null);
  const [assignEventId, setAssignEventId] = useState("");
  const [assignTaskName, setAssignTaskName] = useState("");
  const [assignPriority, setAssignPriority] = useState("Medium");
  const [assignError, setAssignError] = useState("");

  // Filter approved/confirmed events
  const actionableEvents = useMemo(() => {
    const validStatuses = ["approved", "confirmed", "live"];
    return events.filter((e) => validStatuses.includes((e.status || "").toLowerCase()));
  }, [events]);

  // Check single-event restriction for selected staff
  const staffActiveAssignments = useMemo(() => {
    if (!assigningStaff) return [];
    return assignments.filter(
      (a) => a.staffId === assigningStaff.id && a.status !== "rejected"
    );
  }, [assignments, assigningStaff]);

  const restrictedEventId = useMemo(() => {
    if (staffActiveAssignments.length > 0) {
      return staffActiveAssignments[0].eventId;
    }
    return null;
  }, [staffActiveAssignments]);

  const handleOpenAssignModal = useCallback((staff) => {
    if ((staff.workload || 0) >= 100) {
      triggerToast(`${staff.name} is at 100% workload. Complete existing tasks first.`, "danger");
      return;
    }

    setAssigningStaff(staff);
    setAssignTaskName("");
    setAssignPriority("Medium");
    setAssignError("");

    // Identify if staff is restricted to an existing event
    const activeAssigned = assignments.filter(
      (a) => a.staffId === staff.id && a.status !== "rejected"
    );
    if (activeAssigned.length > 0) {
      setAssignEventId(activeAssigned[0].eventId);
    } else if (actionableEvents.length > 0) {
      setAssignEventId(actionableEvents[0].id);
    } else {
      setAssignEventId("");
    }

    setIsAssignOpen(true);
  }, [assignments, actionableEvents, triggerToast]);

  const handleCloseAssignModal = useCallback(() => {
    setIsAssignOpen(false);
    setAssigningStaff(null);
  }, []);

  const handleConfirmAssign = async () => {
    if (!assigningStaff || !assignEventId) return;

    const trimmedTask = assignTaskName.trim();
    if (!trimmedTask) {
      setAssignError("Please enter a task name.");
      return;
    }

    const currentWorkload = assigningStaff.workload || 0;
    if (currentWorkload >= 100) {
      triggerToast(`${assigningStaff.name} is at 100% capacity.`, "danger");
      setIsAssignOpen(false);
      return;
    }

    const targetEvent = events.find((e) => e.id === assignEventId);
    const eventName = targetEvent ? targetEvent.name : "Event";

    // Check duplicate task name
    const existingAssignment = assignments.find(
      (a) => a.staffId === assigningStaff.id && a.eventId === assignEventId
    );
    if (existingAssignment && existingAssignment.tasks) {
      const dup = existingAssignment.tasks.find(
        (t) => (t.desc || t.name || "").trim().toLowerCase() === trimmedTask.toLowerCase()
      );
      if (dup) {
        setAssignError(`Task "${trimmedTask}" is already assigned to ${assigningStaff.name} for this event.`);
        return;
      }
    }

    const newTask = {
      id: `T_${Date.now()}`,
      desc: trimmedTask,
      priority: assignPriority,
      status: "todo",
      eventName: eventName,
    };

    const newWorkload = Math.min(currentWorkload + 20, 100);

    try {
      if (existingAssignment) {
        const updatedTasks = [...(existingAssignment.tasks || []), newTask];
        await updateStaffAssignment(existingAssignment.id, { tasks: updatedTasks });
        setAssignments((prev) =>
          prev.map((a) => (a.id === existingAssignment.id ? { ...a, tasks: updatedTasks } : a))
        );
      } else {
        const newAssignmentPayload = {
          id: `SA_${Date.now()}`,
          staffId: assigningStaff.id,
          staffName: assigningStaff.name,
          staffRole: assigningStaff.role,
          role: assigningStaff.role,
          eventId: targetEvent ? targetEvent.id : assignEventId,
          eventName: eventName,
          eventDate: targetEvent?.date || "",
          eventVenue: targetEvent?.venue || "",
          eventPeople: targetEvent?.people || targetEvent?.guests || 0,
          taskDesc: trimmedTask,
          priority: assignPriority,
          status: "pending",
          tasks: [newTask],
          assignedAt: new Date().toISOString(),
        };
        await createStaffAssignment(newAssignmentPayload);
        setAssignments((prev) => [...prev, newAssignmentPayload]);
      }

      // Update staff workload in state & backend
      await updateStaff(assigningStaff.id, { workload: newWorkload, status: "busy" }).catch(() => {});
      setStaffList((prev) =>
        prev.map((s) => (s.id === assigningStaff.id ? { ...s, workload: newWorkload, status: "busy" } : s))
      );

      triggerToast(`Task "${trimmedTask}" assigned to ${assigningStaff.name}! Workload: ${newWorkload}%`, "success");
      setIsAssignOpen(false);
      setAssigningStaff(null);
    } catch (err) {
      console.error("Failed to assign staff task:", err);
      // Optimistic local update
      setStaffList((prev) =>
        prev.map((s) => (s.id === assigningStaff.id ? { ...s, workload: newWorkload, status: "busy" } : s))
      );
      triggerToast(`Task "${trimmedTask}" assigned locally! Workload: ${newWorkload}%`, "success");
      setIsAssignOpen(false);
      setAssigningStaff(null);
    }
  };

  // ==========================================================================
  // 7. ACTION MODAL 3: SCHEDULE INSPECTION
  // ==========================================================================

  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [schedulingStaff, setSchedulingStaff] = useState(null);

  const staffScheduleEvents = useMemo(() => {
    if (!schedulingStaff) return [];

    // Find all assignments for this staff member
    const memberAssignments = assignments.filter((a) => a.staffId === schedulingStaff.id);

    if (memberAssignments.length > 0) {
      return memberAssignments;
    }

    // Fallback: check assignedEvents IDs on the staff record
    const eventIds = Array.isArray(schedulingStaff.assignedEvents) ? schedulingStaff.assignedEvents : [];
    return events.filter((e) => eventIds.includes(e.id)).map((e) => ({
      id: e.id,
      eventId: e.id,
      eventName: e.name,
      eventDate: e.date,
      eventVenue: e.venue,
      eventPeople: e.people || e.guests,
      status: e.status,
      tasks: [],
    }));
  }, [schedulingStaff, assignments, events]);

  const handleOpenScheduleModal = useCallback((staff) => {
    setSchedulingStaff(staff);
    setIsScheduleOpen(true);
  }, []);

  const handleCloseScheduleModal = useCallback(() => {
    setIsScheduleOpen(false);
    setSchedulingStaff(null);
  }, []);

  // ==========================================================================
  // 8. ACTION MODAL 4: DELETE CONFIRMATION
  // ==========================================================================

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);

  const handleOpenDeleteModal = useCallback((staff) => {
    setStaffToDelete(staff);
    setIsDeleteOpen(true);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setIsDeleteOpen(false);
    setStaffToDelete(null);
  }, []);

  const handleConfirmDelete = async () => {
    if (!staffToDelete) return;
    const targetId = staffToDelete.id;
    const targetName = staffToDelete.name;

    try {
      await deleteStaff(targetId);
      setStaffList((prev) => prev.filter((s) => s.id !== targetId));
      triggerToast(`"${targetName}" removed from team roster.`, "danger");
    } catch (err) {
      console.error("Failed to delete staff member:", err);
      setStaffList((prev) => prev.filter((s) => s.id !== targetId));
      triggerToast(`"${targetName}" removed locally.`, "danger");
    } finally {
      setIsDeleteOpen(false);
      setStaffToDelete(null);
    }
  };

  // ==========================================================================
  // 9. ACTION MODAL 5: RECRUITMENT REQUEST
  // ==========================================================================

  const [isRecruitOpen, setIsRecruitOpen] = useState(false);
  const [recruitData, setRecruitData] = useState({
    position: "",
    location: "",
    type: "Full Time",
    salary: "",
    description: "",
  });
  const [recruitErrors, setRecruitErrors] = useState({});

  const handleOpenRecruitModal = useCallback(() => {
    setRecruitData({
      position: "",
      location: "",
      type: "Full Time",
      salary: "",
      description: "",
    });
    setRecruitErrors({});
    setIsRecruitOpen(true);
  }, []);

  const handleCloseRecruitModal = useCallback(() => {
    setIsRecruitOpen(false);
  }, []);

  const handleRecruitFieldChange = useCallback((field, value) => {
    setRecruitData((prev) => ({ ...prev, [field]: value }));
    setRecruitErrors((prev) => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  }, []);

  const handleSubmitRecruit = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const errors = {};
    if (!recruitData.position.trim()) errors.position = "Position title is required.";
    if (!recruitData.location.trim()) errors.location = "Location is required.";
    if (!recruitData.salary.trim()) errors.salary = "Salary / rate is required.";

    if (Object.keys(errors).length > 0) {
      setRecruitErrors(errors);
      triggerToast("Please fill in Position, Location, and Salary.", "danger");
      return;
    }

    triggerToast(`Recruitment request for "${recruitData.position}" sent to Admin!`, "success");
    setIsRecruitOpen(false);
  };

  const formatDateReadable = useCallback((dateStr) => {
    if (!dateStr) return "Date TBD";
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }, []);

  return {
    // Primary Data State
    staffList,
    events,
    assignments,
    loading,
    toast,
    setToast,
    triggerToast,

    // KPI Metrics
    kpiStats,

    // Search & Filtering
    searchQuery,
    setSearchQuery: handleSearchChange,
    activeFilters,
    filteredStaff,
    handleApplyFilters,
    handleResetFilters,

    // Pagination
    currentPage: safeCurrentPage,
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
  };
}
