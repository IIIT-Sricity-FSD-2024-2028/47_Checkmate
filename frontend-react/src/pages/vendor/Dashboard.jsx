/**
 * ====================================================================================================
 * VENDOR DASHBOARD (VendorDashboard.jsx)
 * ====================================================================================================
 * Role: Event Coordinator / Vendor
 * Replaces Legacy: front-end/pages/vendor/dashboard.html & scripts/vendor_js/dashboard.js
 *
 * PURPOSE & ARCHITECTURE:
 * ----------------------------------------------------------------------------------------------------
 * 1. Single-pane-of-glass overview for event coordinators and vendors.
 * 2. Fetches real-time data from the NestJS backend API services:
 *    - Events (getMyEvents)
 *    - Resources / Inventory (getMyResources)
 *    - Staff roster (getMyStaff)
 *    - Staff assignments & RSVP status (getStaffAssignments)
 *    - Issues / tickets (getMyIssues)
 *    - Vendor financial payouts (getVendorPayouts)
 * 3. Dynamically computes:
 *    - KPI Statistics (Pending Requests, Active Events, Total Events, Completed, Net Earnings)
 *    - Chronologically sorted upcoming events (top 5)
 *    - Chronological recent activity stream (staff responses, event transitions, tickets)
 *    - Operational Critical Alerts (pending review alerts, low stock warnings, workload thresholds)
 * 4. Provides one-click Quick Actions to navigate directly into vendor sub-modules.
 * ====================================================================================================
 */

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  CheckCircle2,
  DollarSign,
  Package,
  TrendingUp,
} from "lucide-react";

// --- Stylesheets ---
import "../../styles/dashboard.css";

// --- Shared & Reusable UI Components ---
import StatisticCard from "../../components/StatisticCard";
import TopHeaderBar from "../../components/TopHeaderBar";
import WelcomeCard from "../../components/WelcomeCard";
import AlertItem from "../../components/vendor/AlertItem";
import QuickActionButton from "../../components/vendor/QuickActionButton";
import RecentActivityItem from "../../components/vendor/RecentActivityItem";
import UpcomingEventsCard from "../../components/vendor/UpcomingEventsCard";

// --- Authentication Session Storage ---
import { getAuthSession } from "../../services/auth/authStorage";

// --- Backend API Service Functions ---
import {
  getMyEvents,
  getMyIssues,
  getMyResources,
  getMyStaff,
  getStaffAssignments,
  getVendorPayouts,
  getVendors,
} from "../../services";

/**
 * ----------------------------------------------------------------------------------------------------
 * HELPER: formatRelativeTime
 * ----------------------------------------------------------------------------------------------------
 * Converts an ISO date string into human-friendly relative time (e.g., "Just now", "15 mins ago",
 * "2 hours ago", "Yesterday", or "Oct 12"). Used by the Recent Activity stream and Alerts.
 *
 * @param {string|Date} dateString - The raw timestamp to format
 * @returns {string} Human-readable relative time string
 */
