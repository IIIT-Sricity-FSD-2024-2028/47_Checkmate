/* ═══════════════════════════════════════════
   report.js  —  Report Issue Page
   • Full client-side validation (all fields)
   • Character counter for description
   • Saves issue to DB on submit
   • Success toast + form reset
   • Cancel → go back
═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  const titleEl    = document.querySelector('.ri-input[placeholder*="Brief"]');
  const descEl     = document.querySelector('.ri-textarea');
  const selects    = document.querySelectorAll('.ri-select');
  const priorityEl = selects[0];
  const categoryEl = selects[1];
  const eventEl    = selects[2];
  const submitBtn  = document.getElementById('submitBtn');
  const cancelBtn  = document.querySelector('.ri-cancel');

  /* ── Populate related-event dropdown from DB ── */
  function populateEvents() {
    if (eventEl) {
      const events = window.CoordHub ? window.CoordHub.getEventsForUser() : DB.getAll('events').filter(e => e.status === 'live');
      eventEl.innerHTML = `<option value="" disabled selected>Select related event *</option>`;
      events.forEach(ev => {
        const opt = document.createElement('option');
        opt.value = ev.id;
        opt.textContent = ev.name;
        eventEl.appendChild(opt);
      });
    }
  }
  
  // Wait for DB to be initialized
  setTimeout(populateEvents, 500);

  /* ── Character counter ──────────────── */
  if (descEl) {
    const counter = document.createElement('div');
    counter.style.cssText = 'font-size:11px;color:var(--text-muted);text-align:right;margin-top:4px';
    counter.textContent = '0 / 500';
    descEl.parentElement.appendChild(counter);
    descEl.addEventListener('input', () => {
      if (descEl.value.length > 500) descEl.value = descEl.value.slice(0, 500);
      const len = descEl.value.length;
      counter.textContent = `${len} / 500`;
      counter.style.color = len > 450 ? 'var(--yellow)' : 'var(--text-muted)';
    });
  }

  /* ── Field highlight helpers ─────────── */
  function markField(el, hasErr) {
    if (!el) return;
    el.style.borderColor = hasErr ? 'rgba(239,68,68,0.6)' : '';
  }
  function clearErrors() {
    [titleEl, descEl, priorityEl, categoryEl, eventEl].forEach(el => markField(el, false));
  }

  /* ── Real-time feedback ─────────────── */
  titleEl?.addEventListener('input',    () => markField(titleEl,    !titleEl.value.trim()));
  descEl?.addEventListener('input',     () => markField(descEl,     !descEl.value.trim()));
  priorityEl?.addEventListener('change',() => markField(priorityEl, !priorityEl.value));
  categoryEl?.addEventListener('change',() => markField(categoryEl, !categoryEl.value));
  eventEl?.addEventListener('change',   () => markField(eventEl,    !eventEl.value));

  /* ── Validate ───────────────────────── */
  function validate() {
    const errors = [];
    const title = titleEl?.value.trim();
    const desc  = descEl?.value.trim();

    if (!title)             { errors.push('Issue title is required.');          markField(titleEl,    true); }
    if (!desc)              { errors.push('Description is required.');          markField(descEl,     true); }
    if (!priorityEl?.value) { errors.push('Please select a priority level.');   markField(priorityEl, true); }
    if (!categoryEl?.value) { errors.push('Please select an issue category.');  markField(categoryEl, true); }
    if (!eventEl?.value)    { errors.push('Please select a related event.');    markField(eventEl,    true); }

    if (title && title.length < 5) {
      errors.push('Issue title must be at least 5 characters.');
      markField(titleEl, true);
    }
    if (desc && desc.length < 10) {
      errors.push('Description must be at least 10 characters.');
      markField(descEl, true);
    }

    return errors;
  }

  /* ── Submit ─────────────────────────── */
  submitBtn?.addEventListener('click', () => {
    clearErrors();
    const errors = validate();
    if (errors.length) {
      Toast.show(errors[0], 'warn');
      return;
    }

    const issue = {
      id:        uid('ISS'),
      title:     titleEl.value.trim(),
      desc:      descEl.value.trim(),
      priority:  priorityEl.value,
      category:  categoryEl.value,
      event:     eventEl?.value || '',
      eventId:   eventEl?.value || '',
      reporter:  DB.getSession().user,
      reporterRole: DB.getSession().role,
      email:     DB.getSession().email,
      role:      DB.getSession().role,
      createdAt: new Date().toISOString(),
      status:    'open',
    };

    const savedIssue = DB.add('issues', issue);

    /* Broadcast to Coordination Hub */
    if (window.CoordHub && (savedIssue.event || savedIssue.eventId)) {
      CoordHub.postIssueToChat(savedIssue.eventId || savedIssue.event, savedIssue);
    }
    // Legacy messages channel broadcast (keep for backward compat)
    const allMsgs = DB.get('messages') || {};
    if (!allMsgs['vendor-vendor']) allMsgs['vendor-vendor'] = [];
    const evName = DB.find('events', issue.event)?.name || issue.event;
    allMsgs['vendor-vendor'].push({
      id:       uid('MSG'),
      sender:   'System Alert',
      initials: '!',
      self:     false,
      text:     `🚨 New Issue Reported: "${issue.title}" for event "${evName}". Priority: ${issue.priority.toUpperCase()}.\nReason: ${issue.desc}`,
      time:     new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }),
      avatar:   'orange',
    });
    DB.set('messages', allMsgs);

    /* Built-in HTML toast */
    const builtIn = document.getElementById('toast');
    if (builtIn) {
      builtIn.classList.add('show');
      setTimeout(() => builtIn.classList.remove('show'), 3200);
    }

    Toast.show('Issue submitted successfully!', 'success');

    /* Reset */
    setTimeout(() => {
      titleEl.value    = '';
      descEl.value     = '';
      priorityEl.value = '';
      categoryEl.value = '';
      if (eventEl) eventEl.value = '';
      clearErrors();
      const counter = descEl?.parentElement.querySelector('div[style*="text-align:right"]');
      if (counter) counter.textContent = '0 / 500';
    }, 400);
  });

  /* ── Cancel ─────────────────────────── */
  cancelBtn?.addEventListener('click', () => {
    if (history.length > 1) history.back();
    else window.location.href = 'dashboard.html';
  });
});