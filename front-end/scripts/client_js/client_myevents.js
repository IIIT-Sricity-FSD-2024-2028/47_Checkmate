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
            return `<button class="btn btn-ghost" style="padding:4px 12px; font-size:12px; opacity:0.5;" disabled>Rejected</button>`;
        }
        // pending — still allow tracking so client can see "awaiting approval" state
        return `<a href="client_trackprogress.html?id=${ev.id}" class="btn btn-ghost" style="padding:4px 12px; font-size:12px; opacity:0.8;"><i class="ph ph-hourglass"></i> View</a>`;
    }

    // Get client's events from DB
    function getClientEvents() {
        if (typeof DB === 'undefined') return [];
        const all = DB.getAll('events');
        // Show events created by the client (tagged) OR all events if none tagged yet
        const clientOwned = all.filter(ev => ev.createdBy === 'client');
        return clientOwned;
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

        tbody.innerHTML = filtered.map(ev => `
            <tr class="table-row" data-id="${ev.id}">
                <td class="col-id">${ev.id}</td>
                <td>${ev.name || '—'}</td>
                <td><span class="badge ${TYPE_CLASS[ev.type] || 'badge--conference'}">${ev.type || '—'}</span></td>
                <td>${fmtDate(ev.date)}</td>
                <td>${ev.venue || '—'}</td>
                <td>${ev.people || '—'}</td>
                <td>${statusBadge(ev.status)}</td>
                <td style="text-align:right;">${actionBtn(ev)}</td>
            </tr>
        `).join('');

        // Row hover flash
        tbody.querySelectorAll('.table-row').forEach(row => {
            row.style.cursor = 'pointer';
            row.addEventListener('click', (e) => {
                if (e.target.closest('.btn')) return;
                row.style.backgroundColor = 'rgba(233, 30, 140, 0.06)';
                setTimeout(() => row.style.backgroundColor = '', 160);
            });
        });
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
