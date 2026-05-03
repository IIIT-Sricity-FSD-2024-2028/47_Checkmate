/* ═══════════════════════════════════════════
   client_coordination.js  —  Client Messages
   Uses CoordHub for event-wise real-time messaging
═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  const chatWindow = document.getElementById('chatWindow');
  const chatInput  = document.getElementById('chatInput');
  const btnSend    = document.getElementById('btnSend');

  if (!window.CoordHub) { console.error('CoordHub not loaded'); return; }
  const Hub = window.CoordHub;
  const session = Hub.getSession();

  /* ── Get events for this client ────── */
  let selectedEventId = null;
  let _lastCount = -1;

  function buildEventSelector() {
    const events = Hub.getEventsForUser();
    const header = document.querySelector('.chat-header');
    if (!header) return;

    // Build event dropdown if multiple events
    const sidebar = document.querySelector('.chat-sidebar .chat-list');
    if (!sidebar) return;

    if (events.length === 0) {
      sidebar.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 13px;">No live events found.</div>';
      const headerName = document.querySelector('.chat-header h4');
      const headerSub = document.querySelector('.chat-header p');
      if (headerName) headerName.textContent = 'No active event';
      if (headerSub) headerSub.innerHTML = '';
      if (chatWindow) chatWindow.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:60px;font-size:13px;">You have no live events to coordinate.</div>';
      return;
    }
    if (sidebar) {
      sidebar.innerHTML = events.map((e, i) => `
        <div class="chat-item ${i === 0 ? 'active' : ''}" data-event-id="${e.id}" style="cursor:pointer;">
          <div class="chat-avatar" style="background:var(--purple);">${Hub.initials(e.name)}<div class="online-dot"></div></div>
          <div class="chat-info">
            <div class="chat-info-top"><h4>${e.name}</h4><span class="chat-time">${e.status}</span></div>
            <p>${e.vendor || 'Event Coordinator'}</p>
          </div>
        </div>
      `).join('');

      sidebar.querySelectorAll('.chat-item').forEach(item => {
        item.addEventListener('click', () => {
          sidebar.querySelectorAll('.chat-item').forEach(i => i.classList.remove('active'));
          item.classList.add('active');
          selectedEventId = item.dataset.eventId;
          _lastCount = -1;
          updateHeader();
          renderMessages();
        });
      });
    }

    selectedEventId = events[0].id;
    updateHeader();
    renderMessages();
  }

  function updateHeader() {
    if (!selectedEventId) return;
    const event = DB.find('events', selectedEventId);
    const headerName = document.querySelector('.chat-header h4');
    const headerSub = document.querySelector('.chat-header p');
    if (headerName && event) headerName.textContent = event.vendor || 'Event Coordinator';
    if (headerSub && event) headerSub.innerHTML = `<span style="width:6px;height:6px;background:var(--green);border-radius:50%;display:inline-block;"></span> Online • ${event.name}`;
  }

  function renderMessages() {
    if (!chatWindow || !selectedEventId) return;

    let msgs = Hub.getMessagesForEvent(selectedEventId, 'all');

    // Also show issues
    const issues = Hub.getIssuesForEvent(selectedEventId);
    issues.forEach(iss => {
      if (!msgs.some(m => m.id === 'ISS_' + iss.id) && iss.title) {
        msgs.push({
          id: 'ISS_' + iss.id, eventId: selectedEventId, channel: 'all',
          sender: 'System', senderRole: 'System', senderInitials: '⚠',
          text: `${iss.title}${iss.desc ? ' — ' + iss.desc : ''}`,
          type: 'issue', createdAt: iss.createdAt || new Date().toISOString()
        });
      }
    });

    msgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    if (msgs.length === _lastCount) return;
    _lastCount = msgs.length;

    if (msgs.length === 0) {
      chatWindow.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:60px;font-size:13px;">No messages yet. Start the conversation!</div>';
      return;
    }

    chatWindow.innerHTML = msgs.map(m => {
      const isSelf = m.sender?.toLowerCase() === session.name?.toLowerCase();
      const isSystem = m.type === 'issue' || m.type === 'contingency';
      const time = Hub.timeStr(m.createdAt);

      if (isSystem) {
        return `<div style="text-align:center;margin:8px 0;font-size:12px;color:#fca5a5;background:rgba(239,68,68,0.06);padding:8px 14px;border-radius:6px;border:1px solid rgba(239,68,68,0.2);">${m.text}<span style="color:var(--text-muted);margin-left:8px;font-size:11px;">${time}</span></div>`;
      }

      if (isSelf) {
        return `<div class="msg msg-sent"><div class="msg-bubble">${m.text}</div><div class="msg-time">${time}</div></div>`;
      }

      return `<div class="msg msg-received"><div style="font-size:11px;color:var(--text-secondary);margin-bottom:4px;">${m.sender} <span style="font-size:10px;padding:1px 5px;border-radius:3px;background:rgba(255,255,255,0.06);color:var(--text-muted);">${m.senderRole}</span></div><div class="msg-bubble">${m.text}</div><div class="msg-time">${time}</div></div>`;
    }).join('');

    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  function sendMessage() {
    if (!chatInput || !selectedEventId) return;
    const text = chatInput.value.trim();
    if (!text) return;

    Hub.sendMsg(selectedEventId, text, 'client');
    chatInput.value = '';
    _lastCount = -1;
    renderMessages();
  }

  if (btnSend) btnSend.addEventListener('click', sendMessage);
  if (chatInput) chatInput.addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(); });

  function initClientCoord() {
    buildEventSelector();
    setInterval(() => { _lastCount = -1; renderMessages(); }, Hub.POLL_MS);
  }

  // Boot (wait for DB)
  setTimeout(initClientCoord, 500);
});
