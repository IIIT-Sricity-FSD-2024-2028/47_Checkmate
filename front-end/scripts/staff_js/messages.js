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
          type: 'issue', issueId: iss.id, createdAt: iss.createdAt || new Date().toISOString()
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

    chatEl.innerHTML = msgs.map(m => Hub.renderMsgBubble(m, session.name)).join('');
    if (window.lucide) lucide.createIcons();

    chatEl.scrollTop = chatEl.scrollHeight;

    // Bind View Report buttons
    chatEl.querySelectorAll('.ch-view-report-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const issueId = btn.dataset.issueId;
        if (issueId) Hub.showIssueModal(issueId);
      });
    });
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
    reqSubmit.onclick = () => {
      const evId = reqEventId?.value;
      const type = document.getElementById('reqType')?.value;
      const item = document.getElementById('reqItem')?.value.trim();
      const qty = parseInt(document.getElementById('reqQty')?.value, 10);
      const desc = document.getElementById('reqDesc')?.value?.trim() || '';

      if (!evId) { alert("Please select a target event."); return; }
      if (!item) { alert("Please specify the requested item."); return; }
      if (!qty || qty < 1) { alert("Enter a valid quantity."); return; }

      const ev = DB.find('events', evId);
      const evName = ev ? ev.name : evId;

      const newReq = {
        id: 'sr_' + Date.now(),
        eventId: evId,
        eventName: evName,
        type,
        item,
        qty,
        desc,
        status: 'pending',
        requestedBy: session.name,
        createdAt: new Date().toISOString()
      };

      const reqs = DB.get('staffRequests') || [];
      reqs.push(newReq);
      DB.set('staffRequests', reqs);

      // Post to coordination chat
      const descNote = desc ? ` — "${desc}"` : '';
      Hub.sendMsg(evId, `📋 Dispatch Request: ${qty}x ${item} (${type})${descNote}`, 'staff');

      // Signal vendor monitoring page
      try { localStorage.setItem('eventpro_staffRequestsUpdated', Date.now().toString()); } catch(e) {}

      // Custom in-app popup instead of alert
      const popup = document.createElement('div');
      popup.style.cssText = 'position:fixed;bottom:20px;right:20px;background:var(--pink,#e91e8c);color:#fff;padding:12px 20px;border-radius:8px;box-shadow:0 10px 25px rgba(233,30,140,0.4);font-size:14px;font-weight:600;z-index:9999;animation:fadeIn 0.3s ease-out;';
      popup.innerHTML = '<div style="display:flex;align-items:center;gap:8px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Request dispatched to vendor</div>';
      document.body.appendChild(popup);
      setTimeout(() => {
        popup.style.animation = 'fadeOut 0.3s ease-in forwards';
        setTimeout(() => popup.remove(), 300);
      }, 3000);

      closeModal();
      _lastCount = -1;
      renderChat();
    };
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
