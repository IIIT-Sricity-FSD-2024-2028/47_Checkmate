/* ═══════════════════════════════════════════
   coordination.js  —  Coordination Hub
   Works for:
     coordination.html        (vendor–vendor)
     coordination-staff.html  (vendor–staff)
     coordination-client.html (vendor–client)
   • Renders message history from DB
   • Send new messages (persisted to DB)
   • Typing indicator (simulated)
   • Section tab navigation
   • Real-time poll every 3s
═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Load Participants (Staff & Coordinators) ── */
  const session = DB.getSession();
  const listWrapper = document.querySelector('.ch-participant-list');
  if (listWrapper) {
    const allStaff = DB.getAll('staff') || [];
    
    // Determine vendor specialty keyword for filtering
    let vendorKeyword = '';
    if (session.role.toLowerCase().includes('audio')) vendorKeyword = 'audio|av|sound';
    else if (session.role.toLowerCase().includes('catering')) vendorKeyword = 'catering|food|kitchen';
    else if (session.role.toLowerCase().includes('security')) vendorKeyword = 'security|guard';

    const regex = vendorKeyword ? new RegExp(vendorKeyword, 'i') : null;

    // Filter staff according to user rule
    const filteredStaff = allStaff.filter(s => {
      if (session.role === 'Coordinator' || session.role === 'Event Coordinator') return true;
      if (s.role.includes('Coordinator') || s.name === session.user || s.role === session.role) return true;
      if (regex && regex.test(s.role)) return true;
      return false;
    });

    listWrapper.innerHTML = filteredStaff.map(s => {
      const isCoordinator = s.role.toLowerCase().includes('coordinator');
      const coordBadge = isCoordinator ? '<span class="role-badge-coord">Coordinator</span>' : '';
      const dotClass = (s.status === 'available') ? '<span class="ch-online-dot"></span>' : '';
      const isActive = (s.name === session.user || s.role === session.role) ? 'active-user' : '';
      
      return `
        <div class="ch-participant ${isActive}">
          <div class="ch-avatar ch-avatar--${s.avatar || 'teal'}" style="background:var(--${s.avatar || 'teal'})">
            ${s.initials}${dotClass}
          </div>
          <div class="ch-participant-info">
            <div class="ch-participant-name">${s.name}</div>
            <div class="ch-participant-role">
              ${coordBadge}
              ${s.role}
            </div>
          </div>
        </div>`;
    }).join('');
  }

  /* ── Detect channel ─────────────────── */
  const path = window.location.pathname + window.location.href;
  let channel = 'Vendor-Vendor';
  if (path.includes('coordination-staff'))  channel = 'Vendor-Staff';
  if (path.includes('coordination-client')) channel = 'Vendor-Client';

  /* ── DOM refs ───────────────────────── */
  const chatBody = document.querySelector('.ch-chat__body, .ch-messages, [class*="ch-chat"] .ch-messages');
  const input    = document.querySelector('.ch-input, .ch-chat__input input, .ch-compose input, input[placeholder*="message"], input[placeholder*="Message"]');
  const sendBtn  = document.querySelector('.ch-send-btn, .ch-chat__send, [data-action="send"], button[class*="send"]');

  /* ── Avatar color map ───────────────── */
  const COLORS = {
    pink:'#e91e8c', teal:'#0e7490', purple:'#7e22ce',
    green:'#15803d', orange:'#c2410c', blue:'#1d4ed8',
  };

  function avatarStyle(color) {
    const bg = COLORS[color] || COLORS.pink;
    return `background:${bg};width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:700;font-size:12px;color:#fff;flex-shrink:0`;
  }

  function renderMessages() {
    if (!chatBody) return;

    if (!window.MsgService) return;

    const msgs = window.MsgService.getMessagesByConversation(channel);

    let html = msgs.map(m => {
        // Vendor perspective: "Self" is if senderRole is Vendor
        const isSelf = m.senderRole === 'Vendor';
        
        let mObj = {
            isSystem: m.message && m.message.startsWith('[SYSTEM]'),
            text: m.message,
            time: window.MsgService.formatTime(m.timestamp),
            sender: m.senderName || m.senderRole,
            avatar: isSelf ? 'pink' : 'teal',
            initials: m.senderName ? m.senderName[0] : m.senderRole[0],
            statusTick: isSelf ? `<span style="font-size:10px;margin-left:5px;opacity:0.7">✓ ${m.status}</span>` : ''
        };

        if (mObj.isSystem) {
            mObj.sysClass = 'info';
        }

        return isSelf ? renderSelf(mObj) : renderOther(mObj);
    }).join('');

    if (chatBody.innerHTML !== html) {
        chatBody.innerHTML = html;
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    renderIssues();
    
    // Mark as read
    window.MsgService.markConversationAsRead(channel, 'Vendor');
  }

  // Hook up event listeners for real-time reactivity
  window.addEventListener('messageStorageUpdated', renderMessages);
  window.addEventListener('newMessage', renderMessages);
  window.addEventListener('messageStatusUpdated', renderMessages);

  function renderIssues() {
    const box = document.getElementById('coordIssuesBox');
    const list = document.getElementById('coordIssuesList');
    if (!box || !list) return;

    const issues = DB.getAll('issues');
    if (!issues.length) {
      box.style.display = 'none';
      return;
    }

    box.style.display = 'block';
    list.innerHTML = issues.map(iss => {
      const isHigh = iss.priority.toLowerCase() === 'high' || iss.priority.toLowerCase() === 'critical';
      const color = isHigh ? 'var(--red)' : 'var(--orange)';
      const bg = isHigh ? 'rgba(239,68,68,0.06)' : 'rgba(234,179,8,0.06)';
      const border = isHigh ? 'rgba(239,68,68,0.2)' : 'rgba(234,179,8,0.2)';
      const evName = iss.event ? (DB.find('events', iss.event)?.name || iss.event) : 'General';
      
      return `
        <div class="ch-alert-item" style="background:${bg};border:1px solid ${border}">
          <i data-lucide="alert-triangle" style="color:${color}"></i>
          <div class="ch-alert-item__body">
            <div class="ch-alert-item__title">${iss.title}</div>
            <div class="ch-alert-item__sub">→ ${evName}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:4px">${iss.desc}</div>
          </div>
        </div>`;
    }).join('');
    lucide.createIcons();
  }

  function renderOther(m) {
    if (m.isSystem) {
      const icon = m.sysClass === 'alert' ? 'alert-triangle' : (m.sysClass === 'success' ? 'check-circle' : 'zap');
      return `
        <div class="ch-sys-msg ${m.sysClass || 'info'}">
          <i data-lucide="${icon}" style="width:13px;height:13px"></i>
          ${m.text}
          <span class="sys-time">${m.time}</span>
        </div>`;
    }
    return `
      <div class="msg-enter-anim" style="display:flex;align-items:flex-end;gap:10px;margin-bottom:16px">
        <div style="${avatarStyle(m.avatar || 'teal')}">${m.initials}</div>
        <div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-bottom:4px">${m.sender}</div>
          <div style="background:rgba(255,255,255,0.06);border:1px solid var(--border);border-radius:12px 12px 12px 4px;padding:12px 16px;max-width:380px;font-size:13.5px;color:var(--text-secondary);line-height:1.55">${m.text}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px">${m.time}</div>
        </div>
      </div>`;
  }

  function renderSelf(m) {
    return `
      <div class="msg-enter-anim" style="display:flex;align-items:flex-end;gap:10px;margin-bottom:16px;justify-content:flex-end">
        <div>
          <div style="background:linear-gradient(135deg,var(--pink),#c2185b);border-radius:12px 12px 4px 12px;padding:12px 16px;max-width:380px;font-size:13.5px;color:#fff;line-height:1.55">${m.text}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px;text-align:right">${m.time} ${m.statusTick || ''}</div>
        </div>
        <div style="${avatarStyle('pink')}">${m.initials || 'V'}</div>
      </div>`;
  }

  /* ── Send message ───────────────────── */
  function sendMessage() {
    const text = input?.value.trim();
    if (!text || !window.MsgService) return;

    let receiverRole = 'Staff';
    if (channel === 'Vendor-Vendor') receiverRole = 'Vendor';
    if (channel === 'Vendor-Client') receiverRole = 'Client';

    const session = DB.getSession();
    window.MsgService.sendMessage('Vendor', session.user || 'Elite Events Co.', receiverRole, 'Recipient', text, channel);

    if (input) input.value = '';
    renderMessages();
    showTypingIndicator();
  }

  /* ── Typing indicator ───────────────── */
  function showTypingIndicator() {
    if (!chatBody) return;
    const existing = document.getElementById('_typingIndicator');
    if (existing) existing.remove();

    const typing = document.createElement('div');
    typing.id = '_typingIndicator';
    typing.style.cssText = 'display:flex;align-items:center;gap:10px;margin-bottom:16px;opacity:0.7';
    typing.innerHTML = `
      <div style="width:34px;height:34px;border-radius:50%;background:var(--border);display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--text-muted)">…</div>
      <div style="background:rgba(255,255,255,0.06);border:1px solid var(--border);border-radius:12px 12px 12px 4px;padding:12px 16px;font-size:13.5px;color:var(--text-muted)">
        <span style="display:inline-flex;gap:4px">
          <span style="animation:_blink 1s infinite 0s">●</span>
          <span style="animation:_blink 1s infinite .3s">●</span>
          <span style="animation:_blink 1s infinite .6s">●</span>
        </span>
      </div>`;

    if (!document.getElementById('_blinkKF')) {
      const s = document.createElement('style');
      s.id = '_blinkKF';
      s.textContent = '@keyframes _blink{0%,100%{opacity:1}50%{opacity:.2}}';
      document.head.appendChild(s);
    }

    chatBody.appendChild(typing);
    chatBody.scrollTop = chatBody.scrollHeight;
    setTimeout(() => typing.remove(), 2200);
  }

  /* ── Wire send ──────────────────────── */
  sendBtn?.addEventListener('click', sendMessage);
  input?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });

  /* ── Trigger contingency broadcast ── */
  const trgBtn = document.querySelector('.ch-trigger-btn');
  if (trgBtn) {
    trgBtn.addEventListener('click', () => {
      Confirm.ask({
        title: 'Trigger Contingency',
        msg:   'This will broadcast a CRITICAL alert to all staff and clients across all channels.',
        okLabel: 'Trigger Now',
        okColor: '#ef4444'
      }).then(confirmed => {
        if (!confirmed) return;

        // Get active/live event to associate alert with
        const liveEvent = DB.getAll('events').find(e => e.status === 'live' || e.status === 'confirmed');
        const eventId   = liveEvent ? liveEvent.id : null;

        if (window._broadcastContingency) {
          // Use shared function from monitoring.js (if loaded on same page, else use local impl)
          window._broadcastContingency(eventId);
        } else {
          // Local fallback implementation
          const now = new Date().toISOString();
          const ts  = new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
          const evName = liveEvent ? liveEvent.name : '';

          // 1. Write to liveEvents
          const liveEvts = JSON.parse(localStorage.getItem('eventpro_liveEvents') || '[]');
          liveEvts.push({ id:'le_'+Date.now(), eventId: eventId||'all', type:'contingency', note:'Contingency plan triggered.', createdAt: now });
          localStorage.setItem('eventpro_liveEvents', JSON.stringify(liveEvts));

          // 2. Write to issues
          const issues = DB.getAll('issues');
          issues.push({ id:'iss_'+Date.now(), eventId: eventId||null, type:'contingency', title:'⚡ Contingency plan triggered by coordinator', createdAt: now, severity:'high', priority:'high' });
          DB.save('issues', issues);

          // 3. Broadcast via MsgService to all channels
          const broadcastText = `[SYSTEM] ⚡ CRITICAL CONTINGENCY TRIGGERED${evName?' for '+evName:''}: Immediate action required. ${ts}`;
          if (window.MsgService) {
            ['Vendor-Staff','Vendor-Client','Vendor-Vendor'].forEach(ch => {
              window.MsgService.sendMessage('Vendor','System (Coordinator)','All','All Participants', broadcastText, ch);
            });
          }

          // 4. Write contingency alert key for client/staff pages
          const contKey = JSON.parse(localStorage.getItem('eventpro_contingencyAlerts') || '[]');
          contKey.push({ id:'cnt_'+Date.now(), eventId: eventId||'all', message: broadcastText, createdAt: now, readBy:[] });
          localStorage.setItem('eventpro_contingencyAlerts', JSON.stringify(contKey));

          Toast.show('⚡ Contingency broadcast sent to all staff & clients!', 'error', 4500);
          renderMessages();
        }
      });
    });
  }

  /* ── Real-time polling (refresh messages every 2s) ── */
  setInterval(renderMessages, 2000);

  /* ── Task Management (Vendor-Staff) ── */
  const btnAddTaskModal = document.getElementById('btnAddTaskModal');
  const addTaskOverlay = document.getElementById('addTaskOverlay');
  const btnCloseTaskModal = document.getElementById('btnCloseTaskModal');
  const btnCancelTask = document.getElementById('btnCancelTask');
  const btnSaveTask = document.getElementById('btnSaveTask');

  function renderTasks() {
    const list = document.getElementById('chTaskList');
    const tracker = document.getElementById('tasksTracker');
    if (!list) return;

    let tasks = DB.get('staffTasks');
    if (!tasks) {
      tasks = [
        { id:'t1', title:'Complete catering menu finalization', assignee:'S004', priority:'medium', done:false, due:'Mar 28, 5:00 PM' },
        { id:'t2', title:'Test all audio equipment', assignee:'S002', priority:'high', done:true, due:'Mar 27, 4:00 PM' }
      ];
      DB.set('staffTasks', tasks);
    }
    
    if (tasks.length === 0) {
      list.innerHTML = '<div style="font-size:12px;color:var(--text-muted);text-align:center;padding:20px;">No tasks assigned yet.</div>';
      if(tracker) tracker.textContent = '0 tasks';
      return;
    }

    const completed = tasks.filter(t => t.done).length;
    if(tracker) tracker.textContent = `${completed} of ${tasks.length} completed`;

    list.innerHTML = tasks.map(t => {
      const staff = DB.find('staff', t.assignee);
      const staffName = staff ? staff.name : 'Unknown Staff';
      const checked = t.done ? 'done-check' : '';
      const checkedIcon = t.done ? '<i data-lucide="check" style="width:10px;height:10px"></i>' : '';
      const pxColor = t.priority === 'high' ? 'var(--red)' : (t.priority === 'medium' ? 'var(--yellow)' : 'var(--blue)');

      return `
        <div class="ch-task ${t.done ? 'done' : ''}" style="background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;display:flex;flex-direction:column;gap:8px;">
          <div style="display:flex;align-items:flex-start;gap:10px;">
            <div class="ch-task__check ${checked}" data-id="${t.id}" style="width:16px;height:16px;border-radius:4px;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;">${checkedIcon}</div>
            <div style="font-size:13.5px;font-weight:600;color:${t.done ? 'var(--text-muted)' : 'var(--text-primary)'};text-decoration:${t.done ? 'line-through' : 'none'};">${t.title}</div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;padding-left:26px;font-size:11px;">
            <span style="color:var(--text-secondary);display:flex;align-items:center;gap:4px;"><i data-lucide="user" style="width:11px;height:11px"></i> ${staffName}</span>
            <span style="padding:2px 6px;border-radius:4px;background:${pxColor}20;color:${pxColor};font-weight:700;font-size:9.5px;text-transform:uppercase;">${t.priority}</span>
            ${t.due ? `<span style="color:var(--text-muted);display:flex;align-items:center;gap:4px;"><i data-lucide="clock" style="width:11px;height:11px"></i> ${t.due}</span>` : ''}
          </div>
        </div>`;
    }).join('');

    // Reattach listeners
    document.querySelectorAll('.ch-task__check').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const allTasks = DB.get('staffTasks') || [];
        const task = allTasks.find(x => x.id === id);
        if (task) {
          task.done = !task.done;
          DB.set('staffTasks', allTasks);
          renderTasks();
        }
      });
    });

    lucide.createIcons();
  }

  function populateTaskDropdown() {
    const sel = document.getElementById('taskStaffSelect');
    if (!sel) return;
    const allStaff = DB.getAll('staff') || [];
    if (allStaff.length === 0) {
      sel.innerHTML = '<option value="">No staff available (Create one)</option>';
      return;
    }
    sel.innerHTML = allStaff.map(s => `<option value="${s.id}">${s.name} (${s.role})</option>`).join('');
  }

  if (btnAddTaskModal) {
    btnAddTaskModal.addEventListener('click', () => {
      populateTaskDropdown();
      document.getElementById('taskDescInput').value = '';
      addTaskOverlay.style.display = 'flex';
    });
  }
  if (btnCloseTaskModal) btnCloseTaskModal.addEventListener('click', () => addTaskOverlay.style.display = 'none');
  if (btnCancelTask) btnCancelTask.addEventListener('click', () => addTaskOverlay.style.display = 'none');

  if (btnSaveTask) {
    btnSaveTask.addEventListener('click', () => {
      const desc = document.getElementById('taskDescInput').value.trim();
      const staffId = document.getElementById('taskStaffSelect').value;
      const priority = document.getElementById('taskPrioritySelect').value;
      
      if (!desc) return Toast.show('Please enter a task description', 'error');
      if (!staffId) return Toast.show('Please assign the task to a staff member', 'error');

      const allTasks = DB.get('staffTasks') || [];
      allTasks.push({
        id: 't' + Date.now(),
        title: desc,
        assignee: staffId,
        priority: priority,
        done: false,
        due: 'Today'
      });
      DB.set('staffTasks', allTasks);
      addTaskOverlay.style.display = 'none';
      renderTasks();
      Toast.show('Task assigned successfully!', 'success');
    });
  }

  // Initial render calls
  renderTasks();

  /* ── Section tab navigation ─────────── */
  document.querySelectorAll('.ch-section-tab').forEach(tab => {
    tab.addEventListener('click', e => {
      e.preventDefault();
      const href = tab.getAttribute('href') || tab.dataset.href;
      if (href && href !== '#') window.location.href = href;
    });
  });

  /* ── Boot ───────────────────────────── */
  renderMessages();
});