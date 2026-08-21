/* ═══════════════════════════════════════════
   create_event_client.js  —  Multi-Step Event Wizard
   • 4-step wizard: Details → Resources → Staff → Review
   • Live resource/staff availability from DB (API-backed)
   • Conflict detection for items in live events
   • Builds full event payload with requestedResources/Staff
   ═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

    /* ══════════════════════════════════════
       STATE
    ══════════════════════════════════════ */
    let currentStep = 1;
    const totalSteps = 4;
    let selectedResources = {};   // { resourceId: { ...resource, qty: N } }
    let selectedStaff = {};       // { staffId: { ...staffMember } }
    let resSearchQuery = '';
    let resCategoryFilter = 'all';
    let staffSearchQuery = '';

    /* ══════════════════════════════════════
       WIZARD NAVIGATION
    ══════════════════════════════════════ */
    function goToStep(step) {
        if (step < 1 || step > totalSteps) return;
        currentStep = step;

        // Update panels
        document.querySelectorAll('.wizard-panel').forEach(p => p.classList.remove('active'));
        const panel = document.getElementById(`step${step}`);
        if (panel) panel.classList.add('active');

        // Update step indicators
        document.querySelectorAll('.wizard-step').forEach(s => {
            const sNum = parseInt(s.dataset.step);
            s.classList.remove('active', 'completed');
            if (sNum === step) s.classList.add('active');
            else if (sNum < step) s.classList.add('completed');
        });

        // Update lines
        for (let i = 1; i <= 3; i++) {
            const line = document.getElementById(`line${i}`);
            if (line) {
                if (i < step) line.classList.add('done');
                else line.classList.remove('done');
            }
        }

        // Load dynamic content for each step
        if (step === 2) renderResources();
        if (step === 3) renderStaff();
        if (step === 4) renderReview();

        // Scroll to top
        document.querySelector('.content')?.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /* ══════════════════════════════════════
       STEP 1: VALIDATION
    ══════════════════════════════════════ */
    function validateStep1() {
        const fields = [
            { id: 'fieldEventName',  msg: 'Event name is required.' },
            { id: 'fieldEventType',  msg: 'Please select an event type.' },
            { id: 'fieldEventDate',  msg: 'Please select a date.' },
            { id: 'fieldPeople',     msg: 'Please enter guest count.' },
        ];
        let valid = true;
        fields.forEach(f => {
            const el = document.getElementById(f.id);
            const errEl = el?.parentElement?.querySelector('.error-msg');
            if (!el || !el.value.trim()) {
                el?.classList.add('input-error');
                if (errEl) { errEl.textContent = f.msg; errEl.style.display = 'block'; }
                valid = false;
            } else {
                el.classList.remove('input-error');
                if (errEl) errEl.style.display = 'none';
            }
        });
        return valid;
    }

    // Live validation
    ['fieldEventName','fieldEventType','fieldEventDate','fieldPeople'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('input', () => {
            if (el.classList.contains('input-error') && el.value.trim()) {
                el.classList.remove('input-error');
                const errEl = el.parentElement?.querySelector('.error-msg');
                if (errEl) errEl.style.display = 'none';
            }
        });
    });

    const budgetSelect = document.getElementById('fieldBudget');
    const customBudgetInput = document.getElementById('fieldCustomBudget');
    if (budgetSelect && customBudgetInput) {
        budgetSelect.addEventListener('change', () => {
            if (budgetSelect.value === 'custom') {
                customBudgetInput.style.display = 'block';
            } else {
                customBudgetInput.style.display = 'none';
            }
        });
    }

    function getMaxBudget() {
        const budgetVal = budgetSelect?.value;
        if (budgetVal === 'custom') {
            return parseInt(customBudgetInput?.value || 0, 10);
        }
        if (!budgetVal) return Infinity; // No budget limit
        
        // Extract the upper bound from the string. e.g. "$1,000 - $5,000" or "$50,000+"
        if (budgetVal.includes('-')) {
            const parts = budgetVal.split('-');
            const maxPart = parts[1].replace(/[^0-9]/g, '');
            return parseInt(maxPart, 10);
        } else if (budgetVal.includes('+')) {
            const val = budgetVal.replace(/[^0-9]/g, '');
            return parseInt(val, 10);
        }
        return Infinity;
    }

    /* ══════════════════════════════════════
       STEP 2: RESOURCES
    ══════════════════════════════════════ */
    function getResourceAvailability(resource) {
        // Check how many are allocated to confirmed/live events
        const allocs = DB.get('resourceAllocations') || {};
        let allocated = 0;
        const liveEvents = DB.getAll('events').filter(e => e.status === 'live' || e.status === 'confirmed');
        liveEvents.forEach(ev => {
            const evAllocs = allocs[ev.id] || [];
            evAllocs.forEach(a => {
                if (a.resourceId === resource.id) allocated += (a.qty || a.quantity || 0);
            });
        });
        const available = Math.max(0, resource.quantity - allocated);
        return { total: resource.quantity, allocated, available };
    }

    function renderResources() {
        const resources = DB.getAll('resources') || [];
        const grid = document.getElementById('resourceGrid');
        if (!grid) return;

        // Build category filter pills
        const pillsEl = document.getElementById('resFilterPills');
        if (pillsEl && pillsEl.children.length === 0) {
            const cats = ['All', ...new Set(resources.map(r => r.category))];
            pillsEl.innerHTML = cats.map(c => 
                `<button class="ce-filter-pill ${c === 'All' ? 'active' : ''}" data-cat="${c.toLowerCase()}">${c}</button>`
            ).join('');
            pillsEl.querySelectorAll('.ce-filter-pill').forEach(btn => {
                btn.addEventListener('click', () => {
                    pillsEl.querySelectorAll('.ce-filter-pill').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    resCategoryFilter = btn.dataset.cat;
                    renderResources();
                });
            });
        }

        // Filter
        const filtered = resources.filter(r => {
            const catMatch = resCategoryFilter === 'all' || r.category.toLowerCase() === resCategoryFilter;
            const searchMatch = !resSearchQuery || r.name.toLowerCase().includes(resSearchQuery) || r.category.toLowerCase().includes(resSearchQuery);
            return catMatch && searchMatch;
        });

        if (!filtered.length) {
            grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);">No resources found.</div>`;
            return;
        }

        grid.innerHTML = filtered.map(r => {
            const isSelected = !!selectedResources[r.id];
            const selQty = isSelected ? selectedResources[r.id].qty : 0;
            const catBadge = r.category === 'Equipment' ? 'badge--equipment' : r.category === 'Furniture' ? 'badge--furniture' : 'badge--decor';

            return `
            <div class="ce-res-card ${isSelected ? 'selected' : ''}" data-id="${r.id}">
                <div class="ce-res-card__top">
                    <div>
                        <div class="ce-res-card__name">${r.name}</div>
                        <span class="ce-res-card__cat ${catBadge}" style="margin-top:4px;display:inline-block;">${r.category}</span>
                    </div>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div class="ce-res-card__price">$${r.price}/${r.unit || 'day'}</div>
                    <div class="ce-qty-selector" onclick="event.stopPropagation()">
                        <button class="ce-qty-btn" data-action="dec" data-id="${r.id}">−</button>
                        <input class="ce-qty-val" type="text" value="${selQty}" readonly data-qty-input="${r.id}">
                        <button class="ce-qty-btn" data-action="inc" data-id="${r.id}">+</button>
                    </div>
                </div>
            </div>`;
        }).join('');

        // Attach quantity button listeners
        grid.querySelectorAll('.ce-qty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const resId = btn.dataset.id;
                const action = btn.dataset.action;
                const resource = resources.find(r => r.id === resId);
                if (!resource) return;

                const avail = getResourceAvailability(resource);
                let current = selectedResources[resId]?.qty || 0;

                if (action === 'inc') {
                    current++;
                } else if (action === 'dec' && current > 0) {
                    current--;
                }

                if (current > 0) {
                    selectedResources[resId] = {
                        resourceId: resource.id,
                        resourceName: resource.name,
                        category: resource.category,
                        quantity: current,
                        pricePerDay: resource.price,
                        qty: current
                    };
                } else {
                    delete selectedResources[resId];
                }

                // Update display
                const qtyInput = grid.querySelector(`[data-qty-input="${resId}"]`);
                if (qtyInput) qtyInput.value = current;

                const card = grid.querySelector(`.ce-res-card[data-id="${resId}"]`);
                if (card) {
                    if (current > 0) card.classList.add('selected');
                    else card.classList.remove('selected');
                }

                renderSelectedResourcesSummary();
            });
        });

        renderSelectedResourcesSummary();
    }

    function renderSelectedResourcesSummary() {
        const summary = document.getElementById('selectedResourcesSummary');
        const list = document.getElementById('selectedResList');
        const countBadge = document.getElementById('selectedResCount');
        const keys = Object.keys(selectedResources);

        if (!keys.length) {
            if (summary) summary.style.display = 'none';
            return;
        }

        if (summary) summary.style.display = 'block';
        if (countBadge) countBadge.textContent = keys.length;

        let total = 0;
        if (list) {
            list.innerHTML = keys.map(id => {
                const r = selectedResources[id];
                const cost = r.qty * r.pricePerDay;
                total += cost;
                return `
                <div class="ce-selected-item">
                    <span class="ce-selected-item__name">${r.resourceName}</span>
                    <span class="ce-selected-item__detail">×${r.qty} · $${cost}/day</span>
                    <button class="ce-selected-item__remove" data-remove-res="${id}" title="Remove">✕</button>
                </div>`;
            }).join('');
            list.innerHTML += `
            <div style="display:flex;justify-content:space-between;padding:10px 0 0;border-top:1px solid var(--border);margin-top:4px;">
                <span style="font-size:13px;font-weight:600;color:var(--text-primary);">Subtotal</span>
                <span style="font-size:14px;font-weight:700;color:var(--pink);font-family:var(--font-display);">$${total.toLocaleString()}/day</span>
            </div>`;

            list.querySelectorAll('[data-remove-res]').forEach(btn => {
                btn.addEventListener('click', () => {
                    delete selectedResources[btn.dataset.removeRes];
                    renderResources();
                });
            });
        }

        const summaryTotal = document.getElementById('selectedResTotal');
        if (summaryTotal) summaryTotal.textContent = `$${total}/day`;

        const maxBudget = getMaxBudget();
        const budgetWarningBanner = document.getElementById('budgetWarningBanner');
        const budgetWarningText = document.getElementById('budgetWarningText');
        
        const overBudget = total > maxBudget;
        
        // 1. Toggle Banner
        if (overBudget) {
            if (budgetWarningBanner && budgetWarningText) {
                budgetWarningText.textContent = `Resource total ($${total.toLocaleString()}) exceeds your budget limit ($${maxBudget.toLocaleString()}).`;
                budgetWarningBanner.style.display = 'flex';
            }
        } else {
            if (budgetWarningBanner) {
                budgetWarningBanner.style.display = 'none';
            }
        }

        // 2. Toggle Next Button
        const btnNext2 = document.getElementById('btnNext2');
        if (btnNext2) {
            btnNext2.disabled = overBudget;
            btnNext2.style.opacity = overBudget ? '0.5' : '1';
            btnNext2.style.cursor = overBudget ? 'not-allowed' : 'pointer';
        }

        // 3. Toggle '+' Buttons
        document.querySelectorAll('.ce-qty-btn[data-action="inc"]').forEach(btn => {
            btn.disabled = overBudget;
            btn.style.opacity = overBudget ? '0.3' : '1';
            btn.style.cursor = overBudget ? 'not-allowed' : 'pointer';
        });
    }

    // Resource search
    document.getElementById('resSearchInput')?.addEventListener('input', (e) => {
        resSearchQuery = e.target.value.trim().toLowerCase();
        renderResources();
    });

    /* ══════════════════════════════════════
       STEP 3: STAFF
    ══════════════════════════════════════ */
    function getStaffAvailability(staff) {
        const liveEvents = DB.getAll('events').filter(e => e.status === 'live');
        const isInLive = liveEvents.some(ev =>
            Array.isArray(staff.assignedEvents) && staff.assignedEvents.includes(ev.id)
        );
        return {
            isAvailable: staff.status === 'available' || staff.avail === 'Available',
            isBusy: staff.status === 'busy' || staff.avail === 'Busy',
            isInLiveEvent: isInLive,
            workload: staff.workload || 0
        };
    }

    function renderStaff() {
        const allStaff = DB.getAll('staff') || [];
        const grid = document.getElementById('staffGrid');
        if (!grid) return;

        const filtered = allStaff.filter(s => {
            if (!staffSearchQuery) return true;
            return s.name.toLowerCase().includes(staffSearchQuery) ||
                   s.role.toLowerCase().includes(staffSearchQuery);
        });

        if (!filtered.length) {
            grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);">No staff found.</div>`;
            return;
        }

        const avatarColors = ['pink', 'teal', 'purple', 'green', 'orange'];
        const avatarGradients = {
            pink: 'linear-gradient(135deg, #e91e8c, #a855f7)',
            teal: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
            purple: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
            green: 'linear-gradient(135deg, #22c55e, #16a34a)',
            orange: 'linear-gradient(135deg, #f97316, #ef4444)',
        };

        grid.innerHTML = filtered.map((s, i) => {
            const avail = getStaffAvailability(s);
            const isSelected = !!selectedStaff[s.id];
            const initials = s.initials || s.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
            const avatarColor = s.avatar || avatarColors[i % avatarColors.length];
            const gradient = avatarGradients[avatarColor] || avatarGradients.pink;

            let statusClass = 'ok', statusLabel = 'Available';
            if (avail.isInLiveEvent) { statusClass = 'out'; statusLabel = 'In Live Event'; }
            else if (avail.isBusy) { statusClass = 'low'; statusLabel = 'Busy'; }
            else if (s.status === 'off') { statusClass = 'out'; statusLabel = 'Off Duty'; }

            const workloadClass = avail.workload >= 80 ? 'high' : avail.workload >= 50 ? 'medium' : 'low';

            return `
            <div class="ce-staff-card ${isSelected ? 'selected' : ''}" data-staff-id="${s.id}">
                <div class="ce-staff-card__top">
                    <div class="ce-staff-card__avatar" style="background:${gradient}">${initials}</div>
                    <div>
                        <div class="ce-staff-card__name">${s.name}</div>
                        <div class="ce-staff-card__role">${s.role}</div>
                    </div>
                </div>
            </div>`;
        }).join('');

        // Attach click to toggle selection
        grid.querySelectorAll('.ce-staff-card').forEach(card => {
            card.addEventListener('click', () => {
                const staffId = card.dataset.staffId;
                const staff = allStaff.find(s => s.id === staffId);
                if (!staff) return;

                if (selectedStaff[staffId]) {
                    delete selectedStaff[staffId];
                    card.classList.remove('selected');
                } else {
                    selectedStaff[staffId] = {
                        staffId: staff.id,
                        staffName: staff.name,
                        role: staff.role
                    };
                    card.classList.add('selected');
                }

                renderSelectedStaffSummary();
            });
        });

        renderSelectedStaffSummary();
    }

    function renderSelectedStaffSummary() {
        const summary = document.getElementById('selectedStaffSummary');
        const list = document.getElementById('selectedStaffList');
        const countBadge = document.getElementById('selectedStaffCount');
        const keys = Object.keys(selectedStaff);

        if (!keys.length) {
            if (summary) summary.style.display = 'none';
            return;
        }

        if (summary) summary.style.display = 'block';
        if (countBadge) countBadge.textContent = keys.length;

        if (list) {
            list.innerHTML = keys.map(id => {
                const s = selectedStaff[id];
                return `
                <div class="ce-selected-item">
                    <span class="ce-selected-item__name">${s.staffName}</span>
                    <span class="ce-selected-item__detail">${s.role}</span>
                    <button class="ce-selected-item__remove" data-remove-staff="${id}" title="Remove">✕</button>
                </div>`;
            }).join('');

            list.querySelectorAll('[data-remove-staff]').forEach(btn => {
                btn.addEventListener('click', () => {
                    delete selectedStaff[btn.dataset.removeStaff];
                    renderStaff();
                });
            });
        }
    }

    // Staff search
    document.getElementById('staffSearchInput')?.addEventListener('input', (e) => {
        staffSearchQuery = e.target.value.trim().toLowerCase();
        renderStaff();
    });

    /* ══════════════════════════════════════
       STEP 4: REVIEW
    ══════════════════════════════════════ */
    function fmtTime(t) {
        if (!t) return '09:00';
        const [h, m] = t.split(':').map(Number);
        const suffix = h >= 12 ? 'PM' : 'AM';
        const hour = h % 12 || 12;
        return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
    }

    function renderReview() {
        const name   = document.getElementById('fieldEventName')?.value.trim() || 'Untitled Event';
        const type   = document.getElementById('fieldEventType')?.value   || '—';
        const date   = document.getElementById('fieldEventDate')?.value   || '—';
        const time   = fmtTime(document.getElementById('fieldEventTime')?.value);
        const venue  = document.getElementById('fieldVenue')?.value.trim() || 'TBD';
        const people = document.getElementById('fieldPeople')?.value || '—';
        
        let budgetVal = document.getElementById('fieldBudget')?.value || '—';
        if (budgetVal === 'custom') {
            const customVal = document.getElementById('fieldCustomBudget')?.value;
            budgetVal = customVal ? `$${customVal}` : '—';
        }
        const budget = budgetVal;
        const notes  = document.getElementById('fieldNotes')?.value.trim() || '';

        // Event details grid
        const detailsGrid = document.getElementById('reviewDetailsGrid');
        if (detailsGrid) {
            detailsGrid.innerHTML = `
                <div class="ce-review-field"><div class="ce-review-field__label">Event Name</div><div class="ce-review-field__value">${name}</div></div>
                <div class="ce-review-field"><div class="ce-review-field__label">Type</div><div class="ce-review-field__value">${type}</div></div>
                <div class="ce-review-field"><div class="ce-review-field__label">Date</div><div class="ce-review-field__value">${date}</div></div>
                <div class="ce-review-field"><div class="ce-review-field__label">Time</div><div class="ce-review-field__value">${time}</div></div>
                <div class="ce-review-field"><div class="ce-review-field__label">Venue</div><div class="ce-review-field__value">${venue}</div></div>
                <div class="ce-review-field"><div class="ce-review-field__label">Expected Guests</div><div class="ce-review-field__value">${people}</div></div>
                <div class="ce-review-field" style="grid-column:1/-1;"><div class="ce-review-field__label">Budget Range</div><div class="ce-review-field__value">${budget}</div></div>
            `;
        }

        // Resources review
        const resKeys = Object.keys(selectedResources);
        const resSection = document.getElementById('reviewResourcesSection');
        const resList = document.getElementById('reviewResourcesList');
        const costSection = document.getElementById('reviewCostTotal');

        if (resKeys.length > 0) {
            if (resSection) resSection.style.display = 'block';
            let totalCost = 0;
            if (resList) {
                resList.innerHTML = resKeys.map(id => {
                    const r = selectedResources[id];
                    const cost = r.qty * r.pricePerDay;
                    totalCost += cost;
                    return `<span class="ce-review-tag"><i class="ph ph-cube"></i> ${r.resourceName} ×${r.qty} — $${cost}/day</span>`;
                }).join('');
            }
            if (costSection) {
                costSection.style.display = 'flex';
                document.getElementById('reviewTotalCost').textContent = `$${totalCost.toLocaleString()}/day`;
            }
        } else {
            if (resSection) resSection.style.display = 'none';
            if (costSection) costSection.style.display = 'none';
        }

        // Staff review
        const staffKeys = Object.keys(selectedStaff);
        const staffSection = document.getElementById('reviewStaffSection');
        const staffList = document.getElementById('reviewStaffList');

        if (staffKeys.length > 0) {
            if (staffSection) staffSection.style.display = 'block';
            if (staffList) {
                staffList.innerHTML = staffKeys.map(id => {
                    const s = selectedStaff[id];
                    return `<span class="ce-review-tag"><i class="ph ph-user"></i> ${s.staffName} — ${s.role}</span>`;
                }).join('');
            }
        } else {
            if (staffSection) staffSection.style.display = 'none';
        }

        // Notes
        const notesSection = document.getElementById('reviewNotesSection');
        const notesEl = document.getElementById('reviewNotes');
        if (notes) {
            if (notesSection) notesSection.style.display = 'block';
            if (notesEl) notesEl.textContent = notes;
        } else {
            if (notesSection) notesSection.style.display = 'none';
        }
    }

    /* ══════════════════════════════════════
       SUBMIT
    ══════════════════════════════════════ */
    function generateId() {
        const existing = typeof DB !== 'undefined' ? DB.getAll('events') : [];
        const maxNum = existing.reduce((max, ev) => {
            const num = parseInt((ev.id || '').replace(/\D/g, ''), 10) || 0;
            return Math.max(max, num);
        }, 0);
        return `EVT${String(maxNum + 1).padStart(3, '0')}`;
    }

    function submitEvent() {
        const name    = document.getElementById('fieldEventName')?.value.trim()  || 'New Event';
        const type    = document.getElementById('fieldEventType')?.value          || 'Conference';
        const date    = document.getElementById('fieldEventDate')?.value          || '';
        const time    = document.getElementById('fieldEventTime')?.value          || '09:00';
        const venue   = document.getElementById('fieldVenue')?.value.trim()       || 'TBD';
        const people  = parseInt(document.getElementById('fieldPeople')?.value, 10) || 0;
        let budgetVal = document.getElementById('fieldBudget')?.value             || '';
        if (budgetVal === 'custom') {
            const customVal = document.getElementById('fieldCustomBudget')?.value;
            budgetVal = customVal ? `$${customVal}` : '';
        }
        const budget  = budgetVal;
        const notes   = document.getElementById('fieldNotes')?.value.trim()       || '';

        // Build resource and staff arrays
        const reqResources = Object.values(selectedResources).map(r => ({
            resourceId: r.resourceId,
            resourceName: r.resourceName,
            category: r.category,
            quantity: r.qty,
            pricePerDay: r.pricePerDay
        }));

        const reqStaff = Object.values(selectedStaff).map(s => ({
            staffId: s.staffId,
            staffName: s.staffName,
            role: s.role
        }));

        let estimatedCost = 0;
        reqResources.forEach(r => { estimatedCost += r.quantity * r.pricePerDay; });

        const session = typeof DB !== 'undefined' ? DB.getSession() : {};

        let targetVendor = 'Elite Events Co.';
        let targetVendorId = 'V001';
        if (reqResources.length > 0) {
            const firstRes = Object.values(selectedResources)[0];
            if (firstRes && (firstRes.vendor || firstRes.vendorId)) {
                targetVendor = firstRes.vendor || targetVendor;
                targetVendorId = firstRes.vendorId || targetVendorId;
            }
        }

        const newEvent = {
            id:         generateId(),
            name,
            type,
            date,
            time:       fmtTime(time),
            venue,
            people,
            status:     'pending',
            notes,
            createdBy:  'client',
            client:     session.user || session.name || 'Client',
            clientId:   session.id || session.userId || '',
            clientEmail: session.email || '',
            vendor:     targetVendor,
            vendorId:   targetVendorId,
            budgetRange: budget,
            requestedResources: reqResources.length > 0 ? reqResources : undefined,
            requestedStaff: reqStaff.length > 0 ? reqStaff : undefined,
            estimatedCost: estimatedCost > 0 ? estimatedCost : undefined,
            submittedAt: new Date().toISOString(),
        };

        // Save to shared DB
        if (typeof DB !== 'undefined') {
            DB.add('events', newEvent);
        } else {
            console.warn('DB not loaded — event not persisted.');
        }

        // UI success feedback
        const submitBtn = document.getElementById('btnSubmitFinal');
        if (!submitBtn) return;
        const originalContent = submitBtn.innerHTML;

        submitBtn.innerHTML = '<i class="ph ph-spinner-gap ph-spin"></i> Submitting...';
        submitBtn.style.opacity = '0.8';
        submitBtn.style.pointerEvents = 'none';

        setTimeout(() => {
            submitBtn.innerHTML = '<i class="ph ph-check-circle"></i> Event Created Successfully!';
            submitBtn.style.background = 'var(--green-solid, #22c55e)';
            submitBtn.style.boxShadow = '0 4px 20px rgba(34, 197, 94, 0.4)';

            setTimeout(() => {
                window.location.href = 'client_myevents.html';
            }, 1500);
        }, 1200);
    }

    /* ══════════════════════════════════════
       WIRE UP NAVIGATION BUTTONS
    ══════════════════════════════════════ */
    document.getElementById('btnNext1')?.addEventListener('click', () => {
        if (!validateStep1()) return;
        goToStep(2);
    });

    document.getElementById('btnBack2')?.addEventListener('click', () => goToStep(1));
    document.getElementById('btnNext2')?.addEventListener('click', () => goToStep(3));
    document.getElementById('btnSkip2')?.addEventListener('click', () => goToStep(3));

    document.getElementById('btnBack3')?.addEventListener('click', () => goToStep(2));
    document.getElementById('btnNext3')?.addEventListener('click', () => goToStep(4));
    document.getElementById('btnSkip3')?.addEventListener('click', () => goToStep(4));

    document.getElementById('btnBack4')?.addEventListener('click', () => goToStep(3));
    document.getElementById('btnSubmitFinal')?.addEventListener('click', () => submitEvent());

    /* ══════════════════════════════════════
       SPIN ANIMATION
    ══════════════════════════════════════ */
    if (!document.getElementById('ph-spin-style')) {
        const style = document.createElement('style');
        style.id = 'ph-spin-style';
        style.innerHTML = `
            @keyframes ph-spin {
                0%   { transform: rotate(0deg); }
                100% { transform: rotate(359deg); }
            }
            .ph-spin { animation: ph-spin 1s linear infinite; }
        `;
        document.head.appendChild(style);
    }
});
