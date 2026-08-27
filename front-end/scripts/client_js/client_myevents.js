/* ═══════════════════════════════════════════
   client_myevents.js  —  Client My Events Page
   • Reads ALL events tagged createdBy:'client'
     from the shared DB (data.js / localStorage)
   • Falls back to seed events if no client events yet
   • Live search filter
   • Shows empty state when no results
═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

    const TYPE_CLASS = {
        Conference: 'badge--conference',
        Wedding:    'badge--wedding',
        Corporate:  'badge--corporate',
        Birthday:   'badge--birthday',
        Party:      'badge--birthday',
    };

    // Format date: '2026-04-05' → 'Apr 05, 2026'
    function fmtDate(d) {
        if (!d) return '—';
        const dt = new Date(d + 'T00:00:00');
        return dt.toLocaleDateString('en-US', { month:'short', day:'2-digit', year:'numeric' });
    }

    function statusBadge(status) {
        if (status === 'live') {
            return `<span class="status-badge approved" style="background:rgba(239,68,68,0.18);color:#fca5a5;border:1px solid rgba(239,68,68,0.35);display:inline-flex;align-items:center;gap:5px;"><span style="width:6px;height:6px;border-radius:50%;background:#ef4444;animation:_livePulse 1.4s ease-in-out infinite;"></span>LIVE</span>`;
        }
        if (status === 'completed') {
            return `<span class="status-badge approved" style="background:rgba(100,116,139,0.15);color:#94a3b8;border:1px solid rgba(100,116,139,0.25);">Completed</span>`;
        }
        const map = {
            pending:   'pending',
            confirmed: 'approved',
            approved:  'approved',
            rejected:  'rejected',
        };
        const cls = map[status] || 'pending';
        const label = { pending:'Pending', confirmed:'Approved', approved:'Approved', rejected:'Rejected' }[status] || status;
        return `<span class="status-badge ${cls}">${label}</span>`;
    }

    function actionBtn(ev) {
        if (ev.status === 'live') {
            return `<a href="client_trackprogress.html?id=${ev.id}" class="btn btn-primary" style="padding:4px 12px; font-size:12px; background:rgba(239,68,68,0.25); border:1px solid rgba(239,68,68,0.4); display:inline-flex; align-items:center; gap:6px;">
                <span style="width:6px;height:6px;border-radius:50%;background:#ef4444;animation:_livePulse 1.4s ease-in-out infinite;"></span> Track Live
            </a>`;
        }
        if (ev.status === 'completed') {
            return `<a href="client_trackprogress.html?id=${ev.id}" class="btn btn-ghost" style="padding:4px 12px; font-size:12px; opacity:0.8;"><i class="ph ph-check-circle"></i> View</a>`;
        }
        if (ev.status === 'confirmed') {
            return `<a href="client_trackprogress.html?id=${ev.id}" class="btn btn-ghost" style="padding:4px 12px; font-size:12px;"><i class="ph ph-chart-line-up"></i> Track</a>`;
        }
        if (ev.status === 'rejected') {
            return `<button class="btn btn-ghost btn-view-reason" data-evid="${ev.id}" style="padding:4px 12px; font-size:12px; color:#fca5a5; border-color:rgba(239,68,68,0.3);"><i class="ph ph-warning-circle"></i> View Reason</button>`;
        }
        // pending — still allow tracking so client can see "awaiting approval" state
        return `<a href="client_trackprogress.html?id=${ev.id}" class="btn btn-ghost" style="padding:4px 12px; font-size:12px; opacity:0.8;"><i class="ph ph-hourglass"></i> View</a>`;
    }

    // Get client's events from DB
    function getClientEvents() {
        if (typeof DB === 'undefined') return [];
        return DB.getMyEvents();
    }

    let allEvents = getClientEvents();
    let searchQuery = '';

    function render() {
        const tbody   = document.getElementById('myEventsBody');
        const emptyEl = document.getElementById('myEventsEmpty');
        if (!tbody) return;

        const filtered = allEvents.filter(ev => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return (
                (ev.name   || '').toLowerCase().includes(q) ||
                (ev.id     || '').toLowerCase().includes(q) ||
                (ev.type   || '').toLowerCase().includes(q) ||
                (ev.status || '').toLowerCase().includes(q) ||
                (ev.venue  || '').toLowerCase().includes(q)
            );
        });

        if (!filtered.length) {
            tbody.innerHTML = '';
            if (emptyEl) emptyEl.style.display = 'block';
            return;
        }

        if (emptyEl) emptyEl.style.display = 'none';

        tbody.innerHTML = filtered.map(ev => {
            const rejectionRow = ev.status === 'rejected' && ev.rejectionReason
              ? `<div style="font-size:11px;color:#fca5a5;margin-top:4px;display:flex;align-items:center;gap:4px;"><i class="ph ph-warning-circle" style="font-size:12px;"></i> ${ev.rejectionReason.length > 80 ? ev.rejectionReason.slice(0, 80) + '…' : ev.rejectionReason}</div>`
              : '';
            return `
            <tr class="table-row" data-id="${ev.id}">
                <td class="col-id">${ev.id}</td>
                <td>${ev.name || '—'}${rejectionRow}</td>
                <td><span class="badge ${TYPE_CLASS[ev.type] || 'badge--conference'}">${ev.type || '—'}</span></td>
                <td>${fmtDate(ev.date)}</td>
                <td>${ev.venue || '—'}</td>
                <td>${ev.people || '—'}</td>
                <td>${statusBadge(ev.status)}</td>
                <td style="text-align:right;">${actionBtn(ev)}</td>
            </tr>
        `}).join('');

        // Row hover flash
        tbody.querySelectorAll('.table-row').forEach(row => {
            row.style.cursor = 'pointer';
            row.addEventListener('click', (e) => {
                if (e.target.closest('.btn')) return;
                row.style.backgroundColor = 'rgba(233, 30, 140, 0.06)';
                setTimeout(() => row.style.backgroundColor = '', 160);
            });
        });

        // View Reason buttons for rejected events
        tbody.querySelectorAll('.btn-view-reason').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const evId = btn.dataset.evid;
                const event = allEvents.find(ev => ev.id === evId);
                if (!event) return;
                showRejectionModal(event);
            });
        });
    }

    function showRejectionModal(event) {
        const existing = document.getElementById('rejectionReasonModal');
        if (existing) existing.remove();

        const conflicts = event.conflicts || [];
        const conflictHtml = conflicts.length
          ? conflicts.map(c => `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border:1px solid var(--border);border-radius:8px;margin-bottom:6px;">
              <div><div style="font-size:12.5px;font-weight:600;color:var(--text-primary);">${c.type}</div><div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;">${c.desc}</div></div>
              <span style="font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;background:${c.severity === 'high' ? 'rgba(239,68,68,0.15)' : 'rgba(234,179,8,0.15)'};color:${c.severity === 'high' ? '#fca5a5' : 'var(--yellow)'};border:1px solid ${c.severity === 'high' ? 'rgba(239,68,68,0.3)' : 'rgba(234,179,8,0.3)'};">${c.severity}</span>
            </div>`).join('')
          : '<div style="padding:12px;color:var(--text-muted);font-size:13px;">No specific conflicts recorded.</div>';

        const overlay = document.createElement('div');
        overlay.id = 'rejectionReasonModal';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;';
        overlay.innerHTML = `
          <div style="background:var(--bg-sidebar, #1a1a2e);border:1px solid var(--border);border-radius:14px;width:min(500px,92vw);max-height:80vh;overflow-y:auto;" onclick="event.stopPropagation()">
            <div style="padding:20px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;">
              <i class="ph ph-warning-circle" style="font-size:22px;color:#fca5a5;"></i>
              <div>
                <div style="font-size:16px;font-weight:700;color:var(--text-primary);">Event Rejected</div>
                <div style="font-size:12px;color:var(--text-muted);">${event.name} · ${event.id}</div>
              </div>
            </div>
            <div style="padding:20px 24px;">
              <div style="font-size:12px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Rejection Reason</div>
              <div style="font-size:13px;color:var(--text-secondary);line-height:1.6;margin-bottom:20px;padding:12px;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.15);border-radius:8px;">${event.rejectionReason || 'Rejected by vendor.'}</div>
              ${conflicts.length ? `<div style="font-size:12px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Conflicts (${conflicts.length})</div>${conflictHtml}` : ''}
            </div>
            <div style="padding:14px 24px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;">
              <button class="btn btn-ghost" id="closeRejModal">Close</button>
            </div>
          </div>`;
        document.body.appendChild(overlay);
        overlay.addEventListener('click', () => overlay.remove());
        document.getElementById('closeRejModal').addEventListener('click', () => overlay.remove());
    }

    function refreshData() {
        allEvents = getClientEvents();
        render();
    }

    // ── Initial call ──────────────────────────────────
    refreshData();

    // ── Real-time Updates ─────────────────────────────
    setInterval(refreshData, 5000);

    // Search
    const searchInput = document.getElementById('searchEvents');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            searchQuery = this.value.trim();
            render();
        });
    }
});
