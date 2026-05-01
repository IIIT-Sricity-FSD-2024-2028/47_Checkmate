/* ═══════════════════════════════════════════
   monitoring.js  —  Monitor Live Events Page
   • Live event selector from DB
   • Progress bars with auto-simulation
   • Issue log from DB
   • Quick action buttons
   • Live clock
   • Allocated Resources panel per event
═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  let selectedEventId = null;
  let simulationTimer = null;

  /* ── Live clock ─────────────────────── */
  function updateClock() {
    const now  = new Date();
    const time = now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
    document.querySelectorAll('.mon-stat__value').forEach(el => {
      const label = el.closest('.mon-stat')?.querySelector('.mon-stat__label')?.textContent || '';
      if (label.includes('Time')) el.textContent = time;
    });
  }
  setInterval(updateClock, 1000);
  updateClock();

  /* ── Init event cards ───────────────── */
  function initEventCards() {
    const events = DB.getAll('events')
      .filter(e => e.status === 'live' || e.status === 'confirmed' || e.status === 'approved')
      .sort((a, b) => {
        // live events bubble to the top
        if (a.status === 'live' && b.status !== 'live') return -1;
        if (b.status === 'live' && a.status !== 'live') return  1;
        return 0;
      });
    const grid  = document.querySelector('.mon-event-grid');
    if (!grid) return;

    if (events.length === 0) {
      grid.innerHTML = '<div style="color:var(--text-muted);font-size:13px;padding:10px;">No approved events currently live.</div>';
      
      const monBadge = document.querySelector('.live-badge');
      if (monBadge) monBadge.innerHTML = '<span class="live-dot" style="background:var(--text-muted)"></span> 0 Events Live';
      return;
    }

    grid.innerHTML = events.map(ev => {
      const isActuallyLive = ev.status === 'live';
      const startedTime = ev.startedAt
        ? new Date(ev.startedAt).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })
        : null;
      return `
      <div class="mon-event-card" data-event-id="${ev.id}">
        <div class="mon-event-card__name">
          <i data-lucide="${isActuallyLive ? 'radio' : 'play-circle'}"></i>
          ${ev.name || 'Unnamed Event'}
          ${isActuallyLive ? `<span style="margin-left:auto;display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;background:rgba(239,68,68,0.18);color:#fca5a5;border:1px solid rgba(239,68,68,0.3);"><span style="width:5px;height:5px;border-radius:50%;background:#ef4444;animation:_livePulse 1.4s ease-in-out infinite;"></span>LIVE</span>` : ''}
        </div>
        <div class="mon-event-card__time">
          <i data-lucide="clock"></i>
          ${fmtDate(ev.date)} · ${ev.venue || 'TBA'}
          ${isActuallyLive && startedTime ? `<span style="margin-left:6px;color:#86efac;font-size:11px;">• Started ${startedTime}</span>` : ''}
        </div>
      </div>`;
    }).join('');

    const monBadge = document.querySelector('.live-badge');
    if (monBadge) monBadge.innerHTML = `<span class="live-dot"></span> ${events.length} Event${events.length === 1 ? '' : 's'} Live`;

    /* Activate first card */
    const cards = document.querySelectorAll('.mon-event-card');
    if (cards.length) {
      cards[0].classList.add('active');
      selectedEventId = cards[0].dataset.eventId;
      
      const statsTitle = document.getElementById('statsTitle');
      const nameEl = cards[0].querySelector('.mon-event-card__name');
      if (statsTitle && nameEl) {
         statsTitle.textContent = nameEl.textContent.trim();
      }
    }
    if (window.lucide) window.lucide.createIcons();
    bindEventCards();
  }

  /* ── Event card click ───────────────── */
  function bindEventCards() {
    document.querySelectorAll('.mon-event-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.mon-event-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        selectedEventId = card.dataset.eventId || selectedEventId;
        
        const statsTitle = document.getElementById('statsTitle');
        const nameEl = card.querySelector('.mon-event-card__name');
        if (statsTitle && nameEl) {
           statsTitle.textContent = nameEl.textContent.trim();
        }

        updateProgressDisplay();
        renderAllocatedResources();
        renderStaffRequests();
      });
    });
  }

  /* ── Progress display ───────────────── */
  function updateProgressDisplay() {
    if (!selectedEventId) return;

    // 1. Get real assignment data
    const assignments = DB.getAll('staffAssignments');
    const eventAssignments = assignments.filter(a => a.eventId === selectedEventId && a.status === 'accepted');
    
    let totalTasks = 0;
    let completedTasks = 0;

    eventAssignments.forEach(a => {
        if (a.tasks) {
            totalTasks += a.tasks.length;
            completedTasks += a.tasks.filter(t => t.status === 'done').length;
        } else if (a.taskDesc) {
            // Fallback for assignments without explicit tasks array yet
            totalTasks += 1;
            if (a.status === 'accepted') { /* assume pending unless specific task status known */ }
        }
    });

    const realProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // 2. Active Staff Count
    const activeStaffCount = eventAssignments.length;
    const totalAssigned = assignments.filter(a => a.eventId === selectedEventId).length;

    // 3. Update DOM
    document.querySelectorAll('.mon-stat__value').forEach(el => {
      const label = el.closest('.mon-stat')?.querySelector('.mon-stat__label')?.textContent || '';
      if (label.includes('Progress') || label.includes('Overall')) {
          el.textContent = realProgress + '%';
      }
      if (label.includes('Active Staff')) {
          el.textContent = `${activeStaffCount} / ${totalAssigned || '?'}`;
      }
    });

    // Handle progress indicators (setup, registration, event etc) if they match specific IDs
    // For now we use the global realProgress for the big bar
    if (fill) fill.style.width = realProgress + '%';

    // Update subtext for staff
    const staffSub = document.querySelector('.mon-stat:last-child .mon-stat__sub');
    if (staffSub) {
        staffSub.textContent = activeStaffCount < totalAssigned ? `${totalAssigned - activeStaffCount} pending acceptance` : 'All staff onboard';
        staffSub.className = activeStaffCount === totalAssigned ? 'mon-stat__sub green' : 'mon-stat__sub';
    }
  }

  /* ══════════════════════════════════════════
     ALLOCATED RESOURCES — per event
  ══════════════════════════════════════════ */
  function renderAllocatedResources() {
    const panel = document.getElementById('monAllocatedResources');
    if (!panel) return;

    if (!selectedEventId) {
      panel.innerHTML = `
        <div style="text-align:center;padding:20px;color:var(--text-muted);font-size:13px;">
          Select an event to view its allocated resources.
        </div>`;
      return;
    }

    const allocs = DB.get('resourceAllocations') || {};
    const evAllocs = allocs[selectedEventId] || [];

    if (!evAllocs.length) {
      panel.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px 16px;gap:10px;">
          <div style="width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;">
            <i data-lucide="package-x" style="width:20px;height:20px;color:var(--text-muted)"></i>
          </div>
          <div style="font-size:13px;color:var(--text-muted);text-align:center;">No resources allocated to this event yet.<br><span style="font-size:12px;opacity:.7">Go to Manage Resource to allocate.</span></div>
        </div>`;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    /* Category colour map */
    const catColor = {
      Equipment: { bg:'rgba(168,85,247,0.12)', color:'#d8b4fe', border:'rgba(168,85,247,0.2)' },
      Furniture:  { bg:'rgba(249,115,22,0.12)', color:'#fdba74', border:'rgba(249,115,22,0.2)' },
      Decor:      { bg:'rgba(59,130,246,0.12)', color:'#93c5fd', border:'rgba(59,130,246,0.2)' },
    };

    panel.innerHTML = evAllocs.map(a => {
      const c = catColor[a.category] || catColor.Equipment;
      const time = new Date(a.allocatedAt).toLocaleString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
      return `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 0;border-bottom:1px solid var(--border)">
          <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;">
            <span style="background:${c.bg};color:${c.color};border:1px solid ${c.border};border-radius:20px;padding:2px 10px;font-size:11px;font-weight:600;white-space:nowrap;flex-shrink:0">${a.category}</span>
            <div style="min-width:0;">
              <div style="font-size:13.5px;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.resourceName}</div>
              <div style="font-size:11.5px;color:var(--text-muted)">Allocated ${time}</div>
            </div>
          </div>
          <div style="flex-shrink:0;text-align:right">
            <div style="font-family:var(--font-display);font-size:18px;font-weight:700;color:var(--green);line-height:1">${a.qty}</div>
            <div style="font-size:11px;color:var(--text-muted)">units</div>
          </div>
        </div>`;
    }).join('');

    /* Remove last border-bottom */
    const lastRow = panel.lastElementChild;
    if (lastRow) lastRow.style.borderBottom = 'none';
    if (window.lucide) window.lucide.createIcons();
  }

  /* ── Real-time Updates ──────────────── */
  function startRealTimePolling() {
    clearInterval(simulationTimer);
    simulationTimer = setInterval(() => {
      if (!selectedEventId) return;
      updateProgressDisplay();
      renderStaffRequests();
      renderIssueLog();
    }, 3000); // Polling every 3s for "live" feel
  }

  /* ── Quick action buttons ────────────── */
  function bindActionBtns() {
    document.querySelectorAll('.mon-action-btn, .mon-contig-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.textContent.trim();

        if (text.includes('Update') || text.includes('update'))
          Toast.show('Progress update sent to all team members.', 'info');

        if (text.includes('Allocate') || text.includes('resource'))
          window.location.href = 'manage-resource.html';

        if (text.includes('Staff') || text.includes('Reassign'))
          window.location.href = 'manage-staff.html';

        if (text.includes('Trigger') || text.includes('Backup'))
          Toast.show('Contingency plan activated. Team notified.', 'warn', 4000);

        if (text.includes('End') || text.includes('end')) {
          Confirm.ask({
            title:'End Event?',
            msg:'This will mark the event as complete and stop monitoring.',
            okLabel:'End Event', okColor:'#9f1239',
          }).then(ok => {
            if (!ok) return;
            clearInterval(simulationTimer);
            if (selectedEventId) {
              const progress = DB.get('monitorProgress') || {};
              progress[selectedEventId] = { setup:100, registration:100, event:100, breakdown:100 };
              DB.set('monitorProgress', progress);
              updateProgressDisplay();
            }
            Toast.show('Event ended. Monitoring stopped.', 'success');
          });
        }
      });
    });
  }

  /* ── Issue log from DB ──────────────── */
  function renderIssueLog() {
    const logEl = document.querySelector('.mon-alert-list');
    if (!logEl) return;

    if (!selectedEventId) {
        logEl.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px;">Select an event to view feed.</div>';
        return;
    }

    const assignments = DB.getAll('staffAssignments').filter(a => a.eventId === selectedEventId);
    const issues = (DB.getAll('issues') || []).filter(i => i.eventId === selectedEventId || !i.eventId).slice(-3).reverse();
    
    let html = '';

    // 1. Staff Status & Task Alerts
    assignments.forEach(a => {
        // Alert for acceptance
        if (a.status === 'accepted') {
            html += `
              <div class="mon-alert-item mon-alert-item--info">
                <i data-lucide="user-check" style="color:var(--green)"></i>
                <div class="mon-alert-item__body">
                  <div class="mon-alert-item__text">${a.staffName} (${a.staffRole}) is on-site.</div>
                  <div class="mon-alert-item__time">Active</div>
                </div>
              </div>
            `;
        }

        // Alert for completed tasks
        if (a.tasks) {
            a.tasks.filter(t => t.status === 'done').forEach(t => {
                html += `
                  <div class="mon-alert-item mon-alert-item--info">
                    <i data-lucide="check-circle" style="color:var(--pink)"></i>
                    <div class="mon-alert-item__body">
                      <div class="mon-alert-item__text">Done: ${t.desc}</div>
                      <div class="mon-alert-item__time">by ${a.staffName}</div>
                    </div>
                  </div>
                `;
            });
        }
    });

    // 2. System Issues
    issues.forEach(iss => {
      html += `
        <div class="mon-alert-item mon-alert-item--warn">
          <i data-lucide="alert-triangle" style="color:var(--orange)"></i>
          <div class="mon-alert-item__body">
            <div class="mon-alert-item__text">${iss.title || iss.type}</div>
            <div class="mon-alert-item__time">${new Date(iss.createdAt || Date.now()).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
          </div>
        </div>
      `;
    });

    logEl.innerHTML = html || `<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px;">Waiting for live updates...</div>`;
    if (window.lucide) window.lucide.createIcons();
  }

  /* ── Event switcher (old inline script compatibility) ── */
  window.selectEvent = function(card) {
    document.querySelectorAll('.mon-event-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    selectedEventId = card.dataset.eventId || card.dataset.event || selectedEventId;
    updateProgressDisplay();
    renderAllocatedResources();
    renderStaffRequests();
  };

  /* ── Staff Requests (Live Approvals) ── */
  function renderStaffRequests() {
    const rEl = document.getElementById('monStaffRequests');
    if (!rEl) return;
    
    if (!selectedEventId) {
       rEl.innerHTML = '<div style="color:var(--text-muted);font-size:12px;text-align:center;padding:20px;">Select an event.</div>';
       return;
    }

    const reqs = (DB.get('staffRequests') || []).filter(r => r.eventId === selectedEventId);
    
    if (reqs.length === 0) {
       rEl.innerHTML = '<div style="color:var(--text-muted);font-size:12px;text-align:center;padding:20px;">No pending requests for this event.</div>';
       return;
    }

    rEl.innerHTML = reqs.map(r => {
      let statusHtml = '';
      if (r.status === 'pending') {
         statusHtml = `
          <div style="display:flex;gap:6px;margin-top:8px;">
            <button onclick="resolveStaffRequest('${r.id}', 'approved')" style="flex:1;padding:6px;background:rgba(34,197,94,0.1);color:var(--green);border:1px solid rgba(34,197,94,0.2);border-radius:4px;cursor:pointer;font-size:11px;font-weight:600;">✓ Approve</button>
            <button onclick="resolveStaffRequest('${r.id}', 'declined')" style="flex:1;padding:6px;background:rgba(239,68,68,0.1);color:var(--red);border:1px solid rgba(239,68,68,0.2);border-radius:4px;cursor:pointer;font-size:11px;font-weight:600;">✗ Decline</button>
          </div>
         `;
      } else {
         const color = r.status === 'approved' ? 'var(--green)' : 'var(--red)';
         statusHtml = `<div style="margin-top:8px;font-size:11px;font-weight:700;color:${color};text-transform:uppercase;">${r.status}</div>`;
      }

      return `
        <div style="padding:12px 14px; background:rgba(255,255,255,0.03); border:1px solid var(--border); border-radius:6px;">
           <div style="font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:4px;">Request: ${r.item} (x${r.qty})</div>
           <div style="font-size:11.5px;color:var(--text-muted);">Type: ${r.type} · By: ${r.requestedBy}</div>
           ${statusHtml}
        </div>
      `;
    }).join('');
  }

  window.resolveStaffRequest = function(reqId, newStatus) {
    const reqs = DB.get('staffRequests') || [];
    const idx = reqs.findIndex(r => r.id === reqId);
    if (idx < 0) return;
    
    reqs[idx].status = newStatus;
    DB.set('staffRequests', reqs);

    if (newStatus === 'approved') {
       // Deduct resource logic
       if (reqs[idx].type === 'resource') {
          const res = DB.getAll('resources');
          // Try to find a partial match
          let match = res.find(r => r.name.toLowerCase().includes(reqs[idx].item.toLowerCase()));
          if (match) {
             match.quantity = Math.max(0, match.quantity - reqs[idx].qty);
             if (match.quantity === 0) match.available = false;
             DB.update('resources', match.id, match);
             window.Toast?.show(`Deducted ${reqs[idx].qty}x from ${match.name}`, 'info');
          }
       }
       window.Toast?.show('Request Approved!', 'success');
       
       // Write system notification to staff chat
       notifyStaff(reqs[idx], 'approved');
       
    } else {
       window.Toast?.show('Request Declined.', 'error');
       
       // Write system notification to staff chat
       notifyStaff(reqs[idx], 'declined');
    }
    
    renderStaffRequests();
  };

  function notifyStaff(req, decision) {
    const messagesObj = DB.get('messages') || {};
    const vsChat = messagesObj['vendor-staff'] || [];
    
    const timeStr = new Date().toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit'});
    
    // Vendor is confirming it
    const sysMsg = {
      id: 'msg_' + Date.now(),
      sender: 'System (Event Coordinator)',
      initials: 'Sys',
      self: true, 
      text: `[SYSTEM] The extra request for ${req.qty}x ${req.item} was ${decision.toUpperCase()} by the Vendor.`,
      time: timeStr,
      avatar: 'pink'
    };
    
    vsChat.push(sysMsg);
    messagesObj['vendor-staff'] = vsChat;
    DB.set('messages', messagesObj);
  }

  /* ── Boot ───────────────────────────── */
  initEventCards();
  bindEventCards();
  updateProgressDisplay();
  bindActionBtns();
  startRealTimePolling();
  renderIssueLog();
  renderAllocatedResources();
  renderStaffRequests();
});