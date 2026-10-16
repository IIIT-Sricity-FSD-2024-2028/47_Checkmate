/**
 * ============================================================================
 * MODULAR CLIENT DASHBOARD (Dashboard.jsx)
 * ============================================================================
 * Role: Client
 * Purpose:
 *   High-level parent page for the Client Dashboard (port of client-dashboard.html):
 *     1. Connects to the data hook `useClientDashboardData` for live state.
 *     2. Assembles focused, reusable modular components:
 *         - <ClientTopbar>: Title bar with the notifications bell.
 *         - <WelcomeCard>: Personalised greeting card (shared with vendor).
 *         - <ClientStatsGrid>: 4 KPI metric cards.
 *         - <ClientNextEventSection>: Next event progress bar + 5-step timeline.
 *         - <ClientQuickActionsSection>: Shortcut buttons to other client pages.
 *         - <ClientRecentActivitySection>: Latest event activity feed.
 * ============================================================================
 */

import React from "react";
import { Link, useNavigate } from "react-router-dom";

// Stylesheets
import "../../styles/dashboard.css";
import "./client.css";

// Shared & Global UI Components
import WelcomeCard from "../../components/WelcomeCard";
import ClientTopbar from "../../components/client/ClientTopbar";

// Custom Dashboard Data Hook
import useClientDashboardData from "../../components/client/useClientDashboardData";

// Modular Client Dashboard Subcomponents
import ClientStatsGrid from "../../components/client/ClientStatsGrid";
import ClientNextEventSection from "../../components/client/ClientNextEventSection";
import ClientQuickActionsSection from "../../components/client/ClientQuickActionsSection";
import ClientRecentActivitySection from "../../components/client/ClientRecentActivitySection";

import { getCurrentUser } from "../../utils/clientHelpers";

function ClientDashboard() {
  const navigate = useNavigate();
  const firstName = getCurrentUser().name.split(" ")[0];

  // All fetching, polling and calculations live in the hook
  const { loading, error, stats, nextEvent, progress, steps, activities } = useClientDashboardData();

  return (
    <div className="dashboard-page">
      {/* ── Top Header Bar with notifications ── */}
      <ClientTopbar title="Client Dashboard" />

      <div className="content">
        {/* ── Component 1: Welcome Greeting Card ── */}
        <WelcomeCard
          name={firstName}
          description="Here's an overview of your upcoming events and insights for today."
        />

        {/* Error banner (backend down / session expired) */}
        {error && (
          <div className="cl-client-error">
            {error} <Link to="/signin">Sign in</Link>
          </div>
        )}

        {/* ── Component 2: 4 KPI Metric Cards ── */}
        <ClientStatsGrid stats={stats} loading={loading} />

        {/* ── Two-Column Bottom Grid Layout ── */}
        <div className="bottom-grid">
          {/* Left Column: Next event + timeline */}
          <div className="left-col">
            <ClientNextEventSection event={nextEvent} progress={progress} steps={steps} loading={loading} />
          </div>

          {/* Right Column: Quick actions + activity feed */}
          <div className="right-col">
            <ClientQuickActionsSection onNavigate={(path) => navigate(path)} />
            <ClientRecentActivitySection activities={activities} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientDashboard;
