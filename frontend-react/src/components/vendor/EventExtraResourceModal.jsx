/**
 * ============================================================================
 * EVENT EXTRA RESOURCE MODAL (EventExtraResourceModal.jsx)
 * ============================================================================
 * Role: Reusable Component (Vendor Portal)
 * Location: src/components/vendor/EventExtraResourceModal.jsx
 *
 * Purpose:
 *   Replicates legacy Event Review "Allocate Extra Resource" modal dialog:
 *     - Displays available inventory items for the event date
 *     - Provides quantity selector for the resource
 *     - Allocates the selected inventory item and substitutes shortages
 * ============================================================================
 */

import React, { useState } from "react";
import { Package, X } from "lucide-react";

function EventExtraResourceModal({
  isOpen,
  onClose,
  availableResources = [],
  eventDate,
  onAllocate,
}) {
  const [quantities, setQuantities] = useState({});

  if (!isOpen) return null;

  const handleQtyChange = (e, resId) => {
    e.stopPropagation();
    const val = parseInt(e.target.value, 10) || 1;
    setQuantities((prev) => ({ ...prev, [resId]: val }));
  };

  const handleSelectResource = (resource) => {
    const qty = quantities[resource.id] || 1;
    if (onAllocate) {
      onAllocate(resource, qty);
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
        aria-label="Allocate Extra Resource"
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
          <span>Allocate Extra Resource</span>
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
          {availableResources.length > 0 ? (
            availableResources.map((r) => {
              const maxQty = r.availableQty || r.quantity || 1;
              const currentQty = quantities[r.id] || 1;

              return (
                <div
                  key={r.id}
                  onClick={() => handleSelectResource(r)}
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
                      borderRadius: "10px",
                      background: "rgba(233, 30, 140, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--pink, #e91e8c)",
                      flexShrink: 0,
                    }}
                  >
                    <Package size={20} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "var(--text-primary, #f0e8ff)",
                        fontSize: "13.5px",
                      }}
                    >
                      {r.name}
                    </div>
                    <div
                      style={{
                        fontSize: "11.5px",
                        color: "var(--text-muted, #6b5d7e)",
                        marginTop: "2px",
                      }}
                    >
                      {r.category || "Equipment"} • ${r.price || 0}/day •{" "}
                      <span style={{ color: "#86efac", fontWeight: 600 }}>
                        {maxQty} available for {eventDate || "event date"}
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <input
                      type="number"
                      value={currentQty}
                      min="1"
                      max={maxQty}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleQtyChange(e, r.id)}
                      style={{
                        width: "60px",
                        padding: "6px",
                        borderRadius: "8px",
                        border: "1px solid var(--border, rgba(255, 255, 255, 0.1))",
                        background: "var(--bg-main, #0d0615)",
                        color: "var(--text-primary, #f0e8ff)",
                        fontSize: "12px",
                        textAlign: "center",
                      }}
                    />
                  </div>
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
              No additional resources currently in stock for this date.
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

export default React.memo(EventExtraResourceModal);
