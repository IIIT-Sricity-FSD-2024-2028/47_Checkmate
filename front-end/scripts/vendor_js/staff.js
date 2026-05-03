/* ═══════════════════════════════════════════
   staff.js  —  Manage Staff Page
   • Render staff cards from DB
   • Search filter
   • Add / Edit (modal) with full validation
   • Delete with confirm
   • Schedule view
═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  let searchQuery = '';
  let editingId   = null;
  let assignStaffId = null;

  /* ── Inject modal HTML ──────────────── */
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay" id="staffModalOverlay">
      <div class="modal" style="width:min(520px,94vw)">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px 16px;border-bottom:1px solid var(--border)">
          <h3 id="staffModalTitle" style="font-family:var(--font-display);font-size:17px;font-weight:700;color:var(--text-primary)">Add Staff</h3>
          <button id="staffModalClose" style="width:32px;height:32px;border-radius:8px;border:1px solid var(--border);background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text-secondary);font-size:16px">✕</button>
        </div>
        <div style="padding:24px;display:flex;flex-direction:column;gap:16px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
            <div style="display:flex;flex-direction:column;gap:6px;grid-column:1/-1">
              <label style="font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.4px">Full Name *</label>
              <input id="stName" class="ri-input" type="text" placeholder="e.g. Alex Johnson" />
              <span id="stNameErr" style="font-size:11.5px;color:var(--red);display:none">Name is required.</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px">
              <label style="font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.4px">Role *</label>
              <input id="stRole" class="ri-input" type="text" placeholder="e.g. Event Coordinator" />
              <span id="stRoleErr" style="font-size:11.5px;color:var(--red);display:none">Role is required.</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px">
              <label style="font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.4px">Phone</label>
              <input id="stPhone" class="ri-input" type="tel" placeholder="+1 234-567-8900" />
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;grid-column:1/-1">
              <label style="font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.4px">Email *</label>
              <input id="stEmail" class="ri-input" type="email" placeholder="name@eventpro.com" />
              <span id="stEmailErr" style="font-size:11.5px;color:var(--red);display:none">Valid email is required.</span>
            </div>

            <div style="display:flex;flex-direction:column;gap:6px">
              <label style="font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.4px">Workload % *</label>
              <input id="stWorkload" class="ri-input" type="number" min="0" max="100" placeholder="e.g. 75" />
              <span id="stWorkloadErr" style="font-size:11.5px;color:var(--red);display:none">Enter 0–100.</span>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;padding:16px 24px;border-top:1px solid var(--border)">
          <button id="staffCancelBtn" class="ri-cancel">Cancel</button>
          <button id="staffSaveBtn" class="ri-submit" style="flex:unset;padding:12px 28px">Save Staff</button>
        </div>
      </div>
    </div>

    <!-- Assign Modal -->
    <div class="modal-overlay" id="assignModalOverlay">
      <div class="modal" style="width:min(480px,94vw)">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px 16px;border-bottom:1px solid var(--border)">
          <h3 style="font-family:var(--font-display);font-size:17px;font-weight:700;color:var(--text-primary)">Assign Task</h3>
          <button id="assignModalClose" style="width:32px;height:32px;border-radius:8px;border:1px solid var(--border);background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text-secondary);font-size:16px">✕</button>
        </div>
        <div style="padding:24px;display:flex;flex-direction:column;gap:16px">
          <div style="font-size:13px;color:var(--text-secondary)">Assign a task to <strong id="assignStaffName" style="color:var(--text-primary)"></strong></div>
          <!-- Workload bar -->
          <div id="assignWorkloadBar" style="background:var(--bg-hover);border:1px solid var(--border);border-radius:8px;padding:10px 14px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
              <span style="font-size:11px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.4px">Current Workload</span>
              <span id="assignWorkloadPct" style="font-size:12px;font-weight:700;color:var(--pink)">0%</span>
            </div>
            <div style="height:6px;background:rgba(255,255,255,.06);border-radius:4px;overflow:hidden">
              <div id="assignWorkloadFill" style="height:100%;width:0%;background:var(--pink);border-radius:4px;transition:width .3s"></div>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.4px">Select Event *</label>
            <div class="ri-select-wrap">
              <select id="assignEventSelect" class="ri-select">
              </select>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.4px">Task Name *</label>
            <input id="assignTaskName" class="ri-input" type="text" placeholder="e.g. Setup Sound System, Manage Guest Entry" />
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.4px">Priority</label>
            <div class="ri-select-wrap">
              <select id="assignTaskPriority" class="ri-select">
                <option value="High">High</option>
                <option value="Medium" selected>Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;padding:16px 24px;border-top:1px solid var(--border)">
          <button id="assignCancelBtn" class="ri-cancel">Cancel</button>
          <button id="assignSaveBtn" class="ri-submit" style="flex:unset;padding:12px 28px">Assign Task</button>
        </div>
      </div>
    </div>`);

  lucide.createIcons();

  const overlay = document.getElementById('staffModalOverlay');
  wireModalClose(overlay, document.getElementById('staffModalClose'), document.getElementById('staffCancelBtn'));

  const assignOverlay = document.getElementById('assignModalOverlay');
  wireModalClose(assignOverlay, document.getElementById('assignModalClose'), document.getElementById('assignCancelBtn'));

  /* ── Helpers ────────────────────────── */
  function workloadLevel(pct) {
    return pct <= 50 ? 'low' : pct <= 79 ? 'medium' : 'high';
  }

  function toInitials(name) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  function staffStatusBadge(status) {
    const labels = { available:'available', busy:'busy', off:'off duty' };
    return `<span class="staff-status ${status || 'off'}">${labels[status] || status}</span>`;
  }

  const AVATARS = ['pink','teal','purple','green','orange'];
  function avatarCol(idx) { return AVATARS[idx % AVATARS.length]; }

  /* ── Error helpers ──────────────────── */
  function showErr(id, show) {
    const el = document.getElementById(id);
    if (el) el.style.display = show ? 'block' : 'none';
  }
  function markField(inputId, hasErr) {
    const el = document.getElementById(inputId);
    if (el) el.style.borderColor = hasErr ? 'rgba(239,68,68,0.6)' : '';
  }
  function clearErrors() {
    ['stNameErr','stRoleErr','stEmailErr','stWorkloadErr'].forEach(id => showErr(id, false));
    ['stName','stRole','stEmail','stWorkload'].forEach(id => markField(id, false));
  }

  /* ── Validate ───────────────────────── */
  function validate() {
    const name     = document.getElementById('stName').value.trim();
    const role     = document.getElementById('stRole').value.trim();
    const email    = document.getElementById('stEmail').value.trim();
    const workload = document.getElementById('stWorkload').value;
    let valid = true;

    const nameErr = !name;
    showErr('stNameErr', nameErr); markField('stName', nameErr);
    if (nameErr) valid = false;

    const roleErr = !role;
    showErr('stRoleErr', roleErr); markField('stRole', roleErr);
    if (roleErr) valid = false;

    const emailErr = !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    showErr('stEmailErr', emailErr); markField('stEmail', emailErr);
    if (emailErr) valid = false;

    const wlNum  = parseInt(workload, 10);
    const wlErr  = workload === '' || isNaN(wlNum) || wlNum < 0 || wlNum > 100;
    showErr('stWorkloadErr', wlErr); markField('stWorkload', wlErr);
    if (wlErr) valid = false;

    return valid;
  }

  /* ── Render cards ───────────────────── */
  function render() {
    const staffList = DB.getAll('staff');
    const grid = document.querySelector('.staff-grid');
    if (!grid) return;

    const filtered = staffList.filter(s =>
      !searchQuery ||
      s.name.toLowerCase().includes(searchQuery)  ||
      s.role.toLowerCase().includes(searchQuery)  ||
      s.email.toLowerCase().includes(searchQuery)
    );

    if (!filtered.length) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text-muted)">No staff found.</div>`;
      return;
    }

    grid.innerHTML = filtered.map((s, idx) => {
      const lvl  = workloadLevel(s.workload);
      const init = s.initials || toInitials(s.name);
      const av   = s.avatar   || avatarCol(idx);
      return `
        <div class="staff-card" data-id="${s.id}">
          <div class="staff-card__header">
            <div class="staff-card__info">
              <div class="staff-avatar avatar--${av}">${init}</div>
              <div>
                <div class="staff-name">${s.name}</div>
                <div class="staff-role">${s.role}</div>
              </div>
            </div>
            ${staffStatusBadge(s.status)}
          </div>
          <div class="staff-card__contact">
            <div class="contact-row"><i data-lucide="phone"></i> ${s.phone || '—'}</div>
            <div class="contact-row"><i data-lucide="mail"></i> ${s.email}</div>
          </div>
          <div class="staff-card__workload">
            <div class="workload-header">
              <span class="workload-label"><i data-lucide="activity"></i> Workload</span>
              <span class="workload-pct ${lvl}">${s.workload}%</span>
            </div>
            <div class="workload-bar-bg">
              <div class="workload-bar-fill ${lvl}" style="width:${s.workload}%"></div>
            </div>
          </div>
          <div class="staff-card__actions">
            <button class="staff-btn staff-btn--assign" data-action="assign" data-id="${s.id}" style="color:var(--pink)">
              <i data-lucide="calendar-plus"></i> Assign
            </button>
            <button class="staff-btn staff-btn--schedule" data-action="schedule" data-id="${s.id}">
              <i data-lucide="calendar"></i> Schedule
            </button>
            <button class="staff-btn staff-btn--edit" data-action="edit" data-id="${s.id}">
              <i data-lucide="pencil"></i> Edit
            </button>
            <button class="staff-btn staff-btn--delete" data-action="delete" data-id="${s.id}">
              <i data-lucide="trash-2"></i> Delete
            </button>
          </div>
        </div>`;
    }).join('');

    lucide.createIcons();
    attachActions();
  }

  /* ── Card actions ───────────────────── */
  function attachActions() {
    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const { action, id } = btn.dataset;
        if (action === 'schedule') scheduleStaff(id);
        if (action === 'assign')   assignStaffToEvent(id);
        if (action === 'edit')    editStaff(id);
        if (action === 'delete')  deleteStaff(id);
      });
    });
  }

  function scheduleStaff(id) {
    const s = DB.find('staff', id);
    if (!s) return;
    const confirmed = DB.getAll('events').filter(e => e.status === 'confirmed');
    Toast.show(
      `${s.name} (${s.role}) — ${confirmed.length} confirmed event(s) available. Workload: ${s.workload}%`,
      'info', 5000
    );
  }

  function assignStaffToEvent(id) {
    const s = DB.find('staff', id);
    if (!s) return;
    
    // Check workload cap
    if ((s.workload || 0) >= 100) {
      Toast.show(`${s.name} is at 100% workload. Complete existing tasks first.`, 'warn');
      return;
    }
    
    // ── Single-event constraint ──
    // Check if this staff already has assignments to an event
    const allAssignments = DB.getAll('staffAssignments') || [];
    const staffAssignments = allAssignments.filter(a => a.staffId === s.id && (a.status === 'pending' || a.status === 'accepted'));
    const assignedEventIds = [...new Set(staffAssignments.map(a => a.eventId))];
    
    // Broaden filter to any actionable status
    const validStatuses = ['approved', 'confirmed', 'live'];
    let actionableEvents = DB.getAll('events').filter(e => validStatuses.includes((e.status || '').toLowerCase()));
    
    // If staff is already assigned to an event, restrict to only that event
    let restrictedToEvent = null;
    if (assignedEventIds.length > 0) {
      restrictedToEvent = assignedEventIds[0]; // Staff can only work on one event
      actionableEvents = actionableEvents.filter(e => e.id === restrictedToEvent);
      
      if (actionableEvents.length === 0) {
        const evName = staffAssignments[0]?.eventName || restrictedToEvent;
        Toast.show(`${s.name} is assigned to "${evName}" which is no longer active. Remove existing assignment first.`, 'warn');
        return;
      }
    }
    
    if (actionableEvents.length === 0) {
      Toast.show('No approved or confirmed events available to assign.', 'warn');
      return;
    }
    
    assignStaffId = id;
    document.getElementById('assignStaffName').textContent = s.name;
    
    // Show workload
    const wl = Math.min(s.workload || 0, 100);
    document.getElementById('assignWorkloadPct').textContent = wl + '%';
    document.getElementById('assignWorkloadFill').style.width = wl + '%';
    document.getElementById('assignWorkloadFill').style.background = wl >= 80 ? '#ef4444' : wl >= 60 ? '#f59e0b' : 'var(--pink)';
    
    const select = document.getElementById('assignEventSelect');
    select.innerHTML = actionableEvents.map(ev => 
      `<option value="${ev.id}">${ev.name} [${ev.status.toUpperCase()}]</option>`
    ).join('');
    
    // Show info about restriction
    let infoEl = document.getElementById('assignEventInfo');
    if (!infoEl) {
      infoEl = document.createElement('div');
      infoEl.id = 'assignEventInfo';
      select.parentElement.parentElement.appendChild(infoEl);
    }
    if (restrictedToEvent) {
      const evName = actionableEvents[0]?.name || restrictedToEvent;
      infoEl.style.cssText = 'font-size:11px;color:var(--yellow,#eab308);margin-top:6px;padding:8px 12px;background:rgba(234,179,8,0.08);border:1px solid rgba(234,179,8,0.2);border-radius:6px;display:flex;align-items:center;gap:6px;';
      infoEl.innerHTML = `⚠️ ${s.name} is already assigned to <strong>"${evName}"</strong>. Staff can only be assigned to one event at a time.`;
    } else {
      infoEl.style.cssText = 'font-size:11px;color:var(--green,#22c55e);margin-top:6px;padding:8px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:6px;';
      infoEl.innerHTML = `✓ ${s.name} has no current event assignment. You may assign to any event.`;
    }
    
    // Clear task input
    document.getElementById('assignTaskName').value = '';
    document.getElementById('assignTaskPriority').value = 'Medium';
    
    openModal(assignOverlay);
  }

  document.getElementById('assignSaveBtn')?.addEventListener('click', () => {
    if (!assignStaffId) return;
    const eventId = document.getElementById('assignEventSelect').value;
    const taskName = document.getElementById('assignTaskName').value.trim();
    const priority = document.getElementById('assignTaskPriority').value;
    const s = DB.find('staff', assignStaffId);
    const ev = DB.find('events', eventId);
    
    if (!taskName) {
      Toast.show('Please enter a task name.', 'warn');
      return;
    }
    
    if (!s || !ev) return;
    
    // 1. Check workload cap
    const currentWorkload = s.workload || 0;
    if (currentWorkload >= 100) {
      Toast.show(`${s.name} is at 100% workload. Cannot assign more tasks.`, 'warn');
      closeModal(assignOverlay);
      assignStaffId = null;
      return;
    }

    // 2. Check for duplicate task name for same staff+event
    const allAssignments = DB.getAll('staffAssignments');
    const existingAssignment = allAssignments.find(a => a.staffId === s.id && a.eventId === ev.id);
    
    if (existingAssignment && existingAssignment.tasks) {
      const dupTask = existingAssignment.tasks.find(t => t.desc.trim().toLowerCase() === taskName.toLowerCase());
      if (dupTask) {
        Toast.show(`Task "${taskName}" already assigned to ${s.name} for ${ev.name}.`, 'warn');
        closeModal(assignOverlay);
        assignStaffId = null;
        return;
      }
    }

    // 3. Create the task object
    const newTask = {
      id: 'T_' + Date.now(),
      desc: taskName,
      priority: priority,
      status: 'todo',
      eventName: ev.name
    };

    if (existingAssignment) {
      // 4a. Add task to existing assignment
      const updatedTasks = [...(existingAssignment.tasks || []), newTask];
      DB.update('staffAssignments', existingAssignment.id, { tasks: updatedTasks });
    } else {
      // 4b. Create new assignment with this task
      const assigned = Array.isArray(s.assignedEvents) ? s.assignedEvents : [];
      if (!assigned.includes(eventId)) {
        assigned.push(eventId);
        DB.update('staff', assignStaffId, { assignedEvents: assigned });
      }

      const newAssignment = {
        id: 'SA_' + Date.now(),
        staffId: s.id,
        staffName: s.name,
        staffRole: s.role,
        role: s.role,
        eventId: ev.id,
        eventName: ev.name,
        eventDate: ev.date,
        eventVenue: ev.venue,
        eventPeople: ev.people,
        taskDesc: taskName,
        priority: priority,
        status: 'pending',
        tasks: [newTask],
        assignedAt: new Date().toISOString()
      };
      
      DB.add('staffAssignments', newAssignment);
    }

    // 5. Increase workload by 20%
    const newWorkload = Math.min(currentWorkload + 20, 100);
    DB.update('staff', assignStaffId, { workload: newWorkload });
    
    Toast.show(`Task "${taskName}" assigned to ${s.name} for ${ev.name}! Workload: ${newWorkload}%`, 'success');
    
    closeModal(assignOverlay);
    assignStaffId = null;
    render();
  });

  function editStaff(id) {
    const s = DB.find('staff', id);
    if (!s) return;
    editingId = id;
    document.getElementById('staffModalTitle').textContent = 'Edit Staff';
    document.getElementById('stName').value     = s.name;
    document.getElementById('stRole').value     = s.role;
    document.getElementById('stPhone').value    = s.phone || '';
    document.getElementById('stEmail').value    = s.email;
    document.getElementById('stWorkload').value = s.workload;
    clearErrors();
    openModal(overlay);
  }

  async function deleteStaff(id) {
    const s = DB.find('staff', id);
    if (!s) return;
    const ok = await Confirm.ask({ title:'Remove Staff?', msg:`"${s.name}" will be removed from the team.` });
    if (!ok) return;
    DB.remove('staff', id);
    render();
    Toast.show('Staff member removed.', 'error');
  }

  /* ── Save ───────────────────────────── */
  document.getElementById('staffSaveBtn').addEventListener('click', () => {
    if (!validate()) { Toast.show('Please fix the errors above.', 'warn'); return; }

    const name     = document.getElementById('stName').value.trim();
    const role     = document.getElementById('stRole').value.trim();
    const phone    = document.getElementById('stPhone').value.trim();
    const email    = document.getElementById('stEmail').value.trim();
    const workload = Math.min(100, Math.max(0, parseInt(document.getElementById('stWorkload').value, 10)));

    const staffList = DB.getAll('staff');
    const existIdx  = staffList.findIndex(s => s.id === editingId);
    const av        = existIdx >= 0 ? staffList[existIdx].avatar : avatarCol(staffList.length);

    const patch = { name, role, phone, email, workload, initials: toInitials(name), avatar: av };

    if (editingId) {
      DB.update('staff', editingId, patch);
      Toast.show('Staff updated!', 'success');
    } else {
      DB.add('staff', { id: uid('S'), status: 'available', ...patch });
      Toast.show('Staff added!', 'success');
    }

    closeModal(overlay);
    editingId = null;
    render();
  });

  /* ── Add button ─────────────────────── */
  document.querySelector('.ms-add-btn')?.addEventListener('click', () => {
    editingId = null;
    document.getElementById('staffModalTitle').textContent = 'Add Staff';
    ['stName','stRole','stPhone','stEmail','stWorkload'].forEach(id => document.getElementById(id).value = '');
    clearErrors();
    openModal(overlay);
  });

  /* ── Search & Filters ─────────────────────────── */
  document.querySelector('.ms-search input')?.addEventListener('input', e => {
    searchQuery = e.target.value.trim().toLowerCase();
    render();
  });

  document.querySelector('.ms-search i')?.addEventListener('click', () => {
    document.querySelector('.ms-search input')?.focus();
  });

  document.querySelector('.ms-filter-btn')?.addEventListener('click', () => {
    Toast.show('Advanced filter options coming soon.', 'info');
  });

  initTopbarSearch(q => { searchQuery = q; render(); });

  render();
});