/**
 * COMPONENT: StatusBadge.jsx
 * WHAT IT DOES:
 *   Standardized badge chip used across all Superuser tables.
 *   Maps status, category, role, or event type strings to their respective
 *   vibrant glassmorphic badge classes in superuser.css.
 *
 * PROPS:
 *   - text: The label string (e.g. 'Confirmed', 'Active', 'Admin')
 *   - customClass: Optional override for the badge styling
 */

import React from 'react';

const BADGE_MAP = {
  // Booking & Event Statuses
  Confirmed: 'b-confirmed',
  Completed: 'b-completed',
  Pending: 'b-pending',
  'In Progress': 'b-inprogress',
  Cancelled: 'b-cancelled',

  // User & Staff Statuses
  Active: 'b-active',
  Inactive: 'b-inactive',

  // Staff Availability
  Available: 'b-avail',
  Busy: 'b-busy',
  'On Leave': 'b-leave',

  // User Roles
  Admin: 'b-admin',
  Vendor: 'b-vendor',
  Staff: 'b-staff',
  Client: 'b-client',
  Superuser: 'b-admin',

  // Event Types
  Wedding: 'b-wedding',
  Birthday: 'b-birthday',
  Conference: 'b-conf',
  Corporate: 'b-corp',
  Other: 'b-other',

  // Resource Categories
  Furniture: 'b-furn',
  Audio: 'b-audio',
  Visual: 'b-visual',
  Infrastructure: 'b-infra',
  Decoration: 'b-deco',
  'Food & Beverage': 'b-food',
  Media: 'b-media',
};

export default function StatusBadge({ text, customClass }) {
  if (!text) return null;

  // FACULTY MAY ASK: How do you add a new status or change a status badge color?
  // HOW TO CHANGE: Add the new key-value pair to BADGE_MAP above and define the corresponding ".b-<name>" class in superuser.css.
  const resolvedClass = customClass || BADGE_MAP[text] || 'b-pending';

  return <span className={`badge ${resolvedClass}`}>{text}</span>;
}
