/* ═══════════════════════════════════════════
   event-request.js  —  Event Request Page
   • Renders events table dynamically from DB
   • Approve / Reject with confirm + status update
   • Real-time search filter
   • Select-all checkbox
   • Functional pagination
   • View links to event-review.html?id=
═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  let searchQuery = '';
  let currentPage = 1;
  let PAGE_SIZE = 10;
  let activeFilters = { status: 'All', date: 'All', type: 'All' }; // default fallback

  /* ── Dynamic page-size: fill available space ── */
  function calcPageSize() {
    const ROW_HEIGHT = 52;          // approx height of one table row (padding + content)
    const SAFETY_MARGIN = 20;       // breathing room at bottom

    const vh = window.innerHeight;
    const topbar   = document.querySelector('.topbar');
    const toolbar  = document.querySelector('.er-toolbar');
    const thead    = document.querySelector('.er-table thead');
    const footer   = document.querySelector('.er-footer');
    const content  = document.querySelector('.content');

    const topbarH  = topbar  ? topbar.offsetHeight  : 60;
    const toolbarH = toolbar ? toolbar.offsetHeight : 56;
    const theadH   = thead   ? thead.offsetHeight   : 44;
    const footerH  = footer  ? footer.offsetHeight  : 50;
    const contentPad = content
      ? parseFloat(getComputedStyle(content).paddingTop) +
        parseFloat(getComputedStyle(content).paddingBottom)
      : 48;
    const gapSpace = 40; // content gap between toolbar, table, footer

    const usedHeight = topbarH + toolbarH + theadH + footerH + contentPad + gapSpace + SAFETY_MARGIN;
    const available  = vh - usedHeight;
    const rows = Math.floor(available / ROW_HEIGHT);
    return Math.max(3, rows);       // always show at least 3 rows
  }

  /* Recalculate on load & resize */
  PAGE_SIZE = calcPageSize();
  window.addEventListener('resize', () => {
    const newSize = calcPageSize();
    if (newSize !== PAGE_SIZE) {
      PAGE_SIZE = newSize;
      render();
    }
  });

  const TYPE_CLASS = {
    Conference:'badge--conference',
    Wedding:   'badge--wedding',
    Corporate: 'badge--corporate',
    Birthday:  'badge--birthday',
    Party:     'badge--birthday',
  };

  function typeBadge(type) {
    return `<span class="badge ${TYPE_CLASS[type] || 'badge--conference'}">${type}</span>`;
  }

  /* ── Allocation status helpers ──────── */
  function hasResources(evId) {
    const allocs = DB.get('resourceAllocations') || {};
    return Array.isArray(allocs[evId]) && allocs[evId].length > 0;
  }

  function hasStaff(evId) {
    return DB.getAll('staff').some(s =>
      Array.isArray(s.assignedEvents) && s.assignedEvents.includes(evId)
    );
  }

  function allocBadge(done, label) {
    return done
      ? `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:20px;font-size:11px;font-weight:600;background:rgba(34,197,94,0.12);color:#86efac;border:1px solid rgba(34,197,94,0.25);"><i data-lucide="check-circle" style="width:12px;height:12px"></i>${label}</span>`
      : `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:20px;font-size:11px;font-weight:600;background:rgba(255,255,255,0.04);color:var(--text-muted);border:1px solid var(--border);"><i data-lucide="minus-circle" style="width:12px;height:12px"></i>None</span>`;
  }

  /* ── Conflict detection ───────────── */
  function detectConflicts(ev) {
    const conflicts = [];
    const allRes = DB.getAll('resources') || [];
    const allStaff = DB.getAll('staff') || [];
    const liveEvents = DB.getAll('events').filter(e => e.status === 'live');
    (ev.requestedResources || []).forEach(r => {
      const db = allRes.find(x => x.id === r.resourceId);
      if (!db || r.quantity > db.quantity)
        conflicts.push({type:'Resource Shortage', desc: db ? `${r.resourceName}: need ${r.quantity}, only ${db.quantity} available` : `${r.resourceName}: not in inventory`, severity:'high'});
    });
    (ev.requestedStaff || []).forEach(s => {
      const st = allStaff.find(x => x.id === s.staffId);
      if (!st) { conflicts.push({type:'Staff Not Found', desc:`${s.staffName} not found`, severity:'high'}); return; }
      const isBusy = st.status==='busy' || st.avail==='Busy';
      const isOff = st.status==='off';
      const isOverloaded = (st.workload||0) >= 100;
      const assignedTo = Array.isArray(st.assignedEvents) ? st.assignedEvents : [];
      const isAlreadyAssigned = assignedTo.length > 0 && !assignedTo.includes(ev.id);
      const isInLive = liveEvents.some(e => assignedTo.includes(e.id));
      if (isOff) conflicts.push({type:'Staff Off Duty', desc:`${s.staffName} is off duty`, severity:'high'});
      else if (isInLive) conflicts.push({type:'Staff In Live Event', desc:`${s.staffName} is in a live event`, severity:'high'});
      else if (isBusy) conflicts.push({type:'Staff Busy', desc:`${s.staffName} is busy`, severity:'high'});
      else if (isOverloaded) conflicts.push({type:'Staff Overloaded', desc:`${s.staffName} at ${st.workload}% workload`, severity:'high'});
      else if (isAlreadyAssigned) conflicts.push({type:'Staff Already Assigned', desc:`${s.staffName} assigned to ${assignedTo.length} other event(s)`, severity:'medium'});
    });
    return conflicts;
  }

  /* ── Get filtered list ──────────────── */
  function getFiltered() {
    return DB.getAll('events').filter(ev => {
      const searchMatch = !searchQuery ||
        ev.name.toLowerCase().includes(searchQuery) ||
        ev.id.toLowerCase().includes(searchQuery)   ||
        ev.type.toLowerCase().includes(searchQuery);
        
      const statusMatch = activeFilters.status === 'All' || ev.status === activeFilters.status;
      const typeMatch = activeFilters.type === 'All' || ev.type === activeFilters.type;
      
      let dateMatch = true;
      if (activeFilters.date !== 'All' && ev.date) {
        const evDate = new Date(ev.date + 'T00:00:00');
        const now = new Date();
        const diffDays = (evDate - now) / (1000 * 60 * 60 * 24);
        
        if (activeFilters.date === 'Past') {
          dateMatch = diffDays < 0;
        } else if (activeFilters.date === 'Upcoming7') {
          dateMatch = diffDays >= 0 && diffDays <= 7;
        } else if (activeFilters.date === 'Upcoming30') {
          dateMatch = diffDays >= 0 && diffDays <= 30;
        }
      }
      
      return searchMatch && statusMatch && typeMatch && dateMatch;
    });
  }

  /* ── Render table ───────────────────── */
  function render() {
    const filtered   = getFiltered();
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;

    const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const tbody = document.querySelector('.er-table tbody');
    if (!tbody) return;

    if (!paged.length) {
      tbody.innerHTML = `<tr><td colspan="12" style="text-align:center;padding:40px;color:var(--text-muted)">No event requests found.</td></tr>`;
    } else {
      tbody.innerHTML = paged.map(ev => {
        const canStart = ev.status === 'confirmed';
        const isLive   = ev.status === 'live';
        const isDone   = ev.status === 'completed';
        const isPending = ev.status === 'pending';
        const conflicts = isPending ? detectConflicts(ev) : [];
        const hasConflict = conflicts.length > 0;
        let statusHtml = statusBadge(ev.status);
        if (isPending && hasConflict) {
          statusHtml = `<span class="status-badge" style="background:rgba(239,68,68,0.15);color:#fca5a5;border:1px solid rgba(239,68,68,0.3);padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;">⚠ Conflict</span>`;
        }
        return `
        <tr data-id="${ev.id}">
          <td><input type="checkbox" data-id="${ev.id}" /></td>
          <td class="col-id">${ev.id}</td>
          <td class="col-name">${ev.name}</td>
          <td>${typeBadge(ev.type)}</td>
          <td>${fmtDate(ev.date)}</td>
          <td>${ev.venue}</td>
          <td>${ev.people}</td>
          <td>${ev.time}</td>
          <td>${statusHtml}</td>
          <td>${allocBadge(hasResources(ev.id), 'Allocated')}</td>
          <td>${allocBadge(hasStaff(ev.id),     'Assigned')}</td>
          <td>
            <div class="er-actions">
              <a href="event-review.html?id=${ev.id}" class="er-action-btn view" title="View"><i data-lucide="eye"></i></a>
              ${canStart ? `<button class="er-action-btn" title="Start Event" data-action="start" data-id="${ev.id}" style="color:#22c55e"><i data-lucide="play-circle"></i></button>` : ''}
              ${isLive   ? `<button class="er-action-btn" title="End Event"   data-action="end"   data-id="${ev.id}" style="color:#ef4444"><i data-lucide="stop-circle"></i></button>` : ''}
              ${isDone   ? `<span style="font-size:11px;color:var(--text-muted);padding:4px 6px;">Done</span>` : ''}
              ${!isLive && !isDone && !hasConflict ? `<button class="er-action-btn approve" title="Approve" data-action="approve" data-id="${ev.id}"><i data-lucide="check-circle"></i></button>` : ''}
              ${!isLive && !isDone ? `<button class="er-action-btn reject"  title="Reject"  data-action="reject"  data-id="${ev.id}"><i data-lucide="x-circle"></i></button>` : ''}
              <button class="er-action-btn delete" title="Delete" data-action="delete" data-id="${ev.id}" style="color:var(--text-muted)"><i data-lucide="trash-2"></i></button>
            </div>
          </td>
        </tr>`;
      }).join('');
    }

    const showEl = document.querySelector('.er-showing');
    if (showEl) showEl.textContent = `Showing ${filtered.length} Request${filtered.length !== 1 ? 's' : ''}`;

    renderPagination(totalPages);
    lucide.createIcons();
    attachActions();
  }

  /* ── Pagination ─────────────────────── */
  function renderPagination(totalPages) {
    const pag = document.querySelector('.er-pagination');
    if (!pag) return;

    let html = `<button class="page-btn" id="pgPrev">Previous</button>`;
    for (let i = 1; i <= totalPages; i++) {
      html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    html += `<button class="page-btn" id="pgNext">Next</button>`;
    pag.innerHTML = html;

    pag.querySelector('#pgPrev').addEventListener('click', () => {
      if (currentPage > 1) { currentPage--; render(); }
    });
    pag.querySelector('#pgNext').addEventListener('click', () => {
      if (currentPage < totalPages) { currentPage++; render(); }
    });
    pag.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', () => { currentPage = +btn.dataset.page; render(); });
    });
  }

  /* ── Action buttons ─────────────────── */
  function attachActions() {
    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const { action, id } = btn.dataset;
        const ev = DB.find('events', id);
        if (!ev) return;

        if (action === 'approve') {
          if (ev.status === 'confirmed' || ev.status === 'live') { Toast.show('Already approved.', 'info'); return; }
          DB.update('events', id, { status:'confirmed', approvedAt: new Date().toISOString() });
          
          const allMsgs = DB.get('messages') || {};
          if (!allMsgs['vendor-client']) allMsgs['vendor-client'] = [];
          allMsgs['vendor-client'].push({
            id: 'sys_' + Date.now(),
            sender: 'System',
            self: false,
            text: `Event "${ev.name}" has been officially approved.`,
            time: new Date().toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit'}),
            isSystem: true,
            sysClass: 'success'
          });
          DB.set('messages', allMsgs);

          Toast.show(`✓ "${ev.name}" approved!`, 'success');
          render();
        }

        if (action === 'start') {
          if (ev.status !== 'confirmed') { Toast.show('Only approved events can be started.', 'warn'); return; }
          Confirm.ask({
            title: 'Start Event?',
            msg: `This will mark "${ev.name}" as LIVE and notify the client.`,
            okLabel: 'Start Event', okColor: '#15803d',
          }).then(ok => {
            if (!ok) return;
            DB.update('events', id, { status: 'live', startedAt: new Date().toISOString() });
            Toast.show(`🚀 "${ev.name}" is now LIVE!`, 'success', 4000);
            render();
          });
        }

        if (action === 'end') {
          if (ev.status !== 'live') { Toast.show('Event is not currently live.', 'warn'); return; }
          Confirm.ask({
            title: 'End Event?',
            msg: `This will mark "${ev.name}" as completed and stop live monitoring.`,
            okLabel: 'End Event', okColor: '#9f1239',
          }).then(ok => {
            if (!ok) return;
            DB.update('events', id, { status: 'completed', endedAt: new Date().toISOString() });
            Toast.show(`"${ev.name}" marked as completed.`, 'success');
            render();
          });
        }

        if (action === 'reject') {
          if (ev.status === 'rejected') { Toast.show('Already rejected.', 'info'); return; }
          const conflicts = detectConflicts(ev);
          const hasConflict = conflicts.length > 0;
          const summary = hasConflict ? conflicts.map(c => `${c.type}: ${c.desc}`).join('; ') : 'Rejected by vendor';
          Confirm.ask({
            title: hasConflict ? 'Reject Due to Conflict?' : 'Reject Event Request?',
            msg: hasConflict ? `"${ev.name}" has ${conflicts.length} conflict(s). Reject and notify client?` : `"${ev.name}" will be marked as rejected.`,
            okLabel:'Reject', okColor:'#b91c1c',
          }).then(ok => {
            if (!ok) return;
            DB.update('events', id, { status:'rejected', rejectionReason: summary, rejectedAt: new Date().toISOString(), conflicts: hasConflict ? conflicts : undefined });
            Toast.show(`"${ev.name}" rejected.${hasConflict ? ' Client notified.' : ''}`, 'error');
            render();
          });
        }

        if (action === 'delete') {
          Confirm.ask({
            title:'Delete Event Request?',
            msg:`"${ev.name}" will be permanently removed.`,
            okLabel:'Delete', okColor:'#b91c1c',
          }).then(ok => {
            if (!ok) return;
            DB.remove('events', id);
            Toast.show(`"${ev.name}" deleted.`, 'error');
            render();
          });
        }
      });
    });

    /* Select-all & Checkboxes for Batch */
    const selectAll = document.querySelector('thead input[type="checkbox"]');
    selectAll?.addEventListener('change', () => {
      document.querySelectorAll('tbody input[type="checkbox"]')
        .forEach(cb => cb.checked = selectAll.checked);
      toggleBatchActions();
    });

    document.querySelectorAll('tbody input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', toggleBatchActions);
    });
  }

  function toggleBatchActions() {
    const batchDiv = document.getElementById('erBatchActions');
    const checked = document.querySelectorAll('tbody input[type="checkbox"]:checked');
    if (batchDiv) batchDiv.style.display = checked.length > 0 ? 'flex' : 'none';
  }

  function batchAction(status) {
    const checked = document.querySelectorAll('tbody input[type="checkbox"]:checked');
    if (!checked.length) return;
    const msg = status === 'confirmed' ? 'Approve' : 'Reject';
    Confirm.ask({
      title: `${msg} Selected?`,
      msg: `Apply "${status}" to ${checked.length} selected events?`,
      okLabel: msg, okColor: status === 'confirmed' ? '#15803d' : '#b91c1c'
    }).then(ok => {
      if (!ok) return;
      checked.forEach(cb => {
        const rowId = cb.dataset.id;
        if(rowId) DB.update('events', rowId, { status });
      });
      Toast.show(`${checked.length} events ${status === 'confirmed' ? 'approved' : 'rejected'}.`, status==='confirmed' ? 'success' : 'error');
      render();
      toggleBatchActions();
    });
  }

  /* ── Search & Filters ─────────────────────────── */
  document.querySelector('.er-search input')?.addEventListener('input', e => {
    searchQuery = e.target.value.trim().toLowerCase();
    currentPage = 1;
    render();
  });

  document.querySelector('.er-search i')?.addEventListener('click', () => {
    document.querySelector('.er-search input')?.focus();
  });

  const erFilterBtn = document.querySelector('.er-filter-btn');
  const erFilterDropdown = document.getElementById('erFilterDropdown');
  const applyErFiltersBtn = document.getElementById('applyErFilters');

  if (erFilterBtn && erFilterDropdown) {
    erFilterBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isShowing = erFilterDropdown.style.display === 'block';
      erFilterDropdown.style.display = isShowing ? 'none' : 'block';
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#erFilterWrapper')) {
        erFilterDropdown.style.display = 'none';
      }
    });

    applyErFiltersBtn?.addEventListener('click', () => {
      activeFilters.status = document.getElementById('filterErStatus').value;
      activeFilters.date = document.getElementById('filterErDate').value;
      activeFilters.type = document.getElementById('filterErType').value;
      
      erFilterDropdown.style.display = 'none';
      currentPage = 1;
      render();
      Toast.show('Filters applied!', 'success');
    });
  }

  /* ── Inject Batch Actions into Toolbar ── */
  const toolbar = document.querySelector('.er-toolbar');
  if (toolbar) {
    toolbar.insertAdjacentHTML('beforeend', `
      <div id="erBatchActions" style="display:none; gap: 8px; margin-left: auto;">
        <button id="batchApprove" style="padding: 8px 12px; border-radius: 4px; border: 1px solid var(--green); background: transparent; color: var(--green); cursor: pointer; font-size: 13px; font-weight:600;">Approve All</button>
        <button id="batchReject" style="padding: 8px 12px; border-radius: 4px; border: 1px solid var(--red); background: transparent; color: var(--red); cursor: pointer; font-size: 13px; font-weight:600;">Reject All</button>
      </div>
    `);
    
    document.getElementById('batchApprove')?.addEventListener('click', () => batchAction('confirmed'));
    document.getElementById('batchReject')?.addEventListener('click', () => batchAction('rejected'));
  }

  initTopbarSearch(q => { searchQuery = q; currentPage = 1; render(); });

  render();
});