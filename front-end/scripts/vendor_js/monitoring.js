/* ═══════════════════════════════════════════
   monitoring.js  —  Monitor Live Events
   Real-time via localStorage polling (2s).
   Sources of truth:
     • eventpro_events            → event cards + status
     • eventpro_staffAssignments  → staff tasks → timeline + progress
     • eventpro_issues            → active risks + alerts feed
     • eventpro_liveEvents        → contingency / update notes
     • eventpro_staffRequests     → approvals panel
═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  let selectedEventId   = null;
  let selectedEventData = null;
  let pollTimer         = null;
  let clockTimer        = null;

  /* ─── Duration clock ──────────────────── */
  function updateClock() {
    if (!selectedEventData?.startedAt) return;
    const diffMs    = Date.now() - new Date(selectedEventData.startedAt).getTime();
    if (diffMs <= 0) return;
    const totalMins = Math.floor(diffMs / 60000);
    const hrs  = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    const el   = document.getElementById('durationValue');
    const sub  = document.getElementById('durationSub');
    if (el) el.textContent  = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
    if (sub) {
      const st = new Date(selectedEventData.startedAt)
        .toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
      sub.textContent = `Started at ${st}`;
    }
  }

  /* ─── Strip LIVE badge text from card ─── */
  function getEventName(card) {
    const el = card.querySelector('.evt-name-text');
    return el ? el.textContent.trim() : (card.querySelector('.mon-event-card__name')?.textContent?.trim() || 'Event');
  }

  /* ─── Build event selector cards ─────── */
  function initEventCards() {
    const events = DB.getAll('events')
      .filter(e => ['live','confirmed','approved'].includes(e.status))
      .sort((a,b) => {
        if (a.status==='live' && b.status!=='live') return -1;
        if (b.status==='live' && a.status!=='live') return  1;
        return 0;
      });

    const grid = document.querySelector('.mon-event-grid');
    if (!grid) return;

    if (!events.length) {
      grid.innerHTML = '<div style="color:var(--text-muted);font-size:13px;padding:10px;">No approved events currently live.</div>';
      const badge = document.querySelector('.live-badge');
      if (badge) badge.innerHTML = '<span class="live-dot" style="background:var(--text-muted)"></span> 0 Events Live';
      return;
    }

    // Preserve selected event across re-renders
    const prevId = selectedEventId;

    grid.innerHTML = events.map(ev => {
      const live = ev.status === 'live';
      const st   = ev.startedAt
        ? new Date(ev.startedAt).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})
        : null;
      return `
      <div class="mon-event-card${ev.id===prevId?' active':''}" data-event-id="${ev.id}" style="cursor:pointer;">
        <div class="mon-event-card__name">
          <i data-lucide="${live?'radio':'play-circle'}"></i>
          <span class="evt-name-text">${ev.name||'Unnamed Event'}</span>
          ${live?`<span style="margin-left:auto;display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;background:rgba(239,68,68,0.18);color:#fca5a5;border:1px solid rgba(239,68,68,0.3);"><span style="width:5px;height:5px;border-radius:50%;background:#ef4444;animation:_livePulse 1.4s ease-in-out infinite;"></span>LIVE</span>`:''}
        </div>
        <div class="mon-event-card__time">
          <i data-lucide="clock"></i>
          ${fmtDate(ev.date)} · ${ev.venue||'TBA'}
          ${live&&st?`<span style="margin-left:6px;color:#86efac;font-size:11px;">• Started ${st}</span>`:''}
        </div>
      </div>`;
    }).join('');

    const badge = document.querySelector('.live-badge');
    if (badge) badge.innerHTML = `<span class="live-dot"></span> ${events.length} Event${events.length===1?'':'s'} Live`;

    // Auto-select: keep previous or pick first
    const allCards = document.querySelectorAll('.mon-event-card');
    if (allCards.length) {
      const target = prevId
        ? ([...allCards].find(c=>c.dataset.eventId===prevId) || allCards[0])
        : allCards[0];
      target.classList.add('active');
      selectedEventId   = target.dataset.eventId;
      selectedEventData = DB.find('events', selectedEventId);
      const st = document.getElementById('statsTitle');
      if (st) st.textContent = getEventName(target);
    }

    if (window.lucide) window.lucide.createIcons();
    bindEventCards();
  }

  /* ─── Card click binding ──────────────── */
  function bindEventCards() {
    document.querySelectorAll('.mon-event-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.mon-event-card').forEach(c=>c.classList.remove('active'));
        card.classList.add('active');
        selectedEventId   = card.dataset.eventId;
        selectedEventData = DB.find('events', selectedEventId);
        const st = document.getElementById('statsTitle');
        if (st) st.textContent = getEventName(card);
        refreshAll();
      });
    });
  }

  /* ─── Progress & staff stats ──────────── */
  function updateProgressDisplay() {
    if (!selectedEventId) return;

    const assignments = JSON.parse(localStorage.getItem('eventpro_staffAssignments')||'[]');
    const evAssign    = assignments.filter(a=>a.eventId===selectedEventId && a.status==='accepted');

    let total=0, done=0;
    evAssign.forEach(a=>{
      if (a.tasks?.length) { total+=a.tasks.length; done+=a.tasks.filter(t=>t.status==='done').length; }
      else total+=1;
    });

    // Also count taskBoard tasks linked to this event
    const tbTasks = (DB.get('staffTasks')||[]).filter(t=>t.eventId===selectedEventId);
    if (tbTasks.length) {
      total += tbTasks.length;
      done  += tbTasks.filter(t=>t.done).length;
    }

    const pct        = total>0 ? Math.round((done/total)*100) : 0;
    const active     = evAssign.length;
    const totalAssig = assignments.filter(a=>a.eventId===selectedEventId).length;

    const pVal = document.getElementById('progressValue');
    const pFil = document.getElementById('progressFill');
    const sVal = document.getElementById('staffValue');
    const sSub = document.getElementById('staffSub');

    if (pVal) pVal.textContent = pct+'%';
    if (pFil) pFil.style.width = pct+'%';
    if (sVal) sVal.textContent = `${active} / ${totalAssig||0}`;
    if (sSub) {
      sSub.textContent = active<totalAssig
        ? `${totalAssig-active} pending acceptance`
        : active>0 ? 'All staff onboard' : 'No staff assigned';
      sSub.className = active===totalAssig && active>0 ? 'mon-stat__sub green' : 'mon-stat__sub';
    }

    // Refresh selectedEventData in case it changed (e.g. status updated)
    selectedEventData = DB.find('events', selectedEventId);
  }

  /* ─── Dynamic Event Timeline ──────────── */
  function renderTimeline() {
    const container = document.getElementById('eventTimeline') || document.querySelector('.timeline');
    if (!container || !selectedEventId) return;

    const assignments = JSON.parse(localStorage.getItem('eventpro_staffAssignments')||'[]')
      .filter(a=>a.eventId===selectedEventId);
    const issues   = (DB.getAll('issues')||[]).filter(i=>i.eventId===selectedEventId);
    const liveEvts = (JSON.parse(localStorage.getItem('eventpro_liveEvents')||'[]'))
      .filter(e=>e.eventId===selectedEventId);
    const ev       = DB.find('events', selectedEventId);

    // Build timeline items from multiple sources
    const items = [];

    // 1. Event started
    if (ev?.startedAt) {
      items.push({ type:'done', icon:'check', title:'Event Started', time: new Date(ev.startedAt).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}) });
    } else if (ev?.status==='confirmed'||ev?.status==='approved') {
      items.push({ type:'pending', icon:'clock', title:'Event Scheduled', time: ev.time||'Scheduled' });
    }

    // 2. Staff check-ins (accepted assignments)
    const checkedIn = assignments.filter(a=>a.status==='accepted');
    if (checkedIn.length) {
      items.push({ type:'done', icon:'check', title:`${checkedIn.length} Staff Checked In`, time:'on-site' });
    }

    // 3. Staff task completions (done tasks)
    const doneTasks = [];
    assignments.forEach(a=>{
      (a.tasks||[]).filter(t=>t.status==='done').forEach(t=>{
        doneTasks.push({ desc:t.desc, staffName:a.staffName });
      });
    });
    if (doneTasks.length) {
      doneTasks.slice(-3).forEach(t=>{
        items.push({ type:'done', icon:'check', title:`✓ ${t.desc}`, time:`by ${t.staffName}` });
      });
    }

    // 4. In-progress tasks (current)
    const inProg = assignments.flatMap(a=>(a.tasks||[]).filter(t=>t.status==='in_progress'||t.status==='progress'));
    if (inProg.length) {
      items.push({ type:'current', icon:'play', title:`In Progress: ${inProg[0].desc||'Task ongoing'}`, time:'Now' });
    } else if (checkedIn.length && !doneTasks.length) {
      items.push({ type:'current', icon:'play', title:'Staff working on assignments', time:'Now' });
    }

    // 5. Coordinator update notes
    const updates = liveEvts.filter(e=>e.type==='update').slice(-2);
    updates.forEach(u=>{
      const t = new Date(u.createdAt).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
      items.push({ type:'done', icon:'message-square', title:u.note||'Status updated', time:t });
    });

    // 6. Contingency triggered
    const contig = liveEvts.filter(e=>e.type==='contingency').slice(-1);
    if (contig.length) {
      const t = new Date(contig[0].createdAt).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
      items.push({ type:'current', icon:'zap', title:'⚡ Backup Plan Activated', time:t });
    }

    // 7. Reported issues
    issues.slice(-2).forEach(iss=>{
      const t = new Date(iss.createdAt||Date.now()).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
      items.push({ type:'pending', icon:'alert-triangle', title:iss.title||iss.type, time:t });
    });

    // 8. Event ended
    if (ev?.status==='completed') {
      items.push({ type:'done', icon:'check-circle', title:'Event Completed', time:ev.endedAt?new Date(ev.endedAt).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}):'Done' });
    }

    // Fallback if no items yet
    if (!items.length) {
      container.innerHTML = '<div style="color:var(--text-muted);font-size:13px;padding:20px 0;text-align:center;">No timeline activity yet. Staff updates will appear here.</div>';
      return;
    }

    container.innerHTML = items.map((item, idx) => {
      const isLast  = idx===items.length-1;
      const iconCls = item.type==='done' ? 'tl-icon--done' : item.type==='current' ? 'tl-icon--current' : 'tl-icon--pending';
      const itemCls = item.type==='done' ? 'done' : item.type==='current' ? 'current' : '';
      return `
        <div class="tl-item ${itemCls}">
          ${!isLast?'<div class="tl-line"></div>':''}
          <div class="tl-icon ${iconCls}"><i data-lucide="${item.icon}"></i></div>
          <div class="tl-body">
            <div class="tl-title">${item.title}</div>
            <div class="tl-time">${item.time}</div>
          </div>
        </div>`;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  /* ─── Live Alerts Feed ────────────────── */
  function renderIssueLog() {
    const logEl = document.querySelector('.mon-alert-list');
    if (!logEl) return;

    if (!selectedEventId) {
      logEl.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px;">Select an event to view feed.</div>';
      return;
    }

    const assignments = JSON.parse(localStorage.getItem('eventpro_staffAssignments')||'[]')
      .filter(a=>a.eventId===selectedEventId);
    const issues = (DB.getAll('issues')||[])
      .filter(i=>i.eventId===selectedEventId||!i.eventId)
      .slice(-6).reverse();
    const liveEvts = (JSON.parse(localStorage.getItem('eventpro_liveEvents')||'[]'))
      .filter(e=>e.eventId===selectedEventId)
      .slice(-5).reverse();

    let html = '';

    // Contingency alerts (highest priority)
    liveEvts.filter(e=>e.type==='contingency').forEach(e=>{
      const t = new Date(e.createdAt).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
      html += `
        <div class="mon-alert-item mon-alert-item--warning">
          <i data-lucide="zap"></i>
          <div class="mon-alert-item__body">
            <div class="mon-alert-item__text">⚡ Contingency Plan Activated</div>
            <div class="mon-alert-item__time">${t}</div>
          </div>
        </div>`;
    });

    // Coordinator update notes
    liveEvts.filter(e=>e.type==='update').forEach(e=>{
      const t = new Date(e.createdAt).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
      html += `
        <div class="mon-alert-item mon-alert-item--info">
          <i data-lucide="info"></i>
          <div class="mon-alert-item__body">
            <div class="mon-alert-item__text">${e.note||'Status updated by coordinator'}</div>
            <div class="mon-alert-item__time">${t}</div>
          </div>
        </div>`;
    });

    // Staff check-ins
    assignments.filter(a=>a.status==='accepted').forEach(a=>{
      html += `
        <div class="mon-alert-item mon-alert-item--info">
          <i data-lucide="user-check" style="color:var(--green)"></i>
          <div class="mon-alert-item__body">
            <div class="mon-alert-item__text">${a.staffName} (${a.staffRole}) is on-site.</div>
            <div class="mon-alert-item__time">Active</div>
          </div>
        </div>`;
    });

    // Completed tasks
    assignments.forEach(a=>{
      (a.tasks||[]).filter(t=>t.status==='done').forEach(t=>{
        html += `
          <div class="mon-alert-item mon-alert-item--success">
            <i data-lucide="check-circle"></i>
            <div class="mon-alert-item__body">
              <div class="mon-alert-item__text">✓ ${t.desc}</div>
              <div class="mon-alert-item__time">by ${a.staffName}</div>
            </div>
          </div>`;
      });
    });

    // System issues
    issues.forEach(iss=>{
      const t = new Date(iss.createdAt||Date.now()).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
      const isUpdate = iss.type==='update';
      html += `
        <div class="mon-alert-item ${isUpdate?'mon-alert-item--info':'mon-alert-item--warning'}">
          <i data-lucide="${isUpdate?'info':'alert-triangle'}"></i>
          <div class="mon-alert-item__body">
            <div class="mon-alert-item__text">${iss.title||iss.type}</div>
            <div class="mon-alert-item__time">${t}</div>
          </div>
        </div>`;
    });

    logEl.innerHTML = html || '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px;">Waiting for live updates…</div>';
    if (window.lucide) window.lucide.createIcons();
  }

  /* ─── Active Risks from Issues ────────── */
  function renderActiveRisks() {
    const listEl = document.querySelector('.mon-risk-list');
    if (!listEl || !selectedEventId) return;

    const issues = (DB.getAll('issues')||[]).filter(i=>i.eventId===selectedEventId);
    if (!issues.length) {
      listEl.innerHTML = '<div style="color:var(--text-muted);font-size:12.5px;padding:12px 0;text-align:center;">No active risks reported.</div>';
      return;
    }

    const pil = s => {
      if (!s) return 'medium';
      const p = s.toLowerCase();
      if (p==='high'||p==='critical') return 'high';
      if (p==='low') return 'low';
      return 'medium';
    };

    listEl.innerHTML = issues.slice(-3).reverse().map(iss=>{
      const sev  = pil(iss.severity||iss.priority);
      const time = new Date(iss.createdAt||Date.now()).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
      return `
        <div class="mon-risk-item">
          <div class="mon-risk-item__body">
            <div class="mon-risk-item__title">${iss.title||iss.type}</div>
            <div class="mon-risk-item__time">Reported at ${time}</div>
          </div>
          <span class="risk-pill risk-pill--${sev}">${sev}</span>
        </div>`;
    }).join('');
  }

  /* ─── Type label map (matches staff side) ── */
  const REQ_TYPE_LABELS = {
    resource: 'Resource / Equipment',
    staff: 'Additional Staff',
    extra_task: 'Extra Task',
    custom: 'Custom Request'
  };

  /* ─── Track known request IDs for new-arrival toast ── */
  const _knownReqIds = new Set();
  // Seed with existing requests on load
  (DB.get('staffRequests')||[]).forEach(r => _knownReqIds.add(r.id));

  /* ─── Staff Requests panel ────────────── */
  function renderStaffRequests() {
    const rEl = document.getElementById('monStaffRequests');
    if (!rEl) return;

    const allReqs  = DB.get('staffRequests') || [];
    const pendAll  = allReqs.filter(r => r.status === 'pending').length;
    const headerH4 = document.querySelector('.mon-requests__header h4');
    if (headerH4) {
      headerH4.innerHTML = `Staff Requests${pendAll > 0 ? ` <span style="display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 5px;border-radius:10px;background:rgba(6,182,212,0.25);color:var(--cyan,#06b6d4);font-size:10px;font-weight:700;margin-left:6px;vertical-align:middle;">${pendAll}</span>` : ''}`;
    }

    // Detect newly arrived requests → show toast
    allReqs.forEach(r => {
      if (!_knownReqIds.has(r.id)) {
        _knownReqIds.add(r.id);
        const typeLabel = REQ_TYPE_LABELS[r.type] || r.type;
        const qtyStr = (r.type === 'extra_task' || r.type === 'custom') ? '' : `${r.qty}x `;
        Toast.show(`📋 New Staff Request: ${qtyStr}${r.item} (${typeLabel}) from ${r.requestedBy}`, 'info', 4500);
      }
    });

    if (!selectedEventId) {
      rEl.innerHTML = '<div style="color:var(--text-muted);font-size:12px;text-align:center;padding:20px;">Select an event.</div>';
      return;
    }

    const reqs = allReqs.filter(r => r.eventId === selectedEventId);
    if (!reqs.length) {
      rEl.innerHTML = '<div style="color:var(--text-muted);font-size:12px;text-align:center;padding:20px;">No pending requests.</div>';
      return;
    }

    rEl.innerHTML = reqs.map(r => {
      const typeLabel = REQ_TYPE_LABELS[r.type] || r.type;
      const qtyStr   = (r.type === 'extra_task' || r.type === 'custom') ? '' : `${r.qty}× `;
      const isPending = r.status === 'pending';

      let statusHtml;
      if (isPending) {
        statusHtml = `<div style="display:flex;gap:6px;margin-top:8px;">
             <button onclick="openAllocateModal('${r.id}')" style="flex:1;padding:6px;background:rgba(34,197,94,0.1);color:var(--green);border:1px solid rgba(34,197,94,0.2);border-radius:4px;cursor:pointer;font-size:11px;font-weight:600;transition:background 0.2s;" onmouseover="this.style.background='rgba(34,197,94,0.2)'" onmouseout="this.style.background='rgba(34,197,94,0.1)'">✓ Allocate &amp; Approve</button>
             <button onclick="resolveStaffRequest('${r.id}','declined')" style="flex:1;padding:6px;background:rgba(239,68,68,0.1);color:var(--red);border:1px solid rgba(239,68,68,0.2);border-radius:4px;cursor:pointer;font-size:11px;font-weight:600;transition:background 0.2s;" onmouseover="this.style.background='rgba(239,68,68,0.2)'" onmouseout="this.style.background='rgba(239,68,68,0.1)'">✗ Decline</button>
           </div>`;
      } else {
        const allocInfo = r.allocatedResource ? `<div style="margin-top:4px;font-size:11px;color:var(--cyan);">📦 Allocated: ${r.allocatedQty}× ${r.allocatedResource}</div>` : '';
        statusHtml = `<div style="margin-top:6px;font-size:11px;font-weight:700;color:${r.status==='approved'?'var(--green)':'var(--red)'};text-transform:uppercase;display:flex;align-items:center;gap:4px;">${r.status==='approved'?'✅':'❌'} ${r.status}</div>${allocInfo}`;
      }

      const descHtml = r.desc
        ? `<div style="font-size:11.5px;color:var(--text-muted);margin-top:3px;font-style:italic;">${r.desc}</div>`
        : '';
      const evName  = r.eventName || r.eventId;
      const timeStr = new Date(r.createdAt).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
      const pendingGlow = isPending ? 'border-left:3px solid var(--cyan,#06b6d4);' : '';

      return `<div style="padding:12px 14px;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:6px;${pendingGlow}transition:background 0.15s;" onmouseover="this.style.background='rgba(255,255,255,0.06)'" onmouseout="this.style.background='rgba(255,255,255,0.03)'">
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">${evName} · ${timeStr}</div>
        <div style="font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:2px;">${qtyStr}${r.item} <span style="font-size:11px;color:var(--text-muted);font-weight:400;">(${typeLabel})</span></div>
        <div style="font-size:11.5px;color:var(--text-muted);">By: ${r.requestedBy}</div>
        ${descHtml}
        ${statusHtml}
      </div>`;
    }).join('');
  }

  /* ─── Allocation Modal (shown before approving) ── */
  function ensureAllocModal() {
    if (document.getElementById('_allocOverlay')) return;

    // Inject option styling for dark theme dropdowns
    if (!document.getElementById('_allocStyles')) {
      const st = document.createElement('style');
      st.id = '_allocStyles';
      st.textContent = `#_allocOverlay select { background-color: #1e293b !important; color: #f1f5f9 !important; }
        #_allocOverlay select option { background-color: #1e293b; color: #f1f5f9; padding: 8px; }
        #_allocOverlay select option:checked { background-color: #0e7490; color: #fff; }
        #_allocOverlay select option:hover { background-color: #334155; }
        #_allocOverlay input[type="number"] { background-color: #1e293b !important; color: #f1f5f9 !important; }`;
      document.head.appendChild(st);
    }

    const ov = document.createElement('div');
    ov.id = '_allocOverlay';
    ov.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(15,23,42,0.7);backdrop-filter:blur(6px);z-index:2000;align-items:center;justify-content:center;animation:fadeIn 0.2s;';
    ov.innerHTML = `
      <div style="width:min(480px,92vw);background:var(--bg-card,#1e293b);border:1px solid var(--border);border-radius:16px;box-shadow:0 25px 50px rgba(0,0,0,0.5);overflow:hidden;">
        <div style="padding:20px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;">
          <div style="width:36px;height:36px;border-radius:10px;background:rgba(34,197,94,0.15);display:flex;align-items:center;justify-content:center;color:var(--green);">📦</div>
          <div>
            <h3 id="_allocTitle" style="font-size:15px;font-weight:700;color:var(--text-primary);margin:0;">Allocate Resource</h3>
            <div id="_allocSub" style="font-size:12px;color:var(--text-muted);margin-top:2px;"></div>
          </div>
        </div>
        <div id="_allocBody" style="padding:20px 24px;max-height:350px;overflow-y:auto;"></div>
        <div style="padding:16px 24px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:10px;background:rgba(0,0,0,0.15);">
          <button type="button" onclick="closeAllocModal()" style="padding:8px 16px;border:1px solid var(--border);background:transparent;color:var(--text-primary);border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">Cancel</button>
          <button type="button" id="_allocConfirmBtn" onclick="confirmAllocate()" style="padding:8px 20px;border:none;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;border-radius:6px;cursor:pointer;font-weight:700;font-size:12px;box-shadow:0 4px 12px rgba(34,197,94,0.3);">✓ Confirm &amp; Approve</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    ov.addEventListener('click', e => { if (e.target === ov) closeAllocModal(); });
  }

  let _pendingAllocReqId = null;

  window.openAllocateModal = function(reqId) {
    ensureAllocModal();
    const allReqs = DB.get('staffRequests') || [];
    const req = allReqs.find(r => r.id === reqId);
    if (!req) return;

    _pendingAllocReqId = reqId;
    const ov = document.getElementById('_allocOverlay');
    const title = document.getElementById('_allocTitle');
    const sub = document.getElementById('_allocSub');
    const body = document.getElementById('_allocBody');

    const typeLabel = REQ_TYPE_LABELS[req.type] || req.type;
    const qtyStr = (req.type === 'extra_task' || req.type === 'custom') ? '' : `${req.qty}× `;

    if (req.type === 'resource') {
      title.textContent = 'Allocate Resource';
      sub.textContent = `Staff requested: ${qtyStr}${req.item} for ${req.eventName || req.eventId}`;

      const resources = DB.getAll('resources');
      const matching = resources.filter(r => r.available && r.quantity > 0);

      // Find best match
      const bestMatch = resources.find(r => r.name.toLowerCase().includes(req.item.toLowerCase()));

      body.innerHTML = `
        <div style="margin-bottom:16px;">
          <label style="font-size:12px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;display:block;margin-bottom:6px;">Select Resource to Allocate</label>
          <select id="_allocResource" style="width:100%;padding:10px 12px;border-radius:8px;background:rgba(255,255,255,0.05);border:1px solid var(--border);color:var(--text-primary);font-size:13px;cursor:pointer;" onchange="updateAllocQtyMax()">
            ${matching.map(r => `<option value="${r.id}" ${bestMatch && r.id === bestMatch.id ? 'selected' : ''}>${r.name} — ${r.quantity} available (${r.category})</option>`).join('')}
            ${matching.length === 0 ? '<option value="">No resources available</option>' : ''}
          </select>
        </div>
        <div style="display:flex;gap:16px;align-items:flex-end;">
          <div style="flex:1;">
            <label style="font-size:12px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;display:block;margin-bottom:6px;">Quantity to Allocate</label>
            <input type="number" id="_allocQty" value="${Math.min(req.qty, bestMatch ? bestMatch.quantity : req.qty)}" min="1" max="${bestMatch ? bestMatch.quantity : 999}" style="width:100%;padding:10px 12px;border-radius:8px;background:rgba(255,255,255,0.05);border:1px solid var(--border);color:var(--text-primary);font-size:14px;font-weight:600;">
          </div>
          <div style="flex:1;">
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">Requested</div>
            <div style="font-size:18px;font-weight:700;color:var(--cyan);">${req.qty}</div>
          </div>
        </div>
        <div id="_allocInfo" style="margin-top:14px;padding:10px 14px;background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.15);border-radius:8px;font-size:12px;color:var(--cyan);">
          ℹ️ Inventory will be deducted and Manage Resource page will update automatically.
        </div>`;
    } else if (req.type === 'staff') {
      title.textContent = 'Assign Staff';
      sub.textContent = `Staff requested: ${qtyStr}${req.item} for ${req.eventName || req.eventId}`;

      const staff = DB.getAll('staff').filter(s => s.status === 'available');
      body.innerHTML = `
        <div style="margin-bottom:16px;">
          <label style="font-size:12px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;display:block;margin-bottom:6px;">Select Staff to Assign</label>
          <select id="_allocResource" style="width:100%;padding:10px 12px;border-radius:8px;background:rgba(255,255,255,0.05);border:1px solid var(--border);color:var(--text-primary);font-size:13px;cursor:pointer;">
            ${staff.map(s => `<option value="${s.id}">${s.name} — ${s.role} (${s.status})</option>`).join('')}
            ${staff.length === 0 ? '<option value="">No available staff</option>' : ''}
          </select>
        </div>
        <div id="_allocInfo" style="margin-top:10px;padding:10px 14px;background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.15);border-radius:8px;font-size:12px;color:var(--cyan);">
          ℹ️ The selected staff member will be assigned to this event.
        </div>`;
    } else {
      // Extra task / custom — just show confirmation
      title.textContent = 'Approve Request';
      sub.textContent = `${typeLabel}: ${req.item}`;
      body.innerHTML = `
        <div style="padding:16px;text-align:center;">
          <div style="font-size:14px;color:var(--text-primary);margin-bottom:8px;">Approve this request?</div>
          <div style="font-size:12px;color:var(--text-muted);">"${req.item}" from ${req.requestedBy}</div>
          ${req.desc ? `<div style="font-size:12px;color:var(--text-muted);margin-top:6px;font-style:italic;">${req.desc}</div>` : ''}
        </div>`;
    }

    ov.style.display = 'flex';
  };

  window.updateAllocQtyMax = function() {
    const sel = document.getElementById('_allocResource');
    const qtyInput = document.getElementById('_allocQty');
    if (!sel || !qtyInput) return;
    const res = DB.getAll('resources').find(r => r.id === sel.value);
    if (res) {
      qtyInput.max = res.quantity;
      if (parseInt(qtyInput.value) > res.quantity) qtyInput.value = res.quantity;
    }
  };

  window.closeAllocModal = function() {
    const ov = document.getElementById('_allocOverlay');
    if (ov) ov.style.display = 'none';
    _pendingAllocReqId = null;
  };

  window.confirmAllocate = function() {
    if (!_pendingAllocReqId) return;

    const reqs = DB.get('staffRequests') || [];
    const idx = reqs.findIndex(r => r.id === _pendingAllocReqId);
    if (idx < 0) return;
    const req = reqs[idx];

    const resSelect = document.getElementById('_allocResource');
    const qtyInput = document.getElementById('_allocQty');

    if (req.type === 'resource' && resSelect) {
      const resId = resSelect.value;
      if (!resId) { Toast.show('Please select a resource to allocate.', 'warn'); return; }
      const allocQty = parseInt(qtyInput ? qtyInput.value : req.qty, 10) || req.qty;

      // Find the resource and deduct
      const res = DB.getAll('resources');
      const m = res.find(r => r.id === resId);
      if (m) {
        const newQty = Math.max(0, m.quantity - allocQty);
        DB.update('resources', m.id, { quantity: newQty, available: newQty > 0 });

        // Record allocation
        const allocs = DB.get('resourceAllocations') || {};
        if (!allocs[req.eventId]) allocs[req.eventId] = [];
        allocs[req.eventId].push({
          resourceId: m.id,
          resourceName: m.name,
          category: m.category,
          qty: allocQty,
          allocatedAt: new Date().toISOString(),
          fromStaffRequest: req.id
        });
        DB.set('resourceAllocations', allocs);

        // Update request with allocation info
        req.allocatedResource = m.name;
        req.allocatedQty = allocQty;

        // Signal manage-resource page
        localStorage.setItem('eventpro_resourcesUpdated', Date.now().toString());

        Toast.show(`✓ Allocated ${allocQty}× ${m.name} → deducted from inventory`, 'success');
      }
    } else if (req.type === 'staff' && resSelect) {
      const staffId = resSelect.value;
      if (!staffId) { Toast.show('Please select a staff member.', 'warn'); return; }
      const staffMember = DB.getAll('staff').find(s => s.id === staffId);
      if (staffMember) {
        // Mark staff as busy
        DB.update('staff', staffId, { status: 'busy', workload: Math.min(100, staffMember.workload + 20) });

        // Add staff assignment for the event
        const assignments = DB.get('staffAssignments') || [];
        assignments.push({
          id: 'sa_' + Date.now(),
          eventId: req.eventId,
          staffId: staffId,
          staffName: staffMember.name,
          role: staffMember.role,
          assignedAt: new Date().toISOString(),
          fromStaffRequest: req.id
        });
        DB.set('staffAssignments', assignments);

        req.allocatedResource = staffMember.name;
        req.allocatedQty = 1;

        Toast.show(`✓ Assigned ${staffMember.name} (${staffMember.role}) to event`, 'success');
      }
    }

    // Mark request as approved
    req.status = 'approved';
    req.resolvedAt = new Date().toISOString();
    DB.set('staffRequests', reqs);

    // Signal staff pages
    localStorage.setItem('eventpro_staffRequestsUpdated', Date.now().toString());

    // Notify staff via MsgService
    const typeLabel = REQ_TYPE_LABELS[req.type] || req.type;
    const qtyStr = (req.type === 'extra_task' || req.type === 'custom') ? '' : `${req.qty}x `;
    if (window.MsgService) {
      const evName = req.eventName || req.eventId;
      const allocDetail = req.allocatedResource ? ` (Allocated: ${req.allocatedQty}× ${req.allocatedResource})` : '';
      const notify = `[SYSTEM] ✅ Your request for "${qtyStr}${req.item}" (${typeLabel}) for "${evName}" has been APPROVED by the Event Coordinator.${allocDetail}`;
      window.MsgService.sendMessage('Vendor', 'Event Coordinator', 'Staff', req.requestedBy, notify, 'Vendor-Staff');
    }

    closeAllocModal();
    renderStaffRequests();
  };

  /* ─── Direct decline (no modal needed) ── */
  window.resolveStaffRequest = function(reqId, newStatus) {
    const reqs = DB.get('staffRequests')||[];
    const idx  = reqs.findIndex(r=>r.id===reqId);
    if (idx<0) return;
    const req  = reqs[idx];
    req.status = newStatus;
    req.resolvedAt = new Date().toISOString();
    DB.set('staffRequests', reqs);

    localStorage.setItem('eventpro_staffRequestsUpdated', Date.now().toString());

    const typeLabel = REQ_TYPE_LABELS[req.type] || req.type;
    const qtyStr = (req.type === 'extra_task' || req.type === 'custom') ? '' : `${req.qty}x `;

    Toast.show(`Request Declined: ${qtyStr}${req.item}`, 'error');

    if (window.MsgService) {
      const evName = req.eventName || req.eventId;
      const notify = `[SYSTEM] ❌ Your request for "${qtyStr}${req.item}" (${typeLabel}) for "${evName}" has been DECLINED by the Event Coordinator.`;
      window.MsgService.sendMessage('Vendor', 'Event Coordinator', 'Staff', req.requestedBy, notify, 'Vendor-Staff');
    }

    renderStaffRequests();
  };

  /* ─── Update Event Modal ──────────────── */
  function openUpdateEventModal() {
    if (!selectedEventId) { Toast.show('Please select an event first.','warn'); return; }
    const ev = DB.find('events', selectedEventId);
    if (!ev) return;

    let overlay = document.getElementById('_updateEventOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = '_updateEventOverlay';
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal" style="width:min(480px,94vw);padding:28px 28px 24px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;">
            <div style="font-family:var(--font-display);font-size:17px;font-weight:700;color:var(--text-primary);">Update Event Status</div>
            <button id="_updateClose" style="background:transparent;border:none;cursor:pointer;color:var(--text-muted);padding:4px;"><i data-lucide="x" style="width:18px;height:18px;"></i></button>
          </div>
          <div style="margin-bottom:16px;">
            <label style="font-size:12.5px;color:var(--text-muted);margin-bottom:6px;display:block;">Event</label>
            <div id="_upd_evName" style="font-size:15px;font-weight:600;color:var(--text-primary);padding:10px 14px;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:var(--radius-sm);"></div>
          </div>
          <div style="margin-bottom:16px;">
            <label style="font-size:12.5px;color:var(--text-muted);margin-bottom:6px;display:block;">Update Note</label>
            <textarea id="_upd_note" class="ri-input ri-textarea" rows="3" placeholder="e.g. Ceremony going smoothly, ahead of schedule…" style="resize:vertical;"></textarea>
          </div>
          <div style="margin-bottom:20px;">
            <label style="font-size:12.5px;color:var(--text-muted);margin-bottom:6px;display:block;">Mark Event As</label>
            <select id="_upd_status" class="ri-select">
              <option value="">— Keep current status —</option>
              <option value="live">🔴 Live (In Progress)</option>
              <option value="completed">✅ Completed</option>
            </select>
          </div>
          <div style="display:flex;gap:10px;justify-content:flex-end;">
            <button class="ri-cancel" id="_updCancelBtn">Cancel</button>
            <button class="ri-submit" id="_updSaveBtn" style="flex:none;padding:12px 28px;"><i data-lucide="send" style="width:15px;height:15px;"></i> Send Update</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);

      document.getElementById('_updateClose').addEventListener('click', ()=>closeModal(overlay));
      document.getElementById('_updCancelBtn').addEventListener('click', ()=>closeModal(overlay));
      overlay.addEventListener('click', e=>{ if(e.target===overlay) closeModal(overlay); });

      document.getElementById('_updSaveBtn').addEventListener('click', ()=>{
        const note   = document.getElementById('_upd_note').value.trim();
        const status = document.getElementById('_upd_status').value;
        if (!note && !status) { Toast.show('Please enter a note or select a status.','warn'); return; }

        const now = new Date().toISOString();

        // Persist update note → liveEvents
        if (note) {
          const liveEvts = JSON.parse(localStorage.getItem('eventpro_liveEvents')||'[]');
          liveEvts.push({ id:'le_'+Date.now(), eventId: selectedEventId, type:'update', note, createdAt: now });
          localStorage.setItem('eventpro_liveEvents', JSON.stringify(liveEvts));

          // Also write to issues so it shows up in risks/feed
          const issues = DB.getAll('issues');
          issues.push({ id:'iss_'+Date.now(), eventId: selectedEventId, type:'update', title: note, createdAt: now, severity:'info' });
          DB.save('issues', issues);
        }

        if (status) {
          DB.update('events', selectedEventId, {
            status,
            ...(status==='live' && !ev.startedAt ? { startedAt: now } : {}),
            ...(status==='completed' ? { endedAt: now } : {})
          });
          selectedEventData = DB.find('events', selectedEventId);
        }

        Toast.show('Event update saved ✓','success');
        closeModal(overlay);
        refreshAll();
      });
    }

    document.getElementById('_upd_evName').textContent = ev.name||'Event';
    document.getElementById('_upd_note').value   = '';
    document.getElementById('_upd_status').value = '';
    openModal(overlay);
    if (window.lucide) window.lucide.createIcons();
  }

  /* ─── End Event ───────────────────────── */
  function endCurrentEvent() {
    if (!selectedEventId) { Toast.show('No event selected.','warn'); return; }
    Confirm.ask({
      title:'End Event?',
      msg:'This will mark the event as completed and stop monitoring.',
      okLabel:'End Event',
      okColor:'#9f1239',
    }).then(ok=>{
      if (!ok) return;
      const now = new Date().toISOString();
      DB.update('events', selectedEventId, { status:'completed', endedAt: now });

      // Write end event to liveEvents
      const liveEvts = JSON.parse(localStorage.getItem('eventpro_liveEvents')||'[]');
      liveEvts.push({ id:'le_'+Date.now(), eventId: selectedEventId, type:'end', note:'Event ended by coordinator.', createdAt: now });
      localStorage.setItem('eventpro_liveEvents', JSON.stringify(liveEvts));

      // Log to issues
      const issues = DB.getAll('issues');
      issues.push({ id:'iss_'+Date.now(), eventId: selectedEventId, type:'update', title:'Event ended by coordinator.', createdAt: now, severity:'info' });
      DB.save('issues', issues);

      selectedEventData = DB.find('events', selectedEventId);
      Toast.show('Event ended. Monitoring stopped.','success');
      refreshAll();
      initEventCards();
    });
  }

  /* ─── Contingency Plan helpers (per-event from DB) ── */
  function getPlansForEvent(eventId) {
    const allPlans = DB.get('contingencyPlans') || {};
    if (allPlans[eventId]) return allPlans[eventId];
    // Copy defaults for this event
    const defaults = allPlans['_default'] || [];
    const copied = defaults.map((p, i) => ({
      ...p,
      id: 'CP_' + eventId + '_' + Date.now() + '_' + i
    }));
    allPlans[eventId] = copied;
    DB.set('contingencyPlans', allPlans);
    return copied;
  }

  /* ─── Render contingency actions panel ── */
  function renderContingencyActions() {
    const listEl = document.getElementById('monContingencyList');
    if (!listEl) return;

    if (!selectedEventId) {
      listEl.innerHTML = '<div style="color:var(--text-muted);font-size:12.5px;padding:12px 0;text-align:center;">Select an event to view plans.</div>';
      return;
    }

    const plans = getPlansForEvent(selectedEventId);

    if (!plans.length) {
      listEl.innerHTML = '<div style="color:var(--text-muted);font-size:12.5px;padding:12px 0;text-align:center;">No contingency plans defined.<br><a href="event-review.html?id=' + selectedEventId + '" style="color:var(--pink);font-size:11px;">Add plans in Event Review →</a></div>';
      return;
    }

    listEl.innerHTML = plans.map(p => {
      if (p.status === 'triggered') {
        return `
          <div style="display:flex;align-items:center;gap:12px;padding:13px 16px;border-radius:var(--radius-sm);background:rgba(249,115,22,0.08);border:1px solid rgba(249,115,22,0.2);opacity:0.7;">
            <i data-lucide="check-circle" style="flex-shrink:0;width:17px;height:17px;color:var(--orange);"></i>
            <div>
              <div style="font-size:13px;font-weight:600;color:var(--text-primary);">${p.problem}</div>
              <div style="font-size:11.5px;color:var(--text-muted);">${p.solution}</div>
            </div>
            <span style="margin-left:auto;font-size:10px;font-weight:700;padding:3px 8px;border-radius:20px;background:rgba(249,115,22,0.18);color:var(--orange);border:1px solid rgba(249,115,22,0.3);white-space:nowrap;">⚡ Triggered</span>
          </div>`;
      }
      return `
        <button class="mon-contig-btn mon-contig-btn--orange" data-plan-id="${p.id}" style="position:relative;">
          <i data-lucide="zap"></i>
          <div style="flex:1;">
            <div class="mon-contig-btn__title">${p.problem}</div>
            <div class="mon-contig-btn__sub">${p.trigger} → ${p.solution}</div>
          </div>
          <span style="font-size:10px;padding:2px 8px;border-radius:20px;background:rgba(34,197,94,0.12);color:var(--green);border:1px solid rgba(34,197,94,0.2);font-weight:700;white-space:nowrap;">Ready</span>
        </button>`;
    }).join('');

    // Bind trigger buttons
    listEl.querySelectorAll('[data-plan-id]').forEach(btn => {
      btn.addEventListener('click', () => triggerSpecificPlan(btn.dataset.planId));
    });

    if (window.lucide) window.lucide.createIcons();
  }

  /* ─── Trigger a specific contingency plan ── */
  function triggerSpecificPlan(planId) {
    if (!selectedEventId) return;
    const allPlans = DB.get('contingencyPlans') || {};
    const plans = allPlans[selectedEventId] || [];
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    if (plan.status === 'triggered') { Toast.show('This plan has already been triggered.', 'info'); return; }

    Confirm.ask({
      title: `Trigger: ${plan.problem}?`,
      msg: `This will activate "${plan.solution}" and broadcast an alert to all staff & clients.`,
      okLabel: 'Trigger Plan',
      okColor: '#c2410c',
    }).then(ok => {
      if (!ok) return;

      // 1. Update plan status in DB
      plan.status = 'triggered';
      plan.triggeredAt = new Date().toISOString();
      DB.set('contingencyPlans', allPlans);

      // 2. Broadcast using the shared broadcast function with plan details
      _broadcastContingencyPlan(selectedEventId, plan);

      renderContingencyActions();
    });
  }

  /* ─── Broadcast a specific plan (enhanced version) ── */
  window._broadcastContingencyPlan = function(eventId, plan) {
    const ev  = eventId ? DB.find('events', eventId) : null;
    const now = new Date().toISOString();
    const ts  = new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});

    // 1. Write to liveEvents
    const liveEvts = JSON.parse(localStorage.getItem('eventpro_liveEvents')||'[]');
    liveEvts.push({
      id: 'le_'+Date.now(),
      eventId: eventId||'all',
      type: 'contingency',
      note: `⚡ ${plan.problem}: ${plan.solution}`,
      planId: plan.id,
      createdAt: now,
    });
    localStorage.setItem('eventpro_liveEvents', JSON.stringify(liveEvts));

    // 2. Write to issues
    const issues = DB.getAll('issues');
    issues.push({
      id: 'iss_'+Date.now(),
      eventId: eventId||null,
      type: 'contingency',
      title: `⚡ Contingency: ${plan.problem} — ${plan.solution}`,
      createdAt: now,
      severity: 'high',
      priority: 'high',
    });
    DB.save('issues', issues);

    // 3. Broadcast via MsgService
    const broadcastText = `[SYSTEM] ⚡ CONTINGENCY TRIGGERED${ev ? ' for "'+ev.name+'"' : ''}: ${plan.problem} → ${plan.solution}. Immediate action required. ${ts}`;
    if (window.MsgService) {
      ['Vendor-Staff','Vendor-Client','Vendor-Vendor'].forEach(ch => {
        window.MsgService.sendMessage('Vendor','System (Coordinator)','All','All Participants', broadcastText, ch);
      });
    } else {
      const allMsgs = DB.get('messages')||{};
      const msgObj  = { id:'c_'+Date.now(), sender:'System', self:false, text: broadcastText, time: ts, isSystem:true, sysClass:'alert' };
      ['vendor-vendor','vendor-staff','vendor-client'].forEach(ch => { if(!allMsgs[ch])allMsgs[ch]=[]; allMsgs[ch].push(msgObj); });
      DB.set('messages', allMsgs);
    }

    // 4. Write contingency alert for cross-tab sync
    const contKey = JSON.parse(localStorage.getItem('eventpro_contingencyAlerts')||'[]');
    contKey.push({
      id: 'cnt_'+Date.now(),
      eventId: eventId||'all',
      planId: plan.id,
      message: broadcastText,
      createdAt: now,
      readBy: [],
    });
    localStorage.setItem('eventpro_contingencyAlerts', JSON.stringify(contKey));

    Toast.show(`⚡ "${plan.problem}" contingency triggered! Alert sent to all.`, 'warn', 4500);
  };

  /* ─── Legacy broadcast (for backward compat) ── */
  window._broadcastContingency = function(eventId) {
    _broadcastContingencyPlan(eventId, {
      id: 'CP_legacy_' + Date.now(),
      problem: 'General Contingency',
      solution: 'All contingency resources activated',
      trigger: 'Manual trigger',
    });
  };

  /* ─── Action buttons ──────────────────── */
  function bindActionBtns() {
    document.querySelector('.mon-action-btn--update')?.addEventListener('click', ()=>openUpdateEventModal());
    document.querySelector('.mon-action-btn--allocate')?.addEventListener('click', ()=>window.location.href='manage-resource.html');
    document.querySelector('.mon-action-btn--staff')?.addEventListener('click', ()=>window.location.href='manage-staff.html');
    document.querySelector('.mon-action-btn--end')?.addEventListener('click', ()=>endCurrentEvent());
  }

  /* ─── Refresh all panels ─────────────── */
  function refreshAll() {
    updateProgressDisplay();
    renderTimeline();
    renderIssueLog();
    renderActiveRisks();
    renderStaffRequests();
    renderContingencyActions();
    updateClock();
  }

  /* ─── Poll loop ───────────────────────── */
  function startPolling() {
    clearInterval(pollTimer);
    clearInterval(clockTimer);
    clockTimer = setInterval(updateClock, 1000);
    pollTimer  = setInterval(()=>{
      // Re-read event data to catch external changes
      if (selectedEventId) {
        const fresh = DB.find('events', selectedEventId);
        if (JSON.stringify(fresh) !== JSON.stringify(selectedEventData)) {
          selectedEventData = fresh;
          initEventCards();
        }
      }
      refreshAll();
    }, 2000);
  }

  // Also listen to storage changes from other tabs (staff updating tasks etc.)
  window.addEventListener('storage', e => {
    if (['eventpro_staffAssignments','eventpro_liveEvents','eventpro_issues','eventpro_events',
         'eventpro_staffRequests','eventpro_staffRequestsUpdated','eventpro_contingencyPlans'].some(k=>e.key===k)) {
      refreshAll();
    }
  });

  /* ─── Boot ───────────────────────────── */
  initEventCards();
  bindActionBtns();
  refreshAll();
  startPolling();
});