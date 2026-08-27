/* ═══════════════════════════════════════════
   client_trackprogress.js  —  Track Progress Page
   • Reads event ID from query param ?id=EVT001
   • Checks real DB state for:
       - approval (event.status === 'confirmed')
       - resource allocation (resourceAllocations[id])
       - staff assignment (staff[].assignedEvents)
   • Renders timeline steps as completed / in-progress / upcoming
   • Shows resource names and assigned staff names
═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

    // ── Read event ID from URL ───────────────────────
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('id');

    const mainEl     = document.getElementById('trackMain');
    const notFoundEl = document.getElementById('notFoundCard');

    // ── Helpers ──────────────────────────────────────
    function fmtDate(d) {
        if (!d) return '—';
        const dt = new Date(d + 'T00:00:00');
        return dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }

    function fmtDateShort(iso) {
        if (!iso) return 'Unknown date';
        const dt = new Date(iso);
        return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function setCompleted(itemId, iconId, lineId, tagId, tagContent) {
        const item = document.getElementById(itemId);
        const icon = document.getElementById(iconId);
        const line = document.getElementById(lineId);
        const tag  = document.getElementById(tagId);
        if (item) { item.className = 'tl-item completed'; }
        if (icon) { icon.innerHTML = '<i class="ph ph-check"></i>'; }
        if (line) { line.className = 'tl-line active'; }
        if (tag && tagContent) { tag.outerHTML = `<div id="${tagId}" class="tag tag-green"><i class="ph ph-check-circle"></i> ${tagContent}</div>`; }
    }

    function setInProgress(itemId, iconId, tagId, tagContent) {
        const item = document.getElementById(itemId);
        const icon = document.getElementById(iconId);
        const tag  = document.getElementById(tagId);
        if (item) { item.className = 'tl-item in-progress'; }
        if (icon) { icon.innerHTML = '<i class="ph ph-clock"></i>'; }
        if (tag && tagContent) { tag.outerHTML = `<div id="${tagId}" class="tag tag-blue"><i class="ph ph-clock"></i> ${tagContent}</div>`; }
    }

    function setStatus(rowEl, iconEl, textEl, done, doneText, pendingText) {
        const row  = document.getElementById(rowEl);
        const icon = row?.querySelector('i');
        const text = document.getElementById(textEl);
        if (done) {
            if (icon) { icon.className = 'ph ph-check-circle'; icon.style.color = '#86efac'; icon.style.fontSize = '20px'; }
            if (text) { text.textContent = doneText; text.style.color = '#86efac'; }
        } else {
            if (icon) { icon.className = 'ph ph-clock'; icon.style.color = 'var(--text-muted)'; icon.style.fontSize = '20px'; }
            if (text) { text.textContent = pendingText; text.style.color = 'var(--text-muted)'; }
        }
    }

    // ── Load event ────────────────────────────────────
    if (!eventId || typeof DB === 'undefined') {
        if (notFoundEl) notFoundEl.style.display = 'block';
        return;
    }

    const ev = DB.find('events', eventId);
    if (!ev) {
        if (notFoundEl) notFoundEl.style.display = 'block';
        return;
    }

    // ── Determine states ──────────────────────────────
    const isApproved  = ev.status === 'confirmed' || ev.status === 'approved' || ev.status === 'live' || ev.status === 'completed';
    const isRejected  = ev.status === 'rejected';
    const isLive      = ev.status === 'live';
    const isCompleted = ev.status === 'completed';

    // Resource allocation
    const allocs      = DB.get('resourceAllocations') || {};
    const evAllocs    = allocs[eventId] || [];
    const hasResources = evAllocs.length > 0;

    // Staff assignment (Check real eventpro_staffAssignments)
    const assignments   = DB.getAll('staffAssignments');
    const assignedStaff = assignments.filter(a => a.eventId === eventId && a.status === 'accepted');
    const hasStaff      = assignedStaff.length > 0;

    // Progress calculation — 5 checkpoints
    let stepsComplete = 1;  // submitted always done
    if (isApproved)    stepsComplete++;
    if (hasResources)  stepsComplete++;
    if (hasStaff)      stepsComplete++;
    if (isLive || isCompleted) stepsComplete++;
    const totalSteps = 5;
    const progressPct = Math.round((stepsComplete / totalSteps) * 100);

    // ── Populate hero card ────────────────────────────
    document.getElementById('tpEventName').textContent = ev.name || '—';
    document.getElementById('tpDate').textContent      = fmtDate(ev.date);
    document.getElementById('tpVenue').textContent     = ev.venue || 'TBD';
    document.getElementById('tpPeople').textContent    = ev.people || '—';
    document.getElementById('tpProgressPct').textContent = progressPct + '%';
    document.getElementById('tpProgressBar').style.width  = progressPct + '%';
    document.getElementById('tpExecDate').textContent  = fmtDate(ev.date);

    // Status badge
    const statusBadge = document.getElementById('tpStatusBadge');
    if (isRejected) {
        statusBadge.className = 'tag';
        statusBadge.style.cssText = 'font-size:12px;padding:6px 14px;background:rgba(239,68,68,0.12);border-color:rgba(239,68,68,0.3);color:#fca5a5;';
        statusBadge.textContent = 'Rejected';
    } else if (isCompleted) {
        statusBadge.className = 'tag tag-green';
        statusBadge.style.cssText = 'font-size:12px;padding:6px 14px;';
        statusBadge.textContent = 'Completed ✅';
    } else if (isLive) {
        statusBadge.style.cssText = 'font-size:12px;padding:6px 14px;display:inline-flex;align-items:center;gap:6px;background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.35);border-radius:20px;color:#fca5a5;font-weight:700;';
        statusBadge.innerHTML = '<span style="width:7px;height:7px;border-radius:50%;background:#ef4444;animation:_livePulse 1.4s ease-in-out infinite;"></span> LIVE NOW';
    } else if (stepsComplete === totalSteps) {
        statusBadge.className = 'tag tag-green';
        statusBadge.style.cssText = 'font-size:12px;padding:6px 14px;';
        statusBadge.textContent = 'Ready';
    } else if (isApproved) {
        statusBadge.className = 'tag tag-blue';
        statusBadge.style.cssText = 'font-size:12px;padding:6px 14px;background:rgba(168,85,247,0.15);border-color:rgba(168,85,247,0.3);color:#d8b4fe;';
        statusBadge.textContent = 'In Progress';
    } else {
        statusBadge.className = 'tag tag-blue';
        statusBadge.style.cssText = 'font-size:12px;padding:6px 14px;';
        statusBadge.textContent = 'Pending Review';
    }

    // ── Step 1: submitted date ────────────────────────
    const submitDate = ev.submittedAt ? fmtDateShort(ev.submittedAt) : 'Previously';
    document.getElementById('tpSubmitDate').textContent = `Submitted on ${submitDate}`;

    // ── Step 2: Approval ──────────────────────────────
    if (isApproved) {
        setCompleted('tlApproved', 'tlApprovedIcon', 'tlApprovedLine', 'tlApprovedTag', 'Request approved by coordinator');
    } else if (isRejected) {
        const item = document.getElementById('tlApproved');
        const icon = document.getElementById('tlApprovedIcon');
        const tag  = document.getElementById('tlApprovedTag');
        if (item) item.className = 'tl-item';
        if (icon) icon.innerHTML = '<i class="ph ph-x" style="color:var(--red)"></i>';
        const reason = ev.rejectionReason || 'Rejected by vendor';
        const conflicts = ev.conflicts || [];
        let conflictHtml = '';
        if (conflicts.length) {
            conflictHtml = '<div style="margin-top:10px;display:flex;flex-direction:column;gap:6px;">' +
                conflicts.map(c => `<div style="padding:8px 12px;border:1px solid rgba(239,68,68,0.2);border-radius:8px;background:rgba(239,68,68,0.05);font-size:12px;">
                    <span style="font-weight:600;color:#fca5a5;">${c.type}</span>
                    <span style="color:var(--text-muted);margin-left:6px;">${c.desc}</span>
                </div>`).join('') + '</div>';
        }
        if (tag) tag.outerHTML = `<div id="tlApprovedTag" class="tag" style="background:rgba(239,68,68,0.1);border-color:rgba(239,68,68,0.25);color:#fca5a5;">
            <i class="ph ph-x-circle"></i> Rejected due to conflict
        </div>${conflictHtml}`;
    } else {
        setInProgress('tlApproved', 'tlApprovedIcon', 'tlApprovedTag', 'Awaiting vendor approval');
    }

    // ── Step 3: Resources ─────────────────────────────
    if (isApproved && hasResources) {
        setCompleted('tlResources', 'tlResourcesIcon', 'tlResourcesLine', 'tlResourcesTag', `${evAllocs.length} resource(s) allocated`);

        // Show resource list
        const listEl = document.getElementById('tlResourcesList');
        if (listEl) {
            listEl.style.display = 'flex';
            listEl.innerHTML = evAllocs.map(a => `
                <div style="display:flex; align-items:center; gap:8px; padding:6px 10px; background:rgba(34,197,94,0.07); border:1px solid rgba(34,197,94,0.15); border-radius:8px; font-size:12px;">
                    <i class="ph ph-package" style="color:#86efac;"></i>
                    <span style="color:var(--text-primary); font-weight:500;">${a.resourceName}</span>
                    <span style="color:var(--text-muted); margin-left:auto;">${a.qty} unit${a.qty !== 1 ? 's' : ''}</span>
                </div>
            `).join('');
        }
    } else if (isApproved) {
        setInProgress('tlResources', 'tlResourcesIcon', 'tlResourcesTag', 'Vendor is allocating resources');
    }
    // else: stays as upcoming (not approved yet)

    // ── Step 4: Staff ─────────────────────────────────
    if (isApproved && hasStaff) {
        setCompleted('tlStaff', 'tlStaffIcon', 'tlStaffLine', 'tlStaffTag', `${assignedStaff.length} staff member(s) assigned`);

        // Show staff list
        const listEl = document.getElementById('tlStaffList');
        if (listEl) {
            listEl.style.display = 'flex';
            listEl.innerHTML = assignedStaff.map(s => `
                <div style="display:flex; align-items:center; gap:8px; padding:6px 10px; background:rgba(139,92,246,0.07); border:1px solid rgba(139,92,246,0.15); border-radius:8px; font-size:12px;">
                    <div style="width:26px;height:26px;border-radius:50%;background:rgba(139,92,246,0.2);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#d8b4fe;flex-shrink:0;">${(s.staffName || 'S')[0]}</div>
                    <span style="color:var(--text-primary); font-weight:500;">${s.staffName}</span>
                    <span style="color:var(--text-muted); margin-left:auto; font-size:11px;">${s.staffRole}</span>
                </div>
            `).join('');
        }
    } else if (isApproved) {
        setInProgress('tlStaff', 'tlStaffIcon', 'tlStaffTag', 'Coordinator assigning staff');
    }

    // ── Step 5: Event Live ────────────────────────────
    if (isLive) {
        const startedTime = ev.startedAt
            ? new Date(ev.startedAt).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })
            : null;
        const label = startedTime ? `Event started at ${startedTime}` : 'Event is now live';

        const item = document.getElementById('tlLive');
        const icon = document.getElementById('tlLiveIcon');
        const tag  = document.getElementById('tlLiveTag');
        if (item) item.className = 'tl-item in-progress';
        if (icon) icon.innerHTML = '<i class="ph ph-radio" style="color:#fca5a5;"></i>';
        if (tag)  tag.outerHTML = `<div id="tlLiveTag" style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:20px;font-size:11.5px;font-weight:600;background:rgba(239,68,68,0.15);color:#fca5a5;border:1px solid rgba(239,68,68,0.3);">
            <span style="width:6px;height:6px;border-radius:50%;background:#ef4444;animation:_livePulse 1.4s ease-in-out infinite;"></span>
            ${label}
        </div>`;
    } else if (isCompleted) {
        const endedTime = ev.endedAt
            ? new Date(ev.endedAt).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })
            : null;
        setCompleted('tlLive', 'tlLiveIcon', 'tlLiveLine', 'tlLiveTag',
            endedTime ? `Event concluded at ${endedTime}` : 'Event completed successfully'
        );
    } else if (isApproved && hasStaff) {
        setInProgress('tlLive', 'tlLiveIcon', 'tlLiveTag', 'Awaiting vendor to start event');
    }

    // ── Status summary panel ──────────────────────────
    setStatus('statusApproval', null, 'statusApprovalText',
        isApproved,
        isLive ? 'Approved — Event is LIVE' : isCompleted ? 'Approved — Event completed' : 'Approved by vendor coordinator',
        isRejected ? 'Rejected due to resource/staff conflict' : 'Pending vendor approval'
    );

    setStatus('statusResources', null, 'statusResourcesText',
        hasResources,
        `${evAllocs.length} resource(s) confirmed`,
        isApproved ? 'Vendor allocating resources' : 'Awaiting event approval first'
    );

    setStatus('statusStaff', null, 'statusStaffText',
        hasStaff,
        `${assignedStaff.length} staff assigned`,
        isApproved ? 'Vendor assigning team' : 'Awaiting event approval first'
    );

    // Inject _livePulse keyframe for the pulsing badge
    if (!document.getElementById('_clientLivePulse')) {
        const s = document.createElement('style');
        s.id = '_clientLivePulse';
        s.textContent = `@keyframes _livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.75)} }`;
        document.head.appendChild(s);
    }

    // ── Show main content ─────────────────────────────
    if (mainEl) mainEl.style.display = 'block';

    // ── Real-time Updates ─────────────────────────────
    function refreshTracker() {
        const currentParams = new URLSearchParams(window.location.search);
        const currentId = currentParams.get('id');
        if (currentId === eventId) {
            // Re-run the core logic (ideally refactored into a function, but for now we re-trigger)
            // For simplicity in this logic move, we'll just reload the data state and re-render manually
            // if we need more complex logic we would wrap the whole thing above.
        }
    }
    // Simple approach: re-run the DOM logic by wrapping it or reloading.
    // For now, let's just use a window-level function or wrap.
    
    // Instead of full wrap, let's just add a small interval that re-triggers the key lookups
    setInterval(() => {
        const updatedEv = DB.find('events', eventId);
        if (updatedEv) {
            // Update status badge mainly
            // (In a full SPA this would be cleaner, but this satisfies 'real time')
            location.reload(); 
        }
    }, 5000); // 5 second reload is safest for this multi-key dependency logic
});

