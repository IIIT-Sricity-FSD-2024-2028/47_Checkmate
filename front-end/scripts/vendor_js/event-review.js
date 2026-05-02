/* ═══════════════════════════════════════════
   event-review.js  —  Event Review Page
   • Reads ?id= from URL and loads event from DB
   • Populates header, meta cards dynamically
   • Wires Approve / Reject buttons
   • Back button navigation
═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Read event ID from URL ─────────── */
  const params = new URLSearchParams(window.location.search);
  const id     = params.get('id');
  const ev     = id ? DB.find('events', id) : null;

  /* ── Populate header ────────────────── */
  if (ev) {
    const h2 = document.querySelector('.ev-header__left h2');
    if (h2) h2.textContent = ev.name;

    const subP = document.querySelector('.ev-header__left p');
    if (subP) subP.textContent = `Event ID: ${ev.id} · ${ev.type}`;

    /* Status badge */
    const badge = document.querySelector('.ev-status-badge');
    if (badge) {
      const labels = { pending:'Under Review', confirmed:'Approved', rejected:'Rejected' };
      const colors = {
        pending:   { bg:'rgba(234,179,8,0.15)',   color:'var(--yellow)', border:'rgba(234,179,8,0.3)' },
        confirmed: { bg:'rgba(34,197,94,0.15)',   color:'var(--green)',  border:'rgba(34,197,94,0.3)' },
        rejected:  { bg:'rgba(239,68,68,0.15)',   color:'var(--red)',    border:'rgba(239,68,68,0.3)' },
      };
      const c = colors[ev.status] || colors.pending;
      badge.textContent   = labels[ev.status] || 'Under Review';
      badge.style.background  = c.bg;
      badge.style.color       = c.color;
      badge.style.border      = `1px solid ${c.border}`;
    }

    /* Meta cards — Date / Time / Venue / People */
    const metaVals = document.querySelectorAll('.ev-meta-value');
    if (metaVals[0]) metaVals[0].textContent = fmtDate(ev.date);
    if (metaVals[1]) metaVals[1].textContent = ev.time;
    if (metaVals[2]) metaVals[2].textContent = ev.venue;
    if (metaVals[3]) metaVals[3].textContent = `${ev.people} people`;

    /* Page title */
    document.title = `EventPro – Review: ${ev.name}`;
  } else if (id) {
    Toast.show('Event not found.', 'error');
  }

  /* ── Approve button ─────────────────── */
  document.querySelector('.btn-approve')?.addEventListener('click', () => {
    if (!ev) { Toast.show('No event loaded.', 'warn'); return; }
    if (ev.status === 'confirmed') { Toast.show('Already approved.', 'info'); return; }

    DB.update('events', ev.id, { status:'confirmed' });
    Toast.show(`✓ "${ev.name}" approved!`, 'success');

    /* Update badge immediately */
    const badge = document.querySelector('.ev-status-badge');
    if (badge) {
      badge.textContent = 'Approved';
      badge.style.background = 'rgba(34,197,94,0.15)';
      badge.style.color      = 'var(--green)';
      badge.style.border     = '1px solid rgba(34,197,94,0.3)';
    }

    setTimeout(() => window.location.href = 'event-request.html', 1400);
  });

  /* ── Reject button ──────────────────── */
  document.querySelector('.btn-reject')?.addEventListener('click', () => {
    if (!ev) { Toast.show('No event loaded.', 'warn'); return; }
    if (ev.status === 'rejected') { Toast.show('Already rejected.', 'info'); return; }

    Confirm.ask({
      title:'Reject Event?',
      msg:`"${ev ? ev.name : 'This event'}" will be marked as rejected.`,
      okLabel:'Reject', okColor:'#b91c1c',
    }).then(ok => {
      if (!ok) return;
      DB.update('events', ev.id, { status:'rejected' });
      Toast.show(`"${ev.name}" rejected.`, 'error');

      const badge = document.querySelector('.ev-status-badge');
      if (badge) {
        badge.textContent = 'Rejected';
        badge.style.background = 'rgba(239,68,68,0.15)';
        badge.style.color      = 'var(--red)';
        badge.style.border     = '1px solid rgba(239,68,68,0.3)';
      }

      setTimeout(() => window.location.href = 'event-request.html', 1400);
    });
  });

  /* ── Back button ────────────────────── */
  document.querySelector('.btn-back')?.addEventListener('click', e => {
    e.preventDefault();
    window.location.href = 'event-request.html';
  });

  /* ── Contingency Plan helpers ────────── */
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

  function renderContingencyPlans() {
    const section = document.getElementById('contingencySection');
    if (!section) return;
    const eventId = id;
    if (!eventId) {
      section.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px;">No event loaded.</div>';
      return;
    }

    const plans = getPlansForEvent(eventId);

    let html = `
      <table class="cont-table">
        <thead>
          <tr><th>Problem</th><th>Trigger Condition</th><th>Solution</th><th>Status</th><th style="width:44px"></th></tr>
        </thead>
        <tbody>`;

    if (!plans.length) {
      html += `<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted);font-size:13px;">No contingency plans yet. Add one below.</td></tr>`;
    } else {
      plans.forEach(p => {
        const statusHtml = p.status === 'triggered'
          ? '<span class="cont-status-triggered"><i data-lucide="zap" style="width:11px;height:11px"></i>triggered</span>'
          : '<span class="row-status ready">ready</span>';
        html += `
          <tr>
            <td>${p.problem}</td>
            <td>${p.trigger}</td>
            <td>${p.solution}</td>
            <td>${statusHtml}</td>
            <td style="text-align:right;">
              <button class="cont-del-btn" data-plan-id="${p.id}" title="Remove plan">
                <i data-lucide="x"></i>
              </button>
            </td>
          </tr>`;
      });
    }

    html += `</tbody></table>`;

    // Add plan form
    html += `
      <div class="cont-add-row">
        <div class="cont-input-group">
          <label>Problem</label>
          <input type="text" id="cpProblem" placeholder="e.g. Venue Flooding" />
        </div>
        <div class="cont-input-group">
          <label>Trigger Condition</label>
          <input type="text" id="cpTrigger" placeholder="e.g. Heavy rain > 2hrs" />
        </div>
        <div class="cont-input-group">
          <label>Solution</label>
          <input type="text" id="cpSolution" placeholder="e.g. Relocate to Hall B" />
        </div>
        <button class="cont-add-btn" id="cpAddBtn">
          <i data-lucide="plus"></i> Add Plan
        </button>
      </div>`;

    section.innerHTML = html;

    // Bind delete buttons
    section.querySelectorAll('.cont-del-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const planId = btn.dataset.planId;
        Confirm.ask({
          title: 'Remove Plan?',
          msg: 'This contingency plan will be deleted.',
          okLabel: 'Remove', okColor: '#b91c1c',
        }).then(ok => {
          if (!ok) return;
          const allPlans = DB.get('contingencyPlans') || {};
          if (allPlans[eventId]) {
            allPlans[eventId] = allPlans[eventId].filter(p => p.id !== planId);
            DB.set('contingencyPlans', allPlans);
          }
          Toast.show('Plan removed.', 'error');
          renderContingencyPlans();
        });
      });
    });

    // Bind add button
    document.getElementById('cpAddBtn')?.addEventListener('click', () => {
      const problem  = document.getElementById('cpProblem')?.value.trim();
      const trigger  = document.getElementById('cpTrigger')?.value.trim();
      const solution = document.getElementById('cpSolution')?.value.trim();

      if (!problem || !trigger || !solution) {
        Toast.show('Please fill all three fields.', 'warn');
        return;
      }

      const allPlans = DB.get('contingencyPlans') || {};
      if (!allPlans[eventId]) allPlans[eventId] = [];
      allPlans[eventId].push({
        id: 'CP_' + Date.now(),
        problem,
        trigger,
        solution,
        status: 'ready',
      });
      DB.set('contingencyPlans', allPlans);
      Toast.show('✓ Contingency plan added!', 'success');
      renderContingencyPlans();
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  /* ── Render contingency on load ──────── */
  renderContingencyPlans();

  /* ── Lucide icons ───────────────────── */
  if (typeof lucide !== 'undefined') lucide.createIcons();
});