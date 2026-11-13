/**
 * ============================================================================
 * EVENT EXTRA STAFF MODAL (EventExtraStaffModal.jsx)
 * ============================================================================
 * Role: Reusable Component (Vendor Portal)
 * Location: src/components/vendor/EventExtraStaffModal.jsx
 *
 * Purpose:
 *   Replicates legacy Event Review "Assign Extra Staff" modal dialog:
 *     - Lists the roster; a member with a blockReason cannot be assigned
 *     - Shows staff member role, availability status, and workload
 *     - Assigns the selected team member to this event
 * ============================================================================
 */

import React from "react";
import { X, AlertTriangle } from "lucide-react";

function EventExtraStaffModal({
  isOpen,
  onClose,
  availableStaff = [],
  replacingName,
  onAssign,
}) {
  if (!isOpen) return null;

  const handleSelectStaff = (member) => {
    if (member.blockReason) return;

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
          width: "min(560px, 94vw)",
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
            <span>{replacingName ? `Replace ${replacingName}` : "Assign Staff"}</span>{" "}
            <span
              style={{
                fontSize: "12px",
                color: "var(--text-muted, #6b5d7e)",
                fontWeight: 400,
              }}
            >
              (only staff not working on another event)
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
            gap: "10px",
          }}
        >
          {availableStaff.length > 0 ? (
            availableStaff.map((s) => {
              const initial = (s.name || "S")[0].toUpperCase();
              const currentWl = Number(s.workload || 0);
              const hasConflict = Boolean(s.blockReason);
              const conflictReason = hasConflict
                ? s.blockReason[0].toUpperCase() + s.blockReason.slice(1)
                : "";

              return (
                <div
                  key={s.id}
                  onClick={() => !hasConflict && handleSelectStaff(s)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "12px 16px",
                    border: hasConflict
                      ? "1px solid rgba(239, 68, 68, 0.25)"
                      : "1px solid var(--border, rgba(255, 255, 255, 0.08))",
                    borderRadius: "12px",
                    cursor: hasConflict ? "not-allowed" : "pointer",
                    opacity: hasConflict ? 0.6 : 1,
                    background: hasConflict ? "rgba(239, 68, 68, 0.04)" : "transparent",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!hasConflict) e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                  }}
                  onMouseLeave={(e) => {
                    if (!hasConflict) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: hasConflict
                        ? "rgba(239, 68, 68, 0.2)"
                        : "linear-gradient(135deg, #e91e8c, #a855f7)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "15px",
                      color: hasConflict ? "#fca5a5" : "#fff",
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
                      {hasConflict ? (
                        <span style={{ color: "#f87171", fontWeight: 600 }}>
                          <AlertTriangle size={11} style={{ display: "inline", verticalAlign: "middle", marginRight: "3px" }} />
                          {conflictReason}
                        </span>
                      ) : (
                        <span style={{ color: "#86efac", fontWeight: 600 }}>
                          Available ({currentWl}% workload)
                        </span>
                      )}
                    </div>
                  </div>

                  {hasConflict ? (
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        background: "rgba(239, 68, 68, 0.15)",
                        color: "#fca5a5",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        fontWeight: 600,
                      }}
                    >
                      Conflict
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "5px 12px",
                        borderRadius: "8px",
                        background: "rgba(34, 197, 94, 0.15)",
                        color: "#86efac",
                        border: "1px solid rgba(34, 197, 94, 0.3)",
                        fontWeight: 700,
                      }}
                    >
                      Assign
                    </span>
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
              No staff members found in roster.
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
