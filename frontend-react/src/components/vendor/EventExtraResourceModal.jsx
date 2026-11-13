/**
 * ============================================================================
 * EVENT RESOURCE MODAL (EventExtraResourceModal.jsx)
 * ============================================================================
 * Role: Reusable Component (Vendor Portal)
 * Location: src/components/vendor/EventExtraResourceModal.jsx
 *
 * Purpose:
 *   Lets the vendor allocate inventory to an event from Event Review:
 *     - Search the inventory, with stock shown for the event date
 *     - Pick a quantity and press Add; nothing is allocated by clicking a row
 *     - Items already on this event show their quantity and can be updated
 *     - Stays open so several items can be added, until Done is pressed
 * ============================================================================
 */

import React, { useState } from "react";
import { Minus, Plus, Search, X } from "lucide-react";
import { formatCurrency } from "../../utils/formatCurrency";

function formatEventDate(date) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "the event date";
  return parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function EventExtraResourceModal({
  isOpen,
  onClose,
  title = "Allocate Resource",
  availableResources = [],
  eventDate,
  onAllocate,
  onRemove,
}) {
  const [quantities, setQuantities] = useState({});
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState(null);

  if (!isOpen) return null;

  const getMaxQty = (r) => Number(r.availableQty ?? r.quantity ?? 0);
  const getQty = (r) => {
    const wanted = quantities[r.id] ?? (r.allocatedQty || 1);
    return Math.min(Math.max(1, wanted), Math.max(1, getMaxQty(r)));
  };
  const setQty = (r, value) => {
    setQuantities((prev) => ({ ...prev, [r.id]: Number.parseInt(value, 10) || 1 }));
  };

  const handleAllocate = async (r) => {
    setSavingId(r.id);
    await onAllocate?.(r, getQty(r));
    setSavingId(null);
  };

  const handleRemove = async (r) => {
    setSavingId(r.id);
    await onRemove?.(r);
    setQuantities((prev) => ({ ...prev, [r.id]: undefined }));
    setSavingId(null);
  };

  const handleClose = () => {
    setSearch("");
    setQuantities({});
    onClose();
  };

  const query = search.trim().toLowerCase();
  const visibleResources = availableResources.filter(
    (r) =>
      !query ||
      r.name?.toLowerCase().includes(query) ||
      r.category?.toLowerCase().includes(query)
  );
  const allocatedCount = availableResources.filter((r) => r.allocatedQty > 0).length;

  return (
    <div className="vendor-modal-backdrop" onClick={handleClose}>
      <div
        className="vendor-modal er-res-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* ── Header ── */}
        <div className="vendor-modal__header">
          <div>
            <h3>{title}</h3>
            <p className="er-res-modal__subtitle">
              Stock shown for {formatEventDate(eventDate)}
            </p>
          </div>
          <button type="button" className="modal-close-btn" onClick={handleClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* ── Search ── */}
        <div className="er-res-search">
          <Search size={15} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or category"
            aria-label="Search resources"
          />
        </div>

        {/* ── Inventory List ── */}
        <div className="er-res-list">
          {visibleResources.map((r) => {
            const maxQty = getMaxQty(r);
            const qty = getQty(r);
            const isOutOfStock = maxQty <= 0;
            const isAllocated = r.allocatedQty > 0;
            const isUnchanged = isAllocated && qty === r.allocatedQty;

            return (
              <div key={r.id} className={`er-res-row ${isOutOfStock ? "er-res-row--out" : ""}`}>
                <div className="er-res-row__info">
                  <div className="er-res-row__name">
                    {r.name}
                    {isAllocated && (
                      <span className="er-res-row__badge">Allocated {r.allocatedQty}</span>
                    )}
                  </div>
                  <div className="er-res-row__meta">
                    {r.category || "Equipment"} · {formatCurrency(r.price)}/day ·{" "}
                    <span className={isOutOfStock ? "er-res-row__stock--out" : "er-res-row__stock"}>
                      {isOutOfStock ? "Out of stock" : `${maxQty - (r.allocatedQty || 0)} available`}
                    </span>
                  </div>
                </div>

                {!isOutOfStock && (
                  <div className="er-res-row__actions">
                    <div className="er-res-stepper">
                      <button
                        type="button"
                        onClick={() => setQty(r, qty - 1)}
                        disabled={qty <= 1}
                        aria-label={`Fewer ${r.name}`}
                      >
                        <Minus size={13} />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={maxQty}
                        value={qty}
                        onChange={(e) => setQty(r, e.target.value)}
                        aria-label={`Quantity of ${r.name}`}
                      />
                      <button
                        type="button"
                        onClick={() => setQty(r, qty + 1)}
                        disabled={qty >= maxQty}
                        aria-label={`More ${r.name}`}
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <button
                      type="button"
                      className="er-res-add"
                      onClick={() => handleAllocate(r)}
                      disabled={isUnchanged || savingId === r.id}
                    >
                      {isAllocated ? "Update" : "Add"}
                    </button>
                    {isAllocated && (
                      <button
                        type="button"
                        className="modal-close-btn"
                        onClick={() => handleRemove(r)}
                        disabled={savingId === r.id}
                        aria-label={`Remove ${r.name}`}
                        title="Remove from this event"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {visibleResources.length === 0 && (
            <div className="er-res-empty">
              {query ? "No resources match your search." : "No resources in your inventory."}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="vendor-modal__footer er-res-modal__footer">
          <span className="er-res-modal__count">
            {allocatedCount} {allocatedCount === 1 ? "item" : "items"} on this event
          </span>
          <button type="button" className="vendor-btn-primary" onClick={handleClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(EventExtraResourceModal);
