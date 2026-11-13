/**
 * ============================================================================
 * COMPONENT: WelcomeOverlay.jsx (shared by all five portals)
 * ============================================================================
 * WHAT IT DOES:
 *   "Welcome back, <first name>!" popup shown once per browser session after
 *   login, with a one-line summary that depends on the role. Port of the old
 *   front-end/scripts/welcome-overlay.js, which every HTML portal loaded.
 *
 *   Summary per role (same wording as the HTML version):
 *     admin / superuser -> pending vendor applications + event requests awaiting review
 *     vendor            -> active (confirmed / live) events + available staff
 *     staff             -> new assignments waiting for acceptance
 *     client            -> events in progress or confirmed
 *
 * APIS USED (through the service files):
 *   - GET /api/vendor-applications  (admin, superuser)
 *   - GET /api/events               (admin, superuser, vendor, client)
 *   - GET /api/staff                (vendor)
 *   - GET /api/staff-assignments    (staff)
 * ============================================================================
 */

import { useEffect, useState } from "react";
import { Hand } from "lucide-react";
import { getAuthSession } from "../services/auth/authStorage";
import { getEvents, getMyEvents } from "../services/eventService";
import { getVendorApplications } from "../services/vendorApplicationService";
import { getMyStaff, getMyAssignments } from "../services/staffService";
import "../styles/welcome-overlay.css";

// Text shown until the counts arrive (or if loading them fails)
const DEFAULT_SUMMARY = "Welcome to your dashboard.";

// Builds the one-line summary for a role from the backend data
async function loadSummary(role) {
  if (role === "admin" || role === "superuser") {
    const [applications, events] = await Promise.all([getVendorApplications(), getEvents()]);
    const pendingApps = applications.filter((a) => String(a.status).toLowerCase() === "pending").length;
    const pendingEvents = events.filter((e) => String(e.status).toLowerCase() === "pending").length;
    return `You have ${pendingApps} pending vendor applications and ${pendingEvents} event requests awaiting review.`;
  }
  if (role === "vendor") {
    const [events, staff] = await Promise.all([getMyEvents(), getMyStaff()]);
    const active = events.filter((e) => ["confirmed", "live"].includes(String(e.status).toLowerCase())).length;
    const available = staff.filter((s) => String(s.status).toLowerCase() === "available").length;
    return `You are managing ${active} active events. ${available} staff members are currently available.`;
  }
  if (role === "staff") {
    const assignments = await getMyAssignments();
    const waiting = assignments.filter((a) => ["pending", "assigned"].includes(String(a.status).toLowerCase())).length;
    return `You have ${waiting} new task assignments pending your acceptance.`;
  }
  // client
  const events = await getMyEvents();
  const inProgress = events.filter((e) => ["live", "confirmed"].includes(String(e.status).toLowerCase())).length;
  return `You have ${inProgress} events currently in progress or confirmed.`;
}

function WelcomeOverlay() {
  // Who is signed in (read once; the layout re-mounts after a new login)
  const [session] = useState(() => getAuthSession());
  const user = session?.user || {};
  const role = String(session?.role || user.role || "").toLowerCase();
  // One flag per user, so signing in as another role in the same tab shows it again
  const shownKey = `welcome_shown_${user.id || user.email || "guest"}`;

  // Visible only the first time this user lands on a page in this tab
  const [visible, setVisible] = useState(() => Boolean(user.id || user.email) && !sessionStorage.getItem(shownKey));

  // The role-specific summary line
  const [summary, setSummary] = useState(DEFAULT_SUMMARY);

  // When the popup opens: remember it was shown, then load the counts
  useEffect(() => {
    if (!visible) return;
    sessionStorage.setItem(shownKey, "true");
    let isMounted = true;
    loadSummary(role)
      .then((text) => { if (isMounted) setSummary(text); })
      .catch(() => {}); // keep the default text
    return () => { isMounted = false; };
  }, [visible, role, shownKey]);

  if (!visible) return null;

  const firstName = String(user.name || "there").split(" ")[0];

  return (
    <div className="welcome-overlay" onClick={() => setVisible(false)}>
      <div className="welcome-card" role="dialog" aria-modal="true" aria-label="Welcome" onClick={(e) => e.stopPropagation()}>
        <div className="welcome-card__icon"><Hand size={30} /></div>
        <h2>Welcome back, {firstName}!</h2>
        <p>{summary}</p>
        <button type="button" className="welcome-card__btn" onClick={() => setVisible(false)}>
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

export default WelcomeOverlay;
