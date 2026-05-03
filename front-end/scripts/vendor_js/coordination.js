/* ═══════════════════════════════════════════
   coordination.js  —  Vendor Coordination Hub
   Uses CoordHub shared module for event-wise
   real-time messaging across all tabs.
═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  if (!window.CoordHub) { console.error('CoordHub not loaded'); return; }

  const Hub = window.CoordHub;
  const session = Hub.getSession();

  /* ── Detect which page we're on ──────── */
  const path = window.location.href;
  let pageChannel = 'all';
  if (path.includes('coordination-staff'))  pageChannel = 'staff';
  if (path.includes('coordination-client')) pageChannel = 'client';

  /* ── DOM refs ────────────────────────── */
  const chatBody    = document.getElementById('messagesArea') || document.querySelector('.ch-messages');
  const input       = document.getElementById('msgInput')     || document.querySelector('.ch-input');
  const sendBtn     = document.getElementById('sendBtn')      || document.querySelector('.ch-send-btn');
  const introSub    = document.querySelector('.ch-intro p')   || document.querySelector('.ch-intro-sub');
  const participantList = document.querySelector('.ch-participant-list');

  /* ── Event selector ──────────────────── */
  let selectedEventId = null;

  function buildEventSelector() {
    const events = Hub.getEventsForUser();
    const introEl = document.querySelector('.ch-intro') || document.querySelector('.content > div:first-child');
    if (!introEl) return;
    const old = document.getElementById('coordEventSelector');
    if (old) old.remove();

    if (events.length === 0) {
      if (introSub) introSub.textContent = 'No events available';
      return;
    }

    const wrap = document.createElement('div');
    wrap.id = 'coordEventSelector';
    wrap.style.cssText = 'display:flex;align-items:center;gap:12px;margin-top:8px;';
    wrap.innerHTML = `
      <label style="font-size:13px;color:var(--text-secondary);font-weight:500;">Event:</label>
      <select id="coordEventSelect" style="background:#1e1b2e;border:1px solid var(--border);border-radius:var(--radius-sm);padding:8px 14px;color:var(--text-primary);font-family:var(--font-body);font-size:13px;outline:none;min-width:220px;cursor:pointer;appearance:none;-webkit-appearance:none;">
        ${events.map(e => `<option value="${e.id}" style="background:#1e1b2e;color:#e2e8f0;">${e.name} (${e.status})</option>`).join('')}
      </select>
      <span style="margin-left:-28px;pointer-events:none;color:var(--text-muted);font-size:14px;">▾</span>`;
    introEl.appendChild(wrap);

    const sel = document.getElementById('coordEventSelect');
    sel.addEventListener('change', () => {
      selectedEventId = sel.value;
      refreshAll();
    });

    selectedEventId = events[0].id;
    refreshAll();
  }

  /* ── Render participants ─────────────── */
  function renderParticipants() {
    if (!participantList || !selectedEventId) return;

    const parts = Hub.getParticipantsForEvent(selectedEventId);
    if (parts.length === 0) {
      participantList.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:8px;">No participants found for this event.</div>';
      return;
    }

    participantList.innerHTML = parts.map(p => {
      const isSelf = p.name.toLowerCase() === session.name.toLowerCase();
      const activeClass = isSelf ? 'active-user' : '';
      const bgColor = Hub.COLORS[p.color] || Hub.COLORS.teal;
      const badge = p.type === 'vendor' ? '<span style="background:rgba(233,30,140,0.15);color:var(--pink);font-size:9.5px;font-weight:700;padding:1px 6px;border-radius:4px;text-transform:uppercase;margin-right:4px;">Vendor</span>'
        : p.type === 'client' ? '<span style="background:rgba(168,85,247,0.15);color:#d8b4fe;font-size:9.5px;font-weight:700;padding:1px 6px;border-radius:4px;text-transform:uppercase;margin-right:4px;">Client</span>'
        : '<span style="background:rgba(59,130,246,0.15);color:#93c5fd;font-size:9.5px;font-weight:700;padding:1px 6px;border-radius:4px;text-transform:uppercase;margin-right:4px;">Staff</span>';

      return `
        <div class="ch-participant ${activeClass}">
          <div style="width:34px;height:34px;border-radius:50%;background:${bgColor};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:#fff;flex-shrink:0;position:relative;">
            ${p.initials}<span class="ch-online-dot" style="width:9px;height:9px;border-radius:50%;background:var(--green);border:2px solid var(--bg-card);position:absolute;bottom:0;right:0;"></span>
          </div>
          <div class="ch-participant-info">
            <div class="ch-participant-name">${p.name}</div>
            <div class="ch-participant-role">${badge}${p.role}</div>
          </div>
        </div>`;
    }).join('');
  }

  /* ── Render messages ─────────────────── */
  let _lastMsgCount = -1;

  function renderMessages() {
    if (!chatBody || !selectedEventId) return;

    // Merge coordination messages + issue messages
    let msgs = Hub.getMessagesForEvent(selectedEventId, pageChannel);

    // Also inject issues as system messages if not already in coordination
    const issues = Hub.getIssuesForEvent(selectedEventId);
    issues.forEach(iss => {
      const alreadyExists = msgs.some(m => m.id === 'ISS_' + iss.id);
      if (!alreadyExists && iss.title) {
        msgs.push({
          id: 'ISS_' + iss.id,
          eventId: selectedEventId,
          channel: 'all',
          sender: iss.reporter || 'System',
          senderRole: 'System',
          senderInitials: '⚠',
          text: `${iss.title}${iss.desc ? ' — ' + iss.desc : ''}`,
          type: 'issue',
          createdAt: iss.createdAt || new Date().toISOString()
        });
      }
    });

    // Sort by time
    msgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // Skip re-render if nothing changed
    if (msgs.length === _lastMsgCount) return;
    _lastMsgCount = msgs.length;

    if (msgs.length === 0) {
      chatBody.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:40px;font-size:13px;"><i data-lucide="message-circle" style="width:40px;height:40px;margin-bottom:12px;opacity:0.3;display:block;margin:0 auto 12px;"></i>No messages yet. Start the conversation!</div>';
      if (window.lucide) lucide.createIcons();
      return;
    }

    chatBody.innerHTML = msgs.map(m => Hub.renderMsgBubble(m, session.name)).join('');
    chatBody.scrollTop = chatBody.scrollHeight;
    if (window.lucide) lucide.createIcons();
  }

  /* ── Render contingency plans ────────── */
  function renderContingencyPanel() {
    const listEl = document.querySelector('.ch-contingency__list');
    const triggerBtn = document.querySelector('.ch-trigger-btn');
    if (!listEl || !selectedEventId) return;

    const plans = Hub.getContingencyPlans(selectedEventId);
    if (!plans.length) {
      listEl.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:8px;text-align:center;">No contingency plans defined.</div>';
      return;
    }

    listEl.innerHTML = plans.map(p => {
      const isTriggered = p.status === 'triggered';
      return `
        <div class="ch-alert-item" data-plan-id="${p.id}" style="${isTriggered ? 'opacity:0.5;' : ''}">
          <i data-lucide="${isTriggered ? 'check-circle' : 'alert-triangle'}"></i>
          <div class="ch-alert-item__body">
            <div class="ch-alert-item__title">${p.problem}${isTriggered ? ' ✓ Triggered' : ''}</div>
            <div class="ch-alert-item__sub">→ ${p.solution}</div>
          </div>
          ${!isTriggered ? `<button class="ctg-trigger-single" data-plan-id="${p.id}" style="background:var(--orange);border:none;color:#fff;padding:4px 10px;border-radius:4px;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;">Trigger</button>` : ''}
        </div>`;
    }).join('');

    // Individual trigger buttons
    listEl.querySelectorAll('.ctg-trigger-single').forEach(btn => {
      btn.addEventListener('click', () => {
        const planId = btn.dataset.planId;
        const plan = plans.find(p => p.id === planId);
        if (!plan) return;

        if (window.Confirm) {
          Confirm.ask({
            title: 'Trigger Contingency?',
            msg: `This will activate: "${plan.problem}" and broadcast to all participants.`,
            okLabel: 'Trigger Now',
            okColor: '#ef4444'
          }).then(ok => {
            if (!ok) return;
            Hub.triggerContingency(selectedEventId, plan);
            Toast.show('🚨 Contingency triggered and broadcast!', 'error', 4000);
            _lastMsgCount = -1;
            refreshAll();
          });
        } else {
          Hub.triggerContingency(selectedEventId, plan);
          _lastMsgCount = -1;
          refreshAll();
        }
      });
    });

    if (window.lucide) lucide.createIcons();
  }

  /* ── Render reported issues panel ───── */
  function renderIssuesPanel() {
    const box = document.getElementById('coordIssuesBox');
    const list = document.getElementById('coordIssuesList');
    if (!box || !list || !selectedEventId) return;

    const issues = Hub.getIssuesForEvent(selectedEventId);
    if (!issues.length) {
      box.style.display = 'none';
      return;
    }

    box.style.display = 'block';
    list.innerHTML = issues.slice(-5).map(iss => {
      const isHigh = (iss.priority || '').toLowerCase() === 'high' || (iss.priority || '').toLowerCase() === 'critical';
      const color = isHigh ? 'var(--red)' : 'var(--orange)';
      const bg = isHigh ? 'rgba(239,68,68,0.06)' : 'rgba(234,179,8,0.06)';
      const border = isHigh ? 'rgba(239,68,68,0.2)' : 'rgba(234,179,8,0.2)';
      return `
        <div class="ch-alert-item" style="background:${bg};border:1px solid ${border}">
          <i data-lucide="alert-triangle" style="color:${color}"></i>
          <div class="ch-alert-item__body">
            <div class="ch-alert-item__title">${iss.title}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:3px">${iss.desc || ''}</div>
          </div>
        </div>`;
    }).join('');
    if (window.lucide) lucide.createIcons();
  }

  /* ── Render staff roster (staff page) ── */
  function renderStaffRoster() {
    const rosterList = document.querySelector('.cs-roster-list');
    if (!rosterList || !selectedEventId) return;

    const assignments = (DB.getAll('staffAssignments') || []).filter(a => a.eventId === selectedEventId);
    const allStaff = DB.getAll('staff') || [];

    if (assignments.length === 0) {
      rosterList.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:12px;text-align:center;">No staff assigned to this event.</div>';
      return;
    }

    rosterList.innerHTML = assignments.map(a => {
      const s = allStaff.find(st => st.id === a.staffId);
      if (!s) return '';
      const color = Hub.COLORS[s.avatar] || Hub.COLORS.teal;
      return `
        <div class="cs-staff-item">
          <div style="width:30px;height:30px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;color:#fff;flex-shrink:0;position:relative;">
            ${s.initials || Hub.initials(s.name)}<span class="online" style="width:8px;height:8px;border-radius:50%;background:var(--green);border:2px solid var(--bg-card);position:absolute;bottom:0;right:0;"></span>
          </div>
          <div class="cs-staff-info">
            <div class="cs-staff-name">${s.name}</div>
            <div class="cs-staff-role">${s.role}</div>
          </div>
          <span class="cs-staff-status on-duty" style="font-size:10.5px;font-weight:600;padding:2px 8px;border-radius:4px;background:rgba(34,197,94,0.12);color:var(--green);">Active</span>
        </div>`;
    }).join('');
  }

  /* ── Render client list (client page) ── */
  function renderClientList() {
    const clientList = document.querySelector('.cc-client-list');
    if (!clientList || !selectedEventId) return;

    const event = DB.find('events', selectedEventId);
    if (!event || !event.client) {
      clientList.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:12px;text-align:center;">No client linked to this event.</div>';
      return;
    }

    const color = Hub.COLORS.purple;
    clientList.innerHTML = `
      <div class="cc-client-item active-chat">
        <div style="width:36px;height:36px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:#fff;flex-shrink:0;">${Hub.initials(event.client)}</div>
        <div class="cc-client-info">
          <div class="cc-client-name">${event.client}</div>
          <div class="cc-client-event">${event.name}</div>
        </div>
      </div>`;
  }

  /* ── Send handler ────────────────────── */
  function handleSend() {
    if (!input || !selectedEventId) return;
    const text = input.value.trim();
    if (!text) return;

    // Determine channel based on page
    const channel = pageChannel === 'all' ? 'all' : pageChannel;
    Hub.sendMsg(selectedEventId, text, channel);
    input.value = '';
    _lastMsgCount = -1;
    renderMessages();
  }

  sendBtn?.addEventListener('click', handleSend);
  input?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  });

  /* ── Section tab navigation ─────────── */
  document.querySelectorAll('.ch-section-tab').forEach(tab => {
    tab.addEventListener('click', e => {
      e.preventDefault();
      const href = tab.getAttribute('href');
      if (href && href !== '#') window.location.href = href;
    });
  });

  /* ── Channel tabs (filter messages) ─── */
  document.querySelectorAll('.ch-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.ch-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const ch = tab.dataset.ch || tab.textContent.trim().toLowerCase();
      pageChannel = ch === 'all' ? 'all' : ch;
      _lastMsgCount = -1;
      renderMessages();
    });
  });

  /* ── Task management (staff page) ────── */
  const btnAddTaskModal = document.getElementById('btnAddTaskModal');
  const addTaskOverlay = document.getElementById('addTaskOverlay');
  const btnCloseTaskModal = document.getElementById('btnCloseTaskModal');
  const btnCancelTask = document.getElementById('btnCancelTask');
  const btnSaveTask = document.getElementById('btnSaveTask');

  function renderTasks() {
    const list = document.getElementById('chTaskList');
    const tracker = document.getElementById('tasksTracker');
    if (!list) return;

    let tasks = DB.get('staffTasks') || [];
    if (tasks.length === 0) {
      list.innerHTML = '<div style="font-size:12px;color:var(--text-muted);text-align:center;padding:20px;">No tasks assigned yet.</div>';
      if (tracker) tracker.textContent = '0 tasks';
      return;
    }

    const completed = tasks.filter(t => t.done).length;
    if (tracker) tracker.textContent = `${completed} of ${tasks.length} completed`;

    list.innerHTML = tasks.map(t => {
      const staff = DB.find('staff', t.assignee);
      const staffName = staff ? staff.name : 'Unknown';
      const checked = t.done ? 'done-check' : '';
      const pxColor = t.priority === 'high' ? 'var(--red)' : (t.priority === 'medium' ? 'var(--yellow)' : 'var(--blue)');
      return `
        <div class="ch-task ${t.done ? 'done' : ''}" style="background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;display:flex;flex-direction:column;gap:8px;">
          <div style="display:flex;align-items:flex-start;gap:10px;">
            <div class="ch-task__check ${checked}" data-id="${t.id}" style="width:16px;height:16px;border-radius:4px;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;">${t.done ? '<i data-lucide="check" style="width:10px;height:10px"></i>' : ''}</div>
            <div style="font-size:13.5px;font-weight:600;color:${t.done ? 'var(--text-muted)' : 'var(--text-primary)'};text-decoration:${t.done ? 'line-through' : 'none'};">${t.title}</div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;padding-left:26px;font-size:11px;">
            <span style="color:var(--text-secondary);"><i data-lucide="user" style="width:11px;height:11px"></i> ${staffName}</span>
            <span style="padding:2px 6px;border-radius:4px;background:${pxColor}20;color:${pxColor};font-weight:700;font-size:9.5px;text-transform:uppercase;">${t.priority}</span>
          </div>
        </div>`;
    }).join('');

    document.querySelectorAll('.ch-task__check').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const allTasks = DB.get('staffTasks') || [];
        const task = allTasks.find(x => x.id === id);
        if (task) { task.done = !task.done; DB.set('staffTasks', allTasks); renderTasks(); }
      });
    });
    if (window.lucide) lucide.createIcons();
  }

  function populateTaskDropdown() {
    const sel = document.getElementById('taskStaffSelect');
    if (!sel) return;
    const allStaff = DB.getAll('staff') || [];
    sel.innerHTML = allStaff.length === 0
      ? '<option value="">No staff available</option>'
      : allStaff.map(s => `<option value="${s.id}">${s.name} (${s.role})</option>`).join('');
  }

  if (btnAddTaskModal) {
    btnAddTaskModal.addEventListener('click', () => { populateTaskDropdown(); document.getElementById('taskDescInput').value = ''; addTaskOverlay.style.display = 'flex'; });
  }
  if (btnCloseTaskModal) btnCloseTaskModal.addEventListener('click', () => addTaskOverlay.style.display = 'none');
  if (btnCancelTask) btnCancelTask.addEventListener('click', () => addTaskOverlay.style.display = 'none');
  if (btnSaveTask) {
    btnSaveTask.addEventListener('click', () => {
      const desc = document.getElementById('taskDescInput').value.trim();
      const staffId = document.getElementById('taskStaffSelect').value;
      const priority = document.getElementById('taskPrioritySelect').value;
      if (!desc) return Toast.show('Enter a task description', 'error');
      if (!staffId) return Toast.show('Select a staff member', 'error');
      const allTasks = DB.get('staffTasks') || [];
      allTasks.push({ id: 't' + Date.now(), title: desc, assignee: staffId, priority, done: false, due: 'Today' });
      DB.set('staffTasks', allTasks);
      addTaskOverlay.style.display = 'none';
      renderTasks();
      Toast.show('Task assigned!', 'success');
    });
  }

  /* ── Refresh all ─────────────────────── */
  function refreshAll() {
    const event = selectedEventId ? DB.find('events', selectedEventId) : null;
    if (introSub && event) {
      introSub.textContent = `${event.name} — Real-time collaboration`;
    }
    renderParticipants();
    renderMessages();
    renderContingencyPanel();
    renderIssuesPanel();
    renderStaffRoster();
    renderClientList();
    renderTasks();
  }

  /* ── Boot ─────────────────────────────── */
  buildEventSelector();

  /* ── Real-time polling ─────────────── */
  setInterval(() => {
    _lastMsgCount = -1;
    renderMessages();
    renderIssuesPanel();
  }, Hub.POLL_MS);
});