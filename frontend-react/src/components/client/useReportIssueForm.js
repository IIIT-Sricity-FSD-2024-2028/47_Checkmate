/**
 * ============================================================================
 * REPORT ISSUE FORM HOOK (useReportIssueForm.js)
 * ============================================================================
 * Role: Custom State & Mutation Hook (Report Issue page)
 * Location: src/components/client/useReportIssueForm.js
 *
 * Purpose:
 *   All the logic behind the two Report Issue tabs:
 *     1. "event" tab (old client_reportissue.html): title, description, priority,
 *        optional live event. Saves the issue and, when an event is picked, also
 *        posts it into that event's chat. Then returns to the dashboard.
 *     2. "admin" tab (old client_reportissue_admin.html): title, description,
 *        priority, category (all required). Saves the issue for admins, posts it
 *        to the Admin Support chat, shows a toast and clears the form.
 *   Works for any role (staff / vendor routes reuse this page): the reporter and
 *   the dashboard link come from the logged-in session.
 *
 * Connected Backend Endpoints:
 *   - GET  /api/events                         -> your live events
 *   - POST /api/issues                         -> saves the issue
 *   - GET/PUT /api/state/coordinationMessages  -> event chat
 *   - GET/PUT /api/state/adminChatMessages     -> admin support chat
 * ============================================================================
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyEvents } from "../../services/eventService";
import { createIssue } from "../../services/issueService";
import { getStateKey, setStateKey } from "../../services/stateService";
import { getCurrentUser, initials } from "../../utils/clientHelpers";

const EMPTY_FORM = { title: "", desc: "", priority: "", eventId: "", category: "" };

/**
 * Adds one message to a shared chat list stored under a state key.
 * FACULTY MAY ASK: Why read the list before writing it?
 * HOW TO CHANGE: The backend stores the whole chat as one array, so we fetch the
 * latest copy, add our message, and save the whole array back.
 */
export async function appendToChat(key, message) {
  const current = await getStateKey(key);
  const list = Array.isArray(current) ? current : [];
  await setStateKey(key, [...list, message]);
}

export function useReportIssueForm() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [tab, setTab] = useState("event"); // "event" | "admin"
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [submitState, setSubmitState] = useState("idle"); // idle | submitting | success
  const [toast, setToast] = useState(null);
  const [liveEvents, setLiveEvents] = useState([]);

  // Only live events can have issues raised against them (same as the old page)
  useEffect(() => {
    getMyEvents()
      .then((events) => setLiveEvents(events.filter((e) => e.status === "live")))
      .catch(() => setLiveEvents([]));
  }, []);

  const switchTab = (next) => {
    setTab(next);
    setForm(EMPTY_FORM);
    setError("");
  };

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  };

  // --------------------------------------------------------------------------
  // EVENT TEAM ISSUE
  // --------------------------------------------------------------------------
  const submitEventIssue = async () => {
    if (!form.title.trim()) return setError("Please enter an issue title.");
    if (!form.desc.trim()) return setError("Please enter a description.");
    if (!form.priority) return setError("Please select a priority level.");

    setSubmitState("submitting");
    try {
      // No id: the backend assigns ISS001, ISS002, ...
      const saved = await createIssue({
        title: form.title.trim(),
        desc: form.desc.trim(),
        priority: form.priority,
        event: form.eventId || undefined,
        eventId: form.eventId || undefined,
        reporter: user.name,
        reporterRole: user.roleLabel,
        email: user.email,
        createdAt: new Date().toISOString(),
        status: "open",
      });

      // Also drop it into that event's chat so the team sees it straight away
      if (form.eventId) {
        await appendToChat("coordinationMessages", {
          id: "MSG_ISS_" + Date.now(),
          eventId: form.eventId,
          channel: "all",
          sender: user.name,
          senderRole: user.roleLabel,
          senderInitials: initials(user.name),
          text: `⚠️ Issue Reported: ${saved.title} — ${saved.desc || ""}`,
          type: "issue",
          issueId: saved.id,
          createdAt: new Date().toISOString(),
        });
      }

      setSubmitState("success");
      setTimeout(() => navigate(`/${user.role}/dashboard`), 1500);
    } catch {
      setSubmitState("idle");
      setError("Could not submit the issue. Check that the backend is running on port 3000.");
    }
  };

  // --------------------------------------------------------------------------
  // ADMIN ISSUE
  // --------------------------------------------------------------------------
  const submitAdminIssue = async () => {
    if (!form.title.trim() || !form.desc.trim() || !form.priority || !form.category) {
      return setError("Please fill out all fields.");
    }

    setSubmitState("submitting");
    try {
      await createIssue({
        target: "admin",
        title: form.title.trim(),
        description: form.desc.trim(),
        priority: form.priority,
        category: form.category,
        status: "Open",
        reporter: user.name,
        role: user.roleLabel,
        email: user.email,
        createdAt: new Date().toISOString(),
      });
      await appendToChat("adminChatMessages", {
        id: "msg_" + Date.now(),
        sender: user.name,
        senderRole: user.roleLabel,
        senderEmail: user.email,
        text: `📋 Issue Reported: ${form.title.trim()} | Priority: ${form.priority} | Category: ${form.category}`,
        timestamp: new Date().toISOString(),
        type: "issue-report",
      });

      // The admin form stays on the page and just clears itself
      setSubmitState("idle");
      setForm(EMPTY_FORM);
      setToast({ type: "success", text: "Issue sent to the admin team." });
      setTimeout(() => setToast(null), 3000);
    } catch {
      setSubmitState("idle");
      setError("Could not submit the issue. Check that the backend is running on port 3000.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (tab === "event") submitEventIssue();
    else submitAdminIssue();
  };

  const handleCancel = () => {
    if (tab === "event") navigate(`/${user.role}/dashboard`);
    else setForm(EMPTY_FORM);
  };

  return {
    user, tab, switchTab, form, update, error, submitState,
    toast, setToast, liveEvents, handleSubmit, handleCancel,
  };
}

export default useReportIssueForm;
