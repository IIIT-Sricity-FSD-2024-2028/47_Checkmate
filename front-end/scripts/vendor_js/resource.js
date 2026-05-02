/* ═══════════════════════════════════════════
   resource.js  —  Manage Resource Page
   • Render table from DB
   • Search filter
   • Add / Edit (modal) with full validation
   • Delete with confirm
   • Allocate resource to an approved event (2-phase modal)
═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  let searchQuery = '';
  let editingId   = null;

  /* ── Inject Add/Edit modal HTML ──────────────── */
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay" id="resModalOverlay">
      <div class="modal" style="width:min(500px,94vw)">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px 16px;border-bottom:1px solid var(--border)">
          <h3 id="resModalTitle" style="font-family:var(--font-display);font-size:17px;font-weight:700;color:var(--text-primary)">Add Resource</h3>
          <button id="resModalClose" style="width:32px;height:32px;border-radius:8px;border:1px solid var(--border);background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text-secondary);font-size:16px">✕</button>
        </div>
        <div style="padding:24px;display:flex;flex-direction:column;gap:16px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
            <div style="display:flex;flex-direction:column;gap:6px;grid-column:1/-1">
              <label style="font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.4px">Resource Name *</label>
              <input id="resName" class="ri-input" type="text" placeholder="e.g. Audio System Premium" />
              <span id="resNameErr" style="font-size:11.5px;color:var(--red);display:none">Name is required.</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px">
              <label style="font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.4px">Category *</label>
              <div class="ri-select-wrap">
                <select id="resCategory" class="ri-select">
                  <option value="">Select category</option>
                  <option>Equipment</option>
                  <option>Furniture</option>
                  <option>Decor</option>
                </select>
              </div>
              <span id="resCatErr" style="font-size:11.5px;color:var(--red);display:none">Category is required.</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px">
              <label style="font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.4px">Quantity *</label>
              <input id="resQuantity" class="ri-input" type="number" min="0" placeholder="e.g. 12" />
              <span id="resQtyErr" style="font-size:11.5px;color:var(--red);display:none">Enter a valid quantity.</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px">
              <label style="font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.4px">Price ($/day) *</label>
              <input id="resPrice" class="ri-input" type="number" min="0" placeholder="e.g. 500" />
              <span id="resPriceErr" style="font-size:11.5px;color:var(--red);display:none">Enter a valid price.</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px">
              <label style="font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.4px">Availability</label>
              <div class="ri-select-wrap">
                <select id="resAvail" class="ri-select">
                  <option value="true">Available</option>
                  <option value="false">Unavailable</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;padding:16px 24px;border-top:1px solid var(--border)">
          <button id="resCancelBtn" class="ri-cancel">Cancel</button>
          <button id="resSaveBtn" class="ri-submit" style="flex:unset;padding:12px 28px">Save Resource</button>
        </div>
      </div>
    </div>`);

  /* ── Inject Allocate modal HTML ──────────────── */
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay" id="allocModalOverlay">
      <div class="modal" style="width:min(520px,95vw)">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px 16px;border-bottom:1px solid var(--border)">
          <h3 id="allocModalTitle" style="font-family:var(--font-display);font-size:17px;font-weight:700;color:var(--text-primary)">Allocate Resource</h3>
          <button id="allocModalClose" style="width:32px;height:32px;border-radius:8px;border:1px solid var(--border);background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text-secondary);font-size:16px">✕</button>
        </div>

        <!-- Resource info bar -->
        <div id="allocResInfo" style="display:flex;align-items:center;gap:12px;padding:14px 24px;background:rgba(126,34,206,0.08);border-bottom:1px solid var(--border)">
          <div style="width:38px;height:38px;border-radius:10px;background:rgba(126,34,206,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <i data-lucide="box-select" style="width:18px;height:18px;color:#d8b4fe"></i>
          </div>
          <div>
            <div id="allocResName" style="font-size:14px;font-weight:700;color:var(--text-primary)">Resource Name</div>
            <div id="allocResMeta" style="font-size:12px;color:var(--text-muted)">Category · 0 units available</div>
          </div>
        </div>

        <!-- Phase 1: Event picker -->
        <div id="allocPhase1" style="padding:24px;display:flex;flex-direction:column;gap:16px">
          <div style="font-size:13.5px;color:var(--text-secondary);margin-bottom:4px">Select the event to allocate this resource to:</div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.4px">Approved Event *</label>
            <div class="ri-select-wrap">
              <select id="allocEventSelect" class="ri-select">
                <option value="">Choose an event…</option>
              </select>
            </div>
            <span id="allocEventErr" style="font-size:11.5px;color:var(--red);display:none">Please select an event.</span>
          </div>
          <!-- Event info panel (shown after selection) -->
          <div id="allocEventInfo" style="display:none;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px 16px;display:none;flex-direction:column;gap:8px">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:12px;color:var(--text-muted)">Venue</span>
              <span id="allocInfoVenue" style="font-size:13px;color:var(--text-primary);font-weight:500">—</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:12px;color:var(--text-muted)">Date</span>
              <span id="allocInfoDate" style="font-size:13px;color:var(--text-primary);font-weight:500">—</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:12px;color:var(--text-muted)">Participants</span>
              <span id="allocInfoPeople" style="font-size:16px;font-weight:700;color:var(--purple)">—</span>
            </div>
          </div>
          <div id="allocNoEventsMsg" style="display:none;padding:18px;background:rgba(59,130,246,0.07);border:1px solid rgba(59,130,246,0.2);border-radius:var(--radius-sm);font-size:13px;color:var(--blue);text-align:center">
            <i data-lucide="info" style="width:15px;height:15px;vertical-align:middle;margin-right:6px"></i>
            No approved events available to allocate resources to.
          </div>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;padding:16px 24px;border-top:1px solid var(--border)" id="allocPhase1Footer">
          <button id="allocCancelBtn1" class="ri-cancel">Cancel</button>
          <button id="allocNextBtn" class="ri-submit" style="flex:unset;padding:12px 28px">
            Next <i data-lucide="arrow-right" style="width:15px;height:15px;vertical-align:middle;margin-left:4px"></i>
          </button>
        </div>

        <!-- Phase 2: Quantity input -->
        <div id="allocPhase2" style="padding:24px;display:none;flex-direction:column;gap:16px">
          <!-- Selected event summary pill -->
          <div id="allocSelectedEventPill" style="display:inline-flex;align-items:center;gap:8px;padding:8px 14px;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.2);border-radius:20px;font-size:12.5px;color:var(--green);font-weight:600;width:fit-content">
            <i data-lucide="calendar-check" style="width:13px;height:13px"></i>
            <span id="allocSelectedEventName">—</span>
          </div>

          <!-- Participants display -->
          <div style="display:flex;align-items:center;gap:16px;padding:14px 16px;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:var(--radius-sm)">
            <div style="flex:1">
              <div style="font-size:12px;color:var(--text-muted);margin-bottom:3px">Participants</div>
              <div id="allocPeopleCount" style="font-family:var(--font-display);font-size:26px;font-weight:700;color:var(--purple)">—</div>
            </div>
            <div style="width:1px;height:44px;background:var(--border)"></div>
            <div style="flex:1">
              <div style="font-size:12px;color:var(--text-muted);margin-bottom:3px">Available Units</div>
              <div id="allocAvailCount" style="font-family:var(--font-display);font-size:26px;font-weight:700;color:var(--green)">—</div>
            </div>
          </div>

          <!-- Quantity input -->
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.4px">Units to Allocate *</label>
            <input id="allocQtyInput" class="ri-input" type="number" min="1" placeholder="Enter quantity…" />
            <span id="allocQtyErr" style="font-size:11.5px;color:var(--red);display:none">Please enter a valid quantity.</span>
            <div id="allocQtyHint" style="font-size:12px;color:var(--text-muted)"></div>
          </div>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;padding:16px 24px;border-top:1px solid var(--border)" id="allocPhase2Footer" style="display:none">
          <button id="allocBackBtn" class="ri-cancel">
            <i data-lucide="arrow-left" style="width:14px;height:14px;vertical-align:middle;margin-right:4px"></i> Back
          </button>
          <button id="allocConfirmBtn" class="ri-submit" style="flex:unset;padding:12px 28px;background:linear-gradient(135deg,#7e22ce,#6b21a8);box-shadow:0 4px 18px rgba(126,34,206,0.35)">
            <i data-lucide="check" style="width:15px;height:15px;vertical-align:middle;margin-right:5px"></i>
            Confirm Allocation
          </button>
        </div>
      </div>
    </div>`);

  lucide.createIcons();

  const overlay     = document.getElementById('resModalOverlay');
  const allocOverlay = document.getElementById('allocModalOverlay');

  wireModalClose(overlay, document.getElementById('resModalClose'), document.getElementById('resCancelBtn'));
  wireModalClose(allocOverlay, document.getElementById('allocModalClose'));
  document.getElementById('allocCancelBtn1').addEventListener('click', () => closeModal(allocOverlay));

  /* ── Error helpers ──────────────────── */
  function showErr(id, show) {
    const el = document.getElementById(id);
    if (el) el.style.display = show ? 'block' : 'none';
  }
  function markField(inputId, hasErr) {
    const el = document.getElementById(inputId);
    if (el) el.style.borderColor = hasErr ? 'rgba(239,68,68,0.6)' : '';
  }

  /* ── Category badge ─────────────────── */
  function catBadge(cat) {
    const map = { Equipment:'equipment', Furniture:'furniture', Decor:'decor' };
    return `<span class="badge--${map[cat] || 'equipment'}">${cat}</span>`;
  }

  /* ── Render table ───────────────────── */
  function render() {
    const resources = DB.getAll('resources');
    const tbody = document.querySelector('.mr-table tbody');
    if (!tbody) return;

    const filtered = resources.filter(r =>
      !searchQuery ||
      r.name.toLowerCase().includes(searchQuery) ||
      r.category.toLowerCase().includes(searchQuery)
    );

    tbody.innerHTML = filtered.length ? filtered.map(r => {
      const canAllocate = r.quantity > 0;
      return `
      <tr data-id="${r.id}">
        <td class="col-name">${r.name}</td>
        <td>${catBadge(r.category)}</td>
        <td>${r.quantity}</td>
        <td>$${r.price}/${r.unit || 'day'}</td>
        <td><span class="avail-badge ${r.available ? 'available' : 'unavailable'}">${r.available ? 'available' : 'unavailable'}</span></td>
        <td>
          <div class="mr-actions">
            <button class="mr-action-btn allocate" title="${canAllocate ? 'Allocate to Event' : 'Out of stock — quantity is 0'}"
              data-action="allocate" data-id="${r.id}" ${!canAllocate ? 'style="opacity:0.45;cursor:not-allowed"' : ''}>
              <i data-lucide="send"></i>
            </button>
            <button class="mr-action-btn edit"   title="Edit"   data-action="edit"   data-id="${r.id}"><i data-lucide="pencil"></i></button>
            <button class="mr-action-btn delete" title="Delete" data-action="delete" data-id="${r.id}"><i data-lucide="trash-2"></i></button>
          </div>
        </td>
      </tr>`;
    }).join('')
    : `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">No resources found.</td></tr>`;

    const countEl = document.querySelector('.mr-showing');
    if (countEl) countEl.textContent = `Showing ${filtered.length} Resource${filtered.length !== 1 ? 's' : ''}`;

    lucide.createIcons();
    attachActions();
  }

  /* ── Table actions ──────────────────── */
  function attachActions() {
    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const { action, id } = btn.dataset;
        if (action === 'allocate') allocateResource(id);
        if (action === 'edit')     editResource(id);
        if (action === 'delete')   deleteResource(id);
      });
    });
  }

  /* ══════════════════════════════════════════
     ALLOCATE MODAL — 2-phase flow
  ══════════════════════════════════════════ */
  let _allocResId  = null;
  let _allocEvId   = null;

  function allocateResource(id) {
    const r = DB.find('resources', id);
    if (!r) return;

    // Guard: resource out of stock
    if (r.quantity <= 0) {
      Toast.show(`"${r.name}" is out of stock and cannot be allocated.`, 'warn');
      return;
    }

    _allocResId = id;
    _allocEvId  = null;

    // Populate resource info bar
    document.getElementById('allocResName').textContent  = r.name;
    document.getElementById('allocResMeta').textContent  = `${r.category} · ${r.quantity} unit${r.quantity !== 1 ? 's' : ''} available`;
    document.getElementById('allocAvailCount').textContent = r.quantity;

    // Populate event dropdown
    const evSelect = document.getElementById('allocEventSelect');
    const approvedEvents = DB.getAll('events').filter(e => e.status === 'confirmed' || e.status === 'approved');

    evSelect.innerHTML = `<option value="">Choose an event…</option>`;
    if (approvedEvents.length) {
      approvedEvents.forEach(ev => {
        const opt = document.createElement('option');
        opt.value = ev.id;
        opt.textContent = `${ev.name} (${fmtDate(ev.date)})`;
        evSelect.appendChild(opt);
      });
      document.getElementById('allocNoEventsMsg').style.display  = 'none';
      document.getElementById('allocEventSelect').style.display  = '';
      document.getElementById('allocNextBtn').disabled = false;
    } else {
      document.getElementById('allocNoEventsMsg').style.display  = 'flex';
      document.getElementById('allocEventSelect').style.display  = 'none';
      document.getElementById('allocNextBtn').disabled = true;
    }

    // Reset to Phase 1
    showPhase(1);
    resetAllocErrors();
    document.getElementById('allocEventInfo').style.display = 'none';

    openModal(allocOverlay);
    lucide.createIcons();
  }

  /* ── Phase switcher ─────────────────── */
  function showPhase(n) {
    document.getElementById('allocPhase1').style.display       = n === 1 ? 'flex' : 'none';
    document.getElementById('allocPhase1Footer').style.display = n === 1 ? 'flex' : 'none';
    document.getElementById('allocPhase2').style.display       = n === 2 ? 'flex' : 'none';
    document.getElementById('allocPhase2Footer').style.display = n === 2 ? 'flex' : 'none';
    document.getElementById('allocModalTitle').textContent     = n === 1 ? 'Allocate Resource — Step 1 of 2' : 'Allocate Resource — Step 2 of 2';
  }

  /* ── Event select → show info ─────── */
  document.getElementById('allocEventSelect').addEventListener('change', () => {
    const evId = document.getElementById('allocEventSelect').value;
    const infoPanel = document.getElementById('allocEventInfo');
    if (!evId) { infoPanel.style.display = 'none'; return; }
    const ev = DB.find('events', evId);
    if (!ev) { infoPanel.style.display = 'none'; return; }
    document.getElementById('allocInfoVenue').textContent  = ev.venue  || '—';
    document.getElementById('allocInfoDate').textContent   = fmtDate(ev.date);
    document.getElementById('allocInfoPeople').textContent = ev.people != null ? ev.people.toLocaleString() : '—';
    infoPanel.style.display = 'flex';
    showErr('allocEventErr', false);
    markField('allocEventSelect', false);
  });

  /* ── Next button ────────────────────── */
  document.getElementById('allocNextBtn').addEventListener('click', () => {
    const evId = document.getElementById('allocEventSelect').value;
    if (!evId) {
      showErr('allocEventErr', true);
      markField('allocEventSelect', true);
      Toast.show('Please select an event before proceeding.', 'warn');
      return;
    }
    _allocEvId = evId;
    const ev = DB.find('events', evId);
    const r  = DB.find('resources', _allocResId);

    // Fill Phase 2 info
    document.getElementById('allocSelectedEventName').textContent = ev ? ev.name : evId;
    document.getElementById('allocPeopleCount').textContent       = ev?.people != null ? ev.people.toLocaleString() : '—';
    document.getElementById('allocAvailCount').textContent        = r ? r.quantity : '—';
    document.getElementById('allocQtyInput').value                = '';
    document.getElementById('allocQtyInput').max                  = r ? r.quantity : 1;
    document.getElementById('allocQtyHint').textContent           = r ? `Max available: ${r.quantity} units` : '';

    resetAllocErrors();
    showPhase(2);
    lucide.createIcons();
    document.getElementById('allocQtyInput').focus();
  });

  /* ── Back button ────────────────────── */
  document.getElementById('allocBackBtn').addEventListener('click', () => {
    showPhase(1);
    lucide.createIcons();
  });

  /* ── Qty live validation ─────────────── */
  document.getElementById('allocQtyInput').addEventListener('input', () => {
    const r   = DB.find('resources', _allocResId);
    const val = parseInt(document.getElementById('allocQtyInput').value, 10);
    const max = r ? r.quantity : 0;
    const hasErr = isNaN(val) || val < 1 || val > max;
    showErr('allocQtyErr', hasErr ? true : false);
    if (hasErr && !isNaN(val) && val > max)
      document.getElementById('allocQtyErr').textContent = `Cannot exceed available quantity (${max}).`;
    else if (hasErr)
      document.getElementById('allocQtyErr').textContent = 'Please enter a valid quantity (min 1).';
    markField('allocQtyInput', hasErr);
  });

  /* ── Confirm allocation ──────────────── */
  document.getElementById('allocConfirmBtn').addEventListener('click', () => {
    const r   = DB.find('resources', _allocResId);
    const ev  = DB.find('events', _allocEvId);
    if (!r || !ev) { Toast.show('Something went wrong. Please try again.', 'warn'); return; }

    const qty = parseInt(document.getElementById('allocQtyInput').value, 10);

    // Validate
    if (isNaN(qty) || qty < 1) {
      showErr('allocQtyErr', true);
      document.getElementById('allocQtyErr').textContent = 'Please enter a valid quantity (min 1).';
      markField('allocQtyInput', true);
      Toast.show('Please enter a valid quantity.', 'warn');
      return;
    }
    if (qty > r.quantity) {
      showErr('allocQtyErr', true);
      document.getElementById('allocQtyErr').textContent = `Cannot exceed available quantity (${r.quantity}).`;
      markField('allocQtyInput', true);
      Toast.show(`Only ${r.quantity} unit${r.quantity !== 1 ? 's' : ''} available.`, 'warn');
      return;
    }

    // Deduct from resource
    const newQty = r.quantity - qty;
    DB.update('resources', r.id, { quantity: newQty, available: newQty > 0 });

    // Record allocation
    const allocs = DB.get('resourceAllocations') || {};
    if (!allocs[ev.id]) allocs[ev.id] = [];
    allocs[ev.id].push({
      resourceId:   r.id,
      resourceName: r.name,
      category:     r.category,
      qty,
      allocatedAt:  new Date().toISOString(),
    });
    DB.set('resourceAllocations', allocs);

    closeModal(allocOverlay);
    render();
    Toast.show(`${qty} unit${qty !== 1 ? 's' : ''} of "${r.name}" allocated to "${ev.name}".`, 'success', 4000);
  });

  function resetAllocErrors() {
    showErr('allocEventErr', false);
    showErr('allocQtyErr', false);
    markField('allocEventSelect', false);
    markField('allocQtyInput', false);
  }

  /* ── Edit resource ──────────────────── */
  function editResource(id) {
    const r = DB.find('resources', id);
    if (!r) return;
    editingId = id;
    document.getElementById('resModalTitle').textContent = 'Edit Resource';
    document.getElementById('resName').value     = r.name;
    document.getElementById('resCategory').value = r.category;
    document.getElementById('resQuantity').value  = r.quantity;
    document.getElementById('resPrice').value     = r.price;
    document.getElementById('resAvail').value     = String(r.available);
    clearErrors();
    openModal(overlay);
  }

  async function deleteResource(id) {
    const r = DB.find('resources', id);
    if (!r) return;
    const ok = await Confirm.ask({ title:'Delete Resource?', msg:`"${r.name}" will be permanently removed.` });
    if (!ok) return;
    DB.remove('resources', id);
    render();
    Toast.show('Resource deleted.', 'error');
  }

  /* ── Validate (add/edit form) ───────────────────────── */
  function validate() {
    const name     = document.getElementById('resName').value.trim();
    const category = document.getElementById('resCategory').value;
    const quantity = document.getElementById('resQuantity').value;
    const price    = document.getElementById('resPrice').value;

    let valid = true;

    const nameErr = !name;
    showErr('resNameErr', nameErr); markField('resName', nameErr);
    if (nameErr) valid = false;

    const catErr = !category;
    showErr('resCatErr', catErr); markField('resCategory', catErr);
    if (catErr) valid = false;

    const qtyErr = quantity === '' || isNaN(+quantity) || +quantity < 0;
    showErr('resQtyErr', qtyErr); markField('resQuantity', qtyErr);
    if (qtyErr) valid = false;

    const priceErr = price === '' || isNaN(+price) || +price < 0;
    showErr('resPriceErr', priceErr); markField('resPrice', priceErr);
    if (priceErr) valid = false;

    return valid;
  }

  function clearErrors() {
    ['resNameErr','resCatErr','resQtyErr','resPriceErr'].forEach(id => showErr(id, false));
    ['resName','resCategory','resQuantity','resPrice'].forEach(id => markField(id, false));
  }

  /* ── Save (add/edit) ───────────────────────── */
  document.getElementById('resSaveBtn').addEventListener('click', () => {
    if (!validate()) { Toast.show('Please fix the errors above.', 'warn'); return; }

    const name      = document.getElementById('resName').value.trim();
    const category  = document.getElementById('resCategory').value;
    const quantity  = parseInt(document.getElementById('resQuantity').value, 10);
    const price     = parseFloat(document.getElementById('resPrice').value);
    const available = document.getElementById('resAvail').value === 'true';

    if (editingId) {
      DB.update('resources', editingId, { name, category, quantity, price, available });
      Toast.show('Resource updated!', 'success');
    } else {
      DB.add('resources', { id:uid('R'), name, category, quantity, price, unit:'day', available });
      Toast.show('Resource added!', 'success');
    }

    closeModal(overlay);
    editingId = null;
    render();
  });

  /* ── Add button ─────────────────────── */
  document.querySelector('.mr-add-btn')?.addEventListener('click', () => {
    editingId = null;
    document.getElementById('resModalTitle').textContent = 'Add Resource';
    ['resName','resQuantity','resPrice'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('resCategory').value = '';
    document.getElementById('resAvail').value = 'true';
    clearErrors();
    openModal(overlay);
  });

  /* ── Search & Filters ─────────────────────────── */
  document.querySelector('.mr-search input')?.addEventListener('input', e => {
    searchQuery = e.target.value.trim().toLowerCase();
    render();
  });

  document.querySelector('.mr-search i')?.addEventListener('click', () => {
    document.querySelector('.mr-search input')?.focus();
  });

  document.querySelector('.mr-filter-btn')?.addEventListener('click', () => {
    Toast.show('Advanced filter options coming soon.', 'info');
  });

  initTopbarSearch(q => { searchQuery = q; render(); });

  // Real-time: re-render if resources change from another tab (e.g. staff request approved)
  window.addEventListener('storage', (e) => {
    if (e.key === 'eventpro_resources' || e.key === 'eventpro_resourcesUpdated' || e.key === 'eventpro_resourceAllocations') {
      render();
    }
  });
  // Also poll for same-tab updates (e.g. monitoring page is same window)
  setInterval(render, 3000);

  render();
});