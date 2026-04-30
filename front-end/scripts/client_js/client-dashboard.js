/* ═══════════════════════════════════════════
   client-dashboard.js  —  Client Dashboard Logic
   • Loads real statistics from shared DB
   • Finds and tracks the next upcoming event
   • Generates dynamic activity feed
   • Manages sidebar navigation state
═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize DB
    if (typeof DB !== 'undefined') {
        DB.init();
    } else {
        console.error('DB not found. Ensure data.js is loaded.');
        return;
    }

    // 2. Wrap logic in a refresh function for real-time updates
    function refreshDashboard() {
        // Fetch User Session for Greeting
        const session = DB.getSession();
        const welcomeEl = document.querySelector('.welcome-banner h2');
        if (welcomeEl && session.user) {
            welcomeEl.textContent = `Welcome back, ${session.user.split(' ')[0]} 👋`;
        }

        // 3. Load Stats
        const events    = DB.getAll('events');
        const myEvents  = events.filter(e => e.createdBy === 'client');

        const stats = {
            active:    myEvents.filter(e => ['confirmed', 'live', 'approved'].includes(e.status)).length,
            pending:   myEvents.filter(e => e.status === 'pending').length,
            total:     myEvents.length,
            completed: myEvents.filter(e => e.status === 'completed').length
        };

        // Update Stat Values
        const updateStat = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        updateStat('dash-active',    stats.active);
        updateStat('dash-pending',   stats.pending);
        updateStat('dash-total',     stats.total);
        updateStat('dash-completed', stats.completed);

        // Update Stat Trends (mock/visual logic)
        const activeTrend = document.getElementById('dash-trend-active');
        if (activeTrend) {
            const hasLive = myEvents.some(e => e.status === 'live');
            activeTrend.innerHTML = hasLive 
                ? `<i class="ph ph-trend-up"></i> ${myEvents.filter(e => e.status === 'live').length} Live`
                : `<i class="ph ph-check"></i> Ready`;
        }

        // 4. Find Next Event Progress
        // Prioritize Live > Confirmed > Pending, then by date, then by newest ID
        const nextEvent = myEvents
            .filter(e => e.status !== 'completed' && e.status !== 'rejected')
            .sort((a, b) => {
                const ranks = { 'live': 1, 'confirmed': 2, 'approved': 2, 'pending': 3 };
                const rankA = ranks[a.status] || 4;
                const rankB = ranks[b.status] || 4;
                if (rankA !== rankB) return rankA - rankB;
                
                const timeA = a.date ? new Date(a.date).getTime() : Infinity;
                const timeB = b.date ? new Date(b.date).getTime() : Infinity;
                if (timeA !== timeB && !isNaN(timeA) && !isNaN(timeB)) return timeA - timeB;
                
                // Fallback: newest ID (e.g. EVT002 over EVT001)
                return b.id.localeCompare(a.id);
            })[0];

        const nextInfo    = document.getElementById('dash-next-event-info');
        const timeline    = document.getElementById('dash-timeline');
        const noEvents    = document.getElementById('dash-no-events');
        const trackLink   = document.getElementById('dash-next-track-link');

        if (nextEvent) {
            if (nextInfo) nextInfo.style.display = 'block';
            if (timeline) timeline.style.display = 'flex';
            if (noEvents) noEvents.style.display = 'none';
            
            document.getElementById('dash-next-name').textContent  = nextEvent.name;
            document.getElementById('dash-next-venue').textContent = nextEvent.venue || 'TBA';
            document.getElementById('dash-next-date').textContent  = fmtDate(nextEvent.date);
            if (trackLink) trackLink.href = `client_trackprogress.html?id=${nextEvent.id}`;

            renderTimeline(nextEvent);

            // Dynamically add a progress bar mirroring tracking screen
            const allocs = DB.get('resourceAllocations') || {};
            const hasResource = (allocs[nextEvent.id] || []).length > 0;
            
            // Check real staff assignments from eventpro_staffAssignments
            const assignments = JSON.parse(localStorage.getItem('eventpro_staffAssignments') || '[]');
            const hasStaffAssigned = assignments.some(a => a.eventId === nextEvent.id && a.status === 'accepted');
            
            const isApproved = ['confirmed', 'live', 'approved', 'completed'].includes(nextEvent.status);
            
            let stepsComplete = 1;
            if (isApproved) stepsComplete++;
            if (hasResource) stepsComplete++;
            if (hasStaffAssigned) stepsComplete++;
            if (nextEvent.status === 'live' || nextEvent.status === 'completed') stepsComplete++;
            
            const progressPct = Math.round((stepsComplete / 5) * 100);

            let progressWrap = document.getElementById('dash-progress-wrap');
            if(!progressWrap) {
                progressWrap = document.createElement('div');
                progressWrap.id = 'dash-progress-wrap';
                progressWrap.style.marginTop = '16px';
                nextInfo.appendChild(progressWrap);
            }
            progressWrap.innerHTML = `
                <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:6px; color:var(--text-muted);">
                    <span>Overall Progress</span>
                    <span style="color:var(--pink); font-weight:600;">${progressPct}%</span>
                </div>
                <div style="height:6px; background:rgba(255,255,255,0.06); border-radius:3px; overflow:hidden;">
                    <div style="height:100%; width:${progressPct}%; background:var(--pink); border-radius:3px; transition:width 0.5s ease;"></div>
                </div>
            `;
        } else {
            if (nextInfo) nextInfo.style.display = 'none';
            if (timeline) timeline.style.display = 'none';
            if (noEvents) noEvents.style.display = 'block';
        }

        // 5. Activity Feed
        renderActivity(myEvents);
    }

    // ── Initial call ──────────────────────────────────
    refreshDashboard();

    // ── Real-time Updates ─────────────────────────────
    // Polling every 5 seconds for simulation changes
    setInterval(refreshDashboard, 5000);

    // Storage listener (for multi-tab sync)
    window.addEventListener('storage', (e) => {
        if (e.key === 'checkmate_db') {
            DB.init(); // Reload DB from storage
            refreshDashboard();
        }
    });

    // 6. Navigation Logic
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (window.location.pathname.endsWith(href)) {
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
        }
    });

    // Helper: Format Date
    function fmtDate(iso) {
        if (!iso) return '—';
        const d = new Date(iso + 'T00:00:00');
        return d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
    }

    // Helper: Timeline Renderer
    function renderTimeline(ev) {
        const status = ev.status;
        const timeline = document.getElementById('dash-timeline');
        if (!timeline) return;
        
        // Check resource/staff allocation via DB
        const allocs = DB.get('resourceAllocations') || {};
        const hasResources = (allocs[ev.id] || []).length > 0;
        
        const allStaff = DB.getAll('staff');
        const assignments = JSON.parse(localStorage.getItem('eventpro_staffAssignments') || '[]');
        const hasStaff = assignments.some(a => a.eventId === ev.id && a.status === 'accepted');

        let execDesc = 'Live Monitoring';
        if (status === 'live') {
            const monitorData = DB.get('monitorProgress') || {};
            const evMonitor = monitorData[ev.id] || {};
            
            // Generate summary string of actual current progression
            const parts = [];
            if (evMonitor.setup > 0) parts.push(`Setup: ${evMonitor.setup}%`);
            if (evMonitor.registration > 0) parts.push(`Reg: ${evMonitor.registration}%`);
            if (evMonitor.event > 0) parts.push(`Event: ${evMonitor.event}%`);
            
            execDesc = parts.length > 0 ? parts.join(' • ') : 'Event is currently live';
        }

        const steps = [
            { title: 'Submitted', desc: 'Request received', done: true },
            { title: 'Approval',  desc: 'Vendor coordinator review', done: ['confirmed', 'live', 'approved', 'completed'].includes(status) },
            { title: 'Resources', desc: 'Equipment & Supplies', done: hasResources },
            { title: 'Staffing',  desc: 'Team assignment', done: hasStaff },
            { title: 'Execution', desc: execDesc, done: status === 'live' || status === 'completed', current: status === 'live' }
        ];

        let html = '';
        steps.forEach((step, idx) => {
            const isLast = idx === steps.length - 1;
            const cls = step.current ? 'in-progress' : (step.done ? 'completed' : 'upcoming');
            const icon = step.done ? '<i class="ph ph-check"></i>' : (step.current ? '<i class="ph ph-spinner ph-spin"></i>' : '');
            
            html += `
            <div class="tl-item ${cls}">
                <div class="tl-icon-col">
                    <div class="tl-icon">${icon}</div>
                    ${!isLast ? `<div class="tl-line ${step.done ? 'active' : ''}"></div>` : ''}
                </div>
                <div class="tl-content">
                    <div class="tl-title">${step.title}</div>
                    <div class="tl-desc">${step.desc}</div>
                </div>
            </div>`;
        });
        timeline.innerHTML = html;
    }

    // Helper: Activity Renderer
    function renderActivity(events) {
        const activityEl = document.getElementById('dash-activity');
        if (!activityEl) return;

        // Take last 4 events as "activity"
        const recent = [...events].reverse().slice(0, 4);
        
        if (recent.length === 0) {
            activityEl.innerHTML = '<div style="color:var(--text-muted); font-size:13px; text-align:center; padding:12px;">No recent activity</div>';
            return;
        }

        activityEl.innerHTML = recent.map(ev => {
            let title = '';
            let sub = '';
            let dotColor = 'var(--blue)';

            if (ev.status === 'live') {
                title = 'Event Started';
                sub = `${ev.name} is now LIVE`;
                dotColor = '#ef4444';
            } else if (ev.status === 'confirmed' || ev.status === 'approved') {
                title = 'Event Approved';
                sub = `${ev.name} was approved`;
                dotColor = '#22c55e';
            } else if (ev.status === 'completed') {
                title = 'Event Concluded';
                sub = `${ev.name} finished`;
                dotColor = 'var(--text-muted)';
            } else if (ev.status === 'rejected') {
                title = 'Event Rejected';
                sub = `${ev.name} was declined`;
                dotColor = '#ef4444';
            } else {
                title = 'New Request';
                sub = `${ev.name} submitted`;
            }

            return `
            <div class="activity-item">
                <span class="activity-dot" style="background:${dotColor}"></span>
                <div class="activity-body">
                    <div class="activity-title">${title}</div>
                    <div class="activity-sub">${sub}</div>
                </div>
                <div class="activity-time">Just now</div>
            </div>`;
        }).join('');
    }
});
