/**
 * COMPONENT: StatCard.jsx
 * WHAT IT DOES:
 *   Reusable metric summary card for the Superuser portal.
 *   Displays a key performance indicator (total users, revenue, vendors, events)
 *   with an icon, large stat value, and a percentage/subtext trend badge.
 *
 * PROPS:
 *   - label: Title of the metric (e.g., 'Total Users')
 *   - value: Main metric value or loading placeholder (e.g., '1,247' or '$2.4M')
 *   - subtext: Secondary change description (e.g., '↑ +12% from last month')
 *   - icon: Emoji or symbol representing the metric (e.g., '👥')
 *   - colorClass: Color theme ('pink', 'teal', 'green', 'orange', 'purple')
 *   - borderColor: Custom inline border tint matching the vanilla design
 */

import React from 'react';

export default function StatCard({
  label,
  value,
  subtext,
  icon,
  colorClass = 'pink',
  borderColor,
}) {
  // FACULTY MAY ASK: How do you change the card hover animation or padding?
  // HOW TO CHANGE: Look for class ".sc" in superuser.css or add inline styles to the container div below.
  return (
    <div
      className="sc"
      style={borderColor ? { borderColor } : undefined}
    >
      <div className="sc-lb">
        <span>{label}</span>
        {icon && <span className="sc-ico">{icon}</span>}
      </div>
      <div className={`sc-val ${colorClass}`}>{value}</div>
      {subtext && <div className="sc-sub">{subtext}</div>}
    </div>
  );
}
