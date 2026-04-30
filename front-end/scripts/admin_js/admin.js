document.addEventListener('DOMContentLoaded', () => {

    /* ========================================================
       SECTION 1: VENDOR APPROVALS LOGIC
       ======================================================== */
    const vendorTbody = document.getElementById('vendorTableBody');
    if (vendorTbody) {

        // ── Seed dummy data ──────────────────────────────────
        let vendorData = Array.from({ length: 25 }, (_, i) => {
            const id = i + 1;
            const names = ["Jane Vendor", "John Caterer", "Alice Planner", "Bob DJ", "Sarah Florist"];
            const businesses = ["Dream Events Ltd.", "Tasteful Catering", "Perfect Moments", "Beats Audio", "Blooms & Co."];
            const categories = ["Event Planning", "Catering", "Event Planning", "Entertainment", "Decor"];
            const tags = ["active", "blue", "active", "purple", "pink"];
            const baseIndex = i % 5;
            return {
                id: `v-${id}`,
                vendorName: `${names[baseIndex]} ${id}`,
                businessName: businesses[baseIndex] + (id > 5 ? ` Part ${id}` : ""),
                email: `vendor${id}@demo.com`,
                phone: `555-01${id.toString().padStart(2, '0')}`,
                category: categories[baseIndex],
                categoryClass: tags[baseIndex],
                documents: [], // dummy has no docs
                status: 'pending'
            };
        });

        // ── Merge REAL submissions from localStorage (prepend) ─
        const realApps = JSON.parse(localStorage.getItem('eventpro_vendorApplicationsList') || '[]');
        realApps.forEach(real => {
            // Avoid duplicates by email
            vendorData = vendorData.filter(v => v.email !== real.email);
            vendorData.unshift(real); // real data goes to top
        });

        const sortVendorData = () => {
            vendorData.sort((a, b) => {
                if (a.status === 'pending' && b.status !== 'pending') return -1;
                if (a.status !== 'pending' && b.status === 'pending') return 1;
                return 0;
            });
        };
        sortVendorData();

        let filteredVendors = [...vendorData];
        let vCurPage = 1;
        const vRowsPage = 10;

        const vendorSearch = document.getElementById('vendorSearchInput');
        const vendorStatusFilter = document.getElementById('vendorStatusFilter');
        const vPrev = document.getElementById('prevPageBtn');
        const vNext = document.getElementById('nextPageBtn');
        const vInfo = document.getElementById('paginationInfo');
        const vendorModalObj = document.getElementById('vendorReviewModal');
        let activeVendorId = null;

        const renderVendorTable = () => {
            const totalRows = filteredVendors.length;
            const totalPages = Math.ceil(totalRows / vRowsPage) || 1;
            if (vCurPage > totalPages) vCurPage = totalPages;
            if (vCurPage < 1) vCurPage = 1;

            const startIndex = (vCurPage - 1) * vRowsPage;
            const currentSlice = filteredVendors.slice(startIndex, startIndex + vRowsPage);

            vendorTbody.innerHTML = '';
            currentSlice.forEach(vendor => {
                let statusBadge = `<span class="status-badge pending">pending</span>`;
                if(vendor.status === 'approved') statusBadge = `<span class="status-badge" style="background: rgba(0, 230, 118, 0.15); color: #00e676; font-weight: 600;">approved</span>`;
                if(vendor.status === 'rejected') statusBadge = `<span class="status-badge" style="background: rgba(255, 77, 77, 0.15); color: #ff4d4d; font-weight: 600;">rejected</span>`;

                // Show a doc count badge for real submissions
                const docCount = vendor.documents?.length || 0;
                const docBadge = docCount > 0
                    ? `<span style="background:rgba(59,130,246,.15);color:#3b82f6;border:1px solid rgba(59,130,246,.3);border-radius:5px;padding:2px 8px;font-size:11px;font-weight:600;">${docCount} file${docCount>1?'s':''} uploaded</span>`
                    : `<span style="color:var(--text-muted);font-size:12px;">—</span>`;

                let actionBtn = `<button class="action-btn action-btn-clean review-vendor-btn" data-id="${vendor.id}"><i data-lucide="eye"></i> Review Application</button>`;
                if (vendor.status !== 'pending') {
                    actionBtn = `<button class="action-btn action-btn-clean" style="opacity: 0.5; pointer-events: none;"><i data-lucide="check"></i> Processed</button>`;
                }

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="vendor-name-col">${vendor.vendorName}</td>
                    <td class="business-name-col">${vendor.businessName}</td>
                    <td>${vendor.email}</td>
                    <td>${vendor.phone}</td>
                    <td>${docBadge}</td>
                    <td class="actions-cell">${statusBadge}&nbsp;${actionBtn}</td>
                `;
                vendorTbody.appendChild(tr);
            });

            if (vInfo) vInfo.textContent = `Showing ${totalRows === 0 ? 0 : startIndex + 1} to ${Math.min(startIndex + vRowsPage, totalRows)} of ${totalRows}`;
            if (vPrev) vPrev.disabled = vCurPage === 1;
            if (vNext) vNext.disabled = vCurPage === totalPages || totalRows === 0;

            if (window.lucide) lucide.createIcons();
        };

        const applyVendorFilters = () => {
            const q = vendorSearch ? vendorSearch.value.toLowerCase() : '';
            const statusQ = vendorStatusFilter ? vendorStatusFilter.value : 'all';

            filteredVendors = vendorData.filter(v =>
                (v.vendorName.toLowerCase().includes(q) || v.businessName.toLowerCase().includes(q) || v.email.toLowerCase().includes(q)) &&
                (statusQ === 'all' || v.status === statusQ)
            );
            vCurPage = 1;
            renderVendorTable();
        };

        if (vendorSearch) vendorSearch.addEventListener('input', applyVendorFilters);
        if (vendorStatusFilter) vendorStatusFilter.addEventListener('change', applyVendorFilters);

        if (vPrev) vPrev.addEventListener('click', () => { if (vCurPage > 1) { vCurPage--; renderVendorTable(); } });
        if (vNext) vNext.addEventListener('click', () => { if (vCurPage < Math.ceil(filteredVendors.length / vRowsPage)) { vCurPage++; renderVendorTable(); } });

        if (vendorModalObj) {
            const closeModals = vendorModalObj.querySelectorAll('.notif-close-btn, .action-btn-clean[data-close="modal"]');
            vendorTbody.addEventListener('click', (e) => {
                const reviewBtn = e.target.closest('.review-vendor-btn');
                if (reviewBtn) {
                    const vendor = vendorData.find(v => v.id === reviewBtn.getAttribute('data-id'));
                    if (vendor) {
                        document.getElementById('modalBusinessName').textContent = vendor.businessName;
                        document.getElementById('modalVendorName').textContent = vendor.vendorName;
                        document.getElementById('modalEmail').textContent = vendor.email;
                        document.getElementById('modalPhone').textContent = vendor.phone;
                        const catElem = document.getElementById('modalCategory');
                        if (catElem) {
                            catElem.textContent = vendor.category;
                            catElem.className = `status-badge ${vendor.categoryClass || 'active'}`;
                        }

                        // ── Render real uploaded documents ──────────────
                        const docsContainer = vendorModalObj.querySelector('.vendor-docs-list');
                        if (docsContainer) {
                            const docs = vendor.documents || [];
                            if (docs.length === 0) {
                                docsContainer.innerHTML = `<div style="color:var(--text-muted);font-size:13px;">No documents submitted.</div>`;
                            } else {
                                const iconColors = ['var(--pink)', '#3b82f6', '#10b981'];
                                docsContainer.innerHTML = docs.map((doc, i) => `
                                    <div style="display:flex;align-items:center;justify-content:space-between;background:var(--bg-hover);padding:12px;border-radius:8px;border:1px solid var(--border);">
                                        <div style="display:flex;align-items:center;gap:10px;">
                                            <i data-lucide="file-text" style="color:${iconColors[i%3]};width:18px;"></i>
                                            <span style="font-size:13px;color:var(--text-primary);">${doc.name}</span>
                                        </div>
                                        <span style="font-size:11px;color:var(--text-muted);text-transform:capitalize;">${doc.type}</span>
                                    </div>
                                `).join('');
                            }
                            if (window.lucide) lucide.createIcons();
                        }

                        activeVendorId = vendor.id;
                        vendorModalObj.classList.add('active');
                        document.body.style.overflow = 'hidden';
                    }
                }
            });

            const closeVendorModal = () => { vendorModalObj.classList.remove('active'); document.body.style.overflow = ''; activeVendorId = null; };
            closeModals.forEach(btn => btn.addEventListener('click', closeVendorModal));

            // ── Approve ───────────────────────────────────────────
            document.getElementById('modalApproveBtn')?.addEventListener('click', () => {
                const idx = vendorData.findIndex(v => v.id === activeVendorId);
                if (idx > -1) {
                    vendorData[idx].status = 'approved';
                    persistDecision(vendorData[idx]);
                    sortVendorData(); applyVendorFilters(); closeVendorModal();
                }
            });

            // ── Reject ────────────────────────────────────────────
            document.getElementById('modalRejectBtn')?.addEventListener('click', () => {
                const idx = vendorData.findIndex(v => v.id === activeVendorId);
                if (idx > -1) {
                    vendorData[idx].status = 'rejected';
                    persistDecision(vendorData[idx]);
                    sortVendorData(); applyVendorFilters(); closeVendorModal();
                }
            });

            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('action') === 'review' && vendorData.length > 0) {
                setTimeout(() => { document.querySelector('.review-vendor-btn')?.click(); }, 100);
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }
        renderVendorTable();
    }

    // ── Persist admin decision back to localStorage ──────────
    function persistDecision(vendor) {
        // Update the vendorApplicationsList
        let apps = JSON.parse(localStorage.getItem('eventpro_vendorApplicationsList') || '[]');
        const appIdx = apps.findIndex(a => a.id === vendor.id);
        if (appIdx > -1) {
            apps[appIdx].status = vendor.status;
            localStorage.setItem('eventpro_vendorApplicationsList', JSON.stringify(apps));
        }
        // Also update the single vendorDocSubmission if it matches
        const single = JSON.parse(localStorage.getItem('eventpro_vendorDocSubmission') || 'null');
        if (single && single.id === vendor.id) {
            single.status = vendor.status;
            localStorage.setItem('eventpro_vendorDocSubmission', JSON.stringify(single));
        }
    }


    /* ========================================================
       SECTION 2: MANAGE USERS LOGIC
       ======================================================== */
    const userTbody = document.getElementById('userTableBody');
    if (userTbody) {
        const roles = ["Client", "Vendor", "Staff", "Admin"];
        const statuses = ["active", "pending", "inactive"];
        const names = ["Michael Scott", "Jim Halpert", "Pam Beesly", "Dwight Schrute", "Angela Martin", "Oscar Martinez"];

        let userData = Array.from({ length: 42 }, (_, i) => {
            const id = i + 101;
            const role = roles[i % 4];
            let status = 'active';
            if (i % 7 === 0) status = 'inactive';
            else if (i % 5 === 0) status = 'pending';

            return {
                id: `#${id}`,
                name: `${names[i % 6]} ${i+1}`,
                email: `user${id}@eventpro.com`.toLowerCase(),
                role: role,
                status: status
            };
        });

        let filteredUsers = [...userData];
        let uCurPage = 1;
        const uRowsPage = 10;

        const uSearch = document.getElementById('userSearchInput');
        const roleFilter = document.getElementById('userRoleFilter');
        const statusFilter = document.getElementById('userStatusFilter');
        const uPrev = document.getElementById('userPrevPageBtn');
        const uNext = document.getElementById('userNextPageBtn');
        const uInfo = document.getElementById('userPaginationInfo');

        const updateUserStats = () => {
            let activeClients = 0, activeVendors = 0, activeStaff = 0, pending = 0, inactive = 0;
            userData.forEach(u => {
                if (u.status === 'inactive') inactive++;
                else if (u.status === 'pending') pending++;
                else if (u.status === 'active') {
                    if (u.role === 'Client') activeClients++;
                    else if (u.role === 'Vendor') activeVendors++;
                    else if (u.role === 'Staff' || u.role === 'Admin') activeStaff++; // Including Admin in Staff pool conceptually
                }
            });

            const ec = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
            ec('statActiveClients', activeClients);
            ec('statActiveVendors', activeVendors);
            ec('statActiveStaff', activeStaff);
            ec('statPendingUsers', pending);
            ec('statInactiveUsers', inactive);
        };

        const renderUserTable = () => {
            const MathCeil = Math.ceil(filteredUsers.length / uRowsPage) || 1;
            if (uCurPage > MathCeil) uCurPage = MathCeil;
            if (uCurPage < 1) uCurPage = 1;

            const startIndex = (uCurPage - 1) * uRowsPage;
            const currentObj = filteredUsers.slice(startIndex, startIndex + uRowsPage);

            userTbody.innerHTML = '';
            currentObj.forEach(u => {
                let badge = `<span class="status-badge pending">Pending</span>`;
                if(u.status === 'active') badge = `<span class="status-badge" style="background: rgba(0, 230, 118, 0.15); color: #00e676; font-weight: 600;">Active</span>`;
                if(u.status === 'inactive') badge = `<span class="status-badge" style="background: rgba(255, 77, 77, 0.15); color: #ff4d4d; font-weight: 600;">Inactive</span>`;

                let actionHtml = `
                    <button class="action-btn edit-user-btn" data-uid="${u.id}" style="background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3);"><i data-lucide="edit-3"></i> Edit</button>
                    ${u.status !== 'inactive' 
                        ? `<button class="action-btn reject-btn deactivate-user-btn" data-uid="${u.id}"><i data-lucide="power-off"></i> Disable</button>` 
                        : `<button class="action-btn" style="opacity:0.5; pointer-events:none; border: 1px solid var(--border); color: var(--text-muted);"><i data-lucide="power-off"></i> Disabled</button>`}
                `;

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${u.id}</td>
                    <td class="vendor-name-col">${u.name}</td>
                    <td>${u.email}</td>
                    <td>${u.role}</td>
                    <td>${badge}</td>
                    <td class="actions-cell" style="justify-content: flex-end;">${actionHtml}</td>
                `;
                userTbody.appendChild(tr);
            });

            if (uInfo) uInfo.textContent = `Showing ${filteredUsers.length === 0 ? 0 : startIndex + 1} to ${Math.min(startIndex + uRowsPage, filteredUsers.length)} of ${filteredUsers.length}`;
            if (uPrev) uPrev.disabled = uCurPage === 1;
            if (uNext) uNext.disabled = uCurPage === MathCeil || filteredUsers.length === 0;

            if (window.lucide) lucide.createIcons();
        };

        const applyUserFilters = () => {
            const q = uSearch ? uSearch.value.toLowerCase() : '';
            const rQ = roleFilter ? roleFilter.value : 'all';
            const sQ = statusFilter ? statusFilter.value : 'all';

            filteredUsers = userData.filter(u => 
                (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q)) &&
                (rQ === 'all' || u.role === rQ) &&
                (sQ === 'all' || u.status === sQ)
            );
            uCurPage = 1;
            renderUserTable();
        };

        if (uSearch) uSearch.addEventListener('input', applyUserFilters);
        if (roleFilter) roleFilter.addEventListener('change', applyUserFilters);
        if (statusFilter) statusFilter.addEventListener('change', applyUserFilters);

        if (uPrev) uPrev.addEventListener('click', () => { if (uCurPage > 1) { uCurPage--; renderUserTable(); } });
        if (uNext) uNext.addEventListener('click', () => { if (uCurPage < Math.ceil(filteredUsers.length / uRowsPage)) { uCurPage++; renderUserTable(); } });

        userTbody.addEventListener('click', (e) => {
            const dBtn = e.target.closest('.deactivate-user-btn');
            if (dBtn) {
                const uid = dBtn.getAttribute('data-uid');
                const idx = userData.findIndex(u => u.id === uid);
                if (idx > -1) {
                    userData[idx].status = 'inactive';
                    updateUserStats();
                    applyUserFilters();
                }
            }

            const eBtn = e.target.closest('.edit-user-btn');
            if (eBtn) {
                const uid = eBtn.getAttribute('data-uid');
                const user = userData.find(u => u.id === uid);
                if (user) {
                    document.getElementById('editUserName').value = user.name;
                    document.getElementById('editUserEmail').value = user.email;
                    document.getElementById('editUserRole').value = user.role;
                    activeEditUserId = user.id;
                    
                    const mObj = document.getElementById('userEditModal');
                    if (mObj) {
                        mObj.classList.add('active');
                        document.body.style.overflow = 'hidden';
                    }
                }
            }
        });

        const userModalObj = document.getElementById('userEditModal');
        let activeEditUserId = null;

        if (userModalObj) {
            const closeUserModals = userModalObj.querySelectorAll('[data-close="userModal"]');
            const closeUM = () => { userModalObj.classList.remove('active'); document.body.style.overflow = ''; activeEditUserId = null; };
            closeUserModals.forEach(btn => btn.addEventListener('click', closeUM));
            userModalObj.addEventListener('click', (e) => { if (e.target === userModalObj) closeUM(); });
            
            document.getElementById('saveUserEditBtn')?.addEventListener('click', () => {
                if (activeEditUserId) {
                    const idx = userData.findIndex(u => u.id === activeEditUserId);
                    if (idx > -1) {
                        userData[idx].name = document.getElementById('editUserName').value;
                        userData[idx].email = document.getElementById('editUserEmail').value;
                        const newRole = document.getElementById('editUserRole').value;
                        userData[idx].role = newRole;
                        updateUserStats();
                        applyUserFilters();
                        closeUM();
                    }
                }
            });
        }

        updateUserStats();
        renderUserTable();
    }

    /* ========================================================
       SECTION 3: MONITOR EVENTS LOGIC
       ======================================================== */
    const eventTbody = document.getElementById('eventTableBody');
    if (eventTbody) {
        const eventStatuses = ["Pending", "Staff Assigned", "Resources Allocated", "Completed", "Approved"];
        const clients = ["Michael Scott", "Jim Halpert", "Pam Beesly", "Dwight Schrute", "Angela Martin"];
        const demoVendors = ["Dream Events Ltd.", "Tasteful Catering", "Perfect Moments", "Beats Audio", "Blooms & Co."];
        const evtNames = ["Summer Music Fest", "Tech Conference 2026", "Annual Gala", "Leadership Summit", "Product Launch"];
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        let eventData = Array.from({ length: 45 }, (_, i) => {
            const id = i + 301;
            const rStat = eventStatuses[Math.floor(Math.random() * eventStatuses.length)];
            const rClient = clients[i % 5];
            const rClientId = `C-${1000 + (i % 5)}`;
            const rName = evtNames[i % 5];
            const rDate = `${months[i % 12]} ${Math.floor(Math.random() * 28) + 1}, 2026`;
            const rPrice = "$" + (Math.floor(Math.random() * 50) + 10) * 100;
            
            const vCount = Math.floor(Math.random() * 3) + 1;
            const vList = [];
            for (let j=0; j<vCount; j++) {
                vList.push(demoVendors[(i + j) % demoVendors.length]);
            }

            return {
                id: `EVT-${id}`,
                name: `${rName} ${id}`,
                clientName: rClient,
                clientId: rClientId,
                date: rDate,
                status: rStat,
                price: rPrice,
                vendors: vList
            };
        });

        const sortEventData = () => {
            eventData.sort((a,b) => {
                if (a.status === 'Pending' && b.status !== 'Pending') return -1;
                if (a.status !== 'Pending' && b.status === 'Pending') return 1;
                return parseInt(a.id.replace('EVT-', '')) - parseInt(b.id.replace('EVT-', ''));
            });
        };
        sortEventData();

        let filteredEvts = [...eventData];
        let eCurPage = 1;
        const eRowsPage = 10;

        const eSearch = document.getElementById('eventSearchInput');
        const eStatusFilter = document.getElementById('eventStatusFilter');
        const ePrev = document.getElementById('eventPrevPageBtn');
        const eNext = document.getElementById('eventNextPageBtn');
        const eInfo = document.getElementById('eventPaginationInfo');

        const updateEventStats = () => {
            const counts = {"Pending":0, "Staff Assigned":0, "Resources Allocated":0, "Completed":0, "Approved":0};
            eventData.forEach(e => { if(counts[e.status] !== undefined) counts[e.status]++; });
            
            const ec = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
            ec('statEvtPending', counts['Pending']);
            ec('statEvtStaff', counts['Staff Assigned']);
            ec('statEvtRes', counts['Resources Allocated']);
            ec('statEvtCompleted', counts['Completed']);
            ec('statEvtApproved', counts['Approved']);
        };

        const renderEventTable = () => {
            const MathCeil = Math.ceil(filteredEvts.length / eRowsPage) || 1;
            if (eCurPage > MathCeil) eCurPage = MathCeil;
            if (eCurPage < 1) eCurPage = 1;

            const startIndex = (eCurPage - 1) * eRowsPage;
            const currentObj = filteredEvts.slice(startIndex, startIndex + eRowsPage);

            eventTbody.innerHTML = '';
            currentObj.forEach(ev => {
                let badgeStyle = `background: rgba(255,255,255,0.1); color: #fff; font-weight:500; border: 1px solid var(--border);`;
                
                if(ev.status === 'Pending') badgeStyle = `background: rgba(245, 158, 11, 0.15); color: #f59e0b; font-weight:600;`;
                if(ev.status === 'Staff Assigned') badgeStyle = `background: rgba(59, 130, 246, 0.15); color: #3b82f6; font-weight:600;`;
                if(ev.status === 'Resources Allocated') badgeStyle = `background: rgba(139, 92, 246, 0.15); color: #8b5cf6; font-weight:600;`;
                if(ev.status === 'Completed') badgeStyle = `background: rgba(0, 230, 118, 0.15); color: #00e676; font-weight:600;`;
                if(ev.status === 'Approved') badgeStyle = `background: rgba(255, 255, 255, 0.15); color: #fff; font-weight:600;`;
                if(ev.status === 'Refunded') badgeStyle = `background: rgba(255, 77, 77, 0.15); color: #ff4d4d; font-weight:600;`;

                const badge = `<span class="status-badge" style="${badgeStyle}">${ev.status}</span>`;

                let actionHtml = `
                    <button class="action-btn action-btn-clean view-event-btn" data-eid="${ev.id}"><i data-lucide="eye"></i> View</button>
                    ${ev.status === 'Pending' 
                        ? `<button class="action-btn edit-event-btn" data-eid="${ev.id}" style="background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3);"><i data-lucide="check-square"></i> Approve</button>`
                        : ev.status === 'Approved'
                        ? `<button class="action-btn refund-event-btn" data-eid="${ev.id}" style="background-color: #ef4444; color: #fff; border: 1px solid #dc2626;"><i data-lucide="refresh-ccw"></i> Refund</button>`
                        : ev.status === 'Refunded'
                        ? `<button class="action-btn" style="opacity: 0.5; pointer-events: none; border: 1px solid var(--border); color: var(--text-muted);"><i data-lucide="refresh-ccw"></i> Refunded</button>`
                        : `<button class="action-btn" style="opacity:0.5; pointer-events:none;"><i data-lucide="check-square"></i> Managed</button>`}
                `;

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${ev.id}</td>
                    <td class="vendor-name-col">${ev.name}</td>
                    <td><div style="font-weight: 500;">${ev.clientName}</div><div style="font-size: 11px; color: var(--text-muted);">${ev.clientId}</div></td>
                    <td>${ev.date}</td>
                    <td>${badge}</td>
                    <td class="actions-cell">${actionHtml}</td>
                `;
                eventTbody.appendChild(tr);
            });

            if (eInfo) eInfo.textContent = `Showing ${filteredEvts.length === 0 ? 0 : startIndex + 1} to ${Math.min(startIndex + eRowsPage, filteredEvts.length)} of ${filteredEvts.length}`;
            if (ePrev) ePrev.disabled = eCurPage === 1;
            if (eNext) eNext.disabled = eCurPage === MathCeil || filteredEvts.length === 0;

            if (window.lucide) lucide.createIcons();
        };

        const applyEventFilters = () => {
            const q = eSearch ? eSearch.value.toLowerCase() : '';
            const sQ = eStatusFilter ? eStatusFilter.value : 'all';

            filteredEvts = eventData.filter(e => 
                (e.name.toLowerCase().includes(q) || e.clientName.toLowerCase().includes(q) || e.clientId.toLowerCase().includes(q) || e.id.toLowerCase().includes(q)) &&
                (sQ === 'all' || e.status === sQ)
            );
            eCurPage = 1;
            renderEventTable();
        };

        if (eSearch) eSearch.addEventListener('input', applyEventFilters);
        if (eStatusFilter) eStatusFilter.addEventListener('change', applyEventFilters);

        if (ePrev) ePrev.addEventListener('click', () => { if (eCurPage > 1) { eCurPage--; renderEventTable(); } });
        if (eNext) eNext.addEventListener('click', () => { if (eCurPage < Math.ceil(filteredEvts.length / eRowsPage)) { eCurPage++; renderEventTable(); } });

        // Add dummy logic for 'Approve' to progress status
        eventTbody.addEventListener('click', (e) => {
            const aprBtn = e.target.closest('.edit-event-btn');
            if (aprBtn) {
                const eid = aprBtn.getAttribute('data-eid');
                const idx = eventData.findIndex(ev => ev.id === eid);
                if (idx > -1) {
                    eventData[idx].status = 'Approved';
                    sortEventData();
                    updateEventStats();
                    applyEventFilters();
                }
            }

            const refBtn = e.target.closest('.refund-event-btn');
            if (refBtn) {
                const eid = refBtn.getAttribute('data-eid');
                const idx = eventData.findIndex(ev => ev.id === eid);
                if (idx > -1) {
                    eventData[idx].status = 'Refunded';
                    sortEventData();
                    updateEventStats();
                    applyEventFilters();
                }
            }

            const viewBtn = e.target.closest('.view-event-btn');
            if (viewBtn) {
                const eid = viewBtn.getAttribute('data-eid');
                const ev = eventData.find(e => e.id === eid);
                if (ev) {
                    document.getElementById('viewEventName').textContent = ev.name;
                    document.getElementById('viewEventClient').textContent = ev.clientName + ' (' + ev.clientId + ')';
                    document.getElementById('viewEventDate').textContent = ev.date;
                    document.getElementById('viewEventPrice').textContent = ev.price;
                    
                    const vendorsContainer = document.getElementById('viewEventVendors');
                    vendorsContainer.innerHTML = '';
                    ev.vendors.forEach(v => {
                        const div = document.createElement('div');
                        div.style.color = '#fff';
                        div.style.fontSize = '13px';
                        div.innerHTML = `<i data-lucide="check-circle" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; margin-right: 6px; color: #3b82f6;"></i> <span style="vertical-align: middle;">${v}</span>`;
                        vendorsContainer.appendChild(div);
                    });
                    if (window.lucide) lucide.createIcons();
                    
                    document.getElementById('eventViewModal').classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
            }
        });

        const evModal = document.getElementById('eventViewModal');
        if (evModal) {
            const closeEvtModals = evModal.querySelectorAll('[data-close="eventViewModal"]');
            const closeEM = () => { evModal.classList.remove('active'); document.body.style.overflow = ''; };
            closeEvtModals.forEach(btn => btn.addEventListener('click', closeEM));
            evModal.addEventListener('click', (e) => { if (e.target === evModal) closeEM(); });
        }

        updateEventStats();
        renderEventTable();
    }
});
