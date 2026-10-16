/**
 * ============================================================================
 * CREATE EVENT — STEP 2: RESOURCES (ResourceSelectionStep.jsx)
 * ============================================================================
 * Role: Wizard Step Component (Client Create Event page)
 * Location: src/components/client/ResourceSelectionStep.jsx
 *
 * Purpose:
 *   Optional step to request equipment / furniture / decor:
 *     1. Search box + category pills to filter the catalogue.
 *     2. A card per resource with price and a −/+ quantity control.
 *        "+" is blocked past the available units (toast) or when over budget.
 *     3. "Selected Resources" summary with remove (✕), subtotal per day and
 *        a yellow warning that also disables "Next" when over budget.
 *
 * Props: everything comes from useCreateEventWizard() — see the page file.
 * ============================================================================
 */

import React from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Info, Package, Search } from "lucide-react";
import { money } from "../../utils/clientHelpers";

function ResourceSelectionStep({
  categories, resources, search, onSearch, category, onCategory,
  selectedQty, onChangeQty, chosen, onRemove, subtotal, maxBudget, overBudget,
  onBack, onNext,
}) {
  return (
    <div className="card">
      <h3 className="cl-section-title">
        <Package size={20} color="var(--pink)" /> Request Resources
        <span className="cl-optional"><Info size={12} /> Optional</span>
      </h3>
      <p className="cl-section-sub">Browse available resources and select what you need. Quantities are based on real-time availability.</p>

      {/* ── Search + category pills ── */}
      <div className="cl-toolbar">
        <div className="cl-search">
          <Search size={16} />
          <input type="text" placeholder="Search resources..." value={search} onChange={(e) => onSearch(e.target.value)} />
        </div>
        <div className="cl-pills">
          {categories.map((c) => (
            <button type="button" key={c} className={`cl-pill ${category === c ? "active" : ""}`} onClick={() => onCategory(c)}>{c}</button>
          ))}
        </div>
      </div>

      {/* ── Resource cards ── */}
      <div className="cl-res-grid">
        {resources.length === 0 && <div className="cl-client-muted cl-full">No resources found.</div>}
        {resources.map((r) => {
          const qty = selectedQty[r.id] || 0;
          return (
            <div className={`cl-res-card ${qty > 0 ? "selected" : ""}`} key={r.id}>
              <div>
                <div className="cl-res-card__name">{r.name}</div>
                <span className={`cl-cat cl-cat--${r.category.toLowerCase()}`}>{r.category}</span>
              </div>
              <div className="cl-res-card__bottom">
                <div className="cl-res-card__price">${r.price}/{r.unit || "day"}</div>
                <div className="cl-qty">
                  <button type="button" onClick={() => onChangeQty(r, -1)}>−</button>
                  <span>{qty}</span>
                  {/* + is disabled once the budget is exceeded */}
                  <button type="button" disabled={overBudget} onClick={() => onChangeQty(r, 1)}>+</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Selected summary + budget warning ── */}
      {chosen.length > 0 && (
        <div className="cl-summary">
          <div className="cl-summary__title">
            <CheckCircle2 size={16} color="var(--green)" /> Selected Resources
            <span className="cl-count">{chosen.length}</span>
          </div>
          {chosen.map((r) => (
            <div className="cl-summary__item" key={r.id}>
              <span>{r.name}</span>
              <span className="cl-muted-text">×{r.qty} · ${r.cost}/day</span>
              <button type="button" className="cl-remove" onClick={() => onRemove(r.id)} title="Remove">✕</button>
            </div>
          ))}
          <div className="cl-summary__total">
            <span>Subtotal</span>
            <strong>{money(subtotal)}/day</strong>
          </div>
          {overBudget && (
            <div className="cl-warning">
              <AlertTriangle size={16} />
              Resource total ({money(subtotal)}) exceeds your budget limit ({money(maxBudget)}).
            </div>
          )}
        </div>
      )}

      <div className="cl-wizard-nav">
        <button type="button" className="cl-btn-ghost" onClick={onBack}><ArrowLeft size={16} /> Back</button>
        <div className="cl-btn-row">
          <button type="button" className="cl-btn-ghost" onClick={onNext}>Skip <ArrowRight size={16} /></button>
          <button type="button" className="cl-btn-pink" disabled={overBudget} onClick={onNext}>
            <ArrowRight size={16} /> Next: Staff
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResourceSelectionStep;