function formatRelativeTime(dateString) {
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

  // Fallback to month & day for older dates
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * ----------------------------------------------------------------------------------------------------
 * HELPER: formatEventDate
 * ----------------------------------------------------------------------------------------------------
 * Formats event dates into a clean presentation string (e.g., "Mar 28, 2026").
 *
 * @param {string|Date} dateString - The date string from the event record
 * @returns {string} Formatted date string or "Date TBD"
 */
function formatEventDate(dateString) {
  if (!dateString) return "Date TBD";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * ----------------------------------------------------------------------------------------------------
 * MAIN COMPONENT: VendorDashboard
 * ----------------------------------------------------------------------------------------------------
 */
function VendorDashboard() {
  // Navigation hook to push route transitions programmatically
  const navigate = useNavigate();

  // Read current user session from localStorage / cookies
  const authSession = getAuthSession();
  const userName = authSession?.user?.name || "Vendor";

  // --------------------------------------------------------------------------------------------------
  // STATE MANAGEMENT
  // --------------------------------------------------------------------------------------------------
  // loading: Tracks initial async data retrieval
  const [loading, setLoading] = useState(true);

  // stats: Summary KPI metrics displayed in the top 5 StatisticCards
  const [stats, setStats] = useState({
    pendingRequests: 0,
    activeEvents: 0,
    totalEvents: 0,
    completedEvents: 0,
    netEarnings: "$0.00",
  });

  // upcomingEvents: Top future events sorted chronologically ascending
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  // recentActivities: Real-time event log generated from recent operations
  const [recentActivities, setRecentActivities] = useState([]);

  // alerts: Warning items flagged by operational checks (stock, requests, staff load)
  const [alerts, setAlerts] = useState([]);

  // --------------------------------------------------------------------------------------------------
  // DATA FETCHING & SYNCHRONIZATION EFFECT
  // --------------------------------------------------------------------------------------------------
  useEffect(() => {
    // isMounted flag prevents setting state if user navigates away before requests resolve
    let isMounted = true;

    async function loadDashboardData() {
      setLoading(true);
      try {
        const session = getAuthSession();
        const user = session?.user || {};
        let vendorId = user.vendorId || "";

        // If vendorId is not directly embedded in the auth session, resolve it from the vendors registry
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
            // Non-blocking fallback: proceed with null vendorId
          }
        }

        // Concurrently query all relevant endpoints using Promise.allSettled.
        // This ensures a single endpoint failure does NOT crash the entire dashboard.
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

        // Safely extract payloads, defaulting to empty arrays/objects if rejected
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

        // Guard against updating unmounted component
        if (!isMounted) return;

        // ============================================================================================
        // 1. CALCULATE DYNAMIC KPI METRICS
        // ============================================================================================
        // Count events awaiting vendor confirmation or review
        const pendingCount = events.filter(
          (e) => String(e.status).toLowerCase() === "pending"
        ).length;

        // Count ongoing or confirmed active events
        const activeCount = events.filter((e) =>
          ["confirmed", "live", "in progress", "approved"].includes(
            String(e.status).toLowerCase()
          )
        ).length;

        // Count successfully completed historical events
        const completedCount = events.filter((e) =>
          ["completed", "done"].includes(String(e.status).toLowerCase())
        ).length;

        const totalCount = events.length;

        // Format net payout earnings (deducting 10% platform fee, displaying 90% payout)
        let formattedEarnings = "$0.00";
        if (payouts && typeof payouts.netPayoutAmount === "number") {
          formattedEarnings = `$${payouts.netPayoutAmount.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`;
        }

        // Commit updated stats to component state
        setStats({
          pendingRequests: pendingCount,
          activeEvents: activeCount,
          totalEvents: totalCount,
          completedEvents: completedCount,
          netEarnings: formattedEarnings,
        });

        // ============================================================================================
        // 2. UPCOMING EVENTS (Sort chronologically ascending, take top 5)
        // ============================================================================================
        const sortedEvents = [...events]
          .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
          .slice(0, 5);
        setUpcomingEvents(sortedEvents);

        // ============================================================================================
        // 3. RECENT ACTIVITY TIMELINE (Derived dynamically from backend records)
        // ============================================================================================
        const myStaffIds = new Set(staff.map((s) => s.id));
        const activities = [];

        // (A) Staff Assignment responses & updates
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

        // (B) Event lifecycle transitions
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

        // (C) Issue tickets logged
        issues.slice(-2).forEach((iss) => {
          activities.push({
            activity: "Issue ticket logged",
            description: iss.title || iss.description || "Support ticket",
            when: formatRelativeTime(iss.createdAt),
          });
        });

        // Slice to the 4 most relevant activities
        setRecentActivities(activities.slice(0, 4));

        // ============================================================================================
        // 4. CRITICAL OPERATIONAL ALERTS (Proactive health checks)
        // ============================================================================================
        const alertList = [];

        // Alert A: Event requests waiting for coordinator response
        if (pendingCount > 0) {
          alertList.push({
            what_alert: `${pendingCount} event request${pendingCount > 1 ? "s" : ""} awaiting review`,
            when: "Action required",
            type: "blue",
          });
        }

        // Alert B: Resources that are unavailable or low on inventory
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

        // Alert C: Staff members with workload at or above 80% capacity
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

    // Execute data loading
    loadDashboardData();

    // Cleanup function when component unmounts
    return () => {
      isMounted = false;
    };
  }, []);

  // --------------------------------------------------------------------------------------------------
  // RENDER JSX INTERFACE
  // --------------------------------------------------------------------------------------------------
  return (
    <div className="vendor-dashboard">
      {/* Top Header Bar with dynamic notification badge count */}
      <TopHeaderBar title="Vendor Dashboard" badge={alerts.length} />

      <div className="content">
        {/* Welcome Banner Card showing personalized user name */}
        <WelcomeCard
          name={userName}
          description="Here's what's happening with your events today."
        />

        {/* ------------------------------------------------------------------------------------------
            TOP ROW: 5 Key Performance Indicator (KPI) Metric Cards
            ------------------------------------------------------------------------------------------ */}
        <div className="stats-grid">
          {/* Card 1: Pending Event Requests */}
          <StatisticCard
            value={loading ? "..." : String(stats.pendingRequests)}
            title="Pending Requests"
            status="↗ Active"
            icon={Calendar}
            color="blue"
          />

          {/* Card 2: Active / Live Events */}
          <StatisticCard
            value={loading ? "..." : String(stats.activeEvents)}
            title="Active Events"
            status="↗ Live"
            icon={TrendingUp}
            color="green"
          />

          {/* Card 3: Total Cumulative Events */}
          <StatisticCard
            value={loading ? "..." : String(stats.totalEvents)}
            title="Total Events"
            status="All"
            icon={Package}
            color="purple"
          />

          {/* Card 4: Completed Historical Events */}
          <StatisticCard
            value={loading ? "..." : String(stats.completedEvents)}
            title="Completed Events"
            status="Done"
            icon={CheckCircle2}
            color="orange"
          />

          {/* Card 5: Net Payout Earnings (After 10% Platform Commission) */}
          <StatisticCard
            value={loading ? "..." : stats.netEarnings}
            title="Net Earnings"
            status="90% Net Payout"
            icon={DollarSign}
            color="green"
          />
        </div>

        {/* ------------------------------------------------------------------------------------------
            BOTTOM TWO-COLUMN GRID: Left (Events & Activity) | Right (Alerts & Quick Actions)
            ------------------------------------------------------------------------------------------ */}
        <div className="bottom-grid">
          {/* LEFT COLUMN */}
          <div className="left-col">
            {/* Upcoming Events Card */}
            <div className="card event-card">
              <div className="card__header">
                <h3>Upcoming Events</h3>
                <Link to="/vendor/events" className="view-all">
                  View All →
                </Link>
              </div>
              <div className="event-list">
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.map((ev) => (
                    <UpcomingEventsCard
                      key={ev.id}
                      event_name={ev.name}
                      status={ev.status || "pending"}
                      timeAndVenue={`${formatEventDate(ev.date)}${
                        ev.venue ? " • " + ev.venue : ""
                      }`}
                    />
                  ))
                ) : (
                  <div className="card-empty-placeholder">
                    {loading ? "Loading events..." : "No upcoming events found."}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity Timeline Card */}
            <div className="card Recent-Activity-card">
              <div className="card__header">
                <h3>Recent Activity</h3>
              </div>
              <div className="activity-list">
                {recentActivities.length > 0 ? (
                  recentActivities.map((act, index) => (
                    <RecentActivityItem
                      key={index}
                      activity={act.activity}
                      description={act.description}
                      when={act.when}
                    />
                  ))
                ) : (
                  <div className="card-empty-placeholder">
                    {loading
                      ? "Loading recent activity..."
                      : "No recent activity recorded."}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="right-col">
            {/* Critical Operational Alerts Card */}
            <div className="card Alertitem-card">
              <div className="card__header alerts-header">
                <span className="alert-icon">⚠</span>
                <h3>Critical Alerts</h3>
              </div>
              <div className="alert-list">
                {alerts.length > 0 ? (
                  alerts.map((alert, index) => (
                    <AlertItem
                      key={index}
                      what_alert={alert.what_alert}
                      when={alert.when}
                      type={alert.type}
                    />
                  ))
                ) : (
                  <div className="card-empty-placeholder">
                    {loading
                      ? "Checking operations..."
                      : "All operations normal — no critical alerts."}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Card (Navigates directly to vendor sub-pages) */}
            <div className="card Quckaction-card">
              <div className="card__header">
                <h3>Quick Actions</h3>
              </div>
              <div className="quick-actions">
                {/* 1. Review Event Requests */}
                <QuickActionButton
                  button="1"
                  button_type="Review Event"
                  onClick={() => navigate("/vendor/events")}
                />
                {/* 2. Manage Resources & Inventory */}
                <QuickActionButton
                  button="2"
                  button_type="Manage Resources"
                  onClick={() => navigate("/vendor/resources")}
                />
                {/* 3. Assign Staff Members */}
                <QuickActionButton
                  button="3"
                  button_type="Assign Staff"
                  onClick={() => navigate("/vendor/staff")}
                />
                {/* 4. Configure Preset Packages */}
                <QuickActionButton
                  button="4"
                  button_type="Add Package"
                  onClick={() => navigate("/vendor/packages")}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorDashboard;
