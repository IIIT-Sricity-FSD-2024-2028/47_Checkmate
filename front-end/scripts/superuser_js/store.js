/* Checkmate Superuser API store. Keeps the existing EP/UI interface while
   replacing sessionStorage demo data with backend CRUD calls. */
window.EP = (() => {
  const API_BASE = window.CHECKMATE_API_BASE || 'http://localhost:3000/api';

  /* ── Auth token ─────────────────────────
     Login stores a signed JWT in the session. Every API call must carry it as
     "Authorization: Bearer <token>"; the server reads the caller's role out of
     that token, so no request works without it. */
  function ckToken() {
    try {
      var raw = sessionStorage.getItem('checkmate_session') || localStorage.getItem('checkmate_session');
      if (!raw) return null;
      var s = JSON.parse(raw);
      return (s && s.token) || null;
    } catch (e) { return null; }
  }

  /* A 401 means no token or an expired one. Send the user back to sign in once,
     rather than letting the page render as though it simply has no data. */
  var _ckRedirected = false;
  function ckHandleUnauthorized(status) {
    if (status !== 401 || _ckRedirected) return;
    if (/\/Login\//i.test(location.pathname) || /LandingPage/i.test(location.pathname)) return;
    _ckRedirected = true;
    try { sessionStorage.removeItem('checkmate_session'); } catch (e) {}
    location.href = '../Login/signin.html';
  }

  let d = {};

  const req = (method, path, body) => {
    const session = JSON.parse(sessionStorage.getItem('checkmate_session') || localStorage.getItem('checkmate_session') || 'null');
    const xhr = new XMLHttpRequest();
    xhr.open(method, `${API_BASE}/${path}`, false);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('x-role', session?.role || 'superuser');
    const token = session?.token || ckToken();
    if (token) xhr.setRequestHeader('Authorization', 'Bearer ' + token);
    try {
      xhr.send(body === undefined ? null : JSON.stringify(body));
    } catch (error) {
      console.error('Superuser API request failed. Start the NestJS backend on port 3000.', error);
      return null;
    }
    if (xhr.status >= 400) {
      console.error(`API ${method} ${path} failed`, xhr.status, xhr.responseText);
      ckHandleUnauthorized(xhr.status);
      return null;
    }
    return xhr.responseText ? JSON.parse(xhr.responseText) : null;
  };

  const load = () => {
    const snap = req('GET', 'snapshot') || {};
    d = {
      users: snap.users || [],
      events: (snap.events || []).map((e) => ({
        ...e,
        guests: e.guests ?? e.people ?? 0,
        status: titleStatus(e.status),
        date: normalizeDate(e.date),
      })),
      bookings: snap.bookings || [],
      resources: (snap.resources || []).map((r) => ({
        ...r,
        cat: r.cat || r.category,
        avail: r.avail ?? r.quantity,
        total: r.total ?? r.quantity,
      })),
      staff: snap.staff || [],
      vendors: snap.vendors || [],
    };
  };

  const normalizeDate = (value) => {
    if (!value || value.includes('/')) return value;
    const [year, month, day] = value.split('-');
    return `${Number(month)}/${Number(day)}/${year}`;
  };

  const isoDate = (value) => {
    if (!value || value.includes('-')) return value;
    const [month, day, year] = value.split('/');
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const titleStatus = (value = 'Pending') => String(value).split(' ').map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(' ');
  const cur = (n) => { if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M'; if (n >= 1000) return '$' + n.toLocaleString(); return '$' + n; };
  const patchList = (name, item) => { d[name] = d[name].map((row) => row.id === item.id ? item : row); return item; };
  const post = (path, payload) => req('POST', path, payload);
  const patch = (path, id, payload) => req('PATCH', `${path}/${id}`, payload);
  const del = (path, id) => req('DELETE', `${path}/${id}`);

  load();

  return {
    get users() { return d.users; },
    get events() { return d.events; },
    get bookings() { return d.bookings; },
    get resources() { return d.resources; },
    get staff() { return d.staff; },
    get vendors() { return d.vendors; },

    totalRev() { return d.bookings.reduce((a, b) => a + Number(b.cost || 0), 0); },
    confirmedRev() { return d.bookings.filter((b) => ['Confirmed', 'Completed'].includes(b.status)).reduce((a, b) => a + Number(b.cost || 0), 0); },

    addUser(u) { const row = post('users', u); if (row) d.users.push(row); return row || u; },
    updateUser(id, u) { const row = patch('users', id, u); if (row) patchList('users', row); },
    deleteUser(id) { if (del('users', id)) d.users = d.users.filter((x) => x.id !== id); },

    addEvent(e) { const row = post('events', { ...e, date: isoDate(e.date), people: Number(e.guests || e.people || 0), status: e.status || 'pending' }); if (row) d.events.push({ ...row, status: titleStatus(row.status), date: normalizeDate(row.date) }); return row || e; },
    updateEvent(id, e) { const row = patch('events', id, { ...e, date: isoDate(e.date), people: Number(e.guests || e.people || 0) }); if (row) patchList('events', { ...row, status: titleStatus(row.status), date: normalizeDate(row.date) }); },
    deleteEvent(id) { if (del('events', id)) d.events = d.events.filter((x) => x.id !== id); },

    addBooking(b) { const row = post('bookings', b); if (row) d.bookings.push(row); return row || b; },
    updateBooking(id, b) { const row = patch('bookings', id, b); if (row) patchList('bookings', row); },
    deleteBooking(id) { if (del('bookings', id)) d.bookings = d.bookings.filter((x) => x.id !== id); },

    addResource(r) { const payload = { name: r.name, category: r.cat || r.category, cat: r.cat || r.category, vendor: r.vendor, quantity: Number(r.avail || r.quantity || 0), total: Number(r.total || r.avail || 0), avail: Number(r.avail || 0), price: Number(r.price || 0), available: Number(r.avail || 0) > 0 }; const row = post('resources', payload); if (row) d.resources.push({ ...row, cat: row.cat || row.category, avail: row.avail ?? row.quantity, total: row.total ?? row.quantity }); return row || r; },
    updateResource(id, r) { const row = patch('resources', id, { ...r, category: r.cat || r.category, quantity: Number(r.avail || r.quantity || 0), available: Number(r.avail || r.quantity || 0) > 0 }); if (row) patchList('resources', { ...row, cat: row.cat || row.category, avail: row.avail ?? row.quantity, total: row.total ?? row.quantity }); },
    deleteResource(id) { if (del('resources', id)) d.resources = d.resources.filter((x) => x.id !== id); },

    addStaff(s) { const row = post('staff', s); if (row) d.staff.push(row); return row || s; },
    updateStaff(id, s) { const row = patch('staff', id, s); if (row) patchList('staff', row); },
    deleteStaff(id) { if (del('staff', id)) d.staff = d.staff.filter((x) => x.id !== id); },
  };
})();

window.UI = {
  cur(n) { if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M'; if (n >= 1000) return '$' + n.toLocaleString(); return '$' + n; },
  badge(text, cls) { return `<span class="badge ${cls}">${text}</span>`; },
  sb(s) {
    const m = { 'Confirmed': 'b-confirmed', 'Completed': 'b-completed', 'Pending': 'b-pending', 'In Progress': 'b-inprogress', 'Cancelled': 'b-cancelled', 'Active': 'b-active', 'Inactive': 'b-inactive', 'Available': 'b-avail', 'Busy': 'b-busy', 'On Leave': 'b-leave', 'Admin': 'b-admin', 'Vendor': 'b-vendor', 'Staff': 'b-staff', 'Client': 'b-client', 'Wedding': 'b-wedding', 'Birthday': 'b-birthday', 'Conference': 'b-conf', 'Corporate': 'b-corp', 'Furniture': 'b-furn', 'Audio': 'b-audio', 'Visual': 'b-visual', 'Infrastructure': 'b-infra', 'Decoration': 'b-deco', 'Food & Beverage': 'b-food', 'Media': 'b-media' };
    return this.badge(s, m[s] || 'b-pending');
  },
  prog(a, t) {
    const p = t > 0 ? (a / t) * 100 : 0;
    const col = p < 30 ? '#ef4444' : p < 65 ? '#f59e0b' : '#10b981';
    const cls = p < 30 ? 'pf-lo' : p < 65 ? 'pf-mi' : 'pf-hi';
    return `<div style="min-width:80px"><div style="font-size:11.5px;font-weight:700;color:${col};margin-bottom:3px">${a} / ${t}</div><div style="height:5px;background:rgba(255,255,255,.07);border-radius:5px;overflow:hidden"><div class="${cls}" style="height:100%;width:${p}%;border-radius:5px;transition:width .5s"></div></div></div>`;
  },
  toast(msg, type = 'ok') {
    let c = document.getElementById('_tc');
    if (!c) { c = document.createElement('div'); c.id = '_tc'; c.style.cssText = 'position:fixed;bottom:22px;right:22px;z-index:9999;display:flex;flex-direction:column;gap:7px'; document.body.appendChild(c); }
    const t = document.createElement('div');
    t.style.cssText = 'padding:10px 16px;background:#1a1a2e;border:1px solid rgba(236,72,153,.4);border-radius:8px;font-size:12.5px;color:#f1f5f9;box-shadow:0 8px 24px rgba(0,0,0,.4)';
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => t.remove(), 2800);
  },
  confirm(title, msg, cb) { if (window.confirm(`${title}\n\n${msg}`)) cb(); },
  validate(rules) {
    let ok = true;
    for (const [id, checks] of Object.entries(rules)) {
      const el = document.getElementById(id);
      const er = document.getElementById(id + '_e');
      if (!el) continue;
      const v = el.value.trim();
      let msg = '';
      for (const c of checks) {
        if (c.req && !v) { msg = c.req; break; }
        if (c.email && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { msg = c.email; break; }
        if (c.num && v && isNaN(+v)) { msg = c.num; break; }
        if (c.min !== undefined && +v < c.min) { msg = 'Minimum ' + c.min; break; }
        if (c.maxv !== undefined && +v > c.maxv) { msg = 'Maximum ' + c.maxv; break; }
        if (c.ml && v.length < c.ml) { msg = c.ml; break; }
      }
      el.classList.toggle('fc-err', !!msg);
      if (er) { er.textContent = msg; er.style.display = msg ? 'block' : 'none'; }
      if (msg) ok = false;
    }
    return ok;
  },
  clearV(fid) { const f = document.getElementById(fid); if (!f) return; f.querySelectorAll('.fc-err').forEach((e) => e.classList.remove('fc-err')); f.querySelectorAll('.ferr').forEach((e) => { e.style.display = 'none'; e.textContent = ''; }); },
  vopts() { return EP.vendors.map((v) => `<option value="${v.name}">${v.name}</option>`).join(''); },
  viewDetail(fields) { return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${fields.map(([k, v]) => `<div style="background:#22223a;border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:11px"><div style="font-size:10.5px;text-transform:uppercase;letter-spacing:.07em;color:#64748b;margin-bottom:3px">${k}</div><div style="font-size:13px;font-weight:600;color:#f1f5f9">${v}</div></div>`).join('')}</div>`; },
};

/* Every superuser page ships the sidebar identity as static placeholder markup
   ("Super Admin / superuser@demo.com"). Fill it from the real login session so
   the portal shows whoever is actually signed in. */
document.addEventListener('DOMContentLoaded', () => {
  let s = null;
  try {
    s = JSON.parse(sessionStorage.getItem('checkmate_session') || localStorage.getItem('checkmate_session') || 'null');
  } catch { /* corrupt session -> leave the placeholder text alone */ }
  const u = s && s.user;
  if (!u) return;

  document.querySelectorAll('.sb-un').forEach((el) => { el.textContent = u.name || 'Superuser'; });
  document.querySelectorAll('.sb-ue').forEach((el) => { el.textContent = u.email || ''; });

  // The round avatar shows the first letter of the signed-in user's name.
  const av = document.querySelector('.sb-av');
  if (av && u.name) av.textContent = u.name.trim().charAt(0).toUpperCase();
});
