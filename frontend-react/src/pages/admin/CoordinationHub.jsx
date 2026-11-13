/**
 * ADMIN · COORDINATION HUB (pages/admin/CoordinationHub.jsx)
 * Replaces legacy: front-end/pages/admin/admin-coordination.html.
 *
 * Two tabs:
 *  - Support Inbox: clients message the admins from their Messages page. Those messages
 *    (and the automatic issue-status updates) live in adminChatMessages. Conversations are
 *    grouped by the client's email; a reply goes through POST /support/replies, which tags
 *    it with recipientEmail so it shows up in that client's chat.
 *    Opening /admin/coordination?email=<client email> jumps straight to that conversation
 *    (used by the "Message Reporter" button on Issue Tracking).
 *  - Announcements: POST /announcements with an audience (everyone / clients / vendors /
 *    staff). Each portal shows the newest one meant for it in a banner at the top.
 */

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Megaphone, MessageSquare, RefreshCw, Send, Trash2 } from "lucide-react";

import "../../styles/dashboard.css";
import "../../styles/admin.css";
import "../../styles/components/modal.css";

import AdminTopBar from "../../components/admin/AdminTopBar";
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncements,
  getStateKey,
  replyToClient,
} from "../../services";
import { formatRelativeTime } from "../../utils/formatRelativeTime";

const AUDIENCES = [
  { value: "all", label: "Everyone" },
  { value: "client", label: "Clients" },
  { value: "vendor", label: "Vendors" },
  { value: "staff", label: "Staff" },
];

const audienceLabel = (value) => AUDIENCES.find((a) => a.value === value)?.label || value;

// The client a message belongs to: replies and system updates carry recipientEmail,
// messages the client wrote carry senderEmail.
const clientEmailOf = (m) => String(m.recipientEmail || m.senderEmail || "").toLowerCase();

