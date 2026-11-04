/**
 * ============================================================================
 * CONSOLIDATED VENDOR TOPBAR & NOTIFICATION CENTER (VendorTopBar.jsx)
 * ============================================================================
 * Role: Unified Header & Global Notification Center (Vendor Portal)
 * Location: src/components/vendor/VendorTopBar.jsx
 *
 * Requirements & Architecture:
 *   1. Single JSX file containing all notification data queries, lifecycle hooks,
 *      state synchronization, topbar navigation markup, and top-right dropdown UI.
 *   2. Global vendor persistence: Reads & Clears are synchronized across all
 *      vendor portal pages via localStorage keys ('vendor_notifs_read_v1',
 *      'vendor_notifs_cleared_v1') and real-time custom window events.
 *   3. Floating Top-Right Corner: The notifications dropdown displays anchored
 *      in the top-right corner directly under the bell button (not in screen center).
 *   4. Actions: Includes visible "Read All" and "Clear All" buttons, individual
 *      notification item dismiss controls, and click-through deep-linking.
 *   5. Navigation: Clicking any notification marks it as read, closes the dropdown,
 *      and immediately navigates to that particular section (/vendor/events,
 *      /vendor/resources, /vendor/staff).
 * ============================================================================
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Trash2,
  X,
  Calendar,
  Package,
  Users,
  AlertCircle,
  Inbox,
} from "lucide-react";

// Service endpoints
import {
  getMyEvents,
  getMyResources,
  getMyStaff,
  getMyIssues,
} from "../../services";

// Relative time formatting utility
import { formatRelativeTime } from "../../utils/formatRelativeTime";

// Central Stylesheets
import "../../styles/vendor.css";
import "../../styles/dashboard.css";

// Local storage synchronization keys
const STORAGE_READ_KEY = "vendor_notifs_read_v1";
const STORAGE_CLEARED_KEY = "vendor_notifs_cleared_v1";

/**
 * Safely reads JSON array of ID strings from localStorage.
 *
 * @param {string} key - Local storage key
 * @returns {Array<string>} Parsed array of IDs
 */
