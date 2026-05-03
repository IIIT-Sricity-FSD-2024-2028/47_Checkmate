/* ═══════════════════════════════════════════
   messages.js  —  Staff Messages & Requests
   Uses CoordHub for event-wise real-time messaging
═══════════════════════════════════════════ */

function initMessages() {
  if (!window.CoordHub) { console.error('CoordHub not loaded'); return; }
  const Hub = window.CoordHub;
  const session = Hub.getSession();

  let selectedEventId = null;
  let _lastCount = -1;

  /* ── Build event list in sidebar ────── */
  function buildEventList() {
    const events = Hub.getEventsForUser();
    const convList = document.querySelector('.msg-conv-list');
    if (!convList) return;

    if (events.length === 0) {
      convList.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text3,#94a3b8);font-size:13px;">No live events assigned to you.</div>';
      const cName = document.querySelector('.chat-name');
      const cStatus = document.querySelector('.chat-status');
      if (cName) cName.innerHTML = 'No active event';
      if (cStatus) cStatus.innerHTML = '';
      if (chatBody) chatBody.innerHTML = '<div style="text-align:center;color:var(--text3,#94a3b8);padding:60px;font-size:13px;">You have no live events to coordinate.</div>';
      return;
    }

    convList.innerHTML = events.map((e, i) => {
      const init = Hub.initials(e.name);
      const colors = ['linear-gradient(135deg,#e91e8c,#c2185b)', 'linear-gradient(135deg,#06b6d4,#0891b2)', 'linear-gradient(135deg,#a855f7,#7c3aed)', 'linear-gradient(135deg,#22c55e,#16a34a)'];
      return `
        <div class="msg-conv-item ${i === 0 ? 'active' : ''}" data-event-id="${e.id}">
          <div class="msg-conv-avatar" style="background:${colors[i % colors.length]}">${init}<div class="online-dot"></div></div>
          <div class="msg-conv-body">
            <div class="msg-conv-name">${e.name}<span class="msg-conv-time">${e.status}</span></div>
            <div class="msg-conv-preview">${e.vendor || 'Event Coordinator'}</div>
          </div>
        </div>`;
    }).join('');

    convList.querySelectorAll('.msg-conv-item').forEach(item => {
      item.addEventListener('click', () => {
        convList.querySelectorAll('.msg-conv-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        selectedEventId = item.dataset.eventId;
        _lastCount = -1;
        updateChatHeader();
        renderChat();
      });
    });

    selectedEventId = events[0].id;
    updateChatHeader();
  }

  function updateChatHeader() {
    if (!selectedEventId) return;
    const event = DB.find('events', selectedEventId);
    const cName = document.querySelector('.chat-name');
    const cStatus = document.querySelector('.chat-status');
    if (cName && event) cName.innerHTML = `${event.name} <span style="font-size:10px;background:var(--cyan-dim,rgba(6,182,212,0.15));color:var(--cyan,#06b6d4);padding:1px 6px;border-radius:10px;font-weight:700;vertical-align:middle">Event</span>`;
    if (cStatus && event) cStatus.textContent = `● ${event.status} — ${event.vendor || 'Coordinator'}`;
  }

  /* ── Render chat ──────────────────── */
  function renderChat() {
    const chatEl = document.getElementById('chat-messages');
    if (!chatEl || !selectedEventId) return;

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
      chatEl.innerHTML = '<div style="text-align:center;color:var(--text3,#94a3b8);padding:60px 20px;font-size:13px;">No messages yet. Send a message to start the conversation.</div>';
      return;
    }

    chatEl.innerHTML = msgs.map(m => {
      const isSelf = m.sender?.toLowerCase() === session.name?.toLowerCase();
      const isSystem = m.type === 'issue' || m.type === 'contingency';
      const time = Hub.timeStr(m.createdAt);

      if (isSystem) {
        return `<div class="msg-enter-anim" style="text-align:center;font-size:11px;color:var(--pink,#e91e8c);padding:12px 20px;margin:10px auto;max-width:80%;background:rgba(233,30,140,0.1);border-radius:12px;border:1px solid rgba(233,30,140,0.2);font-weight:600;">${m.text}<div style="font-size:10px;color:var(--text3,#94a3b8);margin-top:4px;">${time}</div></div>`;
      }

      if (isSelf) {
        return `<div class="msg-bubble-wrap me msg-enter-anim"><div class="msg-bubble">${m.text}</div><div class="msg-time">${time}</div></div>`;
      }

      return `<div class="msg-bubble-wrap them msg-enter-anim">
        <div class="msg-sender">${m.sender} <span class="sender-badge" style="background:rgba(6,182,212,0.15);color:var(--cyan,#06b6d4);padding:1px 5px;border-radius:8px;font-size:9px;font-weight:700">${m.senderRole}</span></div>
        <div class="msg-bubble">${m.text}</div>
        <div class="msg-time">${time}</div>
      </div>`;
    }).join('');

    chatEl.scrollTop = chatEl.scrollHeight;
  }

  /* ── Send message ────────────────── */
  window.sendMsg = function() {
    const input = document.getElementById('msg-input');
    if (!input || !input.value.trim() || !selectedEventId) return;

    Hub.sendMsg(selectedEventId, input.value.trim(), 'staff');
    input.value = '';
    _lastCount = -1;
    renderChat();
  };

  // Attach listeners
  const sendBtn = document.querySelector('.chat-send-btn');
  if (sendBtn) sendBtn.addEventListener('click', window.sendMsg);
  const msgInput = document.getElementById('msg-input');
  if (msgInput) msgInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); window.sendMsg(); } });

  /* ── Tab switching (vendor/client) ── */
  window.switchTab = function(type) {
    document.querySelectorAll('.msg-tab').forEach(e => e.style.opacity = '0.5');
    const tab = document.getElementById('tab-' + type);
    if (tab) tab.style.opacity = '1';
    // Both tabs show the same event list now
    buildEventList();
  };

  /* ── Request Modal ────────────────── */
  const btnCreateRequest = document.getElementById('btnCreateRequest');
  const requestModal = document.getElementById('requestModal');
  const reqClose = document.getElementById('reqClose');
  const reqCancel = document.getElementById('reqCancel');
  const reqSubmit = document.getElementById('reqSubmit');
  const reqEventId = document.getElementById('reqEventId');

  function populateLiveEvents() {
    if (!reqEventId) return;
    const events = Hub.getEventsForUser();
    reqEventId.innerHTML = events.length === 0
      ? '<option value="">No Active Events Found</option>'
      : events.map(e => `<option value="${e.id}">${e.name} (${e.status.toUpperCase()})</option>`).join('');
  }

  function openModal() {
    if (!requestModal) return;
    populateLiveEvents();
    if (document.getElementById('reqItem')) document.getElementById('reqItem').value = '';
    if (document.getElementById('reqQty')) document.getElementById('reqQty').value = '1';
    requestModal.style.display = 'flex';
  }
  function closeModal() { if (requestModal) requestModal.style.display = 'none'; }

  if (btnCreateRequest) btnCreateRequest.addEventListener('click', openModal);
  if (reqClose) reqClose.addEventListener('click', closeModal);
  if (reqCancel) reqCancel.addEventListener('click', closeModal);
  if (requestModal) requestModal.addEventListener('click', e => { if (e.target === requestModal) closeModal(); });

  if (reqSubmit) {
    reqSubmit.addEventListener('click', () => {
      const evId = reqEventId?.value;
      const type = document.getElementById('reqType')?.value;
      const item = document.getElementById('reqItem')?.value.trim();
      const qty = parseInt(document.getElementById('reqQty')?.value, 10);

      if (!evId) { alert("Please select a target event."); return; }
      if (!item) { alert("Please specify the requested item."); return; }
      if (!qty || qty < 1) { alert("Enter a valid quantity."); return; }

      const newReq = { id: 'sr_' + Date.now(), eventId: evId, type, item, qty, status: 'pending', requestedBy: session.name, createdAt: new Date().toISOString() };
      if (!DB.get('staffRequests')) DB.set('staffRequests', []);
      DB.add('staffRequests', newReq);

      // Post to coordination chat
      Hub.sendMsg(evId, `📋 Dispatch Request: ${qty}x ${item} (${type})`, 'staff');

      alert("Request dispatched to coordinator!");
      closeModal();
      _lastCount = -1;
      renderChat();
    });
  }

  /* ── Boot ──────────────────────────── */
  buildEventList();
  renderChat();

  // Poll
  setInterval(() => { _lastCount = -1; renderChat(); }, Hub.POLL_MS);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(initMessages, 500));
} else {
  setTimeout(initMessages, 500);
}
