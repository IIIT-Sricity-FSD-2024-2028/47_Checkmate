import React from "react";
import { CheckCircle2 } from "lucide-react";

/**
 * WizardSteps Component
 * ----------------------------------------------------------------------------
 * The "1 — 2 — 3 — 4" progress indicator at the top of Create Event.
 * Past steps get a tick, the current step glows pink, the lines between
 * finished steps turn pink.
 *
 * Props:
 *  - labels: ["Event Details", "Resources", "Staff", "Review"]
 *  - current: the step being shown (1-based)
 */
function WizardSteps({ labels = [], current = 1, onStepClick }) {
  return (
    <div className="cl-wizard-steps" role="navigation" aria-label="Event Creation Steps">
      {labels.map((label, index) => {
        const number = index + 1;
        const state = number === current ? "active" : number < current ? "completed" : "";
        return (
          <div className="cl-wizard-steps__group" key={label}>
            {index > 0 && <div className={`cl-wizard-line ${number <= current ? "done" : ""}`} />}
            <button
              type="button"
              className={`cl-wizard-step ${state}`}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "inherit",
                fontFamily: "inherit",
                padding: 0,
              }}
              onClick={() => onStepClick && onStepClick(number)}
              title={`Go to step ${number}: ${label}`}
              aria-current={number === current ? "step" : undefined}
            >
              <div className="cl-wizard-step__circle">{number < current ? <CheckCircle2 size={16} /> : number}</div>
              <span className="cl-wizard-step__label">{label}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default WizardSteps;
