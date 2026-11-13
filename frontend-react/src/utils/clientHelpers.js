/**
 * clientHelpers.js  (src/utils)
 * Small helper functions shared by the client pages.
 * Kept as plain functions (no React) so they are easy to test and explain.
 */

import { getAuthSession } from "../services/auth/authStorage";

// Statuses that mean the vendor has approved the event
export const APPROVED_STATUSES = ["confirmed", "approved", "live", "completed"];

// How often the live pages re-fetch data (the old pages polled every 3–5 s)
export const REFRESH_MS = 5000;

// The logged-in user, with safe fallbacks so pages never crash on a missing session
export function getCurrentUser() {
    const session = getAuthSession();
    const user = session?.user || {};
    const role = (session?.role || user.role || "client").toLowerCase();
    return {
        id: user.id || "U004",
        name: user.name || "Emily Carter",
        email: user.email || "emily.client@example.com",
        role,
        // "client" -> "Client", used when we save who sent a message / reported an issue
        roleLabel: role.charAt(0).toUpperCase() + role.slice(1),
    };
}

// "2026-05-10" -> "May 10, 2026"  (style "long" -> "May 10, 2026" with full month)
export function formatDate(value, style = "short") {
    if (!value) return "—";
    // Plain dates have no time, so add one to avoid timezone shifting the day
    const date = value.length === 10 ? new Date(value + "T00:00:00") : new Date(value);
    if (isNaN(date)) return "—";
    return date.toLocaleDateString("en-US", {
        month: style === "long" ? "long" : "short",
        day: "numeric",
        year: "numeric",
    });
}

// ISO timestamp -> "09:30 AM"
export function formatClock(iso) {
    if (!iso) return "";
    const date = new Date(iso);
    return isNaN(date) ? "" : date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

// "18:30" -> "6:30 PM"  (same format the old create-event page saved)
export function formatTime12(time) {
    if (!time) return "9:00 AM";
    const [h, m] = time.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${suffix}`;
}

// "Emily Carter" -> "EC"
export function initials(name) {
    return (name || "")
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

// Turns a failed API call into a message that says what actually went wrong.
// FACULTY MAY ASK: How do you know whether the backend is down or the user is logged out?
// HOW TO CHANGE: apiClient throws an ApiError with .status when the server answered
// (401 = not logged in / token expired, 403 = role not allowed). If fetch itself fails
// there is no status at all, which means the server could not be reached.
export function describeError(err, what = "this page") {
    if (err?.status === 401) return "Your session has expired. Please sign in again.";
    if (err?.status === 403) return `Your account isn't allowed to view ${what}.`;
    if (err?.status) return `Could not load ${what} (server error ${err.status}).`;
    return "Could not reach the server. Is the backend running on port 3000?";
}

// "₹1,234"
export function money(amount) {
    return "₹" + Number(amount || 0).toLocaleString("en-IN");
}

/**
 * Works out how far an event has got through the 5 checkpoints:
 * Submitted -> Approved -> Resources -> Staff -> Live/Completed.
 * Used by the dashboard and the Track Progress page so both always agree.
 */
export function getEventProgress(event, allocations, assignments) {
    const eventAllocations = (allocations || {})[event.id] || [];
    const assignedStaff = (assignments || []).filter(
        (a) => a.eventId === event.id && a.status === "accepted"
    );

    const isApproved = APPROVED_STATUSES.includes(event.status);
    const hasResources = eventAllocations.length > 0;
    const hasStaff = assignedStaff.length > 0;
    const isRunning = event.status === "live" || event.status === "completed";

    // "Submitted" always counts, then one point per finished checkpoint
    let stepsComplete = 1;
    if (isApproved) stepsComplete++;
    if (hasResources) stepsComplete++;
    if (hasStaff) stepsComplete++;
    if (isRunning) stepsComplete++;

    return {
        isApproved,
        hasResources,
        hasStaff,
        eventAllocations,
        assignedStaff,
        stepsComplete,
        percent: Math.round((stepsComplete / 5) * 100),
    };
}

// ── Event start / end checks (used by Create Event and Edit Event) ──

// Minutes between start and end. An event may end on a later day (endDate),
// e.g. 9:00 PM on the 10th to 12:00 AM on the 11th = 3 hours.
// date/endDate are "YYYY-MM-DD", time/endTime are "HH:MM" (24h, from <input type="time">).
export function eventDurationMinutes({ date, time, endDate, endTime }) {
    if (!date || !time || !endTime) return null;
    const toMinutes = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
    const dayDiff = endDate && endDate > date
        ? Math.round((Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / 86400000)
        : 0;
    return dayDiff * 24 * 60 + toMinutes(endTime) - toMinutes(time);
}

// Error text for an impossible start/end, or "" when it is fine
export function eventEndError({ date, time, endDate, endTime }) {
    if (endDate && date && endDate < date) return "End date cannot be before the event date.";
    const minutes = eventDurationMinutes({ date, time, endDate, endTime });
    if (minutes !== null && minutes <= 0) {
        return "End time must be after the start time. If the event ends after midnight, set the End Date to the next day.";
    }
    return "";
}

// "3h 30m" for the duration hint; "" when it cannot be worked out
export function describeEventDuration(times) {
    const minutes = eventDurationMinutes(times);
    if (!minutes || minutes <= 0) return "";
    return `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ""}`;
}
