/**
 * ============================================================================
 * MODULAR CLIENT CREATE EVENT PAGE (CreateEvent.jsx)
 * ============================================================================
 * Role: Client
 * Purpose:
 *   4-step wizard to request a new event (port of create_event_client.html):
 *     1. Connects to `useCreateEventWizard` which owns all state and logic.
 *     2. Shows one step component at a time:
 *         - <WizardSteps>: 1-2-3-4 progress indicator.
 *         - <EventDetailsStep>: details form with validation.
 *         - <ResourceSelectionStep>: resources, availability, budget check.
 *         - <StaffSelectionStep>: pick staff.
 *         - <ReviewStep>: summary + submit.
 *         - <EventsToastFeedback>: warnings such as "Only 6 unit(s) available".
 *
 * Connected Backend Endpoints:
 *   - GET /resources, /snapshot, /events, /state/resourceAllocations
 *   - POST /events -> creates the pending event request
 * ============================================================================
 */

import React from "react";

// Stylesheets
import "../../styles/vendor.css";
import "../../styles/dashboard.css";
import "./client.css";

// Shared components
import ClientTopbar from "../../components/client/ClientTopbar";
import EventsToastFeedback from "../../components/vendor/EventsToastFeedback";

// Custom Wizard Hook
import useCreateEventWizard, { STEP_LABELS } from "../../components/client/useCreateEventWizard";

// Modular Wizard Subcomponents
import WizardSteps from "../../components/client/WizardSteps";
import EventDetailsStep from "../../components/client/EventDetailsStep";
import ResourceSelectionStep from "../../components/client/ResourceSelectionStep";
import StaffSelectionStep from "../../components/client/StaffSelectionStep";
import ReviewStep from "../../components/client/ReviewStep";

function CreateEvent() {
  const wizard = useCreateEventWizard();
  const { step, goToStep } = wizard;

  return (
    <div className="dashboard-page">
      <ClientTopbar title="Create Event Request" subtitle="Build your perfect event step by step" />

      <div className="content cl-narrow">
        {/* ── Feedback toast (availability warnings) ── */}
        <EventsToastFeedback toast={wizard.toast} onClose={() => wizard.setToast(null)} />

        {/* ── Step indicator ── */}
        <WizardSteps labels={STEP_LABELS} current={step} />

        {/* ── Only the current step is rendered ── */}
        {step === 1 && (
          <EventDetailsStep
            form={wizard.form}
            errors={wizard.errors}
            onChange={wizard.updateField}
            onNext={() => goToStep(2)}
          />
        )}

        {step === 2 && (
          <ResourceSelectionStep
            categories={wizard.categories}
            resources={wizard.visibleResources}
            search={wizard.resSearch}
            onSearch={wizard.setResSearch}
            category={wizard.resCategory}
            onCategory={wizard.setResCategory}
            selectedQty={wizard.selectedQty}
            onChangeQty={wizard.changeQty}
            chosen={wizard.chosenResources}
            onRemove={wizard.removeResource}
            subtotal={wizard.subtotal}
            maxBudget={wizard.maxBudget}
            overBudget={wizard.overBudget}
            onBack={() => goToStep(1)}
            onNext={() => goToStep(3)}
          />
        )}

        {step === 3 && (
          <StaffSelectionStep
            staff={wizard.visibleStaff}
            search={wizard.staffSearch}
            onSearch={wizard.setStaffSearch}
            selected={wizard.selectedStaff}
            onToggle={wizard.toggleStaff}
            chosen={wizard.chosenStaff}
            onBack={() => goToStep(2)}
            onNext={() => goToStep(4)}
          />
        )}

        {step === 4 && (
          <ReviewStep
            form={wizard.form}
            budgetText={wizard.budgetText}
            resources={wizard.chosenResources}
            staff={wizard.chosenStaff}
            subtotal={wizard.subtotal}
            submitState={wizard.submitState}
            onBack={() => goToStep(3)}
            onSubmit={wizard.handleSubmit}
          />
        )}
      </div>
    </div>
  );
}

export default CreateEvent;
