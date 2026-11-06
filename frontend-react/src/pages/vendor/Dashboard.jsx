/**
 * ============================================================================
 * MODULAR VENDOR DASHBOARD (Dashboard.jsx)
 * ============================================================================
 * Role: Event Coordinator / Vendor
 * Purpose:
 *   High-level parent page for the Vendor Dashboard portal:
 *     1. Connects to the data hook `useVendorDashboardData` for real-time state.
 *     2. Assembles focused, reusable modular components:
 *         - <TopHeaderBar>: Top bar with alert notification badge.
 *         - <WelcomeCard>: Personalized greeting card.
 *         - <VendorStatsGrid>: 5 core KPI metric cards.
 *         - <VendorUpcomingEventsSection>: Upcoming events list card.
 *         - <VendorRecentActivitySection>: Real-time chronological activity stream.
 *         - <VendorCriticalAlertsSection>: Proactive operational warnings.
 *         - <VendorQuickActionsSection>: Direct navigation action triggers.
 * ============================================================================
 */

import React from "react";
import { useNavigate } from "react-router-dom";

// Central stylesheet
import "../../styles/dashboard.css";

// Shared & Global UI Components
import VendorTopBar from "../../components/vendor/VendorTopBar";
import WelcomeCard from "../../components/WelcomeCard";

// Authentication session storage
import { getAuthSession } from "../../services/auth/authStorage";

// Custom Dashboard Data Retrieval Hook
import useVendorDashboardData from "../../components/vendor/useVendorDashboardData";

// Modular Vendor Dashboard Subcomponents
import VendorStatsGrid from "../../components/vendor/VendorStatsGrid";
import VendorUpcomingEventsSection from "../../components/vendor/VendorUpcomingEventsSection";
import VendorRecentActivitySection from "../../components/vendor/VendorRecentActivitySection";
import VendorCriticalAlertsSection from "../../components/vendor/VendorCriticalAlertsSection";
import VendorQuickActionsSection from "../../components/vendor/VendorQuickActionsSection";
import VendorWidgetsSection from "../../components/vendor/VendorWidgetsSection";

function VendorDashboard() {
  // Navigation hook to navigate between vendor submodules
  const navigate = useNavigate();

  // Retrieve current user session to personalize the welcome greeting
  const authSession = getAuthSession();
  const userName = authSession?.user?.name || "Vendor";

  // Connect to custom data hook handling all async queries and data computation
  const {
    loading,
    stats,
    eventsData,
    upcomingEvents,
    recentActivities,
    alerts,
    widgetsData,
  } = useVendorDashboardData();

  return (
    <div className="vendor-dashboard">
      {/* ── Top Header Bar with Live Working Notifications ── */}
      <VendorTopBar
        title="Vendor Dashboard"
      />

      <div className="content">
        {/* ── Component 1: Welcome Greeting Card ── */}
        <WelcomeCard
          name={userName}
          description="Here's what's happening with your events today."
        />

        {/* ── Component 2: 5 Key Performance Indicator (KPI) Metric Cards ── */}
        <VendorStatsGrid
          stats={stats}
          loading={loading}
        />

        {/* ── Two-Column Bottom Grid Layout ── */}
        <div className="bottom-grid">
          {/* Left Column: Events & Activity Stream */}
          <div className="left-col">
            {/* Component 3: Upcoming Events Section Card (With Tabs & Staffing Progress) */}
            <VendorUpcomingEventsSection
              events={upcomingEvents}
              eventsData={eventsData}
              loading={loading}
            />

            {/* Component 4: Recent Activity Timeline Section Card */}
            <VendorRecentActivitySection
              activities={recentActivities}
              loading={loading}
            />
          </div>

          {/* Right Column: Alerts & Quick Action Navigation */}
          <div className="right-col">
            {/* Component 5: Critical Operational Alerts Card */}
            <VendorCriticalAlertsSection
              alerts={alerts}
              loading={loading}
            />

            {/* Component 6: One-Click Quick Action Buttons Card (With Badges & Staff Highlight) */}
            <VendorQuickActionsSection
              onNavigate={(path) => navigate(path)}
              pendingCount={stats.pendingRequests}
              availableStaff={stats.availableStaff}
              unassignedShiftsCount={widgetsData?.unassignedShiftsCount || 0}
            />
          </div>
        </div>

        {/* ── Component 7: Operational Widgets (Venue Calendar, Utilization, Staff & Earnings) ── */}
        <VendorWidgetsSection
          widgetsData={widgetsData}
          loading={loading}
        />
      </div>
    </div>
  );
}

export default VendorDashboard;
