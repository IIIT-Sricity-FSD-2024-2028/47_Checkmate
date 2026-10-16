/**
 * ============================================================================
 * VENDOR DASHBOARD DATA HOOK (useVendorDashboardData.js)
 * ============================================================================
 * Role: Custom Data Retrieval & Transformation Hook (Vendor Portal)
 * Location: src/components/vendor/useVendorDashboardData.js
 *
 * Purpose:
 *   Handles all asynchronous data fetching and real-time computation for the
 *   Vendor Dashboard:
 *     1. Concurrently queries events, inventory, staff, assignments, tickets, and payouts.
 *     2. Computes summary KPI metrics (pending, active, total, completed, net payout).
 *     3. Sorts top upcoming events chronologically ascending.
 *     4. Derives a chronological recent activity stream from backend logs.
 *     5. Proactively flags critical operational alerts (shortages, workloads, pending requests).
 *
 * Returns:
 *   @returns {Object} { loading, stats, upcomingEvents, recentActivities, alerts }
 * ============================================================================
 */

import { useState, useEffect } from "react";
import { getAuthSession } from "../../services/auth/authStorage";
import {
  getMyEvents,
  getMyResources,
  getMyStaff,
  getStaffAssignments,
  getMyIssues,
  getVendorPayouts,
  getVendors,
} from "../../services";

/**
 * ----------------------------------------------------------------------------
 * HELPER: formatRelativeTime
 * ----------------------------------------------------------------------------
 * Converts a raw timestamp into a human-readable relative time string
 * (e.g. "Just now", "15 mins ago", "2 hours ago", "Yesterday").
 *
 * @param {string|Date} dateString - The ISO timestamp to format
 * @returns {string} Relative time string
 */
