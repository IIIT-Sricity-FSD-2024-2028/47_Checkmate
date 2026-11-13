/**
 * ============================================================================
 * EVENT VENUE MODAL (EventVenueModal.jsx)
 * ============================================================================
 * Role: Reusable Component (Vendor Portal)
 * Location: src/components/vendor/EventVenueModal.jsx
 *
 * Purpose:
 *   Lists every venue with its location, capacity, price and fit for the event.
 *   Venues with issues (booked, under maintenance, too small) show the reason
 *   and cannot be allocated.
 * ============================================================================
 */

import React from "react";
import { MapPin, X } from "lucide-react";
import { formatCurrency } from "../../utils/formatCurrency";

function EventVenueModal({
  isOpen,
  onClose,
  venues = [],
  currentVenueId,
  guests = 0,
  eventDate,
  onAllocate,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        className="modal-card"
        style={{
          background: "var(--bg-sidebar, #130a1c)",
          border: "1px solid var(--border, rgba(255, 255, 255, 0.1))",
          borderRadius: "16px",
          width: "min(600px, 94vw)",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Allocate Venue"
      >
        <div
          style={{
            padding: "18px 22px",
            borderBottom: "1px solid var(--border, rgba(255, 255, 255, 0.08))",
            fontWeight: 700,
            fontSize: "15px",
            color: "var(--text-primary, #f0e8ff)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>Allocate Venue</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted, #6b5d7e)",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div
          style={{
            padding: "18px 22px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div style={{ fontSize: "12.5px", color: "var(--text-secondary, #9b8db0)" }}>
            {eventDate || "Date not set"} • {guests || "Unknown number of"} guests
          </div>

          {venues.length > 0 ? (
            venues.map((v) => {
              const hasIssues = v.issues.length > 0;
              const isCurrent = v.id === currentVenueId;

              return (
                <div
                  key={v.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "14px 16px",
                    border: hasIssues
                      ? "1px solid rgba(239, 68, 68, 0.25)"
                      : "1px solid var(--border, rgba(255, 255, 255, 0.08))",
                    borderRadius: "12px",
                    background: hasIssues ? "rgba(239, 68, 68, 0.04)" : "transparent",
                  }}
                >
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "10px",
                      background: hasIssues ? "rgba(239, 68, 68, 0.15)" : "rgba(233, 30, 140, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: hasIssues ? "#f87171" : "var(--pink, #e91e8c)",
                      flexShrink: 0,
                    }}
                  >
                    <MapPin size={20} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "var(--text-primary, #f0e8ff)",
                        fontSize: "13.5px",
                      }}
                    >
                      {v.name}
                    </div>
                    <div
                      style={{
                        fontSize: "11.5px",
                        color: "var(--text-muted, #6b5d7e)",
                        marginTop: "2px",
                      }}
                    >
                      {v.location} • Capacity {v.capacity} • {formatCurrency(v.pricePerDay)}/day
                    </div>
                    {hasIssues ? (
                      v.issues.map((issue) => (
                        <div
                          key={issue.desc}
                          style={{ fontSize: "11.5px", color: "#f87171", fontWeight: 600, marginTop: "3px" }}
                        >
                          ⚠ {issue.desc}
                        </div>
                      ))
                    ) : (
                      <div
                        style={{ fontSize: "11.5px", color: "#86efac", fontWeight: 600, marginTop: "3px" }}
                      >
                        Available for {eventDate || "event date"}
                      </div>
                    )}
                  </div>

                  {hasIssues ? (
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        background: "rgba(239, 68, 68, 0.15)",
                        color: "#fca5a5",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                      }}
                    >
                      Unavailable
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onAllocate(v);
                        onClose();
                      }}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "8px",
                        border: "none",
                        background: "linear-gradient(135deg, #e91e8c, #a855f7)",
                        color: "#fff",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {isCurrent ? "Confirm" : "Allocate"}
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "24px",
                color: "var(--text-muted, #6b5d7e)",
                fontSize: "13px",
              }}
            >
              No venues could be loaded.
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            style={{
              marginTop: "6px",
              padding: "10px 18px",
              borderRadius: "8px",
              border: "1px solid var(--border, rgba(255, 255, 255, 0.1))",
              background: "transparent",
              color: "var(--text-muted, #6b5d7e)",
              cursor: "pointer",
              alignSelf: "flex-end",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(EventVenueModal);
