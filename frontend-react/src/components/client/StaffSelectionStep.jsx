/**
 * ============================================================================
 * CREATE EVENT — STEP 3: STAFF (StaffSelectionStep.jsx)
 * ============================================================================
 * Role: Wizard Step Component (Client Create Event page)
 * Location: src/components/client/StaffSelectionStep.jsx
 *
 * Purpose:
 *   Optional step to request PREFERRED staff:
 *     1. Search by name or role.
 *     2. Each card shows a rating or a "New" badge. Clicking a card opens the
 *        staff profile (StaffProfileModal); its button adds / removes that
 *        person as a preference (pink border when chosen).
 *     3. Greyed "Unavailable" = already working at the chosen date/time.
 *     4. "Preferred Staff" summary with remove (✕). The vendor confirms each
 *        preference or replaces it in Event Review.
 *
 * Props: everything comes from useCreateEventWizard() — see the page file.
 * ============================================================================
 */

import React from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Info, Search, UsersRound } from "lucide-react";
import { initials } from "../../utils/clientHelpers";
import StaffProfileModal, { RatingBadge } from "../StaffProfileModal";

// Avatar colours (staff records store one of these names in `avatar`)
const AVATAR_GRADIENTS = {
  pink: "linear-gradient(135deg, #e91e8c, #a855f7)",
  teal: "linear-gradient(135deg, #06b6d4, #3b82f6)",
  purple: "linear-gradient(135deg, #8b5cf6, #ec4899)",
  green: "linear-gradient(135deg, #22c55e, #16a34a)",
  orange: "linear-gradient(135deg, #f97316, #ef4444)",
};
const COLOR_NAMES = Object.keys(AVATAR_GRADIENTS);

function StaffSelectionStep({ staff, search, onSearch, selected, onToggle, chosen, profileStaffId, onOpenProfile, onBack, onNext }) {
  // The card whose profile is open (to know if it is busy / already chosen)
  const openCard = staff.find((s) => s.id === profileStaffId);

  return (
    <div className="card">
      <h3 className="cl-section-title">
        <UsersRound size={20} color="var(--pink)" /> Preferred Staff
        <span className="cl-optional"><Info size={12} /> Optional</span>
      </h3>
      <p className="cl-section-sub">Click a card to see the profile and add that person as a preference. Your vendor confirms or replaces each preference.</p>

      <div className="cl-toolbar">
        <div className="cl-search">
          <Search size={16} />
          <input type="text" placeholder="Search staff by name or role..." value={search} onChange={(e) => onSearch(e.target.value)} />
        </div>
      </div>

      {/* ── Staff cards ── */}
      <div className="cl-staff-grid">
        {staff.length === 0 && <div className="cl-client-muted cl-full">No staff found.</div>}
        {staff.map((s, index) => {
          const gradient = AVATAR_GRADIENTS[s.avatar] || AVATAR_GRADIENTS[COLOR_NAMES[index % COLOR_NAMES.length]];
          return (
            <div className={`cl-staff-pick ${selected[s.id] ? "selected" : ""}`} key={s.id} onClick={() => onOpenProfile(s.id)} style={s.isBusy ? { opacity: 0.5 } : undefined}>
              <div className="cl-avatar" style={{ background: gradient }}>{s.initials || initials(s.name)}</div>
              <div>
                <div className="cl-res-card__name">{s.name}</div>
                <div className="cl-muted-text">{s.role}{s.isBusy ? " · Unavailable" : ""}</div>
                <RatingBadge profile={s} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Selected summary ── */}
      {chosen.length > 0 && (
        <div className="cl-summary">
          <div className="cl-summary__title">
            <CheckCircle2 size={16} color="var(--green)" /> Preferred Staff
            <span className="cl-count">{chosen.length}</span>
          </div>
          {chosen.map((s) => (
            <div className="cl-summary__item" key={s.id}>
              <span>{s.name}</span>
              <span className="cl-muted-text">{s.role}</span>
              <button type="button" className="cl-remove" onClick={() => onToggle(s.id)} title="Remove">✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Profile modal: the button adds / removes the preference */}
      <StaffProfileModal
        staffId={profileStaffId}
        onClose={() => onOpenProfile(null)}
        busyOn={openCard?.busyOn || null}
        actionLabel={!openCard ? "" : selected[openCard.id] ? "Remove preference" : openCard.isBusy ? "Unavailable on this date" : "Add as preference"}
        actionDisabled={Boolean(openCard && !selected[openCard.id] && openCard.isBusy)}
        onAction={() => { onToggle(profileStaffId); onOpenProfile(null); }}
      />

      <div className="cl-wizard-nav">
        <button type="button" className="cl-btn-ghost" onClick={onBack}><ArrowLeft size={16} /> Back</button>
        <div className="cl-btn-row">
          <button type="button" className="cl-btn-ghost" onClick={onNext}>Skip <ArrowRight size={16} /></button>
          <button type="button" className="cl-btn-pink" onClick={onNext}><ArrowRight size={16} /> Next: Review</button>
        </div>
      </div>
    </div>
  );
}

export default StaffSelectionStep;
