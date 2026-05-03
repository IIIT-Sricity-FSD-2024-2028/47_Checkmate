/* ═══════════════════════════════════════════
   admin-reports.js  —  Reports & Analytics
   • Fetches live data from API
   • Calculates top level stats
   • Renders Chart.js visuals
   • Handles date/category filtering
   • Exports to CSV
═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    if (typeof DB === 'undefined') {
        console.warn('DB not loaded. Analytics cannot render.');
        return;
    }

    // 1. Fetch Data
    const rawEvents = DB.getAll('events') || [];
    const rawBookings = DB.getAll('bookings') || [];
    const rawResources = DB.getAll('resources') || [];

    // Chart instances
    let revenueChartInst = null;
    let statusChartInst = null;

    // 2. Render Functions
    function renderAnalytics(events, bookings, resources) {
        // Compute Stats
        const totalEvents = events.length;
        const completedEvents = events.filter(e => e.status && e.status.toLowerCase() === 'completed').length;
        const totalRevenue = bookings.reduce((sum, b) => sum + (Number(b.cost) || 0), 0);
        
        // Resources Allocated Calculation
        const resourcesUsed = resources.reduce((sum, r) => sum + ((r.total || r.quantity || 0) - (r.avail || 0)), 0);

        document.getElementById('statTotalEvents').textContent = totalEvents;
        document.getElementById('statCompletedEvents').textContent = completedEvents;
        document.getElementById('statTotalRevenue').textContent = `$${totalRevenue.toLocaleString()}`;
        document.getElementById('statResourcesUsed').textContent = resourcesUsed;

        // Populate Event Summary
        const evtTbody = document.getElementById('eventSummaryTbody');
        if(evtTbody) {
            if(events.length === 0) {
                evtTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:20px;">No events match the filters.</td></tr>`;
            } else {
                evtTbody.innerHTML = events.map(e => `
                    <tr>
                        <td style="font-family: monospace;">${e.id}</td>
                        <td style="font-weight: 500;">${e.name || '-'}</td>
                        <td>${e.type || '-'}</td>
                        <td>${e.date || '-'}</td>
                        <td>${e.guests || e.people || '0'}</td>
                        <td>
                            <span class="status-badge" style="background: rgba(255,255,255,0.08);">
                                ${e.status ? e.status.charAt(0).toUpperCase() + e.status.slice(1) : 'Pending'}
                            </span>
                        </td>
                    </tr>
                `).join('');
            }
        }

        // Populate Resource Usage
        const resTbody = document.getElementById('resourceUsageTbody');
        if(resTbody) {
            if(resources.length === 0) {
                resTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:20px;">No resources match the filters.</td></tr>`;
            } else {
                resTbody.innerHTML = resources.map(r => {
                    const total = r.total || r.quantity || 0;
                    const avail = r.avail || 0;
                    const allocated = total - avail;
                    return `
                    <tr>
                        <td style="font-weight: 500;">${r.name}</td>
                        <td>${r.category || r.cat || '-'}</td>
                        <td>${total}</td>
                        <td>${avail}</td>
                        <td style="color: var(--pink); font-weight: bold;">${allocated}</td>
                    </tr>
                `}).join('');
            }
        }

        // Populate Revenue Report
        const revTbody = document.getElementById('revenueReportTbody');
        if(revTbody) {
            if(bookings.length === 0) {
                revTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:20px;">No bookings match the filters.</td></tr>`;
            } else {
                revTbody.innerHTML = bookings.map(b => {
                    const evtName = b.eventName || rawEvents.find(e => e.id === b.eventId)?.name || b.eventId || '-';
                    return `
                    <tr>
                        <td style="font-family: monospace;">${b.id}</td>
                        <td style="font-weight: 500;">${evtName}</td>
                        <td>${b.client || '-'}</td>
                        <td>${b.vendor || '-'}</td>
                        <td style="color: var(--pink); font-weight: bold;">$${(Number(b.cost) || 0).toLocaleString()}</td>
                        <td><span class="status-badge" style="background: rgba(0, 230, 118, 0.15); color: #00e676;">${b.status || 'Confirmed'}</span></td>
                    </tr>
                `}).join('');
            }
        }

        renderCharts(events, bookings);
        if (window.lucide) lucide.createIcons();
    }

    // 3. Charts Logic
    function renderCharts(events, bookings) {
        // Status Doughnut Chart
        const ctxStatus = document.getElementById('statusChart');
        if (ctxStatus) {
            const statusCounts = events.reduce((acc, e) => {
                const s = (e.status || 'pending').toLowerCase();
                acc[s] = (acc[s] || 0) + 1;
                return acc;
            }, {});

            const dataStatus = {
                labels: Object.keys(statusCounts).map(s => s.charAt(0).toUpperCase() + s.slice(1)),
                datasets: [{
                    data: Object.values(statusCounts),
                    backgroundColor: ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#6366f1'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            };

            if (statusChartInst) statusChartInst.destroy();
            statusChartInst = new Chart(ctxStatus, {
                type: 'doughnut',
                data: dataStatus,
                options: { 
                    cutout: '75%', 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'right', labels: { color: '#a1a1aa' } }
                    }
                }
            });
        }

        // Revenue Bar Chart
        const ctxRev = document.getElementById('revenueChart');
        if (ctxRev) {
            const revenueByMonth = bookings.reduce((acc, b) => {
                const d = b.created ? new Date(b.created) : new Date();
                const m = d.toLocaleString('default', { month: 'short' });
                acc[m] = (acc[m] || 0) + (Number(b.cost) || 0);
                return acc;
            }, {});

            if(Object.keys(revenueByMonth).length === 0) revenueByMonth['No Data'] = 0;

            const dataRev = {
                labels: Object.keys(revenueByMonth),
                datasets: [{
                    label: 'Revenue ($)',
                    data: Object.values(revenueByMonth),
                    backgroundColor: '#f43f5e',
                    borderRadius: 4
                }]
            };

            if (revenueChartInst) revenueChartInst.destroy();
            revenueChartInst = new Chart(ctxRev, {
                type: 'bar',
                data: dataRev,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: { 
                        y: { 
                            beginAtZero: true, 
                            grid: { color: 'rgba(255,255,255,0.05)' },
                            ticks: { color: '#a1a1aa' }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#a1a1aa' }
                        }
                    }
                }
            });
        }
    }

    // 4. Filtering Logic
    const applyBtn = document.getElementById('applyFiltersBtn');
    const typeSelect = document.getElementById('filterReportType');
    const startInput = document.getElementById('filterStartDate');
    const endInput = document.getElementById('filterEndDate');
    const eventTypeSelect = document.getElementById('filterEventType');

    function filterData() {
        let fEvents = [...rawEvents];
        let fBookings = [...rawBookings];
        let fResources = [...rawResources];

        const start = startInput.value ? new Date(startInput.value) : null;
        const end = endInput.value ? new Date(endInput.value) : null;
        const evType = eventTypeSelect.value.toLowerCase();

        // Filter Events by Date & Type
        fEvents = fEvents.filter(e => {
            if (evType !== 'all' && (e.type || '').toLowerCase() !== evType) return false;
            if (start || end) {
                const ed = new Date(e.date || new Date());
                if (start && ed < start) return false;
                if (end && ed > end) return false;
            }
            return true;
        });

        const validEventIds = new Set(fEvents.map(e => e.id));
        const validEventNames = new Set(fEvents.map(e => e.name));

        // Filter Bookings to match Events (if filters applied)
        if (evType !== 'all' || start || end) {
             fBookings = fBookings.filter(b => validEventIds.has(b.eventId) || validEventNames.has(b.eventName));
        }

        renderAnalytics(fEvents, fBookings, fResources);

        // Toggle Table Visibility based on "Report Type"
        const repType = typeSelect.value;
        document.querySelectorAll('.report-section').forEach(el => el.style.display = 'none');
        if (repType === 'all') {
            document.querySelectorAll('.report-section').forEach(el => el.style.display = 'block');
        } else if (repType === 'financial') {
            document.getElementById('reportFinancial').style.display = 'block';
        } else if (repType === 'operational') {
            document.getElementById('reportOperational').style.display = 'block';
        } else if (repType === 'resources') {
            document.getElementById('reportResources').style.display = 'block';
        }
    }

    if (applyBtn) {
        applyBtn.addEventListener('click', filterData);
    }

    // 5. CSV Export Logic
    const exportBtn = document.getElementById('exportCsvBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            if (rawBookings.length === 0) return alert('No data to export.');
            
            let csv = 'Booking ID,Event Name,Client Name,Vendor Name,Total Cost ($),Status\\n';
            rawBookings.forEach(b => {
                const cost = b.cost || 0;
                const evtName = b.eventName || rawEvents.find(e => e.id === b.eventId)?.name || b.eventId || '';
                // Quote values to safely escape commas
                csv += `"${b.id}","${evtName}","${b.client || ''}","${b.vendor || ''}","${cost}","${b.status || ''}"\\n`;
            });
            
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('hidden', '');
            a.setAttribute('href', url);
            a.setAttribute('download', 'financial_report_export.csv');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }

    // Initial load
    filterData();
});
