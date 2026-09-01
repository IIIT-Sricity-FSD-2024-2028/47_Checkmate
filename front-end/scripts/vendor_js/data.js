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
    const endpoint = COLLECTION_ENDPOINTS[name];
    if (endpoint) {
      const result = xhr('POST', endpoint, item);
      if (result) {
        // Update cache
        if (!Array.isArray(_cache[name])) _cache[name] = [];
        _cache[name].push(result);
        return result;
      }
    }
    // Fallback: state key array or local-only
    if (!Array.isArray(_cache[name])) _cache[name] = [];
    _cache[name].push(item);
    if (STATE_KEYS.has(name)) {
      xhr('PUT', `state/${name}`, { value: _cache[name] });
    }
    return item;
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
    // Always prefer live sessionStorage/localStorage first — avoids stale cache returning wrong user
    try {
      const raw = sessionStorage.getItem('checkmate_session') || localStorage.getItem('checkmate_session');
      if (raw) {
        const s = JSON.parse(raw);
        if (s && s.user && typeof s.user === 'object' && s.user.email) {
          // Hydrate full user context including profile
          return {
            ...s.user,
            user: s.user.name || '',
            name: s.user.name || '',
            email: s.user.email || '',
            role: (s.role || s.user.role || 'vendor').toLowerCase(),
          };
        }
      }
    } catch {}
    // Fallback to backend session cache (set after login API call)
    const backendSession = _cache.session;
    if (backendSession && backendSession.email) return backendSession;
    // No session found — return empty so the profile modal shows the correct error
    return { user: '', name: '', email: '', role: '' };
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
    // Expose _cache for debugging
    get _cache() { return _cache; },
  };

})();