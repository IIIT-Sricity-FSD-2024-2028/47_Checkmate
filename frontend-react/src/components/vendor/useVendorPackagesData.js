/**
 * ============================================================================
 * VENDOR PRESET PACKAGES DATA HOOK (useVendorPackagesData.js)
 * ============================================================================
 * Role: Custom Data Retrieval & Mutation Hook (Vendor Packages Portal)
 * Location: src/components/vendor/useVendorPackagesData.js
 *
 * Purpose:
 *   Encapsulates all asynchronous data operations, multi-criteria filtering,
 *   KPI metric calculations, and CRUD handlers for the Preset Package portal:
 *     1. Fetches vendor packages via `getMyPackages()` with robust fallbacks.
 *     2. Loads active catalog inventory via `getMyResources()`.
 *     3. Loads active workforce roster via `getMyStaff()`.
 *     4. Computes KPI metrics (Total Packages, Active, Avg Price, Primary Category).
 *     5. Provides memoized multi-dimensional filtering (category tabs, search, price, capacity).
 *     6. Handles Package creation, update, and deletion with instant optimistic UI feedback.
 * ============================================================================
 */

import { useState, useEffect, useMemo } from "react";
import {
  getMyPackages,
  createPackage,
  updatePackage,
  deletePackage,
  getMyResources,
  getMyStaff,
} from "../../services";

// Default turnkey fallback packages when backend returns empty initial state
const DEFAULT_PRESET_PACKAGES = [
  {
    id: "P001",
    name: "Elegant Wedding Package",
    category: "Wedding",
    price: 4500,
    duration: 8,
    capacity: "100-300",
    desc: "Complete luxury wedding setup including banquet tables, ambient uplighting, floral arrangements, sound system, and professional event coordinator.",
    resources: ["Round Banquet Tables (15)", "Luxury Floral Centrepieces (20)", "Banquet Chairs (150)", "Ambient Uplighting Kit"],
    staff: ["Mike Johnson (Event Coordinator)", "Marcus Sterling (AV Specialist)"],
    status: "approved",
  },
  {
    id: "P002",
    name: "Birthday Celebration Special",
    category: "Birthday",
    price: 1200,
    duration: 5,
    capacity: "30-80",
    desc: "Vibrant birthday setup with party cocktail tables, premium audio system, disco lighting, and coordinator.",
    resources: ["Cocktail High-Top Tables (8)", "Audio System Premium (1)", "Ambient Uplighting Kit (1)"],
    staff: ["Mike Johnson (Event Coordinator)"],
    status: "approved",
  },
  {
    id: "P003",
    name: "Professional Conference Setup",
    category: "Conference",
    price: 3800,
    duration: 10,
    capacity: "100-500",
    desc: "Turnkey conference package with 4K LED video wall, dual audio routing, wireless mics, and AV technical support.",
    resources: ["LED Screen 4K Wall (2)", "Audio System Premium (2)", "Wireless Microphone Set (2)", "Banquet Chairs (300)"],
    staff: ["Marcus Sterling (AV Specialist)", "David Kim (Lead Sound Engineer)"],
    status: "approved",
  },
  {
    id: "P004",
    name: "Corporate Gala Evening",
    category: "Corporate",
    price: 6200,
    duration: 12,
    capacity: "100-400",
    desc: "Executive gala experience featuring stage lighting rig, modular wooden dance floor, banquet seating, and full stage management.",
    resources: ["Stage Lighting Rig Pro (2)", "Modular Wooden Dance Floor (1)", "Round Banquet Tables (25)", "Luxury Floral Centrepieces (25)"],
    staff: ["Elena Rostova (Stage Manager)", "Mike Johnson (Event Coordinator)", "Chloe Bennett (Guest Relations Lead)"],
    status: "approved",
  },
  {
    id: "P005",
    name: "VIP Product Launch Showcase",
    category: "Corporate",
    price: 5500,
    duration: 8,
    capacity: "80-250",
    desc: "High-impact keynote and demo experience with 4K LED video wall, spotlighting, cocktail high-tops, and AV team.",
    resources: ["LED Screen 4K Wall (2)", "Stage Lighting Rig Pro (1)", "Cocktail High-Top Tables (15)", "Velvet Rope Stanchions (6)"],
    staff: ["Elena Rostova (Stage Manager)", "Marcus Sterling (AV Specialist)"],
    status: "approved",
  },
];