export function formatRelativeTime(dateString) {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return String(dateString);

  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 5) return "Just now";
  if (diffMins < 60) return `${diffMins} mins ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * ----------------------------------------------------------------------------
 * HELPER: formatEventDate
 * ----------------------------------------------------------------------------
 * Formats event dates into clean presentation strings (e.g. "Mar 28, 2026").
 *
 * @param {string|Date} dateString - The raw event date string
 * @returns {string} Formatted readable date
 */
export function formatEventDate(dateString) {
  if (!dateString) return "Date TBD";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function useVendorDashboardData() {
  // --------------------------------------------------------------------------
  // STATE DEFINITIONS
  // --------------------------------------------------------------------------
  // Loading flag while fetching and computing data
  const [loading, setLoading] = useState(true);

  // Summary KPI numbers
  const [stats, setStats] = useState({
    pendingRequests: 0,
    activeEvents: 0,
    totalEvents: 0,
    completedEvents: 0,
    netEarnings: "$0.00",
  });

  // Top future events
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  // Activity stream items
  const [recentActivities, setRecentActivities] = useState([]);

  // Proactive operational warnings
  const [alerts, setAlerts] = useState([]);

  // --------------------------------------------------------------------------
  // ASYNC DATA FETCH & COMPUTATION EFFECT
  // --------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      setLoading(true);
      try {
        const session = getAuthSession();
        const user = session?.user || {};
        let vendorId = user.vendorId || "";

        // Resolve vendorId if not directly stored on session
        if (!vendorId && user.id) {
          try {
            const allVendors = await getVendors();
            const matched = allVendors.find(
              (v) =>
                v.userId === user.id ||
                v.name?.toLowerCase() === user.name?.toLowerCase() ||
                v.businessName?.toLowerCase() === user.name?.toLowerCase()
            );
            if (matched) {
              vendorId = matched.id;
            }
          } catch {
            // Non-blocking fallback
          }
        }

        // Concurrently query all relevant endpoints using Promise.allSettled
        const [
          eventsResult,
          resourcesResult,
          staffResult,
          assignmentsResult,
          issuesResult,
          payoutsResult,
        ] = await Promise.allSettled([
          getMyEvents(),
          getMyResources(),
          getMyStaff(),
          getStaffAssignments(),
          getMyIssues(),
          vendorId ? getVendorPayouts(vendorId) : Promise.resolve(null),
        ]);

        // Safely unpack payloads with default fallbacks
        const events =
          eventsResult.status === "fulfilled" && Array.isArray(eventsResult.value)
            ? eventsResult.value
            : [];
        const resources =
          resourcesResult.status === "fulfilled" && Array.isArray(resourcesResult.value)
            ? resourcesResult.value
            : [];
        const staff =
          staffResult.status === "fulfilled" && Array.isArray(staffResult.value)
            ? staffResult.value
            : [];
        const assignments =
          assignmentsResult.status === "fulfilled" && Array.isArray(assignmentsResult.value)
            ? assignmentsResult.value
            : [];
        const issues =
          issuesResult.status === "fulfilled" && Array.isArray(issuesResult.value)
            ? issuesResult.value
            : [];
        const payouts =
          payoutsResult.status === "fulfilled" ? payoutsResult.value : null;

        if (!isMounted) return;

        // --------------------------------------------------------------------
        // 1. COMPUTE DYNAMIC KPI METRICS
        // --------------------------------------------------------------------
        const pendingCount = events.filter(
          (e) => String(e.status).toLowerCase() === "pending"
        ).length;

        const activeCount = events.filter((e) =>
          ["confirmed", "live", "in progress", "approved"].includes(
            String(e.status).toLowerCase()
          )
        ).length;

        const completedCount = events.filter((e) =>
          ["completed", "done"].includes(String(e.status).toLowerCase())
        ).length;

        const totalCount = events.length;

        // Format net earnings string
        let formattedEarnings = "$0.00";
        if (payouts && typeof payouts.netPayoutAmount === "number") {
          formattedEarnings = `$${payouts.netPayoutAmount.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`;
        }

        setStats({
          pendingRequests: pendingCount,
          activeEvents: activeCount,
          totalEvents: totalCount,
          completedEvents: completedCount,
          netEarnings: formattedEarnings,
        });

        // --------------------------------------------------------------------
        // 2. UPCOMING EVENTS (Top 5 sorted by date)
        // --------------------------------------------------------------------
        const sortedEvents = [...events]
          .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
          .slice(0, 5);
        setUpcomingEvents(sortedEvents);

        // --------------------------------------------------------------------
        // 3. RECENT ACTIVITY STREAM (Derived from assignments, events, tickets)
        // --------------------------------------------------------------------
        const myStaffIds = new Set(staff.map((s) => s.id));
        const activities = [];

        // Assignments stream
        [...assignments].reverse().forEach((a) => {
          if (myStaffIds.has(a.staffId)) {
            if (a.status === "accepted") {
              activities.push({
                activity: "Staff accepted assignment",
                description: `${a.staffName || "Staff"} -> ${a.eventName || "Event"}`,
                when: formatRelativeTime(a.respondedAt),
              });
            } else if (a.status === "rejected") {
              activities.push({
                activity: "Staff declined assignment",
                description: `${a.staffName || "Staff"} -> ${a.eventName || "Event"}`,
                when: formatRelativeTime(a.respondedAt),
              });
            } else if (a.status === "assigned" || a.status === "pending") {
              activities.push({
                activity: "Staff assigned to event",
                description: `${a.staffName || "Staff"} -> ${a.eventName || "Event"}`,
                when: formatRelativeTime(a.assignedAt),
              });
            }
          }
        });

        // Events stream
        events.forEach((ev) => {
          const statusLower = String(ev.status).toLowerCase();
          if (statusLower === "live") {
            activities.push({
              activity: "Event is currently live",
              description: ev.name,
              when: "Today",
            });
          } else if (statusLower === "confirmed") {
            activities.push({
              activity: "Event confirmed",
              description: ev.name,
              when: formatEventDate(ev.date),
            });
          } else if (statusLower === "pending") {
            activities.push({
              activity: "New event request received",
              description: ev.name,
              when: formatRelativeTime(ev.submittedAt || ev.createdAt),
            });
          }
        });

        // Issue tickets stream
        issues.slice(-2).forEach((iss) => {
          activities.push({
            activity: "Issue ticket logged",
            description: iss.title || iss.description || "Support ticket",
            when: formatRelativeTime(iss.createdAt),
          });
        });

        setRecentActivities(activities.slice(0, 4));

        // --------------------------------------------------------------------
        // 4. CRITICAL OPERATIONAL ALERTS
        // --------------------------------------------------------------------
        const alertList = [];

        // Alert A: Pending event requests
        if (pendingCount > 0) {
          alertList.push({
            what_alert: `${pendingCount} event request${pendingCount > 1 ? "s" : ""} awaiting review`,
            when: "Action required",
            type: "blue",
          });
        }

        // Alert B: Low or unavailable inventory stock
        const unavailableRes = resources.filter(
          (r) => !r.available || (r.avail !== undefined && Number(r.avail) <= 0)
        );
        if (unavailableRes.length > 0) {
          alertList.push({
            what_alert: `Low stock: ${unavailableRes
              .slice(0, 2)
              .map((r) => r.name)
              .join(", ")}`,
            when: "Inventory check",
            type: "yellow",
          });
        }

        // Alert C: Staff with workload >= 80%
        const overloadedStaff = staff.filter(
          (s) => Number(s.workload || 0) >= 80
        );
        if (overloadedStaff.length > 0) {
          alertList.push({
            what_alert: `Staff near capacity: ${overloadedStaff
              .slice(0, 2)
              .map((s) => s.name)
              .join(", ")}`,
            when: "Workload alert",
            type: "orange",
          });
        }

        setAlerts(alertList);
      } catch (err) {
        console.error("Failed to load vendor dashboard data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    loading,
    stats,
    upcomingEvents,
    recentActivities,
    alerts,
  };
}

export default useVendorDashboardData;
