/* EventPro API-backed data adapter.
   The UI was written against window.DB; this preserves that contract while
   moving persistence to the NestJS backend. */
(function () {
  const API_BASE = window.CHECKMATE_API_BASE || 'http://localhost:3000/api';
  const ROLE_MAP = {
    Admin: 'admin',
    Superuser: 'superuser',
    Vendor: 'vendor',
    Client: 'client',
    Staff: 'staff',
    'Event Coordinator': 'vendor',
  };
  const ENDPOINTS = {
    events: 'events',
    resources: 'resources',
    staff: 'staff',
    packages: 'packages',
    issues: 'issues',
    staffAssignments: 'staff-assignments',
    vendorApplicationsList: 'vendor-applications',
    vendorDocSubmission: 'state/vendorDocSubmission',
    messages: 'messages',
    resourceAllocations: 'state/resourceAllocations',
    monitorProgress: 'state/monitorProgress',
    staffRequests: 'state/staffRequests',
    staffTasks: 'state/staffTasks',
    session: 'state/session',
  };
  let cache = {};

  function role() {
    const active = JSON.parse(localStorage.getItem('checkmate_session') || 'null');
    if (active?.role) return active.role;
    const stored = cache.session || { role: 'Vendor' };
    return ROLE_MAP[stored.role] || ROLE_MAP[localStorage.getItem('accountType')] || 'vendor';
  }

  function request(method, path, body) {
    const xhr = new XMLHttpRequest();
    xhr.open(method, `${API_BASE}/${path}`, false);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('x-role', role());
    try {
      xhr.send(body === undefined ? null : JSON.stringify(body));
    } catch (error) {
      console.error('API request failed. Is the NestJS backend running?', error);
      return null;
    }
    if (xhr.status >= 400) {
      console.error(`API ${method} ${path} failed`, xhr.status, xhr.responseText);
      return null;
    }
    return xhr.responseText ? JSON.parse(xhr.responseText) : null;
  }

  function loadSnapshot() {
    const data = request('GET', 'snapshot');
    if (!data) return;
    cache = {
      ...data,
      vendorApplicationsList: data.vendorApplications || [],
    };
  }

  function collectionPath(name) {
    return ENDPOINTS[name] || name;
  }

  function activeUser() {
    return JSON.parse(localStorage.getItem('checkmate_session') || 'null')?.user || null;
  }

  function normalizeForApi(name, item) {
    if (name === 'events') {
      const user = activeUser();
      const people = Number.parseInt(item.people ?? item.guests ?? 0, 10);
      return {
        name: item.name || 'New Event',
        type: item.type || 'Conference',
        date: item.date || new Date().toISOString().slice(0, 10),
        time: item.time || '09:00',
        venue: item.venue || 'TBD',
        people: Number.isFinite(people) && people > 0 ? people : 1,
        guests: Number.isFinite(people) && people > 0 ? people : 1,
        status: item.status || 'pending',
        client: item.client || user?.name || 'Client',
        vendor: item.vendor,
        createdBy: item.createdBy || 'client',
        packageId: item.packageId || item.presetPackageId,
        budget: Number.isFinite(Number(item.budget)) ? Number(item.budget) : undefined,
        notes: item.notes || item.description,
      };
    }
    if (name === 'issues') {
      return {
        event: item.event,
        eventId: item.eventId || item.event,
        title: item.title || item.subject || 'Reported issue',
        category: item.category || 'General',
        priority: item.priority || 'Medium',
        description: item.description || item.message || 'No description provided.',
        reporter: item.reporter || activeUser()?.name || 'User',
        email: item.email || activeUser()?.email,
        role: item.role || activeUser()?.role,
        status: item.status || 'open',
      };
    }
    if (name === 'staffAssignments') {
      return {
        staffId: item.staffId,
        staffName: item.staffName,
        eventId: item.eventId,
        eventName: item.eventName,
        role: item.role,
        status: item.status || 'assigned',
      };
    }
    if (name === 'resources') {
      const quantity = Number.parseInt(item.quantity ?? item.avail ?? 0, 10);
      return {
        name: item.name,
        category: item.category || item.cat || 'Equipment',
        cat: item.cat || item.category,
        vendor: item.vendor,
        quantity: Number.isFinite(quantity) ? quantity : 0,
        total: Number.isFinite(Number(item.total)) ? Number(item.total) : quantity,
        avail: Number.isFinite(Number(item.avail)) ? Number(item.avail) : quantity,
        price: Number.isFinite(Number(item.price)) ? Number(item.price) : 0,
        unit: item.unit || 'day',
        available: item.available ?? quantity > 0,
        condition: item.condition,
      };
    }
    if (name === 'staff') {
      return {
        name: item.name,
        initials: item.initials,
        role: item.role,
        vendor: item.vendor,
        phone: item.phone || 'N/A',
        email: item.email,
        workload: Number.isFinite(Number(item.workload)) ? Number(item.workload) : undefined,
        status: item.status || 'available',
        avail: item.avail,
        events: Number.isFinite(Number(item.events)) ? Number(item.events) : undefined,
        avatar: item.avatar,
        assignedEvents: item.assignedEvents,
      };
    }
    if (name === 'packages') {
      return {
        name: item.name,
        category: item.category,
        price: Number.isFinite(Number(item.price)) ? Number(item.price) : 0,
        duration: Number.isFinite(Number(item.duration)) ? Number(item.duration) : 1,
        capacity: item.capacity || 'N/A',
        desc: item.desc || item.description || '',
        resources: item.resources || [],
        staff: item.staff || [],
      };
    }
    return item;
  }

  function cleanPatch(patch) {
    const cleaned = { ...patch };
    delete cleaned.id;
    return cleaned;
  }

  window.DB = {
    _seeds: {},
    _key(name) { return `eventpro_${name}`; },
    init() { loadSnapshot(); },
    get(name) {
      const path = collectionPath(name);
      if (path.startsWith('state/')) {
        const value = request('GET', path);
        cache[name] = value;
        return value;
      }
      return cache[name] ?? null;
    },
    set(name, val) {
      const path = collectionPath(name);
      const saved = path.startsWith('state/')
        ? request('PUT', path, { value: val })
        : request('PUT', `state/${name}`, { value: val });
      cache[name] = saved ?? val;
      return cache[name];
    },
    getAll(name) {
      const path = collectionPath(name);
      if (path.startsWith('state/')) return this.get(name) || [];
      const data = request('GET', path);
      cache[name] = data || [];
      return cache[name];
    },
    save(name, arr) { return this.set(name, arr); },
    add(name, item) {
      const path = collectionPath(name);
      if (path.startsWith('state/')) {
        const rows = this.get(name) || [];
        const created = { ...item, id: item.id || `${name}-${Date.now()}` };
        rows.push(created);
        this.set(name, rows);
        return created;
      }
      const created = request('POST', path, normalizeForApi(name, item));
      if (!created) {
        console.error(`Could not save ${name}; keeping local page state only.`, item);
        return item;
      }
      if (!Array.isArray(cache[name])) cache[name] = [];
      cache[name].push(created);
      return created;
    },
    update(name, id, patch) {
      const path = collectionPath(name);
      if (path.startsWith('state/')) {
        const rows = this.get(name) || [];
        const updatedRows = rows.map((item) => item.id === id ? { ...item, ...patch } : item);
        this.set(name, updatedRows);
        return updatedRows.find((item) => item.id === id) || null;
      }
      const updated = request('PATCH', `${path}/${id}`, cleanPatch(patch));
      if (updated && Array.isArray(cache[name])) {
        cache[name] = cache[name].map((item) => item.id === id ? updated : item);
      }
      return updated;
    },
    remove(name, id) {
      const path = collectionPath(name);
      if (path.startsWith('state/')) {
        const rows = (this.get(name) || []).filter((item) => item.id !== id);
        this.set(name, rows);
        return { id, deleted: true };
      }
      const removed = request('DELETE', `${path}/${id}`);
      if (Array.isArray(cache[name])) cache[name] = cache[name].filter((item) => item.id !== id);
      return removed;
    },
    find(name, id) {
      const path = collectionPath(name);
      const found = request('GET', `${path}/${id}`);
      return found || (this.getAll(name).find((item) => item.id === id) || null);
    },
    getSession() { return this.get('session') || { user: 'Sarah Williams', email: 'sarah@eliteevents.com', role: 'Event Coordinator' }; },
    setSession(obj) { return this.set('session', obj); },
    reset() { loadSnapshot(); },
  };

  window.DB.init();
})();
