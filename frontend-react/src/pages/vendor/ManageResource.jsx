/**
 * ============================================================================
 * MANAGE RESOURCE PAGE (ManageResource.jsx)
 * ============================================================================
 * Role: Event Coordinator / Vendor
 * Purpose:
 *   Comprehensive inventory management dashboard allowing vendors to:
 *     1. Monitor real-time equipment, furniture, and decor stock levels.
 *     2. Search, filter, and paginate through resources.
 *     3. Add new inventory items and modify existing specifications.
 *     4. Allocate units to confirmed/approved events via a 2-phase allocation wizard.
 *     5. Remove outdated or decommissioned resources with confirmation safeguards.
 *
 * Reusable Components Utilized:
 *   - <TopHeaderBar>: Unified top header with title and notifications indicator.
 *   - <StatisticCard>: Metric cards for Total Inventory, Stock Levels, and Alerts.
 *   - <ResourceTableRow>: Modular table row rendering each resource item.
 *
 * Connected Backend Endpoints (via resourceService & eventService):
 *   - GET    /resources (via getMyResources) -> Loads vendor-scoped inventory.
 *   - POST   /resources (via createResource) -> Creates a new inventory record.
 *   - PUT    /resources/:id (via updateResource) -> Updates an existing resource.
 *   - DELETE /resources/:id (via deleteResource) -> Permanently deletes an item.
 *   - GET    /events (via getMyEvents) -> Loads events for resource allocation.
 * ============================================================================
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  SlidersHorizontal,
  Plus,
  Package,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  CalendarCheck,
  BoxSelect,
  ArrowRight,
  ArrowLeft,
  Info,
} from "lucide-react";

// Reusable UI components from the design system
import TopHeaderBar from "../../components/TopHeaderBar";
import StatisticCard from "../../components/StatisticCard";
import ResourceTableRow from "../../components/vendor/ResourceTableRow";

// Backend API services and tenant auth storage
import { getMyResources, createResource, updateResource, deleteResource } from "../../services/resourceService";
import { getMyEvents } from "../../services/eventService";
import { getAuthSession } from "../../services/auth/authStorage";

// Central vendor stylesheet (Zero inline styling)
import "../../styles/vendor.css";

function ManageResource() {
  // ==========================================================================
  // 1. STATE MANAGEMENT: INVENTORY & EVENTS DATA
  // ==========================================================================

  // Master array of inventory resources scoped to this vendor
  const [resources, setResources] = useState([]);

  // Master array of events loaded to populate the allocation dropdown
  const [events, setEvents] = useState([]);

  // Active allocations dictionary mapping eventId -> Array of allocated resource records
  // Persisted in localStorage ('resourceAllocations') for multi-page consistency
  const [allocations, setAllocations] = useState(() => {
    try {
      const saved = localStorage.getItem("resourceAllocations");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Loading flag while performing initial asynchronous data fetches
  const [loading, setLoading] = useState(true);

  // Transient feedback toast banner (e.g., success / error messages)
  const [toast, setToast] = useState(null);

  // ==========================================================================
  // 2. STATE MANAGEMENT: SEARCH, FILTERING & PAGINATION
  // ==========================================================================

  // Search keyword input by the user (matches resource name or category)
  const [searchQuery, setSearchQuery] = useState("");

  // Filter dropdown state toggler (open/closed)
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Reference for the filter dropdown wrapper (used to detect outside clicks)
  const filterDropdownRef = useRef(null);

  // Active filter criteria applied to the inventory table
  const [activeFilters, setActiveFilters] = useState({
    category: "All",
    condition: "All",
    stock: "All",
  });

  // Draft filter selections currently being configured in the dropdown
  const [draftFilters, setDraftFilters] = useState({
    category: "All",
    condition: "All",
    stock: "All",
  });

  // Table pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // ==========================================================================
  // 3. STATE MANAGEMENT: ADD / EDIT RESOURCE MODAL
  // ==========================================================================

  // Modal open flag for Add/Edit
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  // Holds resource ID if editing an existing item, or null if creating a new one
  const [editingResourceId, setEditingResourceId] = useState(null);

  // Controlled form input state for Add/Edit resource
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    quantity: "",
    price: "",
    available: "true",
    condition: "Ready",
  });

  // Form validation errors map (field name -> error message string)
  const [formErrors, setFormErrors] = useState({});

  // ==========================================================================
  // 4. STATE MANAGEMENT: ALLOCATE RESOURCE MODAL (2-PHASE WIZARD)
  // ==========================================================================

  // Modal open flag for the 2-phase allocation wizard
  const [isAllocModalOpen, setIsAllocModalOpen] = useState(false);

  // Active step in the allocation flow (1 = Pick Event, 2 = Enter Quantity)
  const [allocStep, setAllocStep] = useState(1);

  // The resource currently selected for allocation
  const [allocatingResource, setAllocatingResource] = useState(null);

  // The event selected in Phase 1 to receive this resource allocation
  const [selectedEventId, setSelectedEventId] = useState("");

  // Number of units the vendor wishes to allocate to the selected event
  const [allocUnits, setAllocUnits] = useState("");

  // Validation error message for the allocation quantity input
  const [allocError, setAllocError] = useState("");

  // ==========================================================================
  // 5. STATE MANAGEMENT: DELETE CONFIRMATION MODAL
  // ==========================================================================

  // Modal open flag for Delete Confirmation
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // The resource item targeted for deletion
  const [resourceToDelete, setResourceToDelete] = useState(null);

  // ==========================================================================
  // 6. INITIAL DATA LOADING ON MOUNT
  // ==========================================================================

  /**
   * Fetches resources and events concurrently on initial component render.
   * Scopes both collections to the current authenticated vendor session.
   */
  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      setLoading(true);
      try {
        // Fetch resources and events in parallel for maximum speed
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

  // Click-outside listener to close the filter dropdown menu cleanly
  useEffect(() => {
    function handleClickOutside(e) {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target)) {
        setIsFilterOpen(false);
      }
    }

    if (isFilterOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFilterOpen]);

  // ==========================================================================
  // 7. CALCULATION HELPER: EFFECTIVE INVENTORY AVAILABILITY
  // ==========================================================================

  /**
   * Computes the available units for a given resource after subtracting active
   * event allocations. Mirrors the calculation from the original legacy platform.
   *
   * @param {string} resId - Unique resource identifier
   * @param {string} [targetDate] - Optional specific date to evaluate conflicts
   * @param {string} [currentEvId] - Event ID to exclude from allocated sum (if editing)
   * @returns {number} Effective quantity remaining in stock
   */
  const getEffectiveAvail = (resId, targetDate = null, currentEvId = null) => {
    const item = resources.find((r) => r.id === resId);
    if (!item) return 0;

    // Use total stock registered on the item
    const totalStock = item.total ?? item.quantity ?? 0;

    // Filter events to active approved/live events
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

    // Sum all allocated units across active events
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
  };

  // ==========================================================================
  // 8. DERIVED KPI METRICS (FOR STATISTIC CARDS)
  // ==========================================================================

  const kpiStats = useMemo(() => {
    // Total distinct inventory resource items
    const totalItems = resources.length;

    // Total available units across all items
    const totalAvailableUnits = resources.reduce((acc, r) => {
      const avail = getEffectiveAvail(r.id);
      return acc + (r.available !== false ? avail : 0);
    }, 0);

    // Items with low remaining stock (1 to 10 units)
    const lowStockCount = resources.filter((r) => {
      const avail = getEffectiveAvail(r.id);
      return r.available !== false && avail > 0 && avail <= 10;
    }).length;

    // Items completely out of stock or flagged unavailable
    const outOfStockCount = resources.filter((r) => {
      const avail = getEffectiveAvail(r.id);
      return r.available === false || avail <= 0;
    }).length;

    return { totalItems, totalAvailableUnits, lowStockCount, outOfStockCount };
  }, [resources, allocations, events]);

  // ==========================================================================
  // 9. FILTERING & SEARCH PIPELINE
  // ==========================================================================

  const filteredResources = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return resources.filter((r) => {
      // Search matching by resource name or category string
      const searchMatch =
        !q ||
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.category && r.category.toLowerCase().includes(q));

      // Category matching
      const catMatch =
        activeFilters.category === "All" ||
        String(r.category || "").toLowerCase() === activeFilters.category.toLowerCase();

      // Condition matching
      let conditionMatch = true;
      if (activeFilters.condition !== "All") {
        const cond = r.condition || r.conditionStatus || "Ready";
        conditionMatch = cond.toLowerCase() === activeFilters.condition.toLowerCase();
      }

      // Stock level matching
      let stockMatch = true;
      if (activeFilters.stock !== "All") {
        const effAvail = getEffectiveAvail(r.id);
        if (activeFilters.stock === "InStock") stockMatch = effAvail > 0 && r.available !== false;
        else if (activeFilters.stock === "LowStock") stockMatch = effAvail > 0 && effAvail <= 10 && r.available !== false;
        else if (activeFilters.stock === "OutStock") stockMatch = effAvail === 0 || r.available === false;
      }

      return searchMatch && catMatch && conditionMatch && stockMatch;
    });
  }, [resources, searchQuery, activeFilters, allocations, events]);

  // Paginated subset of filtered resources
  const totalPages = Math.max(1, Math.ceil(filteredResources.length / itemsPerPage));
  const paginatedResources = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredResources.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredResources, currentPage, itemsPerPage]);

  // Reset pagination to page 1 whenever search query or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeFilters]);

  // Helper to trigger an auto-expiring feedback toast
  const triggerToast = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // ==========================================================================
  // 10. CRUD ACTION HANDLERS: ADD & EDIT RESOURCE
  // ==========================================================================

  /**
   * Opens the form modal prepped for adding a brand new inventory item.
   */
  const handleOpenAddModal = () => {
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
  };

  /**
   * Opens the form modal pre-filled with an existing resource's details.
   */
  const handleOpenEditModal = (resource) => {
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
  };

  /**
   * Validates form inputs before submission.
   * Returns true if valid, false if any validation errors are detected.
   */
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = "Resource name is required.";
    }

    if (!formData.category.trim()) {
      errors.category = "Category is required.";
    }

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

  /**
   * Submits the Add or Edit form data to the backend API and updates local state.
   */
  const handleSaveResource = async (e) => {
    e.preventDefault();

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
        // Edit existing resource via PUT /resources/:id
        await updateResource(editingResourceId, payload);

        setResources((prev) =>
          prev.map((r) => (r.id === editingResourceId ? { ...r, ...payload, id: editingResourceId } : r))
        );
        triggerToast(`"${payload.name}" updated successfully!`, "success");
      } else {
        // Create new resource via POST /resources
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

      // Fallback local update in case backend endpoint is offline
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
  // 11. ACTION HANDLER: DELETE RESOURCE
  // ==========================================================================

  /**
   * Opens the confirmation modal before permanently deleting a resource.
   */
  const handleOpenDeleteModal = (resource) => {
    setResourceToDelete(resource);
    setIsDeleteModalOpen(true);
  };

  /**
   * Confirms and executes resource deletion via DELETE /resources/:id.
   */
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

      // Fallback local deletion
      setResources((prev) => prev.filter((r) => r.id !== targetId));
      triggerToast(`"${targetName}" removed from local list.`, "danger");
    } finally {
      setIsDeleteModalOpen(false);
      setResourceToDelete(null);
    }
  };

  // ==========================================================================
  // 12. 2-PHASE ALLOCATION WIZARD HANDLERS
  // ==========================================================================

  /**
   * Opens Phase 1 of the Allocation Wizard for the chosen resource.
   */
  const handleOpenAllocateModal = (resource, effectiveAvail) => {
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
  };

  // Filter approved/confirmed events that can accept equipment
  const approvedEvents = useMemo(() => {
    return events.filter((e) => e.status === "confirmed" || e.status === "approved" || e.status === "live");
  }, [events]);

  // Details of the event selected in Step 1
  const selectedEvent = useMemo(() => {
    return events.find((e) => e.id === selectedEventId) || null;
  }, [events, selectedEventId]);

  // Compute available units for the selected event's scheduled date
  const availableForSelectedEvent = useMemo(() => {
    if (!allocatingResource) return 0;
    const targetDate = selectedEvent ? selectedEvent.date : null;
    return getEffectiveAvail(allocatingResource.id, targetDate, selectedEventId);
  }, [allocatingResource, selectedEvent, selectedEventId, allocations]);

  /**
   * Moves from Phase 1 (Event Selection) to Phase 2 (Quantity Allocation).
   */
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

  /**
   * Live validation handler when typing allocation units.
   */
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

  /**
   * Confirms the resource allocation to the selected event.
   */
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

    // Persist allocation in state & localStorage
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

  // Helper date formatter for table and modal displays
  const formatDateReadable = (dateStr) => {
    if (!dateStr) return "Date TBD";
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // ==========================================================================
  // 13. JSX RENDERING
  // ==========================================================================

  return (
    <div className="dashboard-page">
      {/* ── TOP HEADER BAR (Reusable Component) ── */}
      <TopHeaderBar
        title="Manage Resource"
        badge={1}
        onNotificationClick={() => triggerToast("You have 1 pending system inventory alert.", "info")}
      />

      <div className="content">
        {/* ── TRANSIENT TOAST NOTIFICATION ── */}
        {toast && (
          <div className={`toast-feedback toast-feedback--${toast.type}`}>
            <span>{toast.text}</span>
            <button
              type="button"
              className="toast-feedback__close"
              onClick={() => setToast(null)}
              aria-label="Close notification"
            >
              ✕
            </button>
          </div>
        )}

        {/* ── KPI METRICS CARDS ROW (Using reusable StatisticCard) ── */}
        <section className="mr-stat-grid" aria-label="Inventory Summary Statistics">
          {/* Card 1: Total distinct resource items */}
          <StatisticCard
            title="Total Resources"
            value={kpiStats.totalItems}
            description="Active inventory catalog"
            icon={Package}
            color="purple"
          />

          {/* Card 2: Total available units across catalog */}
          <StatisticCard
            title="Available Stock"
            value={kpiStats.totalAvailableUnits}
            description="Units ready for deployment"
            icon={CheckCircle2}
            color="green"
          />

          {/* Card 3: Items approaching low stock threshold */}
          <StatisticCard
            title="Low Stock Alert"
            value={kpiStats.lowStockCount}
            description="Items with 1–10 units left"
            icon={AlertTriangle}
            color="orange"
          />

          {/* Card 4: Items completely depleted */}
          <StatisticCard
            title="Out of Stock"
            value={kpiStats.outOfStockCount}
            description="Items needing replenishment"
            icon={XCircle}
            color="red"
          />
        </section>

        {/* ── TOOLBAR: SEARCH, FILTERS & ADD RESOURCE ── */}
        <div className="mr-toolbar">
          {/* Search Box */}
          <div className="mr-search">
            <Search size={15} />
            <input
              type="text"
              className="mr-search-input"
              placeholder="Search resources by name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="mr-search-clear"
                onClick={() => setSearchQuery("")}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* More Filters Dropdown Toggle */}
          <div className="mr-filter-wrapper" ref={filterDropdownRef}>
            <button
              type="button"
              className={`mr-filter-btn ${isFilterOpen ? "active" : ""}`}
              onClick={() => {
                setDraftFilters({ ...activeFilters });
                setIsFilterOpen(!isFilterOpen);
              }}
            >
              <SlidersHorizontal size={15} />
              <span>More Filters</span>
            </button>

            {/* Filter Dropdown Card */}
            {isFilterOpen && (
              <div className="mr-filter-dropdown">
                {/* Filter 1: Category */}
                <div className="mr-filter-group">
                  <label className="mr-filter-label">Category</label>
                  <select
                    className="mr-filter-select"
                    value={draftFilters.category}
                    onChange={(e) => setDraftFilters({ ...draftFilters, category: e.target.value })}
                  >
                    <option value="All">All Categories</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Decor">Decor</option>
                  </select>
                </div>

                {/* Filter 2: Condition */}
                <div className="mr-filter-group">
                  <label className="mr-filter-label">Condition</label>
                  <select
                    className="mr-filter-select"
                    value={draftFilters.condition}
                    onChange={(e) => setDraftFilters({ ...draftFilters, condition: e.target.value })}
                  >
                    <option value="All">All Conditions</option>
                    <option value="Ready">Good / Ready</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>

                {/* Filter 3: Stock Level */}
                <div className="mr-filter-group">
                  <label className="mr-filter-label">Stock Level</label>
                  <select
                    className="mr-filter-select"
                    value={draftFilters.stock}
                    onChange={(e) => setDraftFilters({ ...draftFilters, stock: e.target.value })}
                  >
                    <option value="All">All Levels</option>
                    <option value="InStock">In Stock (&gt; 0)</option>
                    <option value="LowStock">Low Stock (1–10)</option>
                    <option value="OutStock">Out of Stock (0)</option>
                  </select>
                </div>

                {/* Actions: Apply & Reset */}
                <div className="mr-filter-actions">
                  <button
                    type="button"
                    className="mr-filter-reset-btn"
                    onClick={() => {
                      const reset = { category: "All", condition: "All", stock: "All" };
                      setDraftFilters(reset);
                      setActiveFilters(reset);
                      setIsFilterOpen(false);
                      triggerToast("Filters reset to default.", "info");
                    }}
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    className="mr-filter-apply-btn"
                    onClick={() => {
                      setActiveFilters({ ...draftFilters });
                      setIsFilterOpen(false);
                      triggerToast("Filters applied!", "success");
                    }}
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Add Resource Trigger Button */}
          <button
            type="button"
            className="mr-add-btn"
            onClick={handleOpenAddModal}
          >
            <Plus size={15} />
            <span>Add Resource</span>
          </button>
        </div>

        {/* ── INVENTORY DATA TABLE ── */}
        <div className="mr-table-wrap">
          <table className="mr-table">
            <thead>
              <tr>
                <th>Resource Name</th>
                <th>Category</th>
                <th>Quantity (Avail / Total)</th>
                <th>Rental Price</th>
                <th>Availability</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="vendor-table-message">
                    Loading inventory catalog from server...
                  </td>
                </tr>
              ) : paginatedResources.length > 0 ? (
                paginatedResources.map((resource) => (
                  <ResourceTableRow
                    key={resource.id}
                    resource={resource}
                    effectiveAvail={getEffectiveAvail(resource.id)}
                    onAllocate={handleOpenAllocateModal}
                    onEdit={handleOpenEditModal}
                    onDelete={handleOpenDeleteModal}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="vendor-table-message">
                    No resources found matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── TABLE FOOTER & PAGINATION ── */}
        <div className="mr-footer">
          <span className="mr-showing">
            Showing {filteredResources.length} Resource{filteredResources.length !== 1 ? "s" : ""}
            {filteredResources.length > itemsPerPage && ` (Page ${currentPage} of ${totalPages})`}
          </span>

          {totalPages > 1 && (
            <div className="mr-pagination">
              {/* Previous Page Button */}
              <button
                type="button"
                className="mr-page-btn"
                title="Previous Page"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={14} />
              </button>

              {/* Next Page Button */}
              <button
                type="button"
                className="mr-page-btn"
                title="Next Page"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================================
          MODAL 1: ADD / EDIT RESOURCE
          ====================================================================== */}
      {isFormModalOpen && (
        <div className="vendor-modal-backdrop" onClick={() => setIsFormModalOpen(false)}>
          <div
            className="vendor-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="vendor-modal__header">
              <h3>{editingResourceId ? "Edit Resource" : "Add Resource"}</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsFormModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveResource}>
              <div className="vendor-modal__body">
                <div className="form-grid-2col">
                  {/* Field 1: Resource Name */}
                  <div className="form-group form-grid-full">
                    <label className="form-label">Resource Name *</label>
                    <input
                      type="text"
                      className={`form-input ${formErrors.name ? "form-input-error" : ""}`}
                      placeholder="e.g. Audio System Premium"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    {formErrors.name && <span className="form-error-msg">{formErrors.name}</span>}
                  </div>

                  {/* Field 2: Category */}
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select
                      className={`form-input ${formErrors.category ? "form-input-error" : ""}`}
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="">Select category</option>
                      <option value="Equipment">Equipment</option>
                      <option value="Furniture">Furniture</option>
                      <option value="Decor">Decor</option>
                      <option value="General">General</option>
                    </select>
                    {formErrors.category && <span className="form-error-msg">{formErrors.category}</span>}
                  </div>

                  {/* Field 3: Quantity */}
                  <div className="form-group">
                    <label className="form-label">Total Quantity *</label>
                    <input
                      type="number"
                      min="0"
                      className={`form-input ${formErrors.quantity ? "form-input-error" : ""}`}
                      placeholder="e.g. 12"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    />
                    {formErrors.quantity && <span className="form-error-msg">{formErrors.quantity}</span>}
                  </div>

                  {/* Field 4: Rental Price */}
                  <div className="form-group">
                    <label className="form-label">Price ($/day) *</label>
                    <input
                      type="number"
                      min="0"
                      className={`form-input ${formErrors.price ? "form-input-error" : ""}`}
                      placeholder="e.g. 500"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                    {formErrors.price && <span className="form-error-msg">{formErrors.price}</span>}
                  </div>

                  {/* Field 5: Availability */}
                  <div className="form-group">
                    <label className="form-label">Availability Status</label>
                    <select
                      className="form-input"
                      value={formData.available}
                      onChange={(e) => setFormData({ ...formData, available: e.target.value })}
                    >
                      <option value="true">Available</option>
                      <option value="false">Unavailable</option>
                    </select>
                  </div>

                  {/* Field 6: Condition */}
                  <div className="form-group form-grid-full">
                    <label className="form-label">Equipment Condition</label>
                    <select
                      className="form-input"
                      value={formData.condition}
                      onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    >
                      <option value="Ready">Good / Ready</option>
                      <option value="Fair">Fair</option>
                      <option value="Poor">Poor</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="vendor-modal__footer">
                <button
                  type="button"
                  className="mr-filter-reset-btn"
                  onClick={() => setIsFormModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="mr-add-btn">
                  {editingResourceId ? "Update Resource" : "Save Resource"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================
          MODAL 2: 2-PHASE ALLOCATE RESOURCE WIZARD
          ====================================================================== */}
      {isAllocModalOpen && allocatingResource && (
        <div className="vendor-modal-backdrop" onClick={() => setIsAllocModalOpen(false)}>
          <div
            className="vendor-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="vendor-modal__header">
              <h3>
                {allocStep === 1
                  ? "Allocate Resource — Step 1 of 2"
                  : "Allocate Resource — Step 2 of 2"}
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsAllocModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Selected Resource Overview Strip */}
            <div className="alloc-res-info">
              <div className="alloc-res-icon">
                <BoxSelect size={18} />
              </div>
              <div>
                <div className="alloc-res-name">{allocatingResource.name}</div>
                <div className="alloc-res-meta">
                  {allocatingResource.category} ·{" "}
                  {getEffectiveAvail(allocatingResource.id)} units in global stock
                </div>
              </div>
            </div>

            {/* PHASE 1: EVENT SELECTION */}
            {allocStep === 1 && (
              <>
                <div className="alloc-phase-wrap">
                  <p className="alloc-step-intro">
                    Select the approved event to allocate this inventory resource to:
                  </p>

                  {approvedEvents.length > 0 ? (
                    <div className="form-group">
                      <label className="form-label">Approved Event *</label>
                      <select
                        className={`form-input ${allocError ? "form-input-error" : ""}`}
                        value={selectedEventId}
                        onChange={(e) => {
                          setSelectedEventId(e.target.value);
                          setAllocError("");
                        }}
                      >
                        <option value="">Choose an approved event…</option>
                        {approvedEvents.map((ev) => (
                          <option key={ev.id} value={ev.id}>
                            {ev.name} ({formatDateReadable(ev.date)})
                          </option>
                        ))}
                      </select>
                      {allocError && <span className="form-error-msg">{allocError}</span>}
                    </div>
                  ) : (
                    <div className="alloc-no-events">
                      <Info size={16} />
                      <span>No approved events are currently waiting for equipment allocation.</span>
                    </div>
                  )}

                  {/* Event Details Card (Appears once an event is selected) */}
                  {selectedEvent && (
                    <div className="alloc-event-info">
                      <div className="alloc-info-row">
                        <span className="alloc-info-label">Venue</span>
                        <span className="alloc-info-value">{selectedEvent.venue || "Venue TBD"}</span>
                      </div>
                      <div className="alloc-info-row">
                        <span className="alloc-info-label">Date</span>
                        <span className="alloc-info-value">{formatDateReadable(selectedEvent.date)}</span>
                      </div>
                      <div className="alloc-info-row">
                        <span className="alloc-info-label">Expected Attendees</span>
                        <span className="alloc-info-people">
                          {selectedEvent.people || selectedEvent.guests || selectedEvent.attendees || "—"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="vendor-modal__footer">
                  <button
                    type="button"
                    className="mr-filter-reset-btn"
                    onClick={() => setIsAllocModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="mr-add-btn"
                    disabled={!selectedEventId || approvedEvents.length === 0}
                    onClick={handleProceedToAllocStep2}
                  >
                    <span>Next</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </>
            )}

            {/* PHASE 2: QUANTITY INPUT & CONFIRMATION */}
            {allocStep === 2 && selectedEvent && (
              <>
                <div className="alloc-phase-wrap">
                  {/* Selected Event Tag */}
                  <div className="alloc-event-pill">
                    <CalendarCheck size={14} />
                    <span>{selectedEvent.name}</span>
                  </div>

                  {/* Attendees & Free Stock Stat Row */}
                  <div className="alloc-stat-row">
                    <div className="alloc-stat-box">
                      <div className="alloc-stat-label">Event Attendees</div>
                      <div className="alloc-stat-value alloc-stat-value--purple">
                        {selectedEvent.people || selectedEvent.guests || selectedEvent.attendees || "—"}
                      </div>
                    </div>
                    <div className="alloc-stat-divider" />
                    <div className="alloc-stat-box">
                      <div className="alloc-stat-label">Available on {selectedEvent.date}</div>
                      <div className="alloc-stat-value alloc-stat-value--green">
                        {availableForSelectedEvent}
                      </div>
                    </div>
                  </div>

                  {/* Quantity Input */}
                  <div className="form-group">
                    <label className="form-label">Units to Allocate *</label>
                    <input
                      type="number"
                      min="1"
                      max={availableForSelectedEvent}
                      className={`form-input ${allocError ? "form-input-error" : ""}`}
                      placeholder={`Enter quantity (max ${availableForSelectedEvent})`}
                      value={allocUnits}
                      onChange={handleAllocQtyChange}
                      autoFocus
                    />
                    {allocError && <span className="form-error-msg">{allocError}</span>}
                    <span className="alloc-qty-hint">
                      Maximum units available for this date: {availableForSelectedEvent} units
                    </span>
                  </div>
                </div>

                <div className="vendor-modal__footer">
                  <button
                    type="button"
                    className="mr-filter-reset-btn"
                    onClick={() => setAllocStep(1)}
                  >
                    <ArrowLeft size={14} />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    className="btn-primary-purple"
                    disabled={!allocUnits || !!allocError}
                    onClick={handleConfirmAllocation}
                  >
                    <Check size={15} />
                    <span>Confirm Allocation</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ======================================================================
          MODAL 3: DELETE CONFIRMATION SAFEGUARD
          ====================================================================== */}
      {isDeleteModalOpen && resourceToDelete && (
        <div className="vendor-modal-backdrop" onClick={() => setIsDeleteModalOpen(false)}>
          <div
            className="vendor-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="vendor-modal__header">
              <h3>Delete Resource</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsDeleteModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="vendor-modal__body">
              <p className="delete-modal-warning">
                Are you sure you want to permanently delete{" "}
                <span className="delete-item-target">"{resourceToDelete.name}"</span>?
                This item will be removed from your active equipment inventory.
              </p>
            </div>

            <div className="vendor-modal__footer">
              <button
                type="button"
                className="mr-filter-reset-btn"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-delete-confirm"
                onClick={handleConfirmDelete}
              >
                Delete Resource
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageResource;
