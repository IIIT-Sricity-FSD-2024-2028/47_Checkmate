/* ═══════════════════════════════════════════
   dashboard.js  —  Vendor Dashboard
   • Live stat cards from DB
   • Dynamic upcoming events list
   • Dynamic alerts from DB state
   • Quick-Action button navigation
═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Stat Cards ─────────────────────── */
  function updateStats() {
    const events     = DB.getMyEvents();
    const resources  = DB.getMyResources();
    const staff      = DB.getMyStaff();
    const assignments = DB.getAll('staffAssignments') || [];
    const earnings   = typeof DB.getMyEarnings === 'function' ? DB.getMyEarnings() : { netEarnings: 0 };

    const pending    = events.filter(e => e.status === 'pending').length;
    const active     = events.filter(e => e.status === 'confirmed' || e.status === 'live').length;
    const availRes   = resources.reduce((s, r) => s + (r.available ? (r.quantity || r.avail || 0) : 0), 0);
    
    // Available Staff: staff without high workload assignments
    const busyStaffIds = assignments.filter(a => a.status === 'accepted').map(a => a.staffId);
    const availStaff = staff.filter(s => (s.status === 'available' || s.avail === 'Available') && !busyStaffIds.includes(s.id)).length;

    document.querySelectorAll('.stat-card').forEach(card => {
      const label = card.querySelector('.stat-label')?.textContent?.trim();
      const valEl = card.querySelector('.stat-value');
      if (!valEl) return;
      if (label === 'Pending Requests')    valEl.textContent = pending;
      if (label === 'Active Events')       valEl.textContent = active;
      if (label === 'Available Resources') valEl.textContent = availRes;
      if (label === 'Available Staff')     valEl.textContent = availStaff;
      if (label && label.includes('Net Earnings')) {
        valEl.textContent = '$' + (Number(earnings.netEarnings) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
    });
  }

  /* ── Upcoming Events List ───────────── */
  function renderEvents() {
    const eventListEl = document.querySelector('.event-list');
    if (!eventListEl) return;

    const events = DB.getMyEvents();
    const sorted = [...events]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5);

    if (!sorted.length) {
      eventListEl.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-muted)">No upcoming events.</div>`;
      return;
    }

    eventListEl.innerHTML = sorted.map(ev => `
      <div class="event-item">
        <div class="event-info">
          <div class="event-name">${ev.name}</div>
          <div class="event-meta">
            <i data-lucide="calendar" class="meta-icon"></i>
            ${fmtDate(ev.date)}&nbsp;&nbsp;${ev.venue}
          </div>
        </div>
        ${statusBadge(ev.status)}
      </div>
    `).join('');
    lucide.createIcons();
  }

  /* ── Recent Activity ─────────────────── */
  function renderActivity() {
    const actEl = document.querySelector('.activity-list');
    if (!actEl) return;

    const events = DB.getMyEvents();
    const issues = DB.getMyIssues();
    const assignments = DB.getAll('staffAssignments') || [];
    const myStaffIds = new Set(DB.getMyStaff().map(s => s.id));

    const items = [];
    
    // Sort assignments for my staff
    assignments.reverse().forEach(a => {
        if (myStaffIds.has(a.staffId)) {
          if (a.status === 'accepted') items.push({ title: 'Staff accepted assignment', sub: `${a.staffName} -> ${a.eventName}` });
          if (a.status === 'rejected') items.push({ title: 'Staff rejected assignment', sub: `${a.staffName} -> ${a.eventName}` });
          if (a.status === 'pending')  items.push({ title: 'Staff assigned to event', sub: `${a.staffName} -> ${a.eventName}` });
        }
    });

    events.forEach(ev => {
      if (ev.status === 'confirmed' || ev.status === 'live') items.push({ title:'Event active/approved', sub:ev.name });
      if (ev.status === 'pending')   items.push({ title:'New event request', sub:ev.name });
    });
    
    issues.slice(-2).forEach(iss => items.push({ title:'Issue reported', sub:iss.title }));

    const shown = items.slice(0, 4);
    if (!shown.length) {
      actEl.innerHTML = `<div style="padding:24px 16px;text-align:center;color:var(--text-muted);font-size:13px">No recent activity.</div>`;
      return;
    }

    const timeLabels = ['Just now', '10 mins ago','30 mins ago','2 hours ago'];
    actEl.innerHTML = shown.map((a, i) => `
      <div class="activity-item">
        <span class="activity-dot"></span>
        <div class="activity-body">
          <div class="activity-title">${a.title}</div>
          <div class="activity-sub">${a.sub}</div>
        </div>
        <div class="activity-time">${timeLabels[i] || 'Today'}</div>
      </div>
    `).join('');
  }

  /* ── Critical Alerts ────────────────── */
  function renderAlerts() {
    const alertListEl = document.querySelector('.alert-list');
    if (!alertListEl) return;

    const resources = DB.getMyResources();
    const staff     = DB.getMyStaff();
    const events    = DB.getMyEvents();
    const alerts    = [];

    const unavailable = resources.filter(r => !r.available);
    if (unavailable.length)
      alerts.push({ cls:'alert-item--yellow', msg:`Low stock: ${unavailable.map(r => r.name).join(', ')}`, time:'2 hours ago' });

    const highLoad = staff.filter(s => s.workload >= 85);
    if (highLoad.length)
      alerts.push({ cls:'alert-item--orange', msg:`Staff at capacity: ${highLoad.map(s => s.name).join(', ')}`, time:'5 hours ago' });

    const pendingCount = events.filter(e => e.status === 'pending').length;
    if (pendingCount)
      alerts.push({ cls:'alert-item--blue', msg:`${pendingCount} event request(s) awaiting review`, time:'1 day ago' });

    if (!alerts.length)
      alerts.push({ cls:'alert-item--blue', msg:'No critical alerts at this time.', time:'Just now' });

    alertListEl.innerHTML = alerts.map(a => `
      <div class="alert-item ${a.cls}">
        <div class="alert-msg">${a.msg}</div>
        <div class="alert-time"><i data-lucide="clock" class="meta-icon"></i> ${a.time}</div>
      </div>
    `).join('');
    lucide.createIcons();
  }

  /* ── Quick Actions ───────────────────── */
  document.querySelectorAll('.qa-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const label = btn.querySelector('span')?.textContent?.trim();
      const map = {
        'Review Event':     'event-request.html',
        'Manage Resources': 'manage-resource.html',
        'Assign Staff':     'manage-staff.html',
        'Add Package':      'preset-package.html',
      };
      if (map[label]) window.location.href = map[label];
    });
  });

  /* ── View All ────────────────────────── */
  document.querySelector('.view-all')?.addEventListener('click', e => {
    e.preventDefault();
    window.location.href = 'event-request.html';
  });

  /* ── Welcome banner name ─────────────── */
  const session = DB.getSession();
  const h2 = document.querySelector('.welcome-banner h2');
  if (h2) h2.textContent = `Welcome back, ${session.user}! 👋`;

  /* ── Boot ───────────────────────────── */
  updateStats();
  renderEvents();
  renderActivity();
  renderAlerts();
});