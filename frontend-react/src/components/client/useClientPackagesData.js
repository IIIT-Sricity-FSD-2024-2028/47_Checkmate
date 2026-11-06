/**
 * ============================================================================
 * CLIENT PACKAGES DATA HOOK (useClientPackagesData.js)
 * ============================================================================
 * Role: Custom Data Retrieval & Mutation Hook (Client Browse Packages page)
 * Location: src/components/client/useClientPackagesData.js
 *
 * Purpose:
 *   1. Loads approved marketplace packages, the resource catalogue and staff list.
 *   2. Filters packages by category tab and search text (name / description).
 *   3. Quick Create: turns a package into a pending event request in one step,
 *      matching the package's text lists to real resource / staff records.
 *
 * Connected Backend Endpoints:
 *   - GET  /api/packages  -> only approved packages (getMarketplacePackages)
 *   - GET  /api/resources -> to match package services to real resources
 *   - GET  /api/snapshot  -> staff list, to match package staff to real staff
 *   - POST /api/events    -> creates the event request
 *
 * Returns:
 *   @returns {Object} { packages, filteredPackages, loading, error,
 *                       category, setCategory, searchTerm, setSearchTerm, quickCreate }
 * ============================================================================
 */

import { useEffect, useMemo, useState } from "react";
import { getMarketplacePackages } from "../../services/packageService";
import { getResources } from "../../services/resourceService";
import { getSnapshot } from "../../services/analyticsService";
import { createEvent } from "../../services/eventService";
import { describeError, formatTime12, getCurrentUser } from "../../utils/clientHelpers";

/**
 * Matches the package's text lists ("Round Banquet Tables (15)") to real records.
 * FACULTY MAY ASK: Why do unmatched items get an "UNKNOWN_" id?
 * HOW TO CHANGE: That was deliberate in the original: the vendor's conflict checker
 * flags unknown ids, so the vendor sees the package needs something they don't stock.
 */
function matchPackageItems(pkg, resources, staff) {
  const requestedResources = (pkg.resources || []).map((name, i) => {
    const match = resources.find((r) => name.toLowerCase().includes(r.name.toLowerCase().split(" ")[0]));
    if (match) {
      return { resourceId: match.id, resourceName: match.name, category: match.category, quantity: 1, pricePerDay: match.price || 0 };
    }
    return { resourceId: `UNKNOWN_RES_${Date.now()}_${i}`, resourceName: name, category: "Uncategorized", quantity: 1, pricePerDay: 0 };
  });

  const requestedStaff = (pkg.staff || []).map((label, i) => {
    const text = label.toLowerCase();
    const match = staff.find((s) =>
      text.includes((s.role || "").toLowerCase().split(" ")[0]) || text.includes(s.name.toLowerCase().split(" ")[0])
    );
    if (match) return { staffId: match.id, staffName: match.name, role: match.role };
    return { staffId: `UNKNOWN_STF_${Date.now()}_${i}`, staffName: label, role: label };
  });

  const estimatedCost = requestedResources.reduce((sum, r) => sum + r.pricePerDay * r.quantity, 0);
  return { requestedResources, requestedStaff, estimatedCost };
}

export function useClientPackagesData() {
  const [packages, setPackages] = useState([]);
  const [resources, setResources] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [category, setCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // --------------------------------------------------------------------------
  // 1. LOAD DATA
  // --------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      const [pkgs, res, snap] = await Promise.allSettled([getMarketplacePackages(), getResources(), getSnapshot()]);
      if (!isMounted) return;
      if (pkgs.status === "fulfilled") setPackages(pkgs.value || []);
      // allSettled gives the error in .reason instead of throwing
      else setError(describeError(pkgs.reason, "packages"));
      if (res.status === "fulfilled") setResources(res.value || []);
      if (snap.status === "fulfilled") setStaff(snap.value?.staff || []);
      setLoading(false);
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // --------------------------------------------------------------------------
  // 2. CATEGORY TAB + SEARCH
  // --------------------------------------------------------------------------
  const filteredPackages = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return packages.filter((p) => {
      const categoryOk = category === "All" || (p.category || "").toLowerCase() === category.toLowerCase();
      const textOk = (p.name || "").toLowerCase().includes(query) || (p.desc || "").toLowerCase().includes(query);
      return categoryOk && textOk;
    });
  }, [packages, category, searchTerm]);

  // --------------------------------------------------------------------------
  // 3. QUICK CREATE  (returns true when the backend saved the event)
  // --------------------------------------------------------------------------
  const quickCreate = async (pkg, form) => {
    const user = getCurrentUser();
    const { requestedResources, requestedStaff, estimatedCost } = matchPackageItems(pkg, resources, staff);
    try {
      await createEvent({
        name: form.name.trim(),
        type: pkg.category || "Package",
        date: form.date,
        time: formatTime12(form.time),
        venue: form.venue.trim() || "TBD",
        people: Number(form.people) || 0,
        status: "pending",
        notes: `Quick created from package: ${pkg.name}`,
        createdBy: "client",
        client: user.name,
        clientId: user.id,
        clientEmail: user.email,
        vendor: pkg.vendorName || pkg.vendor || "Elite Events Co.",
        vendorId: pkg.vendorId || "",
        presetPackageId: pkg.id,
        packageId: pkg.id,
        submittedAt: new Date().toISOString(),
        requestedResources: requestedResources.length > 0 ? requestedResources : undefined,
        requestedStaff: requestedStaff.length > 0 ? requestedStaff : undefined,
        estimatedCost: estimatedCost > 0 ? estimatedCost : undefined,
      });
      return true;
    } catch {
      return false;
    }
  };

  return { packages, filteredPackages, loading, error, category, setCategory, searchTerm, setSearchTerm, quickCreate };
}

export default useClientPackagesData;
