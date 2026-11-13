/**
 * ============================================================================
 * VENDOR UPCOMING EVENTS SECTION COMPONENT (VendorUpcomingEventsSection.jsx)
 * ============================================================================
 * Role: Reusable Component (Vendor Portal)
 * Location: src/components/vendor/VendorUpcomingEventsSection.jsx
 *
 * Features:
 *   1. Displays truly upcoming events by default (excludes rejected & completed).
 *   2. Interactive tabs: Upcoming | Pending | Past with real counts.
 *   3. Sorted by date ascending with relative time ("in 4 days") beside absolute date.
 *   4. Color-coded status badges (Confirmed=green, Pending=amber, Live=red pulse, Rejected=red, Completed=gray).
 *   5. Staffing progress indicator (e.g. "3/5 staff assigned") & hover actions (View / Assign staff).
 *   6. Loading skeletons & friendly empty state fallbacks.
 * ============================================================================
 */

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";
import UpcomingEventsCard from "./UpcomingEventsCard";
import { formatEventDate } from "./useVendorDashboardData";

function VendorUpcomingEventsSection({ events = [], eventsData = null, loading = false }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("upcoming");

  // Derive categorized lists from eventsData or compute from events array
  const upcomingList = eventsData?.upcoming || events.filter((e) =>
    ["confirmed", "approved", "live"].includes(String(e.status || "").toLowerCase())
  );
  const pendingList = eventsData?.pending || events.filter((e) =>
    String(e.status || "").toLowerCase() === "pending"
  );
  const pastList = eventsData?.past || events.filter((e) =>
    ["completed", "rejected"].includes(String(e.status || "").toLowerCase())
  );

  let currentList = upcomingList;
  if (activeTab === "pending") currentList = pendingList;
  else if (activeTab === "past") currentList = pastList;

  return (
    <>
      <style>{`
        .events-tab-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary, #94a3b8);
          font-size: 13px;
          font-weight: 500;
          padding: 6px 12px;
          border-radius: 8px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.18s ease;
        }
        .events-tab-btn:hover {
          color: var(--text-primary, #f8fafc);
          background: rgba(255, 255, 255, 0.05);
        }
        .events-tab-btn.active {
          color: #fff;
          background: rgba(233, 30, 140, 0.2);
          border: 1px solid rgba(233, 30, 140, 0.4);
          font-weight: 600;
        }
        .events-tab-count {
          font-size: 11px;
          padding: 1px 6px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.08);
        }
        .events-tab-btn.active .events-tab-count {
          background: rgba(233, 30, 140, 0.4);
          color: #fff;
        }

        .badge-confirmed {
          background: rgba(34, 197, 94, 0.16);
          color: #86efac;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }
        .badge-pending {
          background: rgba(245, 158, 11, 0.16);
          color: #fde047;
          border: 1px solid rgba(245, 158, 11, 0.35);
        }
        .badge-live {
          background: rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          border: 1px solid rgba(239, 68, 68, 0.4);
        }
        .badge-rejected {
          background: rgba(239, 68, 68, 0.14);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
        .badge-completed {
          background: rgba(148, 163, 184, 0.14);
          color: #cbd5e1;
          border: 1px solid rgba(148, 163, 184, 0.3);
        }
      `}</style>

      <div className="card event-card">
        {/* ── Card Header: Title, Tabs & View All Navigation ── */}
        <div
          className="card__header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            borderBottom: "1px solid var(--border, rgba(255, 255, 255, 0.08))",
            paddingBottom: 14,
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>Upcoming Events</h3>

            {/* Filter Tabs */}
            <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(0, 0, 0, 0.25)", padding: 3, borderRadius: 10 }}>
              <button
                type="button"
                className={`events-tab-btn ${activeTab === "upcoming" ? "active" : ""}`}
                onClick={() => setActiveTab("upcoming")}
                aria-label={`View upcoming events (${upcomingList.length})`}
              >
                <span>Upcoming</span>
                <span className="events-tab-count">{upcomingList.length}</span>
              </button>

              <button
                type="button"
                className={`events-tab-btn ${activeTab === "pending" ? "active" : ""}`}
                onClick={() => setActiveTab("pending")}
                aria-label={`View pending events (${pendingList.length})`}
              >
                <span>Pending</span>
                <span className="events-tab-count">{pendingList.length}</span>
              </button>

              <button
                type="button"
                className={`events-tab-btn ${activeTab === "past" ? "active" : ""}`}
                onClick={() => setActiveTab("past")}
                aria-label={`View past events (${pastList.length})`}
              >
                <span>Past</span>
                <span className="events-tab-count">{pastList.length}</span>
              </button>
            </div>
          </div>

          <Link to="/vendor/events" className="view-all" style={{ fontSize: "12.5px", color: "#e91e8c", fontWeight: 600 }}>
            View All Events &rarr;
          </Link>
        </div>

        {/* ── Events List or Skeleton / Empty State ── */}
        <div className="event-list" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {loading ? (
            // Loading Skeletons
            [1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  padding: "14px 16px",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.02)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div className="skeleton-block" style={{ width: 180, height: 16 }} />
                  <div className="skeleton-block" style={{ width: 120, height: 12 }} />
                </div>
                <div className="skeleton-block" style={{ width: 70, height: 22, borderRadius: 20 }} />
              </div>
            ))
          ) : currentList.length > 0 ? (
            currentList.slice(0, 6).map((ev, idx) => (
              <UpcomingEventsCard
                key={ev.id || `ev-${idx}`}
                event_name={ev.name || "Untitled Event"}
                status={ev.status || "pending"}
                venue={ev.venue}
                relativeTime={ev.relativeTime}
                staffing={ev.staffing}
                timeAndVenue={`${ev.formattedDate || formatEventDate(ev.date)}${
                  ev.venue ? " • " + ev.venue : ""
                }`}
                onView={() => navigate(ev.id ? `/vendor/events/${ev.id}/review` : "/vendor/events")}
                onAssign={() => navigate("/vendor/staff")}
              />
            ))
          ) : (
            <div
              className="card-empty-placeholder"
              style={{
                padding: "36px 20px",
                textAlign: "center",
                color: "var(--text-muted, #94a3b8)",
                fontSize: "13.5px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Calendar size={28} color="rgba(255, 255, 255, 0.2)" />
              <div>
                {activeTab === "upcoming"
                  ? "No upcoming confirmed events. Check pending requests to approve new bookings."
                  : activeTab === "pending"
                  ? "No pending event requests awaiting coordinator review."
                  : "No past or completed events recorded yet."}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default VendorUpcomingEventsSection;
