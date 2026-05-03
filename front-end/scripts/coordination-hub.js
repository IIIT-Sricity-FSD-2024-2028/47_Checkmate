/* ═══════════════════════════════════════════
   coordination-hub.js  —  Shared Real-Time Coordination
   Works for ALL roles: Vendor, Staff, Client
   • Event-wise chat separation
   • Real-time polling (3s)
   • Issues feed integration
   • Contingency trigger
   • Dynamic participants
═══════════════════════════════════════════ */

window.CoordHub = (() => {
  'use strict';

  const POLL_MS = 3000;
  const AVATARS = ['pink','teal','purple','green','orange','blue'];
  const COLORS  = { pink:'#e91e8c', teal:'#0e7490', purple:'#7e22ce', green:'#15803d', orange:'#c2410c', blue:'#1d4ed8' };

  /* ── Session ─────────────────────────── */
  function getSession() {
    // Use DB.getSession() if available (it handles login state)
    if (window.DB && typeof DB.getSession === 'function') {
      const s = DB.getSession();
      if (s && s.user) return { name: s.user, role: s.role || 'Vendor', email: s.email || '' };
    }
    try {
      const s = JSON.parse(sessionStorage.getItem('checkmate_session') || 'null');
      if (s) return { name: s.user?.name || s.user || 'Unknown', role: s.user?.role || s.role || 'Vendor', email: s.user?.email || '' };
    } catch {}
    return { name: 'Unknown', role: 'Vendor', email: '' };
  }

  function initials(name) {
    return (name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  function timeStr(iso) {
    try { return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  }

  /* ── Messages Storage ────────────────── */
  function getAllMessages() {
    return DB.get('coordinationMessages') || [];
  }

  function saveMessage(msg) {
    const all = getAllMessages();
    all.push(msg);
    DB.set('coordinationMessages', all);
    return msg;
  }

  function getMessagesForEvent(eventId, channel) {
    const all = getAllMessages();
    return all.filter(m => {
      if (m.eventId !== eventId) return false;
      if (!channel || channel === 'all') return true;
      if (channel === 'issues') return m.type === 'issue' || m.type === 'contingency';
      return m.channel === channel || m.channel === 'all';
    });
  }

  /* ── Events for current user ─────────── */
  function getEventsForUser() {
    const session = getSession();
    const role = session.role.toLowerCase();
    const events = DB.getAll('events') || [];

    // Vendor / Event Coordinator — only live events in coordination hub
    if (role.includes('vendor') || role.includes('coordinator') || role.includes('event')) {
      return events.filter(e => e.status === 'live');
    }

    if (role === 'staff') {
      // Staff sees events they are assigned to
      const assignments = DB.getAll('staffAssignments') || [];
      const staff = (DB.getAll('staff') || []).find(s =>
        s.email?.toLowerCase() === session.email?.toLowerCase() ||
        s.name?.toLowerCase() === session.name?.toLowerCase()
      );
      if (!staff) return [];
      const assignedEventIds = assignments.filter(a => a.staffId === staff.id).map(a => a.eventId);
      return events.filter(e => assignedEventIds.includes(e.id) && e.status === 'live');
    }

    if (role === 'client') {
      // Client sees events they booked
      const bookings = DB.getAll('bookings') || [];
      const clientBookings = bookings.filter(b =>
        b.client?.toLowerCase() === session.name?.toLowerCase()
      );
      const eventNames = clientBookings.map(b => b.eventName);
      return events.filter(e => (eventNames.includes(e.name) || e.client?.toLowerCase() === session.name?.toLowerCase()) && e.status === 'live');
    }

    return events;
  }

  /* ── Participants for event ──────────── */
  function getParticipantsForEvent(eventId) {
    const participants = [];
    const event = DB.find('events', eventId);

    // Add vendor (event creator or coordinator)
    const vendors = DB.getAll('vendors') || [];
    if (event?.vendor) {
      const v = vendors.find(v => v.name === event.vendor);
      participants.push({ name: event.vendor, role: 'Vendor', initials: initials(event.vendor), color: 'pink', type: 'vendor' });
    }

    // Add assigned staff
    const assignments = (DB.getAll('staffAssignments') || []).filter(a => a.eventId === eventId);
    const allStaff = DB.getAll('staff') || [];
    assignments.forEach(a => {
      const staff = allStaff.find(s => s.id === a.staffId);
      if (staff) {
        participants.push({ name: staff.name, role: staff.role || 'Staff', initials: staff.initials || initials(staff.name), color: staff.avatar || 'teal', type: 'staff' });
      }
    });

    // Add client
    if (event?.client) {
      participants.push({ name: event.client, role: 'Client', initials: initials(event.client), color: 'purple', type: 'client' });
    }

    return participants;
  }

  /* ── Issues for event ───────────────── */
  function getIssuesForEvent(eventId) {
    const issues = DB.getAll('issues') || [];
    return issues.filter(i => i.eventId === eventId || i.event === eventId);
  }

  /* ── Contingency plans for event ────── */
  function getContingencyPlans(eventId) {
    const allPlans = DB.get('contingencyPlans') || {};
    return allPlans[eventId] || allPlans['_default'] || [];
  }

  /* ── Send a message ─────────────────── */
  function sendMsg(eventId, text, channel) {
    const session = getSession();
    const msg = {
      id: 'MSG_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      eventId: eventId,
      channel: channel || 'all',
      sender: session.name,
      senderRole: session.role.charAt(0).toUpperCase() + session.role.slice(1),
      senderInitials: initials(session.name),
      text: text,
      type: 'message',
      createdAt: new Date().toISOString()
    };
    return saveMessage(msg);
  }

  /* ── Post issue to coordination ─────── */
  function postIssueToChat(eventId, issue) {
    const msg = {
      id: 'MSG_ISS_' + Date.now(),
      eventId: eventId,
      channel: 'all',
      sender: issue.reporter || 'System',
      senderRole: issue.reporterRole || 'System',
      senderInitials: initials(issue.reporter || 'System'),
      text: `⚠️ Issue Reported: ${issue.title} — ${issue.desc || ''}`,
      type: 'issue',
      issueId: issue.id,
      createdAt: new Date().toISOString()
    };
    return saveMessage(msg);
  }

  /* ── Trigger contingency ────────────── */
  function triggerContingency(eventId, plan) {
    const session = getSession();
    const event = DB.find('events', eventId);
    const evName = event ? event.name : 'Event';

    // 1. Write message to chat
    const msg = {
      id: 'MSG_CTG_' + Date.now(),
      eventId: eventId,
      channel: 'all',
      sender: 'System',
      senderRole: 'System',
      senderInitials: '⚡',
      text: `🚨 CONTINGENCY ACTIVATED: ${plan.problem} — Solution: ${plan.solution} (Triggered by ${session.name})`,
      type: 'contingency',
      createdAt: new Date().toISOString()
    };
    saveMessage(msg);

    // 2. Write to liveEvents
    const liveEvts = DB.get('liveEvents') || [];
    liveEvts.push({ id: 'le_' + Date.now(), eventId, type: 'contingency', note: `Contingency: ${plan.problem} — ${plan.solution}`, createdAt: msg.createdAt });
    DB.set('liveEvents', liveEvts);

    // 3. Write to issues
    const issues = DB.getAll('issues');
    issues.push({ id: 'iss_' + Date.now(), eventId, type: 'contingency', title: `⚡ Contingency: ${plan.problem}`, desc: plan.solution, createdAt: msg.createdAt, severity: 'critical', priority: 'Critical' });
    DB.save('issues', issues);

    // 4. Update plan status
    const allPlans = DB.get('contingencyPlans') || {};
    if (allPlans[eventId]) {
      const p = allPlans[eventId].find(x => x.id === plan.id);
      if (p) p.status = 'triggered';
      DB.set('contingencyPlans', allPlans);
    }

    return msg;
  }

  /* ── Render helpers ─────────────────── */
  function renderMsgBubble(m, currentUser) {
    const isSelf = m.sender?.toLowerCase() === currentUser?.toLowerCase();
    const isSystem = m.type === 'issue' || m.type === 'contingency' || m.type === 'system';
    const time = timeStr(m.createdAt);

    if (isSystem) {
      const cssClass = m.type === 'contingency' ? 'alert' : (m.type === 'issue' ? 'alert' : 'info');
      const icon = m.type === 'contingency' ? 'alert-triangle' : (m.type === 'issue' ? 'alert-triangle' : 'zap');
      const actionBtn = (m.type === 'issue' && m.issueId) ? 
        `<button onclick="CoordHub.showIssueModal('${m.issueId}')" style="background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); color:#fca5a5; padding:4px 10px; border-radius:4px; font-size:11px; cursor:pointer; margin-left:10px; white-space:nowrap; transition:all 0.2s;" onmouseover="this.style.background='rgba(239,68,68,0.25)'" onmouseout="this.style.background='rgba(239,68,68,0.15)'">View Report</button>` : '';
        
      return `<div class="ch-sys-msg ${cssClass}" style="text-align:center;font-size:12px;color:${cssClass === 'alert' ? '#fca5a5' : '#93c5fd'};background:${cssClass === 'alert' ? 'rgba(239,68,68,0.06)' : 'rgba(59,130,246,0.06)'};border:1px solid ${cssClass === 'alert' ? 'rgba(239,68,68,0.25)' : 'rgba(59,130,246,0.25)'};border-radius:6px;padding:8px 14px;display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:10px;">
        <i data-lucide="${icon}" style="width:13px;height:13px;flex-shrink:0;"></i>
        <span style="flex:1;text-align:left;">${m.text}</span>
        ${actionBtn}
        <span style="color:var(--text-muted);font-size:11px;white-space:nowrap;">${time}</span>
      </div>`;
    }

    if (isSelf) {
      return `<div style="display:flex;align-items:flex-end;gap:10px;margin-bottom:12px;justify-content:flex-end">
        <div>
          <div style="background:linear-gradient(135deg,var(--pink),#c2185b);border-radius:12px 12px 4px 12px;padding:10px 14px;max-width:380px;font-size:13.5px;color:#fff;line-height:1.5">${m.text}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:3px;text-align:right">${time}</div>
        </div>
        <div style="width:30px;height:30px;border-radius:50%;background:${COLORS.pink};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;color:#fff;flex-shrink:0">${m.senderInitials || initials(m.sender)}</div>
      </div>`;
    }

    const avatarColor = COLORS[m.avatarColor] || COLORS.teal;
    return `<div style="display:flex;align-items:flex-end;gap:10px;margin-bottom:12px">
      <div style="width:30px;height:30px;border-radius:50%;background:${avatarColor};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;color:#fff;flex-shrink:0">${m.senderInitials || initials(m.sender)}</div>
      <div>
        <div style="font-size:11.5px;color:var(--text-muted);margin-bottom:3px;display:flex;align-items:center;gap:6px">
          <span style="font-weight:600;color:var(--text-primary)">${m.sender}</span>
          <span style="font-size:10px;padding:1px 6px;border-radius:3px;background:rgba(255,255,255,0.06);color:var(--text-muted)">${m.senderRole}</span>
        </div>
        <div style="background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:0 12px 12px 12px;padding:10px 14px;max-width:380px;font-size:13.5px;color:var(--text-secondary);line-height:1.5">${m.text}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:3px">${time}</div>
      </div>
    </div>`;
  }

  /* ── Issue Detail Modal ──────────────── */
  function showIssueModal(issueId) {
    const issues = DB.getAll('issues') || [];
    const issue = issues.find(i => i.id === issueId);
    if (!issue) {
      alert('Issue not found or has been removed.');
      return;
    }
    
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
    
    const prioColor = issue.priority === 'Critical' ? 'var(--red)' : (issue.priority === 'High' ? 'var(--orange)' : (issue.priority === 'Medium' ? 'var(--yellow)' : 'var(--green)'));
    const time = timeStr(issue.createdAt || new Date().toISOString());
    const date = new Date(issue.createdAt || new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    overlay.innerHTML = `
      <div style="background:var(--bg-card,#1e1b2e);border:1px solid var(--border,#334155);border-radius:12px;width:100%;max-width:500px;box-shadow:0 10px 40px rgba(0,0,0,0.5);overflow:hidden;animation:fadeIn 0.2s ease-out;">
        <div style="padding:16px 24px;border-bottom:1px solid var(--border,#334155);display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.02);">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:36px;height:36px;border-radius:8px;background:rgba(239,68,68,0.1);color:var(--red,#ef4444);display:flex;align-items:center;justify-content:center;border:1px solid rgba(239,68,68,0.2);">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </div>
            <div>
              <h3 style="font-size:16px;font-weight:600;margin:0;color:var(--text-primary,#f8fafc);font-family:var(--font-display,sans-serif);">Issue Report</h3>
              <div style="font-size:12px;color:var(--text-muted,#94a3b8);margin-top:2px;">${issue.id}</div>
            </div>
          </div>
          <button onclick="this.closest('div[style*=\\'position:fixed\\']').remove()" style="background:transparent;border:none;color:var(--text-muted);cursor:pointer;padding:4px;border-radius:4px;" onmouseover="this.style.color='#fff';this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.color='var(--text-muted)';this.style.background='transparent'">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <div style="padding:24px;">
          <h4 style="font-size:15px;font-weight:600;color:var(--text-primary);margin-bottom:12px;line-height:1.4;">${issue.title}</h4>
          
          <div style="display:flex;gap:12px;margin-bottom:20px;">
            <div style="font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;background:rgba(255,255,255,0.06);color:var(--text-secondary);display:flex;align-items:center;gap:6px;">
              <span style="width:6px;height:6px;border-radius:50%;background:${prioColor};"></span>
              ${issue.priority} Priority
            </div>
            <div style="font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;background:rgba(255,255,255,0.06);color:var(--text-secondary);">
              Status: <span style="color:${issue.status === 'open' ? 'var(--orange,#f97316)' : 'var(--green,#22c55e)'};text-transform:capitalize;">${issue.status || 'open'}</span>
            </div>
          </div>
          
          <div style="background:rgba(0,0,0,0.2);border:1px solid var(--border,#334155);border-radius:8px;padding:16px;margin-bottom:20px;">
            <div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Description</div>
            <p style="font-size:13.5px;color:var(--text-secondary);line-height:1.6;margin:0;white-space:pre-wrap;">${issue.desc || 'No description provided.'}</p>
          </div>
          
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;background:rgba(255,255,255,0.02);border:1px solid var(--border,#334155);border-radius:8px;padding:16px;">
            <div>
              <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">Reported By</div>
              <div style="font-size:13px;font-weight:500;color:var(--text-primary);">${issue.reporter}</div>
              <div style="font-size:11.5px;color:var(--text-secondary);margin-top:2px;">${issue.reporterRole}</div>
            </div>
            <div>
              <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">Date Reported</div>
              <div style="font-size:13px;font-weight:500;color:var(--text-primary);">${date}</div>
              <div style="font-size:11.5px;color:var(--text-secondary);margin-top:2px;">${time}</div>
            </div>
          </div>
        </div>
      </div>
      <style>@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }</style>
    `;
    
    document.body.appendChild(overlay);
  }

  /* ── Public API ─────────────────────── */
  return {
    getSession,
    initials,
    timeStr,
    getAllMessages,
    getMessagesForEvent,
    getEventsForUser,
    getParticipantsForEvent,
    getIssuesForEvent,
    getContingencyPlans,
    sendMsg,
    postIssueToChat,
    triggerContingency,
    renderMsgBubble,
    showIssueModal,
    POLL_MS,
    COLORS,
    AVATARS
  };
})();
