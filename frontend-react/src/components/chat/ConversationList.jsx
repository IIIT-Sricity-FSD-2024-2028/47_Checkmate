/**
 * ============================================================================
 * CONVERSATION LIST (ConversationList.jsx)
 * ============================================================================
 * Role: Chat Sidebar (shared by Client Messages + Vendor Event Coordination)
 * Location: src/components/chat/ConversationList.jsx
 *
 * Purpose:
 *   Left column of a chat page. Two modes:
 *     - Event list: search box + one row per live event (click to open it).
 *       The grey line under each event comes from `getSubtitle`, so the client
 *       sees the vendor's name and the vendor sees the client's name.
 *     - Single conversation (`single` prop): e.g. the client's "Admin Support".
 *
 * Props:
 *   @param {Array} events - Live events matching the search
 *   @param {string} selectedId - Open event id
 *   @param {Function} onSelect - Called with an event id
 *   @param {string} search / @param {Function} onSearch
 *   @param {Function} getSubtitle - (event) => text under the event name
 *   @param {Object} single - { initials, title, subtitle } to show one fixed row instead
 * ============================================================================
 */

import React from "react";
import { Search } from "lucide-react";
import { initials } from "../../utils/clientHelpers";

function ConversationList({
  events = [],
  selectedId,
  onSelect,
  search = "",
  onSearch,
  getSubtitle = (ev) => ev.vendor || "Event Coordinator",
  single,
}) {
  // ── Single fixed conversation (e.g. Admin Support) ──
  if (single) {
    return (
      <aside className="cl-chat-sidebar">
        <div className="cl-chat-item active">
          <div className="cl-avatar">{single.initials}<span className="cl-online-dot" /></div>
          <div className="cl-chat-item__info">
            <div className="cl-chat-item__top"><h4>{single.title}</h4></div>
            <p>{single.subtitle}</p>
          </div>
        </div>
      </aside>
    );
  }

  // ── One row per live event ──
  return (
    <aside className="cl-chat-sidebar">
      <div className="cl-search cl-search--full">
        <Search size={16} />
        <input type="text" placeholder="Search conversations..." value={search} onChange={(e) => onSearch(e.target.value)} />
      </div>
      {events.length === 0 && <div className="cl-client-muted">No live events found.</div>}
      {events.map((ev) => (
        <div key={ev.id} className={`cl-chat-item ${ev.id === selectedId ? "active" : ""}`} onClick={() => onSelect(ev.id)}>
          <div className="cl-avatar cl-avatar--purple">{initials(ev.name)}<span className="cl-online-dot" /></div>
          <div className="cl-chat-item__info">
            <div className="cl-chat-item__top"><h4>{ev.name}</h4><span>{ev.status}</span></div>
            <p>{getSubtitle(ev)}</p>
          </div>
        </div>
      ))}
    </aside>
  );
}

export default ConversationList;
