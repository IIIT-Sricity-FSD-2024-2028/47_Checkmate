/**
 * ============================================================================
 * EVENT EXTRA STAFF MODAL (EventExtraStaffModal.jsx)
 * ============================================================================
 * Role: Reusable Component (Vendor Portal)
 * Location: src/components/vendor/EventExtraStaffModal.jsx
 *
 * Purpose:
 *   Replicates legacy Event Review "Assign Extra Staff" modal dialog:
 *     - Displays available team members (workload < 100%)
 *     - Shows staff member role, availability status, and workload
 *     - Assigns the selected team member to this event
 * ============================================================================
 */

import React from "react";
import { X } from "lucide-react";

function EventExtraStaffModal({
  isOpen,
  onClose,
  availableStaff = [],
  onAssign,
}) {
  if (!isOpen) return null;

  const handleSelectStaff = (member) => {
    if (onAssign) {
      onAssign(member);
    }
    onClose();
  };

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
          width: "min(540px, 94vw)",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Assign Extra Staff"
      >
        {/* ── Modal Header ── */}
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
          <div>
            <span>Assign Extra Staff</span>{" "}
            <span
              style={{
                fontSize: "12px",
                color: "var(--text-muted, #6b5d7e)",
                fontWeight: 400,
              }}
            >
              (only available staff shown)
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
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

        {/* ── Modal Body ── */}
        <div
          style={{
            padding: "18px 22px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {availableStaff.length > 0 ? (
            availableStaff.map((s) => {
              const initial = (s.name || "S")[0].toUpperCase();
              return (
                <div
                  key={s.id}
                  onClick={() => handleSelectStaff(s)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "14px 16px",
                    border: "1px solid var(--border, rgba(255, 255, 255, 0.08))",
                    borderRadius: "12px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #e91e8c, #a855f7)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "16px",
                      color: "#fff",
                      flexShrink: 0,
                    }}
                  >
                    {initial}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "var(--text-primary, #f0e8ff)",
                        fontSize: "13.5px",
                      }}
                    >
                      {s.name}
                    </div>
                    <div
                      style={{
                        fontSize: "11.5px",
                        color: "var(--text-muted, #6b5d7e)",
                        marginTop: "2px",
                      }}
                    >
                      {s.role || "Staff Member"} •{" "}
                      <span style={{ color: "#86efac", fontWeight: 600 }}>
                        Available ({s.workload || 0}% workload)
                      </span>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: "11px",
                      padding: "4px 12px",
                      borderRadius: "20px",
                      background: "rgba(34, 197, 94, 0.12)",
                      color: "#86efac",
                      border: "1px solid rgba(34, 197, 94, 0.25)",
                      fontWeight: 700,
                    }}
                  >
                    Assign
                  </span>
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
              No additional available staff members with open capacity.
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            style={{
              marginTop: "8px",
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

export default React.memo(EventExtraStaffModal);