// One entry per client, newest conversation first.
function groupByClient(messages) {
  const conversations = {};
  messages.forEach((m) => {
    const email = clientEmailOf(m);
    if (!email) return;
    if (!conversations[email]) conversations[email] = { email, name: email, messages: [] };
    if (!m.recipientEmail && m.sender) conversations[email].name = m.sender; // the client's own name
    conversations[email].messages.push(m);
  });

  const list = Object.values(conversations);
  list.forEach((c) => c.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
  const lastTime = (c) => new Date(c.messages[c.messages.length - 1].timestamp);
  return list.sort((a, b) => lastTime(b) - lastTime(a));
}

function SupportInbox({ messages, selectedEmail, onSelect, onReply, sending }) {
  const [text, setText] = useState("");
  const conversations = groupByClient(messages);
  const selected = conversations.find((c) => c.email === selectedEmail) || null;

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const sent = await onReply(selected.email, text.trim());
    if (sent) setText("");
  };

  if (conversations.length === 0) {
    return <div className="admin-empty">No client has messaged the admins yet.</div>;
  }

  return (
    <div className="inbox">
      <div className="inbox__list">
        {conversations.map((c) => (
          <button
            key={c.email}
            type="button"
            className={`inbox__contact ${c.email === selectedEmail ? "inbox__contact--active" : ""}`}
            onClick={() => onSelect(c.email)}
          >
            <strong>{c.name}</strong>
            {c.name !== c.email && <span>{c.email}</span>}
          </button>
        ))}
      </div>

      <div className="inbox__chat">
        <div className="inbox__messages">
          {!selected && <div className="admin-empty">Pick a conversation on the left.</div>}
          {selected &&
            selected.messages.map((m, i) => {
              const kind = m.type === "system" ? "system" : m.recipientEmail ? "admin" : "client";
              return (
                <div key={`${m.id}-${i}`} className={`chat-bubble chat-bubble--${kind}`}>
                  <span className="chat-bubble__meta">
                    {m.sender} · {formatRelativeTime(m.timestamp)}
                  </span>
                  {m.text}
                </div>
              );
            })}
        </div>
        {selected && (
          <form className="inbox__form" onSubmit={submit}>
            <input
              type="text"
              value={text}
              placeholder={`Reply to ${selected.name}...`}
              onChange={(e) => setText(e.target.value)}
            />
            <button type="submit" className="ui-btn ui-btn--primary" disabled={sending || !text.trim()}>
              <Send size={14} /> Send
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Announcements({ announcements, onPost, onDelete, busy }) {
  const [form, setForm] = useState({ title: "", message: "", audience: "all" });

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const posted = await onPost(form);
    if (posted) setForm({ title: "", message: "", audience: "all" });
  };

  return (
    <>
      <form onSubmit={submit}>
        <div className="modal-field">
          <label htmlFor="ann-title">Title</label>
          <input id="ann-title" type="text" value={form.title} onChange={update("title")} required minLength={3} />
        </div>
        <div className="modal-field">
          <label htmlFor="ann-message">Message</label>
          <textarea id="ann-message" value={form.message} onChange={update("message")} required minLength={3} />
        </div>
        <div className="modal-field">
          <label htmlFor="ann-audience">Show to</label>
          <select id="ann-audience" value={form.audience} onChange={update("audience")}>
            {AUDIENCES.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="ui-btn ui-btn--primary" disabled={busy}>
          <Megaphone size={14} /> Post Announcement
        </button>
      </form>

      <h3 style={{ marginTop: 8 }}>Posted</h3>
      <div className="announcement-list">
        {announcements.length === 0 && <div className="admin-empty">Nothing posted yet.</div>}
        {announcements.map((a) => (
          <div key={a.id} className="announcement">
            <div>
              <h4>{a.title}</h4>
              <p>{a.message}</p>
              <span className="cell-muted">
                {audienceLabel(a.audience)} · by {a.createdBy} · {formatRelativeTime(a.createdAt)}
              </span>
            </div>
            <button type="button" className="ui-btn ui-btn--danger" disabled={busy} onClick={() => onDelete(a)}>
              <Trash2 size={14} /> Remove
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

function CoordinationHub() {
  const [searchParams] = useSearchParams();

  const [tab, setTab] = useState("inbox");
  const [messages, setMessages] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // ?email=... (from Issue Tracking) opens that client's conversation.
  const [selectedEmail, setSelectedEmail] = useState(searchParams.get("email")?.toLowerCase() || null);

  // Load both tabs once, when the page opens.
  useEffect(() => {
    Promise.all([getStateKey("adminChatMessages"), getAnnouncements()])
      .then(([chat, posted]) => {
        setMessages(Array.isArray(chat) ? chat : []);
        setAnnouncements(posted || []);
      })
      .catch((err) => {
        console.error("Failed to load the coordination hub:", err);
        setError("Could not load messages and announcements.");
      })
      .finally(() => setLoading(false));
  }, []);

  const refreshInbox = async () => {
    try {
      const chat = await getStateKey("adminChatMessages");
      setMessages(Array.isArray(chat) ? chat : []);
    } catch (err) {
      console.error("Could not refresh messages:", err);
      setError("Could not refresh messages.");
    }
  };

  // Returns true when the reply was saved, so the form knows to clear itself.
  const reply = async (email, text) => {
    setBusy(true);
    setError("");
    try {
      const message = await replyToClient(email, text);
      setMessages([...messages, message]);
      return true;
    } catch (err) {
      console.error("Reply failed:", err);
      setError(err?.message || "Could not send the reply.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const post = async (form) => {
    setBusy(true);
    setError("");
    try {
      const created = await createAnnouncement({
        title: form.title.trim(),
        message: form.message.trim(),
        audience: form.audience,
      });
      setAnnouncements([created, ...announcements]);
      return true;
    } catch (err) {
      console.error("Announcement failed:", err);
      setError(err?.message || "Could not post the announcement.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const remove = async (announcement) => {
    setBusy(true);
    setError("");
    try {
      await deleteAnnouncement(announcement.id);
      setAnnouncements(announcements.filter((a) => a.id !== announcement.id));
    } catch (err) {
      console.error("Delete failed:", err);
      setError(err?.message || "Could not remove the announcement.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-coordination-hub">
      <AdminTopBar title="Coordination Hub" />

      <div className="content">
        {error && <div className="admin-error">{error}</div>}

        <div className="card admin-table-card">
          <div className="admin-tabs">
            <button
              type="button"
              className={`admin-tab ${tab === "inbox" ? "admin-tab--active" : ""}`}
              onClick={() => setTab("inbox")}
            >
              <MessageSquare size={14} /> Support Inbox
            </button>
            <button
              type="button"
              className={`admin-tab ${tab === "announcements" ? "admin-tab--active" : ""}`}
              onClick={() => setTab("announcements")}
            >
              <Megaphone size={14} /> Announcements ({announcements.length})
            </button>
            {tab === "inbox" && (
              <button type="button" className="ui-btn ui-btn--ghost" onClick={refreshInbox}>
                <RefreshCw size={14} /> Refresh
              </button>
            )}
          </div>

          {loading && <div className="admin-empty">Loading...</div>}
          {!loading && tab === "inbox" && (
            <SupportInbox
              messages={messages}
              selectedEmail={selectedEmail}
              onSelect={setSelectedEmail}
              onReply={reply}
              sending={busy}
            />
          )}
          {!loading && tab === "announcements" && (
            <Announcements announcements={announcements} onPost={post} onDelete={remove} busy={busy} />
          )}
        </div>
      </div>
    </div>
  );
}

export default CoordinationHub;
