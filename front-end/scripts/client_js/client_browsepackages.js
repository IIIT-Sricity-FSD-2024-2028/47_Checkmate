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
            const catMatch = activeCat === 'all' || (p.category && p.category.toLowerCase() === activeCat.toLowerCase()) || activeCat === p.category;
            const textMatch = p.name.toLowerCase().includes(searchTerm) || p.desc.toLowerCase().includes(searchTerm);
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
            const newId = 'EVT-C' + Math.floor(1000 + Math.random() * 9000);
            
            // Get full package info so we attach type correctly
            const pid = qcPackageId.value;
            const pkg = DB.find('packages', pid);
            
            const newEvent = {
                id: newId,
                name: qcEventName.value,
                type: pkg ? pkg.category : 'Package',
                date: qcEventDate.value,
                time: qcEventTime.value || '',
                venue: qcVenue.value || 'TBD',
                people: qcPeople.value || 'TBD',
                status: 'pending',
                createdBy: 'client',
                presetPackageId: pid,
                createdAt: new Date().toISOString()
            };

            // Save to DB
            DB.add('events', newEvent);
            
            // Redirect to My Events
            window.location.href = 'client_myevents.html?msg=PackageEventCreated';
        });
    }

    // Initialize
    renderPackages();
});
