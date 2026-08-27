/* ═══════════════════════════════════════════
   data.js  —  EventPro API-Backed Data Layer
   Connects to the NestJS backend on :3000.
   Provides the same DB.get/set/add/update/remove
   interface so all existing vendor JS files work
   without modification.
═══════════════════════════════════════════ */

window.DB = (() => {

  const API = window.CHECKMATE_API_BASE || 'http://localhost:3000/api';
  // Dynamically resolve role from session for proper RBAC
  const _storedSession = (() => {
    try { const s = JSON.parse(sessionStorage.getItem('checkmate_session') || localStorage.getItem('checkmate_session') || 'null'); return s; } catch { return null; }
  })();
  const ROLE = (_storedSession && _storedSession.role) ? _storedSession.role.toLowerCase() : 'vendor';
  const POLL_MS = 5000;

  /* ── Collection → API endpoint mapping ─── */
  const COLLECTION_ENDPOINTS = {
    events:           'events',
    resources:        'resources',
    staff:            'staff',
    packages:         'packages',
    issues:           'issues',
    staffAssignments: 'staff-assignments',
    vendors:          'vendors',
    bookings:         'bookings',
    vendorApplications: 'vendor-applications',
    users:            'users',
  };

  /* Keys stored via the state/:key endpoint */
  const STATE_KEYS = new Set([
    'messages', 'resourceAllocations', 'monitorProgress',
    'staffRequests', 'staffTasks', 'contingencyPlans',
    'vendorDocSubmission', 'session', 'liveEvents',
    'coordinationMessages',
    'adminChatMessages',
  ]);

  /* ── In-memory cache ──────────────────── */
  let _cache = {};
  let _ready = false;

  /* ── Synchronous XHR helper ───────────── */
  function xhr(method, path, body) {
    const x = new XMLHttpRequest();
    x.open(method, `${API}/${path}`, false);
    x.setRequestHeader('Content-Type', 'application/json');
    x.setRequestHeader('x-role', ROLE);
    try {
      x.send(body === undefined ? null : JSON.stringify(body));
    } catch (e) {
      console.warn('[DB] XHR error:', e.message);
      return null;
    }
    if (x.status >= 400) {
      console.warn(`[DB] ${method} ${path} → ${x.status}`, x.responseText);
      return null;
    }
    try {
      return x.responseText ? JSON.parse(x.responseText) : null;
    } catch {
      return null;
    }
  }

  /* ── Async XHR for background polling ─── */
  function xhrAsync(method, path, callback) {
    const x = new XMLHttpRequest();
    x.open(method, `${API}/${path}`, true);
    x.setRequestHeader('Content-Type', 'application/json');
    x.setRequestHeader('x-role', ROLE);
    x.onload = function () {
      if (x.status < 400 && x.responseText) {
        try { callback(JSON.parse(x.responseText)); } catch {}
      }
    };
    x.onerror = function () {};
    x.send(null);
  }

  /* ── Fetch full snapshot ──────────────── */
  function fetchSnapshot() {
    const data = xhr('GET', 'snapshot');
    if (data) {
      _cache = data;
      _ready = true;
    }
    return _ready;
  }

  /* ── Async snapshot poll ──────────────── */
  function pollSnapshot() {
    xhrAsync('GET', 'snapshot', (data) => {
      if (data) _cache = data;
    });
  }

  /* ── Multi-Tenant Context Resolution ─── */

  function getTenantContext() {
    let session = null;
    try {
      session = JSON.parse(sessionStorage.getItem('checkmate_session') || localStorage.getItem('checkmate_session') || 'null');
    } catch {}

    const user = session && session.user ? session.user : {};
    const role = (session && session.role ? session.role : (user.role || 'Vendor')).toLowerCase();
    const userId = user.id || user.userId || '';
    const userName = user.name || user.user || '';
    const userEmail = (user.email || '').toLowerCase();

    // Resolve Vendor Identity
    let vendorId = user.vendorId || '';
    let vendorName = user.vendorName || user.businessName || userName || 'Vendor';
    let businessName = user.businessName || user.vendorName || userName;

    if (role === 'vendor') {
      const allVendors = getAll('vendors');
      const matched = allVendors.find(v => 
        (userId && v.userId === userId) ||
        (user.vendorId && v.id === user.vendorId) ||
        (v.name && v.name.toLowerCase() === userName.toLowerCase()) ||
        (v.businessName && v.businessName.toLowerCase() === userName.toLowerCase()) ||
        (userEmail && userEmail.includes('eliteevents') && v.id === 'V001')
      );
      if (matched) {
        vendorId = matched.id;
        vendorName = matched.name || matched.businessName || vendorName;
        businessName = matched.businessName || matched.name || businessName;
      } else if (!vendorId) {
        vendorId = userId ? `V_${userId}` : 'V_CURRENT';
      }
    }

    // Resolve Staff Identity
    let staffId = user.staffId || '';
    if (role === 'staff') {
      const allStaff = getAll('staff');
      const matched = allStaff.find(s => 
        (userId && s.userId === userId) ||
        (userEmail && s.email && s.email.toLowerCase() === userEmail) ||
        (userName && s.name && s.name.toLowerCase() === userName.toLowerCase())
      );
      if (matched) staffId = matched.id;
    }

    return {
      role,
      userId,
      userName,
      userEmail,
      vendorId,
      vendorName,
      businessName,
      staffId,
      isAdmin: role === 'admin' || role === 'superuser',
      isVendor: role === 'vendor',
      isClient: role === 'client',
      isStaff: role === 'staff',
    };
  }

  /* ── Scoped Data Retrieval Methods ────── */

  function getMyEvents() {
    const ctx = getTenantContext();
    const all = getAll('events');

    if (ctx.isAdmin) return all;

    if (ctx.isVendor) {
      const myResIds = new Set(getMyResources().map(r => r.id));
      const myStaffIds = new Set(getMyStaff().map(s => s.id));

      return all.filter(ev => {
        const evVId = (ev.vendorId || '').toLowerCase();
        const evVName = (ev.vendor || '').toLowerCase();
        const evVEmail = (ev.vendorEmail || '').toLowerCase();
        const ctxVId = (ctx.vendorId || '').toLowerCase();
        const ctxVName = (ctx.vendorName || '').toLowerCase();
        const ctxBName = (ctx.businessName || '').toLowerCase();
        const ctxUName = (ctx.userName || '').toLowerCase();
        const ctxUEmail = (ctx.userEmail || '').toLowerCase();

        // 1. Direct vendor match
        if (
          (ctxVId && evVId === ctxVId) ||
          (ctxVName && evVName === ctxVName) ||
          (ctxBName && evVName === ctxBName) ||
          (ctxUName && evVName === ctxUName) ||
          (ctxUEmail && evVEmail === ctxUEmail) ||
          (ev.createdBy && (ev.createdBy.toLowerCase() === ctxUEmail || ev.createdBy === ctx.userId))
        ) {
          return true;
        }

        // 2. Multi-vendor arrays (vendorIds / vendors)
        if (Array.isArray(ev.vendorIds) && ctxVId && ev.vendorIds.map(v => String(v).toLowerCase()).includes(ctxVId)) return true;
        if (Array.isArray(ev.vendors)) {
          const match = ev.vendors.some(v => 
            (typeof v === 'string' && (v.toLowerCase() === ctxVName || v.toLowerCase() === ctxBName)) ||
            (v && typeof v === 'object' && (
              (v.id && String(v.id).toLowerCase() === ctxVId) ||
              (v.name && String(v.name).toLowerCase() === ctxVName) ||
              (v.businessName && String(v.businessName).toLowerCase() === ctxBName)
            ))
          );
          if (match) return true;
        }

        // 3. Requested resources belonging to this vendor
        if (Array.isArray(ev.requestedResources) && ev.requestedResources.length > 0) {
          const hasMyRes = ev.requestedResources.some(r => 
            (r.resourceId && myResIds.has(r.resourceId)) ||
            (r.vendorId && String(r.vendorId).toLowerCase() === ctxVId) ||
            (r.vendor && (r.vendor.toLowerCase() === ctxVName || r.vendor.toLowerCase() === ctxBName)) ||
            (r.vendorEmail && r.vendorEmail.toLowerCase() === ctxUEmail)
          );
          if (hasMyRes) return true;
        }

        // 4. Requested staff belonging to this vendor
        if (Array.isArray(ev.requestedStaff) && ev.requestedStaff.length > 0) {
          const hasMyStaff = ev.requestedStaff.some(s => 
            (s.staffId && myStaffIds.has(s.staffId)) ||
            (s.vendorId && String(s.vendorId).toLowerCase() === ctxVId) ||
            (s.vendor && (s.vendor.toLowerCase() === ctxVName || s.vendor.toLowerCase() === ctxBName)) ||
            (s.vendorEmail && s.vendorEmail.toLowerCase() === ctxUEmail)
          );
          if (hasMyStaff) return true;
        }

        return false;
      });
    }

    if (ctx.isClient) {
      return all.filter(ev => {
        const evCId = (ev.clientId || '').toLowerCase();
        const evCEmail = (ev.clientEmail || '').toLowerCase();
        const evCName = (ev.client || '').toLowerCase();
        const ctxUId = (ctx.userId || '').toLowerCase();
        const ctxUEmail = (ctx.userEmail || '').toLowerCase();
        const ctxUName = (ctx.userName || '').toLowerCase();

        return (
          (ctxUId && evCId === ctxUId) ||
          (ctxUEmail && evCEmail === ctxUEmail) ||
          (ctxUName && (evCName === ctxUName || evCName.includes(ctxUName) || ctxUName.includes(evCName))) ||
          (ev.createdBy && (ev.createdBy.toLowerCase() === ctxUEmail || ev.createdBy === ctx.userId))
        );
      });
    }

    if (ctx.isStaff) {
      const allStaff = getAll('staff');
      const staffRec = allStaff.find(s => s.id === ctx.staffId || (s.email && s.email.toLowerCase() === ctx.userEmail));
      const assignedEvIds = (staffRec && Array.isArray(staffRec.assignedEvents)) ? staffRec.assignedEvents : [];
      const assignments = getAll('staffAssignments') || [];
      const myAssignedEvIds = assignments
        .filter(a => a.staffId === ctx.staffId || (a.staffName && a.staffName.toLowerCase() === ctx.userName.toLowerCase()))
        .map(a => a.eventId);

      const allMyIds = new Set([...assignedEvIds, ...myAssignedEvIds]);
      return all.filter(ev => allMyIds.has(ev.id));
    }

    return all;
  }

  function getMyResources() {
    const ctx = getTenantContext();
    const all = getAll('resources');

    if (ctx.isAdmin) return all;

    if (ctx.isVendor) {
      return all.filter(r => {
        const rVId = (r.vendorId || '').toLowerCase();
        const rVName = (r.vendor || '').toLowerCase();
        const rVEmail = (r.vendorEmail || '').toLowerCase();
        const rCreated = (r.createdBy || '').toLowerCase();
        const ctxVId = (ctx.vendorId || '').toLowerCase();
        const ctxVName = (ctx.vendorName || '').toLowerCase();
        const ctxBName = (ctx.businessName || '').toLowerCase();
        const ctxUName = (ctx.userName || '').toLowerCase();
        const ctxUEmail = (ctx.userEmail || '').toLowerCase();

        return (
          (ctxVId && rVId === ctxVId) ||
          (ctxVName && rVName === ctxVName) ||
          (ctxBName && rVName === ctxBName) ||
          (ctxUName && rVName === ctxUName) ||
          (ctxUEmail && rVEmail === ctxUEmail) ||
          (ctxUEmail && rCreated === ctxUEmail) ||
          (ctx.userId && r.createdBy === ctx.userId)
        );
      });
    }

    return all;
  }

  function getMyStaff() {
    const ctx = getTenantContext();
    const all = getAll('staff');

    if (ctx.isAdmin) return all;

    if (ctx.isVendor) {
      return all.filter(s => {
        const sVId = (s.vendorId || '').toLowerCase();
        const sVName = (s.vendor || '').toLowerCase();
        const sVEmail = (s.vendorEmail || '').toLowerCase();
        const sCreated = (s.createdBy || '').toLowerCase();
        const ctxVId = (ctx.vendorId || '').toLowerCase();
        const ctxVName = (ctx.vendorName || '').toLowerCase();
        const ctxBName = (ctx.businessName || '').toLowerCase();
        const ctxUName = (ctx.userName || '').toLowerCase();
        const ctxUEmail = (ctx.userEmail || '').toLowerCase();

        return (
          (ctxVId && sVId === ctxVId) ||
          (ctxVName && sVName === ctxVName) ||
          (ctxBName && sVName === ctxBName) ||
          (ctxUName && sVName === ctxUName) ||
          (ctxUEmail && sVEmail === ctxUEmail) ||
          (ctxUEmail && sCreated === ctxUEmail) ||
          (ctx.userId && s.createdBy === ctx.userId)
        );
      });
    }

    if (ctx.isStaff) {
      return all.filter(s => s.id === ctx.staffId || (s.email && s.email.toLowerCase() === ctx.userEmail));
    }

    return all;
  }

  function getMyPackages() {
    const ctx = getTenantContext();
    const all = getAll('packages');

    if (ctx.isAdmin) return all;

    if (ctx.isVendor) {
      return all.filter(p => {
        const pVId = (p.vendorId || '').toLowerCase();
        const pVName = (p.vendorName || p.vendor || '').toLowerCase();
        const ctxVId = (ctx.vendorId || '').toLowerCase();
        const ctxVName = (ctx.vendorName || '').toLowerCase();
        const ctxBName = (ctx.businessName || '').toLowerCase();
        const ctxUName = (ctx.userName || '').toLowerCase();

        return (
          (ctxVId && pVId === ctxVId) ||
          (ctxVName && pVName === ctxVName) ||
          (ctxBName && pVName === ctxBName) ||
          (ctxUName && pVName === ctxUName) ||
          (p.createdBy === ctx.userEmail || p.createdBy === ctx.userId)
        );
      });
    }

    return all;
  }

  function getMarketplacePackages() {
    const all = getAll('packages');
    return all.filter(p => !p.status || p.status === 'approved' || p.status === 'Active');
  }

  function getMyIssues() {
    const ctx = getTenantContext();
    const all = getAll('issues');

    if (ctx.isAdmin) return all;

    const myEventIds = new Set(getMyEvents().map(e => e.id));
    return all.filter(iss => 
      (iss.eventId && myEventIds.has(iss.eventId)) ||
      (iss.reporter && iss.reporter.toLowerCase() === ctx.userName.toLowerCase()) ||
      (iss.email && iss.email.toLowerCase() === ctx.userEmail)
    );
  }

  function getMyBookings() {
    const ctx = getTenantContext();
    const all = getAll('bookings');

    if (ctx.isAdmin) return all;

    if (ctx.isVendor) {
      return all.filter(b => {
        const bVendor = (b.vendor || '').toLowerCase();
        return (
          bVendor === ctx.vendorName.toLowerCase() ||
          bVendor === ctx.businessName.toLowerCase() ||
          bVendor === ctx.userName.toLowerCase()
        );
      });
    }

    if (ctx.isClient) {
      return all.filter(b => {
        const bClient = (b.client || '').toLowerCase();
        return (
          bClient === ctx.userName.toLowerCase() ||
          (b.clientId && b.clientId === ctx.userId)
        );
      });
    }

    return all;
  }

  /* ── Public API ──────────────────────── */

  function init() {
    fetchSnapshot();
    // Start background polling
    setInterval(pollSnapshot, POLL_MS);
  }

  function get(name) {
    if (STATE_KEYS.has(name)) {
      // Try from cache first, if not present fetch from state endpoint
      if (_cache[name] !== undefined) return _cache[name];
      const val = xhr('GET', `state/${name}`);
      if (val !== null) _cache[name] = val;
      return _cache[name] || null;
    }
    return _cache[name] || null;
  }

  function set(name, val) {
    _cache[name] = val;
    if (STATE_KEYS.has(name)) {
      xhr('PUT', `state/${name}`, { value: val });
    }
  }

  function getAll(name) {
    const data = _cache[name];
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') return data;
    return [];
  }

  function save(name, arr) {
    _cache[name] = arr;
    if (STATE_KEYS.has(name)) {
      xhr('PUT', `state/${name}`, { value: arr });
    }
  }

  function find(name, id) {
    const arr = _cache[name];
    if (Array.isArray(arr)) return arr.find(i => i.id === id) || null;
    return null;
  }

  function add(name, item) {
    const ctx = getTenantContext();
    const itemToSave = { ...item };

    // Auto-attach tenant context if creating entities
    if (name === 'resources' || name === 'packages' || name === 'staff') {
      if (ctx.isVendor) {
        itemToSave.vendor = itemToSave.vendor || ctx.vendorName || ctx.businessName || ctx.userName;
        itemToSave.vendorId = itemToSave.vendorId || ctx.vendorId;
        itemToSave.vendorEmail = itemToSave.vendorEmail || ctx.userEmail;
        itemToSave.createdBy = itemToSave.createdBy || ctx.userEmail || ctx.userId;
      }
    } else if (name === 'events') {
      if (ctx.isClient) {
        if (!itemToSave.clientId && !itemToSave.client) {
          itemToSave.client = ctx.userName;
          itemToSave.clientId = ctx.userId;
          itemToSave.clientEmail = ctx.userEmail;
          itemToSave.createdBy = 'client';
        }
      }
    }

    const endpoint = COLLECTION_ENDPOINTS[name];
    if (endpoint) {
      const result = xhr('POST', endpoint, itemToSave);
      if (result) {
        // Update cache
        if (!Array.isArray(_cache[name])) _cache[name] = [];
        _cache[name].push(result);
        return result;
      }
    }
    // Fallback: state key array or local-only
    if (!Array.isArray(_cache[name])) _cache[name] = [];
    _cache[name].push(itemToSave);
    if (STATE_KEYS.has(name)) {
      xhr('PUT', `state/${name}`, { value: _cache[name] });
    }
    return itemToSave;
  }

  function update(name, id, patch) {
    const endpoint = COLLECTION_ENDPOINTS[name];
    if (endpoint) {
      const result = xhr('PATCH', `${endpoint}/${id}`, patch);
      if (result) {
        // Update cache
        const arr = _cache[name];
        if (Array.isArray(arr)) {
          const idx = arr.findIndex(i => i.id === id);
          if (idx >= 0) arr[idx] = { ...arr[idx], ...result };
        }
        return result;
      }
    }
    // Fallback: update in cache
    const arr = _cache[name];
    if (Array.isArray(arr)) {
      const idx = arr.findIndex(i => i.id === id);
      if (idx >= 0) {
        arr[idx] = { ...arr[idx], ...patch };
        if (STATE_KEYS.has(name)) {
          xhr('PUT', `state/${name}`, { value: arr });
        }
        return arr[idx];
      }
    }
    return null;
  }

  function remove(name, id) {
    const endpoint = COLLECTION_ENDPOINTS[name];
    if (endpoint) {
      xhr('DELETE', `${endpoint}/${id}`);
    }
    // Remove from cache
    const arr = _cache[name];
    if (Array.isArray(arr)) {
      _cache[name] = arr.filter(i => i.id !== id);
    }
    if (STATE_KEYS.has(name)) {
      xhr('PUT', `state/${name}`, { value: _cache[name] });
    }
  }

  function getSession() {
    // Read from login-set session (sessionStorage per-tab, fallback to localStorage)
    try {
      const s = JSON.parse(sessionStorage.getItem('checkmate_session') || localStorage.getItem('checkmate_session') || 'null');
      if (s && s.user) {
        // Hydrate full user context including profile
        return {
          ...s.user,
          user: s.user.name || s.user,
          email: s.user.email || '',
          role: s.user.role || s.role || 'Vendor',
        };
      }
    } catch {}
    // Fallback to backend session
    const backendSession = _cache.session;
    if (backendSession) return backendSession;
    return { user: 'Sarah Williams', email: 'sarah@eliteevents.com', role: 'Event Coordinator' };
  }

  function setSession(obj) {
    _cache.session = obj;
  }

  function reset() {
    fetchSnapshot();
  }

  /* ── Initialize on load ──────────────── */
  init();

  return {
    get,
    set,
    getAll,
    save,
    add,
    update,
    remove,
    find,
    getSession,
    setSession,
    reset,
    init,
    getTenantContext,
    getMyEvents,
    getMyResources,
    getMyStaff,
    getMyPackages,
    getMarketplacePackages,
    getMyIssues,
    getMyBookings,
    // Expose _cache for debugging
    get _cache() { return _cache; },
  };

})();