/**
 * ============================================================================
 * CLIENT TOP BAR COMPONENT (ClientTopbar.jsx)
 * ============================================================================
 * Role: Reusable Component (Client Portal)
 * Location: src/components/client/ClientTopbar.jsx
 *
 * Purpose:
 *   The client version of <TopHeaderBar>. Adds what the client pages need:
 *     - an optional subtitle under the title
 *     - an optional back arrow (Track Progress, Live Monitoring)
 *     - extra buttons on the right (children), e.g. "Create Event"
 *     - the notifications bell with an unread badge, opening the shared <Modal>
 *
 * Custom Hooks:
 *   - useClientNotifications(): loads / marks the user's notifications.
 *
 * Props:
 *   @param {string|ReactNode} title - Page title
 *   @param {string} subtitle - Optional grey line under the title
 *   @param {string} backTo - Optional route for the back arrow
 *   @param {ReactNode} children - Optional buttons shown before the bell
 * ============================================================================
 */

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, CheckCheck, CheckCircle2, Info, Receipt, Rocket, XCircle } from "lucide-react";
import Modal from "../Modal";
import "../../styles/admin.css"; // .notif-item styles shared with the admin bell
import useClientNotifications from "./useClientNotifications";
import { formatDate, getCurrentUser } from "../../utils/clientHelpers";

// Picks where a notification should take you, based on words in its text
// FACULTY MAY ASK: How does clicking a notification know which page to open?
// HOW TO CHANGE: Add another "if" here, e.g. text includes "message" -> "/client/messages".
function linkFor(notification) {
  // Notifications created by the backend carry their own link (e.g. /client/track/EVT003)
  if (notification.linkUrl) return notification.linkUrl;
  const text = `${notification.title} ${notification.message}`.toLowerCase();
  if (text.includes("invoice") || text.includes("payment")) return "/client/billing";
  if (text.includes("message")) return "/client/messages";
  return "/client/events";
}

function iconFor(notification) {
  const text = notification.title.toLowerCase();
  if (text.includes("invoice")) return Receipt;
  if (text.includes("live")) return Rocket;
  if (text.includes("approved") || text.includes("completed")) return CheckCircle2;
  if (text.includes("rejected")) return XCircle;
  return Info;
}

function ClientTopbar({ title, subtitle, backTo, children }) {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markRead, markAllRead } = useClientNotifications();

  const openNotification = (notification) => {
    markRead([notification.id]);
    setOpen(false);
    // Report Issue is shared with other roles; only clients have these pages
    if (user.role === "client") navigate(linkFor(notification));
  };

  return (
    <>
      <header className="topbar cl-topbar">
        {/* ── Left: back arrow + title + subtitle ── */}
        <div className="cl-topbar__left">
          {backTo && (
            <Link to={backTo} className="cl-icon-btn" aria-label="Back">
              <ArrowLeft size={18} />
            </Link>
          )}
          <div>
            <h1 className="page-title">{title}</h1>
            {subtitle && <div className="cl-subtitle">{subtitle}</div>}
          </div>
        </div>

        {/* ── Right: page buttons + notifications bell ── */}
        <div className="topbar__right">
          {children}
          <button type="button" className="notif-btn" onClick={() => setOpen(true)} aria-label="Notifications">
            <Bell size={18} />
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>
        </div>
      </header>

      {/* ── Notifications popup (shared Modal) ── */}
      <Modal
        open={open}
        title="Notifications Center"
        onClose={() => setOpen(false)}
        width={440}
        flush
        footer={
          <button type="button" className="cl-link-btn" disabled={unreadCount === 0} onClick={markAllRead}>
            <CheckCheck size={16} /> Mark all as read
          </button>
        }
      >
        {notifications.length === 0 && <div className="notif-empty">You're all caught up.</div>}
        {notifications.map((n) => {
          const Icon = iconFor(n);
          // Unread items are pink, read items blue
          const color = n.isRead ? "blue" : "pink";
          return (
            <div key={n.id} className={`notif-item notif-item--${color}`} onClick={() => openNotification(n)}>
              <div className={`notif-item-icon ${color}`}><Icon size={18} /></div>
              <div className="notif-item-content">
                <div className="notif-item-title">{n.title}</div>
                <div className="notif-item-desc">{n.message}</div>
                <span className="notif-item-time">{formatDate(n.createdAt)}</span>
              </div>
            </div>
          );
        })}
      </Modal>
    </>
  );
}

export default ClientTopbar;
