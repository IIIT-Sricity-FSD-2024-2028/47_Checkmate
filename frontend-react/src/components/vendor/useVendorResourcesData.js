/**
 * ============================================================================
 * VENDOR RESOURCES DATA HOOK (useVendorResourcesData.js)
 * ============================================================================
 * Role: Custom Data Retrieval & Mutation Hook (Vendor Inventory Portal)
 * Location: src/components/vendor/useVendorResourcesData.js
 *
 * Purpose:
 *   Encapsulates all asynchronous data fetching, inventory availability calculations,
 *   search/filter pipelines, pagination, and CRUD modal operations for ManageResource:
 *     1. Fetches vendor-scoped resources via `getMyResources()` and events via `getMyEvents()`.
 *     2. Computes dynamic effective stock availability considering scheduled event allocations.
 *     3. Persists equipment allocation registry to `localStorage` ('resourceAllocations').
 *     4. Derives 4 KPI metrics (Total Resources, Available Stock, Low Stock, Out of Stock).
 *     5. Provides multi-attribute filtering (Category, Condition, Stock Level) and search.
 *     6. Manages Add/Edit modal state, input validation, and submission handlers.
 *     7. Manages 2-Phase Allocation Wizard state, validation, and confirmation.
 *     8. Manages Deletion confirmation state and execution.
 * ============================================================================
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  getMyResources,
  createResource,
  updateResource,
  deleteResource,
} from "../../services/resourceService";
import { getMyEvents } from "../../services/eventService";
import { getAuthSession } from "../../services/auth/authStorage";

export default function useVendorResourcesData() {
  // ==========================================================================
  // 1. STATE: INVENTORY, EVENTS & ALLOCATIONS
  // ==========================================================================

  // Master array of inventory resources scoped to this vendor
  const [resources, setResources] = useState([]);

  // Master array of events loaded to populate allocation targets
  const [events, setEvents] = useState([]);

  // Active allocations dictionary mapping eventId -> Array of allocated resource records
  const [allocations, setAllocations] = useState(() => {
    try {
      const saved = localStorage.getItem("resourceAllocations");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Loading flag for initial asynchronous queries
  const [loading, setLoading] = useState(true);

  // Transient feedback toast notification state
  const [toast, setToast] = useState(null);

  // Helper to trigger an auto-expiring feedback toast
  const triggerToast = useCallback((text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);

  // ==========================================================================
  // 2. INITIAL DATA LOADING ON MOUNT
  // ==========================================================================

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      setLoading(true);
      try {
        const [resData, evData] = await Promise.all([
          getMyResources().catch((err) => {
            console.error("Failed to load inventory resources:", err);
            return [];
          }),
          getMyEvents().catch((err) => {
            console.error("Failed to load vendor events:", err);
            return [];
          }),
        ]);

        if (isMounted) {
          if (Array.isArray(resData)) setResources(resData);
          if (Array.isArray(evData)) setEvents(evData);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync allocations to browser localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem("resourceAllocations", JSON.stringify(allocations));
    } catch (err) {
      console.warn("Unable to persist resourceAllocations to localStorage:", err);
    }
  }, [allocations]);

  // ==========================================================================
  // 3. CALCULATION HELPER: EFFECTIVE INVENTORY AVAILABILITY
  // ==========================================================================

  /**
   * Computes available units for a given resource after deducting active event allocations.
   *
   * @param {string} resId - Unique resource identifier
   * @param {string} [targetDate] - Optional specific date to evaluate conflicts
   * @param {string} [currentEvId] - Event ID to exclude from allocated sum (if editing)
   * @returns {number} Effective quantity remaining in stock
   */
  const getEffectiveAvail = useCallback(
    (resId, targetDate = null, currentEvId = null) => {
      const item = resources.find((r) => r.id === resId);
      if (!item) return 0;

      const totalStock = item.total ?? item.quantity ?? 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const activeEvents = events.filter((e) => {
        if (e.status !== "live" && e.status !== "confirmed" && e.status !== "approved") return false;
        if (e.id === currentEvId) return false;
        if (!e.date) return false;

        if (targetDate) return e.date === targetDate;

        const evDate = new Date(`${e.date}T00:00:00`);
        return evDate >= today;
      });

      let totalAllocated = 0;
      activeEvents.forEach((ev) => {
        const evAllocs = allocations[ev.id] || [];
        evAllocs.forEach((a) => {
          if (a.resourceId === resId) {
            totalAllocated += a.qty || a.quantity || 0;
          }
        });
      });

      return Math.max(0, totalStock - totalAllocated);
    },
    [resources, events, allocations]
  );

  // ==========================================================================
  // 4. DERIVED KPI METRICS
  // ==========================================================================

  const kpiStats = useMemo(() => {
    const totalItems = resources.length;

    const totalAvailableUnits = resources.reduce((acc, r) => {
      const avail = getEffectiveAvail(r.id);
      return acc + (r.available !== false ? avail : 0);
    }, 0);

    const lowStockCount = resources.filter((r) => {
      const avail = getEffectiveAvail(r.id);
      return r.available !== false && avail > 0 && avail <= 10;
    }).length;

    const outOfStockCount = resources.filter((r) => {
      const avail = getEffectiveAvail(r.id);
      return r.available === false || avail <= 0;
    }).length;

    return { totalItems, totalAvailableUnits, lowStockCount, outOfStockCount };
  }, [resources, getEffectiveAvail]);

  // ==========================================================================
  // 5. SEARCH, FILTERING & PAGINATION PIPELINE
  // ==========================================================================

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState({
    category: "All",
    condition: "All",
    stock: "All",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filteredResources = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return resources.filter((r) => {
      // Search keyword match
      const searchMatch =
        !q ||
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.category && r.category.toLowerCase().includes(q));

      // Category filter match
      const catMatch =
        activeFilters.category === "All" ||
        String(r.category || "").toLowerCase() === activeFilters.category.toLowerCase();

      // Condition filter match
      let conditionMatch = true;
      if (activeFilters.condition !== "All") {
        const cond = r.condition || r.conditionStatus || "Ready";
        conditionMatch = cond.toLowerCase() === activeFilters.condition.toLowerCase();
      }

      // Stock level filter match
      let stockMatch = true;
      if (activeFilters.stock !== "All") {
        const effAvail = getEffectiveAvail(r.id);
        if (activeFilters.stock === "InStock") stockMatch = effAvail > 0 && r.available !== false;
        else if (activeFilters.stock === "LowStock") stockMatch = effAvail > 0 && effAvail <= 10 && r.available !== false;
        else if (activeFilters.stock === "OutStock") stockMatch = effAvail === 0 || r.available === false;
      }

      return searchMatch && catMatch && conditionMatch && stockMatch;
    });
  }, [resources, searchQuery, activeFilters, getEffectiveAvail]);

  const handleSearchChange = useCallback((query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const totalPages = Math.max(1, Math.ceil(filteredResources.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedResources = useMemo(() => {
    const startIdx = (safeCurrentPage - 1) * itemsPerPage;
    return filteredResources.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredResources, safeCurrentPage, itemsPerPage]);

  const handleApplyFilters = useCallback((filters) => {
    setActiveFilters(filters);
    setCurrentPage(1);
    triggerToast("Filters applied!", "success");
  }, [triggerToast]);

  const handleResetFilters = useCallback(() => {
    const reset = { category: "All", condition: "All", stock: "All" };
    setActiveFilters(reset);
    setCurrentPage(1);
    triggerToast("Filters reset to default.", "info");
  }, [triggerToast]);

  // ==========================================================================
  // 6. ADD / EDIT RESOURCE MODAL STATE & HANDLERS
  // ==========================================================================

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingResourceId, setEditingResourceId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    quantity: "",
    price: "",
    available: "true",
    condition: "Ready",
  });
  const [formErrors, setFormErrors] = useState({});

  const handleOpenAddModal = useCallback(() => {
    setEditingResourceId(null);
    setFormData({
      name: "",
      category: "",
      quantity: "",
      price: "",
      available: "true",
      condition: "Ready",
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback((resource) => {
    setEditingResourceId(resource.id);
    setFormData({
      name: resource.name || "",
      category: resource.category || "",
      quantity: String(resource.total ?? resource.quantity ?? 0),
      price: String(resource.price ?? 0),
      available: String(resource.available !== false),
      condition: resource.condition || resource.conditionStatus || "Ready",
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  }, []);

  const handleCloseFormModal = useCallback(() => {
    setIsFormModalOpen(false);
  }, []);

  const handleFormFieldChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => {
      if (!prev[field]) return prev;
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
  }, []);

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Resource name is required.";
    if (!formData.category.trim()) errors.category = "Category is required.";
    if (
      formData.quantity === "" ||
      isNaN(Number(formData.quantity)) ||
      Number(formData.quantity) < 0
    ) {
      errors.quantity = "Please enter a valid non-negative quantity.";
    }
    if (
      formData.price === "" ||
      isNaN(Number(formData.price)) ||
      Number(formData.price) < 0
    ) {
      errors.price = "Please enter a valid price.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveResource = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!validateForm()) {
      triggerToast("Please fix the validation errors in the form.", "danger");
      return;
    }

    const session = getAuthSession();
    const vendorName = session?.user?.name || session?.vendorName || "Elite Events Co.";
    const vendorId = session?.user?.vendorId || session?.vendorId || "V001";
    const vendorEmail = session?.user?.email || session?.email || "vendor@eliteevents.com";

    const payload = {
      name: formData.name.trim(),
      category: formData.category,
      quantity: parseInt(formData.quantity, 10),
      total: parseInt(formData.quantity, 10),
      avail: parseInt(formData.quantity, 10),
      price: parseFloat(formData.price),
      unit: "day",
      available: formData.available === "true",
      condition: formData.condition,
      vendor: vendorName,
      vendorId: vendorId,
      vendorEmail: vendorEmail,
      createdBy: vendorEmail,
    };

    try {
      if (editingResourceId) {
        await updateResource(editingResourceId, payload);
        setResources((prev) =>
          prev.map((r) => (r.id === editingResourceId ? { ...r, ...payload, id: editingResourceId } : r))
        );
        triggerToast(`"${payload.name}" updated successfully!`, "success");
      } else {
        const created = await createResource({
          id: `R${Date.now().toString().slice(-4)}`,
          ...payload,
        });
        const newResource = created && created.id ? created : { ...payload, id: `R${Date.now().toString().slice(-4)}` };
        setResources((prev) => [newResource, ...prev]);
        triggerToast(`"${payload.name}" added to inventory!`, "success");
      }
      setIsFormModalOpen(false);
    } catch (err) {
      console.error("Failed to save resource to backend:", err);
      if (editingResourceId) {
        setResources((prev) =>
          prev.map((r) => (r.id === editingResourceId ? { ...r, ...payload, id: editingResourceId } : r))
        );
        triggerToast(`"${payload.name}" updated locally!`, "success");
      } else {
        const fallbackResource = { ...payload, id: `R${Date.now().toString().slice(-4)}` };
        setResources((prev) => [fallbackResource, ...prev]);
        triggerToast(`"${payload.name}" added locally!`, "success");
      }
      setIsFormModalOpen(false);
    }
  };

  // ==========================================================================
  // 7. DELETE RESOURCE MODAL STATE & HANDLERS
  // ==========================================================================

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState(null);

  const handleOpenDeleteModal = useCallback((resource) => {
    setResourceToDelete(resource);
    setIsDeleteModalOpen(true);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setResourceToDelete(null);
  }, []);

  const handleConfirmDelete = async () => {
    if (!resourceToDelete) return;
    const targetId = resourceToDelete.id;
    const targetName = resourceToDelete.name;

    try {
      await deleteResource(targetId);
      setResources((prev) => prev.filter((r) => r.id !== targetId));
      triggerToast(`"${targetName}" permanently removed.`, "danger");
    } catch (err) {
      console.error("Failed to delete resource on backend:", err);
      setResources((prev) => prev.filter((r) => r.id !== targetId));
      triggerToast(`"${targetName}" removed from local list.`, "danger");
    } finally {
      setIsDeleteModalOpen(false);
      setResourceToDelete(null);
    }
  };

  // ==========================================================================
  // 8. 2-PHASE ALLOCATION WIZARD STATE & HANDLERS
  // ==========================================================================

  const [isAllocModalOpen, setIsAllocModalOpen] = useState(false);
  const [allocStep, setAllocStep] = useState(1);
  const [allocatingResource, setAllocatingResource] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [allocUnits, setAllocUnits] = useState("");
  const [allocError, setAllocError] = useState("");

  const approvedEvents = useMemo(() => {
    return events.filter((e) => e.status === "confirmed" || e.status === "approved" || e.status === "live");
  }, [events]);

  const selectedEvent = useMemo(() => {
    return events.find((e) => e.id === selectedEventId) || null;
  }, [events, selectedEventId]);

  const availableForSelectedEvent = useMemo(() => {
    if (!allocatingResource) return 0;
    const targetDate = selectedEvent ? selectedEvent.date : null;
    return getEffectiveAvail(allocatingResource.id, targetDate, selectedEventId);
  }, [allocatingResource, selectedEvent, selectedEventId, getEffectiveAvail]);

  const handleOpenAllocateModal = useCallback((resource, effectiveAvail) => {
    if (effectiveAvail <= 0 || resource.available === false) {
      triggerToast(`"${resource.name}" has 0 available units and cannot be allocated.`, "danger");
      return;
    }
    setAllocatingResource(resource);
    setSelectedEventId("");
    setAllocUnits("");
    setAllocError("");
    setAllocStep(1);
    setIsAllocModalOpen(true);
  }, [triggerToast]);

  const handleCloseAllocModal = useCallback(() => {
    setIsAllocModalOpen(false);
    setAllocatingResource(null);
  }, []);

  const handleSelectEvent = useCallback((eventId) => {
    setSelectedEventId(eventId);
    setAllocError("");
  }, []);

  const handleProceedToAllocStep2 = () => {
    if (!selectedEventId) {
      setAllocError("Please select an approved event before continuing.");
      return;
    }
    if (availableForSelectedEvent <= 0) {
      setAllocError(`No units of this resource are free on ${selectedEvent?.date || "this date"}.`);
      return;
    }
    setAllocError("");
    setAllocStep(2);
  };

  const handleBackToAllocStep1 = useCallback(() => {
    setAllocStep(1);
  }, []);

  const handleAllocQtyChange = (e) => {
    const val = e.target.value;
    setAllocUnits(val);
    const num = parseInt(val, 10);
    if (!val) {
      setAllocError("Quantity is required.");
    } else if (isNaN(num) || num < 1) {
      setAllocError("Please enter a valid quantity of 1 or more.");
    } else if (num > availableForSelectedEvent) {
      setAllocError(`Cannot exceed available stock of ${availableForSelectedEvent} units.`);
    } else {
      setAllocError("");
    }
  };

  const handleConfirmAllocation = () => {
    const qty = parseInt(allocUnits, 10);

    if (isNaN(qty) || qty < 1) {
      setAllocError("Please enter a valid quantity (min 1).");
      return;
    }

    if (qty > availableForSelectedEvent) {
      setAllocError(`Only ${availableForSelectedEvent} unit${availableForSelectedEvent !== 1 ? "s are" : " is"} available for this event date.`);
      return;
    }

    setAllocations((prev) => {
      const existing = prev[selectedEventId] || [];
      const updatedEventAllocs = [
        ...existing,
        {
          resourceId: allocatingResource.id,
          resourceName: allocatingResource.name,
          category: allocatingResource.category,
          qty,
          allocatedAt: new Date().toISOString(),
        },
      ];
      return { ...prev, [selectedEventId]: updatedEventAllocs };
    });

    setIsAllocModalOpen(false);
    triggerToast(
      `${qty} unit${qty !== 1 ? "s" : ""} of "${allocatingResource.name}" allocated to "${selectedEvent.name}".`,
      "success"
    );
  };

  const formatDateReadable = useCallback((dateStr) => {
    if (!dateStr) return "Date TBD";
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }, []);

  return {
    // Inventory & Events State
    resources,
    events,
    allocations,
    loading,
    toast,
    setToast,
    triggerToast,

    // Availability & KPI Metrics
    getEffectiveAvail,
    kpiStats,

    // Search & Filtering
    searchQuery,
    setSearchQuery: handleSearchChange,
    activeFilters,
    filteredResources,
    handleApplyFilters,
    handleResetFilters,

    // Pagination
    currentPage: safeCurrentPage,
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
    effectiveGlobalStock: allocatingResource ? getEffectiveAvail(allocatingResource.id) : 0,
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
  };
}