function getStoredIds(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Safely writes an array of ID strings to localStorage and broadcasts an update.
 *
 * @param {string} key - Local storage key
 * @param {Array<string>} ids - Array of notification IDs
 */
function setStoredIds(key, ids) {
  try {
    localStorage.setItem(key, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent("vendor_notif_sync"));
  } catch {
    // Non-blocking fallback
  }
}

function VendorTopBar({
  title,
  badge,
  onNotificationClick,
  children,
}) {
  const navigate = useNavigate();

  // Dropdown open / close visibility state
  const [open, setOpen] = useState(false);

  // Raw notification items gathered from backend services
  const [rawNotifications, setRawNotifications] = useState([]);

  // Set of read notification IDs (persisted across pages)
  const [readIds, setReadIds] = useState(() => getStoredIds(STORAGE_READ_KEY));

  // Set of cleared notification IDs (persisted across pages)
  const [clearedIds, setClearedIds] = useState(() => getStoredIds(STORAGE_CLEARED_KEY));

  // --------------------------------------------------------------------------
  // 1. DATA RETRIEVAL (Events, Resources, Staff, Issues)
  // --------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function fetchVendorAlerts() {
      try {
        const [eventsRes, resourcesRes, staffRes, issuesRes] = await Promise.allSettled([
          getMyEvents(),
          getMyResources(),
          getMyStaff(),
          getMyIssues(),
        ]);

        if (cancelled) return;

        const events =
          eventsRes.status === "fulfilled" && Array.isArray(eventsRes.value)
            ? eventsRes.value
            : [];
        const resources =
          resourcesRes.status === "fulfilled" && Array.isArray(resourcesRes.value)
            ? resourcesRes.value
            : [];
        const staff =
          staffRes.status === "fulfilled" && Array.isArray(staffRes.value)
            ? staffRes.value
            : [];
        const issues =
          issuesRes.status === "fulfilled" && Array.isArray(issuesRes.value)
            ? issuesRes.value
            : [];

        const items = [];

        // Alert Type 1: Pending Event Requests (Navigates to /vendor/events)
        events
          .filter((e) => String(e.status || "").toLowerCase() === "pending")
          .forEach((e) => {
            items.push({
              id: `event-${e.id}`,
              title: "Pending Event Request",
              description: `"${e.name || e.title || "Event"}" is awaiting your review and quotation.`,
              time: formatRelativeTime(e.submittedAt || e.createdAt || e.date),
              color: "blue",
              icon: Calendar,
              path: "/vendor/events",
            });
          });

        // Alert Type 2: Low Stock or Unavailable Resources (Navigates to /vendor/resources)
        resources
          .filter(
            (r) =>
              !r.available ||
              (r.avail !== undefined && Number(r.avail) <= 5) ||
              (r.quantityAvailable !== undefined && Number(r.quantityAvailable) <= 5)
          )
          .slice(0, 5)
          .forEach((r) => {
            const qty =
              r.avail !== undefined
                ? r.avail
                : r.quantityAvailable !== undefined
                ? r.quantityAvailable
                : 0;
            items.push({
              id: `res-${r.id}`,
              title: "Low Inventory Warning",
              description: `${r.name || "Resource"} has only ${qty} unit${qty === 1 ? "" : "s"} left.`,
              time: "Inventory Check",
              color: "orange",
              icon: Package,
              path: "/vendor/resources",
            });
          });

        // Alert Type 3: Staff Workload Overcapacity / Busy (Navigates to /vendor/staff)
        staff
          .filter(
            (s) =>
              Number(s.workload || 0) >= 80 ||
              String(s.status || "").toLowerCase() === "busy"
          )
          .slice(0, 4)
          .forEach((s) => {
            items.push({
              id: `staff-${s.id}`,
              title: "Staff Workload Alert",
              description: `${s.name || "Team member"} is currently operating at ${s.workload || 85}% capacity.`,
              time: "Workforce Alert",
              color: "pink",
              icon: Users,
              path: "/vendor/staff",
            });
          });

        // Alert Type 4: Active Open Incident/Support Issues (Navigates to /vendor/events)
        issues
          .filter((i) => String(i.status || "").toLowerCase() === "open")
          .slice(0, 3)
          .forEach((i) => {
            items.push({
              id: `issue-${i.id}`,
              title: "Active Support Ticket",
              description: `${i.title || i.description || "Vendor issue reported"}`,
              time: formatRelativeTime(i.createdAt),
              color: "purple",
              icon: AlertCircle,
              path: "/vendor/events",
            });
          });

        setRawNotifications(items);
      } catch (err) {
        console.error("Failed to fetch vendor notifications:", err);
      }
    }

    fetchVendorAlerts();

    return () => {
      cancelled = true;
    };
  }, []);

  // --------------------------------------------------------------------------
  // 2. REAL-TIME MULTI-PAGE SYNCHRONIZATION
  // --------------------------------------------------------------------------
  useEffect(() => {
    const handleSync = () => {
      setReadIds(getStoredIds(STORAGE_READ_KEY));
      setClearedIds(getStoredIds(STORAGE_CLEARED_KEY));
    };

    window.addEventListener("vendor_notif_sync", handleSync);
    window.addEventListener("storage", handleSync);

    return () => {
      window.removeEventListener("vendor_notif_sync", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  // Close dropdown on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // --------------------------------------------------------------------------
  // 3. DERIVED METRICS & FILTERING
  // --------------------------------------------------------------------------
  // Notifications that have not been cleared by the user
  const activeNotifications = useMemo(() => {
    return rawNotifications.filter((n) => !clearedIds.includes(n.id));
  }, [rawNotifications, clearedIds]);

  // Unread badge counter
  const unreadCount = useMemo(() => {
    if (typeof badge === "number") return badge;
    return activeNotifications.filter((n) => !readIds.includes(n.id)).length;
  }, [badge, activeNotifications, readIds]);

  // --------------------------------------------------------------------------
  // 4. USER ACTION HANDLERS
  // --------------------------------------------------------------------------
  // Toggle the top-right dropdown open/close
  const handleToggleDropdown = () => {
    setOpen((prev) => !prev);
    if (onNotificationClick) {
      onNotificationClick();
    }
  };

  // Mark all active notifications as read
  const handleReadAll = useCallback(
    (e) => {
      e?.stopPropagation();
      const allActiveIds = activeNotifications.map((n) => n.id);
      const updated = Array.from(new Set([...readIds, ...allActiveIds]));
      setReadIds(updated);
      setStoredIds(STORAGE_READ_KEY, updated);
    },
    [activeNotifications, readIds]
  );

  // Clear / remove all notifications
  const handleClearAll = useCallback(
    (e) => {
      e?.stopPropagation();
      const allIds = rawNotifications.map((n) => n.id);
      const updated = Array.from(new Set([...clearedIds, ...allIds]));
      setClearedIds(updated);
      setStoredIds(STORAGE_CLEARED_KEY, updated);
    },
    [rawNotifications, clearedIds]
  );

  // Dismiss a single notification item
  const handleDismissItem = useCallback(
    (e, itemId) => {
      e?.stopPropagation();
      const updated = Array.from(new Set([...clearedIds, itemId]));
      setClearedIds(updated);
      setStoredIds(STORAGE_CLEARED_KEY, updated);
    },
    [clearedIds]
  );

  // Click on a notification item: marks as read, closes dropdown, navigates to section
  const handleItemClick = useCallback(
    (item) => {
      if (!readIds.includes(item.id)) {
        const updated = [...readIds, item.id];
        setReadIds(updated);
        setStoredIds(STORAGE_READ_KEY, updated);
      }
      setOpen(false);
      if (item.path) {
        navigate(item.path);
      }
    },
    [navigate, readIds]
  );

  // --------------------------------------------------------------------------
  // 5. VIEW RENDER
  // --------------------------------------------------------------------------
  return (
    <>
      {/* ── TOP HEADER BAR ── */}
      <header className="topbar">
        <h1 className="page-title">{title}</h1>
        <div className="topbar__right">
          {children}

          <button
            type="button"
            className="notif-btn"
            onClick={handleToggleDropdown}
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="notif-badge">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ── TOP-RIGHT FLOATING NOTIFICATION DROPDOWN ── */}
      {open && (
        <>
          {/* Transparent Backdrop to dismiss when clicking outside */}
          <div
            className="vendor-notif-backdrop"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Floating Dropdown anchored to Top-Right Corner */}
          <div
            className="vendor-notif-dropdown"
            role="dialog"
            aria-label="Notifications"
          >
            {/* Header: Title, Unread Count Pill, and Action Buttons */}
            <div className="vendor-notif-header">
              <div className="vendor-notif-header-left">
                <span className="vendor-notif-title">Notifications</span>
                {unreadCount > 0 && (
                  <span className="vendor-notif-pill">{unreadCount} new</span>
                )}
              </div>

              <div className="vendor-notif-actions">
                {activeNotifications.length > 0 && (
                  <>
                    <button
                      type="button"
                      className="vendor-notif-btn vendor-notif-btn--read"
                      onClick={handleReadAll}
                      title="Mark all notifications as read"
                    >
                      <CheckCheck size={14} />
                      <span>Read All</span>
                    </button>

                    <button
                      type="button"
                      className="vendor-notif-btn vendor-notif-btn--clear"
                      onClick={handleClearAll}
                      title="Clear all notifications"
                    >
                      <Trash2 size={14} />
                      <span>Clear All</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Notification Items List */}
            <div className="vendor-notif-list">
              {activeNotifications.length === 0 ? (
                <div className="vendor-notif-empty">
                  <div className="vendor-notif-empty-icon">
                    <Inbox size={24} />
                  </div>
                  <div className="vendor-notif-empty-title">All caught up!</div>
                  <div className="vendor-notif-empty-desc">
                    No active notifications or pending alerts at this time.
                  </div>
                </div>
              ) : (
                activeNotifications.map((item) => {
                  const isUnread = !readIds.includes(item.id);
                  const ItemIcon = item.icon || Bell;

                  return (
                    <div
                      key={item.id}
                      className={`vendor-notif-item ${isUnread ? "is-unread" : "is-read"} notif-item--${item.color || "blue"}`}
                      onClick={() => handleItemClick(item)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          handleItemClick(item);
                        }
                      }}
                    >
                      <div className={`notif-item-icon ${item.color || "blue"}`}>
                        <ItemIcon size={18} />
                      </div>

                      <div className="vendor-notif-details">
                        <div className="vendor-notif-item-title">{item.title}</div>
                        <div className="vendor-notif-item-desc">{item.description}</div>
                        <span className="vendor-notif-item-time">{item.time}</span>
                      </div>

                      {isUnread && (
                        <span
                          className="vendor-notif-unread-dot"
                          title="Unread notification"
                        />
                      )}

                      <button
                        type="button"
                        className="vendor-notif-dismiss-btn"
                        onClick={(e) => handleDismissItem(e, item.id)}
                        title="Dismiss notification"
                        aria-label="Dismiss notification"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default React.memo(VendorTopBar);
