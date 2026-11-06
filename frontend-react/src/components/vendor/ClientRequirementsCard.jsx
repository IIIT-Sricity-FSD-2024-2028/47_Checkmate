/**
 * ============================================================================
 * CLIENT REQUIREMENTS CARD COMPONENT (ClientRequirementsCard.jsx)
 * ============================================================================
 * Role: Reusable Component (Vendor Portal)
 * Location: src/components/vendor/ClientRequirementsCard.jsx
 *
 * Purpose:
 *   Replicates the legacy Event Review Client Requirements section:
 *     - Header: "Client Requirements" with submitted by and timestamp
 *     - Tags: Requested resources and staff members represented as pills
 *     - Free-text message: Special requirements and instructions with accent border
 *     - Extras Grid: Event Budget, Expected Guests, Event Type, and Net Payout (90%)
 * ============================================================================
 */

import React from "react";
import {
  MessageCircle,
  User,
  Clock,
  Package,
  IndianRupee,
  Users,
  Tag,
  Calculator,
} from "lucide-react";

function formatSubmissionDate(dateString) {
  if (!dateString) return "Recently";
  const dt = new Date(dateString);
  if (isNaN(dt.getTime())) return String(dateString);

  const datePart = dt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timePart = dt.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart} at ${timePart}`;
}

function ClientRequirementsCard({ event }) {
  if (!event) return null;

  const reqRes = event.requestedResources || event.resources || [];
  const reqStaff = event.requestedStaff || event.staff || [];
  const clientName = event.client || event.clientEmail || "Client";
  const submittedAt = event.submittedAt || event.createdAt;

  // Budget and 90/10 platform split calculations
  const budgetVal = Number(event.budget || event.estimatedCost || 0);
  const platformFee = budgetVal > 0 ? budgetVal * 0.1 : 0;
  const netPayout = budgetVal > 0 ? budgetVal - platformFee : 0;

  return (
    <div className="client-req-card" aria-label="Client Requirements Summary">
      {/* ── Card Header with Metadata ── */}
      <div className="client-req-card__header">
        <MessageCircle />
        <span className="client-req-card__title">Client Requirements</span>
        <div className="client-req-card__meta">
          <User size={12} />
          <span>Submitted by {clientName}</span>
          <span>·</span>
          <Clock size={12} />
          <span>{formatSubmissionDate(submittedAt)}</span>
        </div>
      </div>

      {/* ── Client Selected Request Tags ── */}
      <div className="client-req-tags">
        {reqRes.map((r, idx) => {
          const name = typeof r === "string" ? r : r.resourceName || r.name;
          const qty = typeof r === "object" ? r.quantity || r.qty || 1 : null;
          return (
            <span key={`res-tag-${idx}`} className="client-tag">
              <Package size={12} />
              {name} {qty ? `×${qty}` : ""}
            </span>
          );
        })}

        {reqStaff.map((s, idx) => {
          const name = typeof s === "string" ? s : s.staffName || s.name;
          const role = typeof s === "object" && s.role ? ` (${s.role})` : "";
          return (
            <span key={`staff-tag-${idx}`} className="client-tag">
              <User size={12} />
              {name}
              {role}
            </span>
          );
        })}

        {reqRes.length === 0 && reqStaff.length === 0 && (
          <span className="text-muted" style={{ fontSize: "12px" }}>
            No specific resources or staff items tagged by client.
          </span>
        )}
      </div>

      {/* ── Client Free-Text Message & Special Instructions ── */}
      <div className="client-req-message">
        {event.notes ||
          event.description ||
          "No additional special instructions or notes specified by the client."}
      </div>

      {/* ── Structured Meta Grid (Budget, Guests, Type, 90% Net Payout) ── */}
      <div className="client-req-extras">
        {/* Budget */}
        <div className="client-extra-item">
          <IndianRupee />
          <div>
            <div className="client-extra-label">Event Budget</div>
            <div className="client-extra-value">
              {budgetVal > 0 ? `₹${budgetVal.toLocaleString("en-IN")}` : "Not specified"}
            </div>
          </div>
        </div>

        {/* Expected Guests */}
        <div className="client-extra-item">
          <Users />
          <div>
            <div className="client-extra-label">Expected Guests</div>
            <div className="client-extra-value">
              {event.people || event.guests || 0} people
            </div>
          </div>
        </div>

        {/* Event Type */}
        <div className="client-extra-item">
          <Tag />
          <div>
            <div className="client-extra-label">Event Type</div>
            <div className="client-extra-value">{event.type || "Event"}</div>
          </div>
        </div>

        {/* Net Payout (90%) Calculation Item */}
        {budgetVal > 0 && (
          <div className="client-extra-item client-extra-payout">
            <Calculator />
            <div>
              <div className="client-extra-label">Net Payout (90%)</div>
              <div className="client-extra-value">
                ₹{netPayout.toLocaleString("en-IN")}{" "}
                <span className="client-extra-fee">
                  (Fee: -₹{platformFee.toLocaleString("en-IN")})
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(ClientRequirementsCard);