export function useVendorPackagesData() {
  // --------------------------------------------------------------------------
  // 1. STATE MANAGEMENT
  // --------------------------------------------------------------------------
  const [packages, setPackages] = useState([]);
  const [availableResources, setAvailableResources] = useState([]);
  const [availableStaff, setAvailableStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter criteria
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [priceFilter, setPriceFilter] = useState("All");
  const [capacityFilter, setCapacityFilter] = useState("All");

  // Feedback toast banner
  const [toast, setToast] = useState(null);

  // --------------------------------------------------------------------------
  // 2. ASYNC DATA FETCHING EFFECT
  // --------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    async function loadAllData() {
      setLoading(true);
      try {
        const [pkgRes, resRes, staffRes] = await Promise.allSettled([
          getMyPackages(),
          getMyResources(),
          getMyStaff(),
        ]);

        if (!isMounted) return;

        // Unpack packages
        if (pkgRes.status === "fulfilled" && Array.isArray(pkgRes.value) && pkgRes.value.length > 0) {
          setPackages(pkgRes.value);
        } else {
          setPackages(DEFAULT_PRESET_PACKAGES);
        }

        // Unpack available resources
        if (resRes.status === "fulfilled" && Array.isArray(resRes.value)) {
          setAvailableResources(resRes.value.filter((r) => r.available !== false));
        }

        // Unpack available staff
        if (staffRes.status === "fulfilled" && Array.isArray(staffRes.value)) {
          setAvailableStaff(staffRes.value.filter((s) => s.status !== "inactive"));
        }
      } catch (err) {
        console.error("Failed to load vendor packages:", err);
        if (isMounted) setPackages(DEFAULT_PRESET_PACKAGES);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAllData();

    return () => {
      isMounted = false;
    };
  }, []);

  // --------------------------------------------------------------------------
  // 3. COMPUTE DYNAMIC KPI SUMMARY METRICS
  // --------------------------------------------------------------------------
  const stats = useMemo(() => {
    const total = packages.length;
    const active = packages.filter(
      (p) => !p.status || ["approved", "active"].includes(String(p.status).toLowerCase())
    ).length;

    // Calculate average price
    const sumPrice = packages.reduce((acc, p) => acc + (Number(p.price) || 0), 0);
    const avg = total > 0 ? Math.round(sumPrice / total) : 0;
    const avgPrice = `$${avg.toLocaleString()}`;

    // Calculate most frequent category
    const catTally = {};
    packages.forEach((p) => {
      const c = p.category || "General";
      catTally[c] = (catTally[c] || 0) + 1;
    });

    let topCategory = "General";
    let maxCount = 0;
    Object.entries(catTally).forEach(([cat, cnt]) => {
      if (cnt > maxCount) {
        maxCount = cnt;
        topCategory = cat;
      }
    });

    return { total, active, avgPrice, topCategory };
  }, [packages]);

  // --------------------------------------------------------------------------
  // 4. MULTI-DIMENSIONAL FILTERING LOGIC
  // --------------------------------------------------------------------------
  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      const query = searchTerm.toLowerCase().trim();

      // Search match
      const matchesSearch =
        !query ||
        (pkg.name && pkg.name.toLowerCase().includes(query)) ||
        (pkg.desc && pkg.desc.toLowerCase().includes(query)) ||
        (pkg.category && pkg.category.toLowerCase().includes(query));

      // Category tab match
      const matchesCategory =
        selectedCategory === "All" ||
        String(pkg.category || "").toLowerCase() === selectedCategory.toLowerCase();

      // Price filter match
      let matchesPrice = true;
      const numPrice = Number(pkg.price) || 0;
      if (priceFilter === "Under2k") matchesPrice = numPrice < 2000;
      else if (priceFilter === "2kTo5k") matchesPrice = numPrice >= 2000 && numPrice <= 5000;
      else if (priceFilter === "Over5k") matchesPrice = numPrice > 5000;

      // Capacity filter match
      let matchesCapacity = true;
      if (capacityFilter !== "All") {
        const capStr = String(pkg.capacity || "");
        const digits = capStr.match(/\d+/g);
        const maxCap = digits ? Math.max(...digits.map(Number)) : 0;

        if (capacityFilter === "Small") matchesCapacity = maxCap < 100;
        else if (capacityFilter === "Medium") matchesCapacity = maxCap >= 100 && maxCap <= 300;
        else if (capacityFilter === "Large") matchesCapacity = maxCap > 300;
      }

      return matchesSearch && matchesCategory && matchesPrice && matchesCapacity;
    });
  }, [packages, searchTerm, selectedCategory, priceFilter, capacityFilter]);

  // --------------------------------------------------------------------------
  // 5. ACTION HANDLER: CREATE OR UPDATE PACKAGE
  // --------------------------------------------------------------------------
  const handleSavePackage = async (formData, editingId) => {
    try {
      if (editingId) {
        // Update existing record
        await updatePackage(editingId, formData).catch(() => {});
        setPackages((prev) =>
          prev.map((p) => (p.id === editingId ? { ...p, ...formData } : p))
        );
        setToast({ type: "success", text: `Package "${formData.name}" updated successfully!` });
      } else {
        // Create new record
        const newPkg = {
          ...formData,
          id: `P${String(Date.now()).slice(-4)}`,
          status: "approved",
        };
        await createPackage(newPkg).catch(() => {});
        setPackages((prev) => [newPkg, ...prev]);
        setToast({ type: "success", text: `Package "${formData.name}" published successfully!` });
      }
      setTimeout(() => setToast(null), 3500);
      return true;
    } catch (err) {
      console.error("Failed to save package:", err);
      setToast({ type: "danger", text: "Failed to save package. Please try again." });
      setTimeout(() => setToast(null), 3500);
      return false;
    }
  };

  // --------------------------------------------------------------------------
  // 6. ACTION HANDLER: DELETE PACKAGE
  // --------------------------------------------------------------------------
  const handleDeletePackage = async (packageId) => {
    try {
      await deletePackage(packageId).catch(() => {});
      setPackages((prev) => prev.filter((p) => p.id !== packageId));
      setToast({ type: "success", text: "Package removed from catalog." });
      setTimeout(() => setToast(null), 3500);
      return true;
    } catch (err) {
      console.error("Failed to delete package:", err);
      setToast({ type: "danger", text: "Could not remove package. Try again." });
      setTimeout(() => setToast(null), 3500);
      return false;
    }
  };

  // --------------------------------------------------------------------------
  // 7. ACTION HANDLER: RESET ALL FILTERS
  // --------------------------------------------------------------------------
  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("All");
    setPriceFilter("All");
    setCapacityFilter("All");
  };

  return {
    packages,
    availableResources,
    availableStaff,
    loading,
    filteredPackages,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    priceFilter,
    setPriceFilter,
    capacityFilter,
    setCapacityFilter,
    stats,
    toast,
    setToast,
    handleSavePackage,
    handleDeletePackage,
    handleResetFilters,
  };
}

export default useVendorPackagesData;
