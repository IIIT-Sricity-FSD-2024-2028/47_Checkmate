/* ═══════════════════════════════════════════
   client_livemonitoring.js  —  Real-Time Monitoring
   • Tracks live task completion from staff
   • Updates progress bar and timeline
   • Populates active staff and resources
═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('id');

    if (!eventId || typeof DB === 'undefined') return;

    function refreshLive() {
        const ev = DB.find('events', eventId);
        if (!ev || ev.status !== 'live') {
            // If event is no longer live, maybe redirect or show msg
            // For now just keep showing last known
        }

        // 1. Update Header
        const nameEl = document.getElementById('tpEventName');
        const venueEl = document.getElementById('tpVenue');
        if (nameEl) nameEl.textContent = ev.name;
        if (venueEl) venueEl.textContent = `${ev.type} • ${ev.venue}`;

        // 2. Calculate Progress from Tasks
        const assignments = DB.getAll('staffAssignments');
        const eventAssignments = assignments.filter(a => a.eventId === eventId && a.status === 'accepted');
        
        let totalTasks = 0;
        let completedTasks = 0;
        let taskList = [];

        eventAssignments.forEach(a => {
            if (a.tasks) {
                a.tasks.forEach(t => {
                    totalTasks++;
                    if (t.status === 'done') completedTasks++;
                    taskList.push({ ...t, staffName: a.staffName });
                });
            }
        });

        const progressPct = totalTasks > 0 ? Math.round((completedTasks/totalTasks)*100) : 0;
        const progEl = document.getElementById('tpProgressPct');
        const fillEl = document.getElementById('tpProgressFill');
        if (progEl) progEl.textContent = progressPct + '%';
        if (fillEl) fillEl.style.width = progressPct + '%';

        // 3. Render Timeline (Tasks)
        const timelineEl = document.getElementById('tpTimeline');
        if (timelineEl && taskList.length > 0) {
            // Sort tasks: done first, then pending
            const sortedTasks = taskList.sort((a,b) => (a.status === 'done' ? -1 : 1));
            
            timelineEl.innerHTML = sortedTasks.map((t, idx) => `
                <div class="tl-item ${t.status === 'done' ? 'completed' : 'in-progress'}">
                    <div class="tl-icon-col">
                        <div class="tl-icon">${t.status === 'done' ? '<i class="ph ph-check"></i>' : '<i class="ph ph-circle-dashed ph-spin"></i>'}</div>
                        ${idx < sortedTasks.length - 1 ? '<div class="tl-line active"></div>' : ''}
                    </div>
                    <div class="tl-content">
                        <div class="tl-title">${t.text || 'Task'}</div>
                        <div class="tl-desc">${t.staffName} • ${t.status === 'done' ? 'Completed' : 'Pending'}</div>
                    </div>
                </div>
            `).join('');
        }

        // 4. Render Staff Cards
        const staffEl = document.getElementById('tpStaffList');
        if (staffEl) {
            staffEl.innerHTML = eventAssignments.map(a => `
                <div class="staff-card">
                    <div class="staff-avatar">${(a.staffName || 'S')[0]}</div>
                    <div class="staff-info">
                        <h4>${a.staffName}</h4>
                        <p>${a.staffRole || 'Team Member'}</p>
                        <span class="tag tag-green"><i class="ph-fill ph-circle"></i> Active</span>
                    </div>
                </div>
            `).join('');
        }

        // 5. Render Resources
        const resourcesEl = document.getElementById('tpResourceList');
        const allocs = DB.get('resourceAllocations') || {};
        const evAllocs = allocs[eventId] || [];
        if (resourcesEl) {
            if (evAllocs.length === 0) {
                resourcesEl.innerHTML = '<div style="color:var(--text-muted); font-size:13px;">No specific resources tracked.</div>';
            } else {
                resourcesEl.innerHTML = evAllocs.map(r => `
                    <div class="resource-item">
                        <div class="resource-name"><i class="ph ph-cube"></i> ${r.resourceName}</div>
                        <div class="tag tag-blue">${r.qty} Allocated</div>
                    </div>
                `).join('');
            }
        }
    }

    refreshLive();
    setInterval(refreshLive, 3000); // 3-second polling for high-intensity live view

    // Add styles for the spinning circle
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes ph-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(359deg); } }
        .ph-spin { animation: ph-spin 1.5s linear infinite; }
    `;
    document.head.appendChild(style);
});
