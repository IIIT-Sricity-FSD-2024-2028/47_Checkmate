document.addEventListener('DOMContentLoaded', () => {

    // 1. Setup Elements
    const packagesGrid = document.getElementById('packagesGrid');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('searchPackages');
    
    // Modal Elements
    const qModal = document.getElementById('quickCreateModal');
    const qcClose = document.getElementById('qcClose');
    const qcCancel = document.getElementById('qcCancel');
    const qcSubmit = document.getElementById('qcSubmit');
    const qcPackageName = document.getElementById('qcPackageName');
    const qcEventName = document.getElementById('qcEventName');
    const qcEventDate = document.getElementById('qcEventDate');
    const qcEventTime = document.getElementById('qcEventTime');
    const qcVenue = document.getElementById('qcVenue');
    const qcPeople = document.getElementById('qcPeople');
    const qcPackageId = document.getElementById('qcPackageId');

    // 2. Load and Render Packages
    function renderPackages() {
        if (!packagesGrid) return;
        
        const activeCat = document.querySelector('.filter-btn.active').getAttribute('data-category').toLowerCase();
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
        
        // From data.js
        const allPackages = DB.getAll('packages') || [];
        
        const filtered = allPackages.filter(p => {
            // Only show approved or legacy (undefined status) packages
            if (p.status === 'pending' || p.status === 'rejected') return false;
            
            const catMatch = activeCat === 'all' || (p.category && p.category.toLowerCase() === activeCat.toLowerCase()) || activeCat === p.category;
            const pName = p.name ? p.name.toLowerCase() : '';
            const pDesc = p.desc ? p.desc.toLowerCase() : '';
            const textMatch = pName.includes(searchTerm) || pDesc.includes(searchTerm);
            return catMatch && textMatch;
        });

        if (filtered.length === 0) {
            packagesGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);">No packages matched your search.</div>`;
            return;
        }

        /* Map categories to image URLs (Using unsplash placeholders based on theme) */
        const imgMap = {
            'wedding': 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
            'birthday': 'https://images.unsplash.com/photo-1530103862676-de88b7280eb4?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
            'conference': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
            'corporate': 'https://images.unsplash.com/photo-1515169067868-5387ec356754?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
            'party': 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
        };

        packagesGrid.innerHTML = filtered.map(p => {
            const cat = (p.category || 'conference').toLowerCase();
            const imgUrl = imgMap[cat] || imgMap['party'];
            
            // Map the colors loosely based on category
            let badgeClass = 'badge--wedding';
            if(['wedding','conference','birthday'].includes(cat)) {
                badgeClass = 'badge--' + cat;
            } else if (cat === 'corporate') {
                badgeClass = 'badge--wedding'; // use blueish
            }

            const resList = (p.resources || []).map(r => `<li>${r}</li>`).join('');
            const staffList = (p.staff || []).map(s => `<li>${s}</li>`).join('');

            return `
                <div class="package-card" data-category="${cat}">
                    <div class="package-img">
                        <img src="${imgUrl}" alt="${p.name}">
                    </div>
                    <div class="package-body">
                        <span class="badge ${badgeClass}" style="width:max-content;font-weight:600;">${p.category || 'Package'}</span>
                        <h3 class="package-title">${p.name}</h3>
                        <p class="package-desc">${p.desc}</p>
                        
                        <div class="package-included">
                            <h4>Included Services:</h4>
                            <ul>${resList || '<li>Standard Setup</li>'}</ul>
                            <h4>Staff Included:</h4>
                            <ul>${staffList || '<li>Event Coordinator</li>'}</ul>
                        </div>
                        
                        <div style="margin-top:auto; padding-top:20px;">
                            <div class="package-price">$${(p.price || 0).toLocaleString()}</div>
                            <div style="font-size:13px; color:var(--text-secondary); margin-bottom:16px;">
                                ${p.duration || 0} hours • Up to ${p.capacity || 'N/A'} Guests
                            </div>
                            <div style="display:flex; flex-direction:column; gap:8px;">
                                <button class="btn btn-primary btn-select" data-id="${p.id}" data-name="${p.name}" data-cat="${p.category}" style="justify-content:center; width:max-content;">
                                    <i class="ph ph-lightning"></i> Quick Create
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        attachSelectListeners();
    }

    // 3. Search and Filtering Events
    if(searchInput) {
        searchInput.addEventListener('input', renderPackages);
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderPackages();
        });
    });

    // 4. Modal Interactions
    function attachSelectListeners() {
        const selectBtns = document.querySelectorAll('.btn-select');
        selectBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const id = btn.getAttribute('data-id');
                const name = btn.getAttribute('data-name');
                const cat = btn.getAttribute('data-cat');
                
                // Reset form
                qcEventName.value = name + ' Event';
                qcEventDate.value = '';
                qcVenue.value = '';
                qcPeople.value = '';
                
                // Populate metadata
                qcPackageId.value = id;
                qcPackageName.textContent = name;
                
                // Open Modal
                qModal.style.display = 'flex';
            });
        });
    }

    function closeModal() {
        if(qModal) qModal.style.display = 'none';
    }

    if(qcClose) qcClose.addEventListener('click', closeModal);
    if(qcCancel) qcCancel.addEventListener('click', closeModal);
    
    // Close on out-click
    if(qModal) {
        qModal.addEventListener('click', (e) => {
            if (e.target === qModal) closeModal();
        });
    }

    // 5. Form Submission (Create directly)
    if(qcSubmit) {
        qcSubmit.addEventListener('click', () => {
            // Validate minimum
            if(!qcEventName.value || !qcEventDate.value) {
                alert("Please fill in the required Event Name and Date.");
                return;
            }

            // Generate an ID similar to how create_event_client.js does it
            const existing = typeof DB !== 'undefined' ? DB.getAll('events') : [];
            const maxNum = existing.reduce((max, ev) => {
                const num = parseInt((ev.id || '').replace(/\D/g, ''), 10) || 0;
                return Math.max(max, num);
            }, 0);
            const newId = `EVT${String(maxNum + 1).padStart(3, '0')}`;
            
            // Format time to display (e.g. 09:00 -> 9:00 AM)
            function fmtTime(t) {
                if (!t) return '09:00';
                const [h, m] = t.split(':').map(Number);
                const suffix = h >= 12 ? 'PM' : 'AM';
                const hour = h % 12 || 12;
                return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
            }
            
            // Get full package info so we attach type correctly
            const pid = qcPackageId.value;
            const pkg = DB.find('packages', pid);
            const session = DB.getSession();

            // Match package resources/staff to real DB entries
            const allResources = DB.getAll('resources') || [];
            const allStaff = DB.getAll('staff') || [];
            let reqResources = [];
            let reqStaff = [];
            let estimatedCost = 0;

            if (pkg && pkg.resources) {
                pkg.resources.forEach(rName => {
                    const match = allResources.find(r => rName.toLowerCase().includes(r.name.toLowerCase().split(' ')[0]));
                    if (match) {
                        const qty = 1;
                        reqResources.push({ resourceId: match.id, resourceName: match.name, category: match.category, quantity: qty, pricePerDay: match.price || 0 });
                        estimatedCost += (match.price || 0) * qty;
                    } else {
                        // Unmatched resources get a dummy ID to intentionally trigger a conflict
                        reqResources.push({ resourceId: `UNKNOWN_RES_${Date.now()}_${Math.random()}`, resourceName: rName, category: 'Uncategorized', quantity: 1, pricePerDay: 0 });
                    }
                });
            }
            if (pkg && pkg.staff) {
                pkg.staff.forEach(sRole => {
                    const match = allStaff.find(s => sRole.toLowerCase().includes(s.role.toLowerCase().split(' ')[0]) || sRole.toLowerCase().includes(s.name.toLowerCase().split(' ')[0]));
                    if (match) {
                        reqStaff.push({ staffId: match.id, staffName: match.name, role: match.role });
                    } else {
                        // Unmatched staff get a dummy ID to intentionally trigger a conflict
                        reqStaff.push({ staffId: `UNKNOWN_STF_${Date.now()}_${Math.random()}`, staffName: sRole, role: sRole });
                    }
                });
            }
            
            const newEvent = {
                id: newId,
                name: qcEventName.value,
                type: pkg ? pkg.category : 'Package',
                date: qcEventDate.value,
                time: fmtTime(qcEventTime.value),
                venue: qcVenue.value || 'TBD',
                people: parseInt(qcPeople.value, 10) || 0,
                status: 'pending',
                notes: `Quick created from package: ${pkg ? pkg.name : pid}`,
                createdBy: 'client',
                client: session.user || session.name || 'Client',
                clientId: session.id || session.userId || '',
                clientEmail: session.email || '',
                vendor: pkg ? (pkg.vendorName || pkg.vendor || pkg.vendorId || 'Elite Events Co.') : 'Elite Events Co.',
                vendorId: pkg ? (pkg.vendorId || '') : '',
                presetPackageId: pid,
                packageId: pid,
                submittedAt: new Date().toISOString(),
                requestedResources: reqResources.length > 0 ? reqResources : undefined,
                requestedStaff: reqStaff.length > 0 ? reqStaff : undefined,
                estimatedCost: estimatedCost > 0 ? estimatedCost : undefined,
            };

            // Save to DB
            DB.add('events', newEvent);
            
            // Show Loading State
            const originalContent = qcSubmit.innerHTML;
            qcSubmit.innerHTML = '<i class="ph ph-spinner-gap ph-spin"></i> Submitting...';
            qcSubmit.style.opacity = '0.8';
            qcSubmit.style.pointerEvents = 'none';

            setTimeout(() => {
                qcSubmit.innerHTML = '<i class="ph ph-check-circle"></i> Success!';
                qcSubmit.style.background = 'var(--green-solid, #22c55e)';
                
                setTimeout(() => {
                    // Redirect to My Events
                    window.location.href = 'client_myevents.html';
                }, 1000);
            }, 1200);
        });
    }

    // Phosphor spin animation
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

    // Initialize
    renderPackages();
});
