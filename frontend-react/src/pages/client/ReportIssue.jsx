/**
 * ============================================================================
 * MODULAR REPORT ISSUE PAGE (ReportIssue.jsx)
 * ============================================================================
 * Role: Client (also reused by the staff, vendor and superuser routes)
 * Purpose:
 *   Report a problem to the event team or to the admins
 *   (port of client_reportissue.html + client_reportissue_admin.html):
 *     1. Connects to `useReportIssueForm` which owns state, validation and saving.
 *     2. Assembles focused, reusable modular subcomponents:
 *         - <ClientTopbar>: Title + bell.
 *         - <TabSwitcher>: "Event Team" / "Admin".
 *         - <EventsToastFeedback>: "Issue sent to the admin team."
 *         - <IssueForm>: The form card for the selected tab.
 *
 * Connected Backend Endpoints:
 *   - GET /events · POST /issues · GET/PUT /state/coordinationMessages · /state/adminChatMessages
 * ============================================================================
 */

import React from "react";
import { ShieldCheck, Users } from "lucide-react";

// Stylesheets
import "../../styles/vendor.css";
import "../../styles/dashboard.css";
import "./client.css";

// Shared components
import ClientTopbar from "../../components/client/ClientTopbar";
import EventsToastFeedback from "../../components/vendor/EventsToastFeedback";

// Custom Form Hook
import useReportIssueForm from "../../components/client/useReportIssueForm";

// Modular Report Issue Subcomponents
import TabSwitcher from "../../components/client/TabSwitcher";
import IssueForm from "../../components/client/IssueForm";

const TABS = [
  { value: "event", label: "Event Team", icon: Users },
  { value: "admin", label: "Admin", icon: ShieldCheck },
];

function ReportIssue() {
  const issue = useReportIssueForm();

  return (
    <div className="dashboard-page">
      <ClientTopbar title="Report Issue" subtitle="Submit details about any problems you're facing" />

      <div className="content cl-narrow">
        {/* ── Component 1: Event Team / Admin tabs ── */}
        <TabSwitcher tabs={TABS} active={issue.tab} onChange={issue.switchTab} />

        {/* ── Component 2: Success feedback for admin reports ── */}
        <EventsToastFeedback toast={issue.toast} onClose={() => issue.setToast(null)} />

        {/* ── Component 3: The form ── */}
        <IssueForm
          tab={issue.tab}
          form={issue.form}
          onChange={issue.update}
          liveEvents={issue.liveEvents}
          user={issue.user}
          error={issue.error}
          submitState={issue.submitState}
          onSubmit={issue.handleSubmit}
          onCancel={issue.handleCancel}
        />
      </div>
    </div>
  );
}

export default ReportIssue;
