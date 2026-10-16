/**
 * ============================================================================
 * MODULAR VENDOR EVENT COORDINATION PAGE (EventCoordination.jsx)
 * ============================================================================
 * Role: Event Coordinator / Vendor  — route /vendor/coordination
 * Purpose:
 *   Client <-> vendor bridge: the vendor's side of the event chat
 *   (port of the old vendor coordination page). It uses the SAME shared hook
 *   and components as the client's Messages page, so:
 *     - a message the client sends shows up here within 3 seconds, and
 *     - the vendor's reply shows up on the client's Messages page.
 *   Issues reported on the event appear as red lines with "View Report".
 *
 *   Assembles:
 *     - <TopHeaderBar>: Vendor title bar.
 *     - <ConversationList>: The vendor's live events, showing the client's name.
 *     - <ChatWindow>: The conversation with that event's client.
 *     - <IssueReportModal>: Issue details.
 *
 * Connected Backend Endpoints:
 *   - GET /events (vendor's events) · GET /issues · GET/PUT /state/coordinationMessages
 * ============================================================================
 */

import React, { useState } from "react";

// Stylesheets (the chat UI is shared with the client portal)
import "../../styles/vendor.css";
import "../../styles/dashboard.css";
import "../client/client.css";

// Shared components & hook
import TopHeaderBar from "../../components/TopHeaderBar";
import ConversationList from "../../components/chat/ConversationList";
import ChatWindow from "../../components/chat/ChatWindow";
import IssueReportModal from "../../components/chat/IssueReportModal";
import useEventChat from "../../hooks/useEventChat";

function EventCoordination() {
  const chat = useEventChat();
  const [openIssue, setOpenIssue] = useState(null);
  const event = chat.selectedEvent;

  return (
    <div className="vendor-page">
      <TopHeaderBar title="Event Coordination" badge={0} />

      <div className="vendor-content">
        {chat.error && <div className="cl-client-error">{chat.error}</div>}

        <div className="cl-chat-layout">
          {/* ── Component 1: Vendor's live events (subtitle = client name) ── */}
          <ConversationList
            events={chat.visibleEvents}
            selectedId={chat.selectedId}
            onSelect={chat.setSelectedId}
            search={chat.search}
            onSearch={chat.setSearch}
            getSubtitle={(ev) => `Client: ${ev.client || "Unknown"}`}
          />

          {/* ── Component 2: Conversation with the event's client ── */}
          <ChatWindow
            title={event ? event.client || "Client" : "No active event"}
            subtitle={event?.name}
            showOnline={Boolean(event)}
            messages={event ? chat.messages : []}
            emptyText={event ? "No messages yet. Say hello to your client!" : "You have no live events to coordinate."}
            isMine={(m) => m.sender?.toLowerCase() === chat.user.name.toLowerCase()}
            onViewIssue={(issueId) => setOpenIssue(chat.findIssue(issueId))}
            disabled={!event}
            onSend={chat.sendMessage}
          />
        </div>

        {/* ── Component 3: Issue details popup ── */}
        <IssueReportModal issue={openIssue} onClose={() => setOpenIssue(null)} />
      </div>
    </div>
  );
}

export default EventCoordination;
