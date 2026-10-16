/**
 * ============================================================================
 * CLIENT QUICK ACTIONS SECTION COMPONENT (ClientQuickActionsSection.jsx)
 * ============================================================================
 * Role: Reusable Component (Client Portal)
 * Location: src/components/client/ClientQuickActionsSection.jsx
 *
 * Purpose:
 *   Renders the Quick Actions card on the Client Dashboard (same 4 as the old page):
 *     1. New Event     -> /client/create-event
 *     2. Pay Invoices  -> /client/billing
 *     3. Packages      -> /client/packages
 *     4. Message       -> /client/messages
 *
 * Props:
 *   @param {Function} props.onNavigate - Called with the destination path
 * ============================================================================
 */

import React from "react";
import { CreditCard, MessageCircle, PlusCircle, ShoppingBag } from "lucide-react";

// FACULTY MAY ASK: How do you add another quick action?
// HOW TO CHANGE: Add one more object to this array; the JSX maps over it automatically.
const QUICK_ACTIONS = [
  { label: "New Event", path: "/client/create-event", icon: PlusCircle, color: "blue" },
  { label: "Pay Invoices", path: "/client/billing", icon: CreditCard, color: "purple" },
  { label: "Packages", path: "/client/packages", icon: ShoppingBag, color: "green" },
  { label: "Message", path: "/client/messages", icon: MessageCircle, color: "orange" },
];

function ClientQuickActionsSection({ onNavigate }) {
  return (
    <div className="card">
      {/* ── Card Header ── */}
      <div className="card__header">
        <h3>Quick Actions</h3>
      </div>

      {/* ── 2x2 grid of action buttons ── */}
      <div className="quick-actions" role="toolbar" aria-label="Client Quick Actions">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button type="button" className="qa-btn" key={action.label}
              onClick={() => onNavigate && onNavigate(action.path)}>
              <div className={`qa-icon qa-icon--${action.color}`}>
                <Icon size={19} />
              </div>
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ClientQuickActionsSection;
