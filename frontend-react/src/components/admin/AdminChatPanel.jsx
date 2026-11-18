/**
 * ============================================================================
 * ADMIN CHAT PANEL (components/admin/AdminChatPanel.jsx)
 * ============================================================================
 * The admin side of the support chat (Coordination Hub → Admin Chat tab).
 *
 * FIXES THE OLD BUG: admin replies used to go into one shared log without a
 * recipientEmail, so the staff member / client / vendor never saw them. Now:
 *   - Left: one conversation per person who wrote to the admins (with an
 *     unread badge).
 *   - Right: that person's messages; a reply is sent to THEM
 *     (POST /api/admin-chat { text, recipientEmail }).
 *   - New messages arrive live (socket), polling every 3 s only as a fallback.
 * ============================================================================
 */

import React, { useMemo, useState } from "react";
import { Send } from "lucide-react";
import useLiveChat, { formatMessageTime } from "../../hooks/useLiveChat";
import useUnreadCounts from "../../hooks/useUnreadCounts";
import "../../styles/chat-live.css";

const ADMIN_ROLES = ["admin", "superuser"];

// The non-admin person a message belongs to (sender, or who an admin wrote to)
function participantOf(message) {
  const fromAdmin = ADMIN_ROLES.includes(String(message.senderRole || "").toLowerCase());
  return String((fromAdmin ? message.recipientEmail : message.senderEmail) || "").toLowerCase();
}

function AdminChatPanel() {
  // Every admin-chat message (admins can read them all), live
  const all = useLiveChat({ kind: "admin" });

  // The person whose conversation is open (their email)
  const [selectedEmail, setSelectedEmail] = useState(null);

  // The open conversation (marks it read; replies go to selectedEmail)
  const chat = useLiveChat({ kind: "admin", withEmail: selectedEmail });

  // Unread badges per person
  const unread = useUnreadCounts();

  // Text in the reply box
  const [inputText, setInputText] = useState("");

  // True while a reply is being saved
  const [sending, setSending] = useState(false);

  // One row per person, newest conversation first
  const conversations = useMemo(() => {
    const byEmail = {};
    all.messages.forEach((m) => {
      const email = participantOf(m);
      if (!email) return; // very old messages with no address
      const isTheirs = !ADMIN_ROLES.includes(String(m.senderRole || "").toLowerCase());
      const row = byEmail[email] || { email, name: email, role: "", last: "" };
      if (isTheirs) {
        row.name = m.sender || row.name;
        row.role = m.senderRole || row.role;
      }
      const when = m.timestamp || m.createdAt || "";
      if (when > row.last) {
        row.last = when;
        row.preview = m.text;
      }
      byEmail[email] = row;
    });
    return Object.values(byEmail).sort((a, b) => b.last.localeCompare(a.last));
  }, [all.messages]);

  const selected = conversations.find((c) => c.email === selectedEmail) || null;

  // Sends the reply to the selected person
  async function handleSend(e) {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || !selectedEmail || sending) return;
    setSending(true);
    const ok = await chat.send(text);
    if (ok) setInputText("");
    setSending(false);
  }

  return (
    <div className="admin-chat-panel" style={{ display: "flex", height: "620px", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
      {/* Left: conversations */}
      <div style={{ width: "280px", borderRight: "1px solid var(--border)", overflowY: "auto", background: "rgba(255,255,255,0.02)" }}>
        <div style={{ padding: "14px 16px", fontWeight: 600, color: "#fff", borderBottom: "1px solid var(--border)" }}>
          Conversations ({conversations.length})
        </div>
        {conversations.length === 0 && <div style={{ padding: "16px", color: "var(--text-muted)", fontSize: "13px" }}>No one has written yet.</div>}
        {conversations.map((c) => (
          <div
            key={c.email}
            className="admin-chat-row"
            data-email={c.email}
            onClick={() => setSelectedEmail(c.email)}
            style={{
              padding: "12px 16px",
              cursor: "pointer",
              borderBottom: "1px solid var(--border)",
              background: c.email === selectedEmail ? "rgba(236,72,153,0.12)" : "transparent",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fff", fontSize: "13.5px", fontWeight: 600 }}>
              <span>{c.name}</span>
              {unread.threads[`admin-chat:${c.email}`] > 0 && <span className="chat-unread-badge">{unread.threads[`admin-chat:${c.email}`]}</span>}
            </div>
            <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>{c.role} · {formatMessageTime(c.last)}</div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.preview}</div>
          </div>
        ))}
      </div>

      {/* Right: the open conversation */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", color: "#fff", fontWeight: 600 }}>
          <span>{selected ? `${selected.name} (${selected.email})` : "Select a conversation"}</span>
          <span className={`chat-live-pill ${chat.connected ? "" : "chat-live-pill--off"}`}>{chat.connected ? "Live" : "Refreshing every 3s"}</span>
        </div>

        <div style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
          {selected && chat.messages.length === 0 && <div style={{ margin: "auto", color: "var(--text-muted)" }}>No messages.</div>}
          {selected && chat.messages.map((m) => {
            const isAdmin = ADMIN_ROLES.includes(String(m.senderRole || "").toLowerCase());
            return (
              <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: isAdmin ? "flex-end" : "flex-start" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>
                  {m.sender} ({m.senderRole}) · {formatMessageTime(m.timestamp || m.createdAt)}
                </div>
                <div style={{ maxWidth: "75%", padding: "10px 14px", borderRadius: "10px", color: "#fff", fontSize: "13.5px", background: isAdmin ? "rgba(236,72,153,0.15)" : "rgba(255,255,255,0.05)", border: "1px solid var(--border)" }}>
                  {m.text}
                </div>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSend} style={{ padding: "16px", borderTop: "1px solid var(--border)", display: "flex", gap: "12px" }}>
          <input
            type="text"
            className="admin-chat-input"
            placeholder={selected ? `Reply to ${selected.name}...` : "Pick a conversation first"}
            disabled={!selected}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            style={{ flex: 1, padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: "8px", color: "#fff" }}
          />
          <button type="submit" disabled={!selected || sending || !inputText.trim()} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 18px", background: "#ec4899", border: "none", borderRadius: "8px", color: "#fff", fontWeight: 600 }}>
            <Send size={15} /> Send
          </button>
        </form>
        {chat.error && <div style={{ padding: "0 16px 12px", color: "#f87171", fontSize: "12.5px" }}>{chat.error}</div>}
      </div>
    </div>
  );
}

export default AdminChatPanel;
