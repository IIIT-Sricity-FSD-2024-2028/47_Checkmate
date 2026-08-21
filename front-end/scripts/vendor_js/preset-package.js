/* ═══════════════════════════════════════════
   preset-package.js  —  Preset Package Page
   • Renders package cards from DB
   • Category tab filter + search
   • Add / Edit (modal) with tag inputs + validation
   • Delete with confirm
   • View package details
═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  let editingId = null;
  let activeFilters = { price: 'All', capacity: 'All' };

  /* ── Inject Add/Edit modal ──────────── */
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay" id="pkgModalOverlay">
      <div class="modal" style="width:min(600px,96vw)">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px 16px;border-bottom:1px solid var(--border)">
          <h3 id="pkgModalTitle" style="font-family:var(--font-display);font-size:17px;font-weight:700;color:var(--text-primary)">Add Package</h3>
          <button id="pkgModalClose" style="width:32px;height:32px;border-radius:8px;border:1px solid var(--border);background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text-secondary);font-size:16px">✕</button>
        </div>
        <div style="padding:24px;display:flex;flex-direction:column;gap:14px;max-height:65vh;overflow-y:auto">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
            <div style="display:flex;flex-direction:column;gap:6px;grid-column:1/-1">
              <label style="font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.4px">Package Name *</label>
              <input id="pkgName" class="ri-input" type="text" placeholder="e.g. Elegant Wedding Package" />
              <span id="pkgNameErr" style="font-size:11.5px;color:var(--red);display:none">Package name is required.</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px">
              <label style="font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.4px">Category *</label>
              <div class="ri-select-wrap">
                <select id="pkgCategory" class="ri-select">
                  <option value="">Select category</option>
                  <option>Wedding</option>
                  <option>Birthday</option>
                  <option>Conference</option>
                  <option>Corporate</option>
                </select>
              </div>
              <span id="pkgCatErr" style="font-size:11.5px;color:var(--red);display:none">Category is required.</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px">
              <label style="font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.4px">Price ($) *</label>
              <input id="pkgPrice" class="ri-input" type="number" min="0" placeholder="e.g. 4500" />
              <span id="pkgPriceErr" style="font-size:11.5px;color:var(--red);display:none">Enter a valid price.</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px">
              <label style="font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.4px">Duration (hrs) *</label>
              <input id="pkgDuration" class="ri-input" type="number" min="1" placeholder="e.g. 8" />
              <span id="pkgDurErr" style="font-size:11.5px;color:var(--red);display:none">Enter a valid duration.</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px">
              <label style="font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.4px">Guest Capacity</label>
              <input id="pkgCapacity" class="ri-input" type="text" placeholder="e.g. 100–300" />
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;grid-column:1/-1">
              <label style="font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.4px">Description *</label>
              <textarea id="pkgDesc" class="ri-input" rows="3" placeholder="Describe what this package includes…" style="resize:vertical;min-height:80px"></textarea>
              <span id="pkgDescErr" style="font-size:11.5px;color:var(--red);display:none">Description is required.</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;grid-column:1/-1">
              <label style="font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.4px">Included Resources <span style="color:var(--text-muted);font-weight:400;text-transform:none;letter-spacing:0">(available only)</span></label>
              <div id="resButtonGrid" style="display:flex;flex-wrap:wrap;gap:7px;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 12px;min-height:52px"></div>
              <div id="resTagWrap" style="display:none"></div>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;grid-column:1/-1">
              <label style="font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.4px">Required Staff <span style="color:var(--text-muted);font-weight:400;text-transform:none;letter-spacing:0">(available only)</span></label>
              <div id="staffButtonGrid" style="display:flex;flex-wrap:wrap;gap:7px;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 12px;min-height:52px"></div>
              <div id="staffTagWrap" style="display:none"></div>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;padding:16px 24px;border-top:1px solid var(--border)">
          <button id="pkgCancelBtn" class="ri-cancel">Cancel</button>
          <button id="pkgSaveBtn" class="ri-submit" style="flex:unset;padding:12px 28px">Save Package</button>
        </div>
      </div>
    </div>`);

  /* tag chip CSS */
  if (!document.getElementById('_tagChipCSS')) {
    const s = document.createElement('style');
    s.id = '_tagChipCSS';
    s.textContent = `
      .tag-chip {
        display:inline-flex;align-items:center;gap:5px;
        background:rgba(233,30,140,0.15);color:#f472b6;
        border:1px solid rgba(233,30,140,0.25);
        border-radius:20px;padding:3px 10px;font-size:12px;font-weight:500;
      }
      .tag-chip button {
        background:none;border:none;color:inherit;cursor:pointer;
        font-size:14px;line-height:1;padding:0;
      }
    `;
    document.head.appendChild(s);
  }

  lucide.createIcons();

  const overlay = document.getElementById('pkgModalOverlay');
  wireModalClose(overlay, document.getElementById('pkgModalClose'), document.getElementById('pkgCancelBtn'));


  function getChips(wrapId) {
    return [...document.querySelectorAll(`#${wrapId} .tag-chip`)]
      .map(c => c.dataset.label || c.textContent.replace('×', '').trim());
  }

  function setChips(wrapId, inputId, items, color) {
    const wrap = document.getElementById(wrapId);
    if (!wrap) return;
    wrap.querySelectorAll('.tag-chip').forEach(c => c.remove());
    const isRes  = wrapId === 'resTagWrap';
    const dbItems = isRes ? DB.getMyResources() : DB.getMyStaff();
    items.forEach(item => {
      const match = isRes
        ? dbItems.find(r => r.name === item || r.id === item)
        : dbItems.find(s => s.name === item || (s.name + ' – ' + s.role) === item || s.id === item);
      if (match) {
        const label = isRes ? match.name : (match.name + ' – ' + match.role);
        addPickerChip(wrapId, match.id, label, color || (isRes ? 'blue' : 'green'));
      } else {
        // Legacy fallback — store raw string as chip in hidden wrap
        const chip = document.createElement('span');
        chip.className = 'tag-chip';
        chip.dataset.id = item;
        chip.dataset.label = item;
        wrap.appendChild(chip);
      }
    });
    refreshButtonGrid();
  }

  /* ── Button-grid Picker ─────────────── */

  function getAvailableResources() {
    return (DB.getMyResources() || []).filter(r => r.available === true);
  }

  function getAvailableStaff() {
    return (DB.getMyStaff() || []).filter(s => s.status === 'available');
  }

  function getSelectedIds(wrapId) {
    return [...document.querySelectorAll(`#${wrapId} .tag-chip`)].map(c => c.dataset.id);
  }

  /* ── Unified toggle grid ──────────────
     Each item renders as:
       • "+ Label"  button  → unselected (click to select)
       • "Label ×"  chip    → selected   (click × to deselect)
     Both live inside the same visible grid div.
  ── */

  // Hidden tagWraps are used only for getChips() / setChips() data bookkeeping
  function addPickerChip(wrapId, id, label, color) {
    // Write into the hidden wrap for data reading by getChips()
    const wrap = document.getElementById(wrapId);
    if (!wrap) return;
    if (getSelectedIds(wrapId).includes(String(id))) return;
    const chip = document.createElement('span');
    chip.className = 'tag-chip';
    chip.dataset.id = String(id);
    chip.dataset.label = label;
    wrap.appendChild(chip);
  }

  function refreshButtonGrid() {
    renderUnifiedGrid('resButtonGrid',   'resTagWrap',   getAvailableResources(),
      r => ({ id: r.id, label: r.name,                    meta: r.category }),
      'blue');
    renderUnifiedGrid('staffButtonGrid', 'staffTagWrap', getAvailableStaff(),
      s => ({ id: s.id, label: s.name + ' – ' + s.role,   meta: 'Workload ' + s.workload + '%' }),
      'green');
  }

  function renderUnifiedGrid(gridId, wrapId, items, mapper, color) {
    const grid = document.getElementById(gridId);
    if (!grid) return;

    const selectedIds = getSelectedIds(wrapId);

    if (!items.length) {
      grid.innerHTML = '<span style="font-size:12px;color:var(--text-muted)">No available entries found.</span>';
      return;
    }

    grid.innerHTML = '';

    items.forEach(item => {
      const mapped    = mapper(item);
      const isSelected = selectedIds.includes(String(mapped.id));

      const el = document.createElement('button');
      el.type  = 'button';
      el.title = mapped.meta || '';

      if (isSelected) {
        // ── Selected chip style ──
        el.style.cssText = color === 'blue'
          ? 'display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:20px;border:1px solid rgba(59,130,246,0.6);background:rgba(59,130,246,0.25);color:#93c5fd;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font-body)'
          : 'display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:20px;border:1px solid rgba(34,197,94,0.6);background:rgba(34,197,94,0.22);color:#22c55e;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font-body)';
        el.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
          + mapped.label +
          '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.7"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        el.addEventListener('click', () => {
          // Deselect: remove from hidden wrap
          const wrap = document.getElementById(wrapId);
          const chip = wrap ? wrap.querySelector(`.tag-chip[data-id="${mapped.id}"]`) : null;
          if (chip) chip.remove();
          refreshButtonGrid();
        });
      } else {
        // ── Unselected button style ──
        el.style.cssText = color === 'blue'
          ? 'display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;border:1px solid rgba(59,130,246,0.3);background:rgba(59,130,246,0.07);color:#93c5fd;font-size:12px;font-weight:500;cursor:pointer;font-family:var(--font-body)'
          : 'display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;border:1px solid rgba(34,197,94,0.25);background:rgba(34,197,94,0.06);color:#22c55e;font-size:12px;font-weight:500;cursor:pointer;font-family:var(--font-body)';
        el.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>'
          + mapped.label;
        el.addEventListener('click', () => {
          addPickerChip(wrapId, mapped.id, mapped.label, color);
          refreshButtonGrid();
        });
      }

      grid.appendChild(el);
    });
  }

  /* Initial render — called after modal opens */
  function initButtonGrids() { refreshButtonGrid(); }

  /* ── Error helpers ──────────────────── */
  function showErr(id, show) {
    const el = document.getElementById(id);
    if (el) el.style.display = show ? 'block' : 'none';
  }
  function markField(inputId, hasErr) {
    const el = document.getElementById(inputId);
    if (el) el.style.borderColor = hasErr ? 'rgba(239,68,68,0.6)' : '';
  }
  function clearErrors() {
    ['pkgNameErr','pkgCatErr','pkgPriceErr','pkgDurErr','pkgDescErr'].forEach(id => showErr(id, false));
    ['pkgName','pkgCategory','pkgPrice','pkgDuration','pkgDesc'].forEach(id => markField(id, false));
  }

  /* ── Validate ───────────────────────── */
  function validate() {
    let valid = true;
    const name = document.getElementById('pkgName').value.trim();
    const cat  = document.getElementById('pkgCategory').value;
    const price = document.getElementById('pkgPrice').value;
    const dur   = document.getElementById('pkgDuration').value;
    const desc  = document.getElementById('pkgDesc').value.trim();

    if (!name)                            { showErr('pkgNameErr',  true); markField('pkgName',     true); valid = false; }
    if (!cat)                             { showErr('pkgCatErr',   true); markField('pkgCategory', true); valid = false; }
    if (!price || isNaN(+price) || +price < 0) { showErr('pkgPriceErr', true); markField('pkgPrice', true); valid = false; }
    if (!dur   || isNaN(+dur)  || +dur   < 1)  { showErr('pkgDurErr',   true); markField('pkgDuration', true); valid = false; }
    if (!desc)                            { showErr('pkgDescErr',  true); markField('pkgDesc',     true); valid = false; }
    return valid;
  }

  /* ── Category color map ─────────────── */
  const CAT_COLORS = {
    Wedding:   { bg:'rgba(233,30,140,0.15)',  color:'#f472b6', border:'rgba(233,30,140,0.25)',  emoji:'💍', placeholder:'--wedding'    },
    Birthday:  { bg:'rgba(249,115,22,0.15)',  color:'#fdba74', border:'rgba(249,115,22,0.25)',  emoji:'🎂', placeholder:'--birthday'   },
    Conference:{ bg:'rgba(59,130,246,0.15)',  color:'#93c5fd', border:'rgba(59,130,246,0.25)',  emoji:'🎤', placeholder:'--conference' },
    Corporate: { bg:'rgba(168,85,247,0.15)',  color:'#d8b4fe', border:'rgba(168,85,247,0.25)',  emoji:'🏢', placeholder:'--corporate'  },
  };

  /* ── Render cards ───────────────────── */
  function render() {
    const grid = document.querySelector('.pp-grid');
    if (!grid) return;

    const query   = (document.getElementById('pkgSearch')?.value || '').trim().toLowerCase();
    const activeCat = document.querySelector('.pp-tab.active')?.dataset?.cat || 'all';
    const packages  = DB.getMyPackages();

    const filtered = packages.filter(p => {
      const matchCat = activeCat === 'all' || p.category === activeCat;
      const matchQ   = !query || p.name.toLowerCase().includes(query) || p.desc.toLowerCase().includes(query);
      
      let matchPrice = true;
      if (activeFilters.price === 'Under2k') matchPrice = p.price < 2000;
      else if (activeFilters.price === '2kTo5k') matchPrice = p.price >= 2000 && p.price <= 5000;
      else if (activeFilters.price === 'Over5k') matchPrice = p.price > 5000;
      
      let matchCap = true;
      if (activeFilters.capacity !== 'All') {
        const capStr = String(p.capacity || '');
        const maxCapMatch = capStr.match(/\d+/g);
        const maxCap = maxCapMatch ? Math.max(...maxCapMatch.map(Number)) : 0;
        
        if (activeFilters.capacity === 'Small') matchCap = maxCap < 100;
        else if (activeFilters.capacity === 'Medium') matchCap = maxCap >= 100 && maxCap <= 300;
        else if (activeFilters.capacity === 'Large') matchCap = maxCap > 300;
      }

      return matchCat && matchQ && matchPrice && matchCap;
    });

    const infoEl = document.getElementById('resultInfo');
    if (infoEl) infoEl.textContent = `${filtered.length} package${filtered.length !== 1 ? 's' : ''} found`;

    if (!filtered.length) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text-muted)">No packages found.</div>`;
      return;
    }

    grid.innerHTML = filtered.map(p => {
      const c = CAT_COLORS[p.category] || CAT_COLORS.Corporate;
      const resTags = (p.resources || []).map(r =>
        `<span style="background:rgba(59,130,246,0.1);color:#93c5fd;border:1px solid rgba(59,130,246,0.2);border-radius:20px;padding:3px 10px;font-size:11.5px;font-weight:500">${r}</span>`
      ).join('');
      const staffTags = (p.staff || []).map(s =>
        `<span style="background:rgba(34,197,94,0.1);color:var(--green);border:1px solid rgba(34,197,94,0.2);border-radius:20px;padding:3px 10px;font-size:11.5px;font-weight:500">${s}</span>`
      ).join('');

      return `
        <div class="pkg-card" data-cat="${p.category}" data-id="${p.id}">
          <div class="pkg-img-placeholder pkg-img-placeholder--${p.category.toLowerCase()}" style="font-size:36px">${c.emoji}</div>
          <div class="pkg-body">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px">
              <div class="pkg-title">${p.name}</div>
              <div style="display:flex;gap:6px;">
                  ${p.status ? statusBadge(p.status) : ''}
                  <span style="background:${c.bg};color:${c.color};border:1px solid ${c.border};border-radius:20px;padding:3px 12px;font-size:11.5px;font-weight:600;white-space:nowrap">${p.category}</span>
              </div>
            </div>
            <p class="pkg-desc">${p.desc}</p>
            <div>
              <div class="pkg-section-label">Included Resources</div>
              <div class="pkg-tags">${resTags || '<span style="color:var(--text-muted);font-size:12px">None listed</span>'}</div>
            </div>
            <div>
              <div class="pkg-section-label">Required Staff</div>
              <div class="pkg-tags">${staffTags || '<span style="color:var(--text-muted);font-size:12px">None listed</span>'}</div>
            </div>
          </div>
          <div style="padding:16px 18px 18px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;border-top:1px solid var(--border);margin-top:12px">
            <div style="text-align:center">
              <div style="font-size:11px;color:var(--text-muted);margin-bottom:2px">Price</div>
              <div style="font-family:var(--font-display);font-size:17px;font-weight:700;color:var(--pink)">$${p.price.toLocaleString()}</div>
            </div>
            <div style="text-align:center">
              <div style="font-size:11px;color:var(--text-muted);margin-bottom:2px">Duration</div>
              <div style="font-family:var(--font-display);font-size:17px;font-weight:700">${p.duration}h</div>
            </div>
            <div style="text-align:center">
              <div style="font-size:11px;color:var(--text-muted);margin-bottom:2px">Capacity</div>
              <div style="font-family:var(--font-display);font-size:14px;font-weight:700">${p.capacity}</div>
            </div>
          </div>
          <div style="padding:0 18px 18px;display:flex;gap:8px">
            <button class="pkg-action-btn" data-action="edit"   data-id="${p.id}" style="flex:1;padding:9px;background:rgba(34,197,94,0.12);color:var(--green);border:1px solid rgba(34,197,94,0.2);border-radius:var(--radius-sm);font-family:var(--font-body);font-size:13px;font-weight:500;cursor:pointer">Edit</button>
            <button class="pkg-action-btn" data-action="delete" data-id="${p.id}" style="flex:1;padding:9px;background:rgba(239,68,68,0.12);color:var(--red);border:1px solid rgba(239,68,68,0.2);border-radius:var(--radius-sm);font-family:var(--font-body);font-size:13px;font-weight:500;cursor:pointer">Delete</button>
          </div>
        </div>`;
    }).join('');

    attachCardActions();
  }

  /* ── Card actions ───────────────────── */
  function attachCardActions() {
    document.querySelectorAll('.pkg-action-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const { action, id } = btn.dataset;
        if (action === 'edit')   editPackage(id);
        if (action === 'delete') deletePackage(id);
      });
    });
  }

  function editPackage(id) {
    const p = DB.find('packages', id);
    if (!p) return;
    editingId = id;
    document.getElementById('pkgModalTitle').textContent = 'Edit Package';
    document.getElementById('pkgName').value     = p.name;
    document.getElementById('pkgCategory').value = p.category;
    document.getElementById('pkgPrice').value    = p.price;
    document.getElementById('pkgDuration').value = p.duration;
    document.getElementById('pkgCapacity').value = p.capacity;
    document.getElementById('pkgDesc').value     = p.desc;
    setChips('resTagWrap',   null, p.resources || []);
    setChips('staffTagWrap', null, p.staff     || []);
    clearErrors();
    openModal(overlay);
    setTimeout(initButtonGrids, 0);
  }

  async function deletePackage(id) {
    const p = DB.find('packages', id);
    if (!p) return;
    const ok = await Confirm.ask({ title:'Delete Package?', msg:`"${p.name}" will be permanently removed.` });
    if (!ok) return;
    DB.remove('packages', id);
    render();
    Toast.show('Package deleted.', 'error');
  }

  /* ── Save ───────────────────────────── */
  document.getElementById('pkgSaveBtn').addEventListener('click', () => {
    if (!validate()) { Toast.show('Please fix the errors above.', 'warn'); return; }

    const session = DB.getSession();
    const data = {
      name:      document.getElementById('pkgName').value.trim(),
      category:  document.getElementById('pkgCategory').value,
      price:     parseFloat(document.getElementById('pkgPrice').value),
      duration:  parseInt(document.getElementById('pkgDuration').value, 10),
      capacity:  document.getElementById('pkgCapacity').value.trim() || '—',
      desc:      document.getElementById('pkgDesc').value.trim(),
      resources: getChips('resTagWrap'),
      staff:     getChips('staffTagWrap'),
      vendorName: session.user,
      vendorId:   session.email, // using email as ID since that's what's available
      status:     'pending'
    };

    if (editingId) {
      DB.update('packages', editingId, data);
      Toast.show('Package updated! Waiting for approval.', 'info');
    } else {
      DB.add('packages', { id: uid('P'), ...data });
      Toast.show('Package submitted for approval!', 'success');
    }

    closeModal(overlay);
    editingId = null;
    render();
  });

  /* ── "Add Package" open button ──────── */
  const openBtn = document.getElementById('openAddModal');
  openBtn?.addEventListener('click', () => {
    editingId = null;
    document.getElementById('pkgModalTitle').textContent = 'Add Package';
    ['pkgName','pkgPrice','pkgDuration','pkgCapacity','pkgDesc'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('pkgCategory').value = '';
    setChips('resTagWrap',   null, []);
    setChips('staffTagWrap', null, []);
    clearErrors();
    openModal(overlay);
    setTimeout(initButtonGrids, 0);
  });

  /* Close existing modal button wiring for old HTML modal */
  const oldClose  = document.getElementById('closeModal');
  const oldCancel = document.getElementById('cancelModal');
  const oldOverlay = document.getElementById('modalOverlay');
  if (oldOverlay) {
    oldClose?.addEventListener('click',  () => oldOverlay.classList.remove('open'));
    oldCancel?.addEventListener('click', () => oldOverlay.classList.remove('open'));
    oldOverlay.addEventListener('click', e => { if (e.target === oldOverlay) oldOverlay.classList.remove('open'); });
    /* Wire old "Save Package" button to new DB save */
    oldOverlay.querySelector('.btn-primary')?.addEventListener('click', () => {
      oldOverlay.classList.remove('open');
      Toast.show('Package saved!', 'success');
      render();
    });
  }

  /* ── Search & Filters ─────────────────────────── */
  document.getElementById('pkgSearch')?.addEventListener('input', render);

  document.querySelector('.pp-search i')?.addEventListener('click', () => {
    document.getElementById('pkgSearch')?.focus();
  });

  const pkgFilterBtn = document.querySelector('.pp-filter-btn');
  const pkgFilterDropdown = document.getElementById('pkgFilterDropdown');
  const applyPkgFiltersBtn = document.getElementById('applyPkgFilters');

  if (pkgFilterBtn && pkgFilterDropdown) {
    pkgFilterBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isShowing = pkgFilterDropdown.style.display === 'block';
      pkgFilterDropdown.style.display = isShowing ? 'none' : 'block';
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#pkgFilterWrapper')) {
        pkgFilterDropdown.style.display = 'none';
      }
    });

    applyPkgFiltersBtn?.addEventListener('click', () => {
      activeFilters.price = document.getElementById('filterPkgPrice').value;
      activeFilters.capacity = document.getElementById('filterPkgCapacity').value;
      
      pkgFilterDropdown.style.display = 'none';
      render();
      Toast.show('Filters applied!', 'success');
    });
  }

  /* ── Category tabs ──────────────────── */
  document.querySelectorAll('.pp-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.pp-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      render();
    });
  });

  initTopbarSearch(() => render());

  render();
});