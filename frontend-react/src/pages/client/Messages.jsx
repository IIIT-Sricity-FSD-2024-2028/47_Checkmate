/**
 * ============================================================================
 * MODULAR CLIENT MESSAGES PAGE (Messages.jsx)
 * ============================================================================
 * Role: Client
 * Purpose:
 *   Chat with the event team or the admins
 *   (port of client_coordination.html + client_coordination_admin.html):
 *     1. Connects to `useClientMessagesData` (refreshes every 3 seconds).
 *        Its Event Chat half is the shared `useEventChat` hook, which the vendor's
 *        Event Coordination page also uses — so messages go both ways.
 *     2. Assembles focused, reusable modular subcomponents:
 *         - <ClientTopbar>: Title + bell.
 *         - <TabSwitcher>: "Event Chat" / "Admin Support".
 *         - <ConversationList>: Live events (or Admin Support) on the left. (shared)
 *         - <ChatWindow>: Header, messages and input on the right. (shared)
 *         - <IssueReportModal>: Opened by "View Report" on an issue message. (shared)
 *
 * Connected Backend Endpoints:
 *   - GET /events, /issues · GET/PUT /state/coordinationMessages, /state/adminChatMessages
 * ============================================================================
 */

import React, { useState } from "react";
import { MessagesSquare, ShieldCheck } from "lucide-react";

// Stylesheets
import "../../styles/dashboard.css";
import "./client.css";

// Shared components
import ClientTopbar from "../../components/client/ClientTopbar";
import ConversationList from "../../components/chat/ConversationList";
import ChatWindow from "../../components/chat/ChatWindow";
import IssueReportModal from "../../components/chat/IssueReportModal";

// Custom Data Hook
import useClientMessagesData from "../../components/client/useClientMessagesData";

// Client components
import TabSwitcher from "../../components/client/TabSwitcher";

const TABS = [
  { value: "event", label: "Event Chat", icon: MessagesSquare },
  { value: "admin", label: "Admin Support", icon: ShieldCheck },
];

function Messages() {
  const chat = useClientMessagesData();
  const [tab, setTab] = useState("event");
  const [openIssue, setOpenIssue] = useState(null);

  const event = chat.selectedEvent;

  return (
    <div className="dashboard-page">
      <ClientTopbar title="Messages" subtitle="Chat directly with your event coordinators" />

      <div className="content">
        {/* ── Component 1: Tabs ── */}
        <TabSwitcher tabs={TABS} active={tab} onChange={setTab} />

        {chat.error && <div className="cl-client-error">{chat.error}</div>}

        {tab === "event" ? (
          <div className="cl-chat-layout">
            {/* ── Component 2: Live events ── */}
            <ConversationList
              events={chat.visibleEvents}
              selectedId={chat.selectedId}
              onSelect={chat.setSelectedId}
              search={chat.search}
              onSearch={chat.setSearch}
            />

            {/* ── Component 3: Chat with the vendor team ── */}
            <ChatWindow
              title={event ? event.vendor || "Event Coordinator" : "No active event"}
              subtitle={event?.name}
              showOnline={Boolean(event)}
              messages={event ? chat.messages : []}
              emptyText={event ? "No messages yet. Start the conversation!" : "You have no live events to coordinate."}
              isMine={(m) => m.sender?.toLowerCase() === chat.user.name.toLowerCase()}
              onViewIssue={(issueId) => setOpenIssue(chat.findIssue(issueId))}
              disabled={!event}
              onSend={chat.sendMessage}
            />
          </div>
        ) : (
          <div className="cl-chat-layout">
            <ConversationList single={{ initials: "AS", title: "Admin Support", subtitle: "Platform administrators" }} />
            <ChatWindow
              title="Admin Support"
              showOnline
              messages={chat.adminChat}
              emptyText="No messages yet. Start the conversation!"
              isMine={(m) => m.senderEmail === chat.user.email}
              onSend={chat.sendAdminMessage}
            />
          </div>
        )}

        {/* ── Component 4: Issue details popup ── */}
        <IssueReportModal issue={openIssue} onClose={() => setOpenIssue(null)} />
      </div>
    </div>
  );
}

export default Messages;
