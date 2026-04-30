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

  /* ── Lucide icons ───────────────────── */
  if (typeof lucide !== 'undefined') lucide.createIcons();
});