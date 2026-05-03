/* ═══════════════════════════════════════════
   vendor.js  —  Global vendor helpers
   • Toast notifications
   • Confirm-delete modal factory
   • Modal open/close helpers
   • Shared UI utilities
   • Live notification badge
   • Sidebar user info from session
═══════════════════════════════════════════ */

/* ── Toast ─────────────────────────────── */
const Toast = (() => {
  let _el = null;

  function _ensure() {
    if (_el) return;
    _el = document.createElement('div');
    _el.style.cssText = `
      position:fixed;bottom:28px;right:28px;z-index:9999;
      display:flex;align-items:center;gap:10px;
      padding:12px 20px;border-radius:8px;
      font-family:var(--font-body);font-size:13.5px;font-weight:500;
      box-shadow:0 8px 28px rgba(0,0,0,0.45);
      transform:translateY(80px);opacity:0;
      transition:all 0.28s cubic-bezier(.22,1,.36,1);
      pointer-events:none;
    `;
    document.body.appendChild(_el);
  }

  function show(msg, type = 'success', duration = 3000) {
    _ensure();
    const colors = {
      success: { bg:'#15803d', icon:'✓' },
      error:   { bg:'#b91c1c', icon:'✕' },
      info:    { bg:'#1d4ed8', icon:'ℹ' },
      warn:    { bg:'#b45309', icon:'⚠' },
    };
    const { bg, icon } = colors[type] || colors.success;
    _el.style.background = bg;
    _el.style.color = '#fff';
    _el.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
    _el.style.transform = 'translateY(0)';
    _el.style.opacity = '1';
    clearTimeout(_el._timer);
    _el._timer = setTimeout(() => {
      _el.style.transform = 'translateY(80px)';
      _el.style.opacity = '0';
    }, duration);
  }

  return { show };
})();

/* ── Confirm Modal ──────────────────────── */
const Confirm = (() => {
  let _overlay = null;

  function _build() {
    _overlay = document.createElement('div');
    _overlay.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,0.65);
      backdrop-filter:blur(4px);z-index:500;
      display:flex;align-items:center;justify-content:center;
      opacity:0;pointer-events:none;transition:opacity 0.2s;
    `;
    _overlay.innerHTML = `
      <div style="
        background:var(--bg-card);border:1px solid var(--border);
        border-radius:12px;width:min(400px,92vw);padding:28px;
        box-shadow:0 24px 64px rgba(0,0,0,0.6);
        transform:translateY(12px);transition:transform 0.22s;
      " id="_confirmBox">
        <div style="font-family:var(--font-display);font-size:17px;font-weight:700;color:var(--text-primary);margin-bottom:8px" id="_confirmTitle">Are you sure?</div>
        <div style="font-size:13.5px;color:var(--text-secondary);margin-bottom:24px;line-height:1.55" id="_confirmMsg"></div>
        <div style="display:flex;gap:10px;justify-content:flex-end">
          <button id="_confirmCancel" style="
            padding:10px 22px;background:transparent;border:1px solid var(--border);
            border-radius:8px;color:var(--text-secondary);font-family:var(--font-body);
            font-size:13.5px;font-weight:500;cursor:pointer;
          ">Cancel</button>
          <button id="_confirmOk" style="
            padding:10px 22px;background:#b91c1c;border:none;
            border-radius:8px;color:#fff;font-family:var(--font-body);
            font-size:13.5px;font-weight:600;cursor:pointer;
          ">Delete</button>
        </div>
      </div>`;
    document.body.appendChild(_overlay);
    document.getElementById('_confirmCancel').onclick = () => _close();
    _overlay.addEventListener('click', e => { if (e.target === _overlay) _close(); });
  }

  function _open() {
    _overlay.style.opacity = '1';
    _overlay.style.pointerEvents = 'auto';
    document.getElementById('_confirmBox').style.transform = 'translateY(0)';
  }

  function _close() {
    _overlay.style.opacity = '0';
    _overlay.style.pointerEvents = 'none';
    document.getElementById('_confirmBox').style.transform = 'translateY(12px)';
  }

  function ask({ title = 'Delete?', msg = 'This action cannot be undone.', okLabel = 'Delete', okColor = '#b91c1c' } = {}) {
    if (!_overlay) _build();
    document.getElementById('_confirmTitle').textContent = title;
    document.getElementById('_confirmMsg').textContent   = msg;
    const okBtn = document.getElementById('_confirmOk');
    okBtn.textContent      = okLabel;
    okBtn.style.background = okColor;
    _open();
    return new Promise(resolve => {
      okBtn.onclick = () => { _close(); resolve(true); };
      document.getElementById('_confirmCancel').onclick = () => { _close(); resolve(false); };
    });
  }

  return { ask };
})();

/* ── Modal overlay CSS (injected once) ───── */
(function injectModalCSS() {
  if (document.getElementById('_modalCSS')) return;
  const s = document.createElement('style');
  s.id = '_modalCSS';
  s.textContent = `
    .modal-overlay {
      display:none;position:fixed;inset:0;
      background:rgba(0,0,0,0.65);backdrop-filter:blur(4px);
      z-index:400;align-items:center;justify-content:center;
    }
    .modal-overlay.open { display:flex; }
    .modal {
      background:var(--bg-card);border:1px solid var(--border);
      border-radius:12px;box-shadow:0 24px 64px rgba(0,0,0,0.6);
      max-height:90vh;overflow-y:auto;
    }
    /* reuse ri-input / ri-select / ri-cancel styles across modals */
    .ri-input,.ri-textarea,.ri-select {
      background:rgba(255,255,255,0.04);border:1px solid var(--border);
      border-radius:var(--radius-sm);padding:11px 14px;
      color:var(--text-primary);font-family:var(--font-body);
      font-size:13.5px;outline:none;width:100%;transition:border-color 0.18s;
    }
    .ri-input:focus,.ri-textarea:focus,.ri-select:focus { border-color:rgba(233,30,140,0.5); }
    .ri-input::placeholder,.ri-textarea::placeholder { color:var(--text-muted); }
    .ri-select { appearance:none;cursor:pointer; }
    .ri-select option { background:#2e1c40; }
    .ri-select-wrap { position:relative; }
    .ri-cancel {
      padding:12px 22px;background:transparent;border:1px solid var(--border);
      border-radius:var(--radius-sm);color:var(--text-secondary);
      font-family:var(--font-body);font-size:14px;font-weight:500;cursor:pointer;
    }
    .ri-cancel:hover { border-color:var(--border-hover);color:var(--text-primary); }
    .ri-submit {
      flex:1;display:flex;align-items:center;justify-content:center;gap:8px;
      padding:12px;background:var(--pink);border:none;border-radius:var(--radius-sm);
      color:#fff;font-family:var(--font-body);font-size:14px;font-weight:600;
      cursor:pointer;box-shadow:0 4px 18px var(--pink-glow);
    }
    .ri-submit:hover { background:var(--pink-light); }
    @keyframes _livePulse {
      0%,100% { opacity:1; transform:scale(1); }
      50%      { opacity:0.5; transform:scale(0.75); }
    }
  `;
  document.head.appendChild(s);
})();

/* ── Generic Modal helpers ──────────────── */
function openModal(el)  { el.classList.add('open'); }
function closeModal(el) { el.classList.remove('open'); }
function wireModalClose(overlayEl, ...btns) {
  btns.forEach(b => b && b.addEventListener('click', () => closeModal(overlayEl)));
  overlayEl.addEventListener('click', e => { if (e.target === overlayEl) closeModal(overlayEl); });
}

/* ── Shared utils ───────────────────────── */
function uid(prefix = 'ID') { return `${prefix}${Date.now().toString(36).toUpperCase()}`; }

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}

function initTopbarSearch(onSearch) {
  const box = document.querySelector('.search-box input');
  if (box && onSearch) box.addEventListener('input', e => onSearch(e.target.value.trim().toLowerCase()));
}

function statusBadge(status) {
  if (status === 'live') {
    return `<span class="status-badge confirmed" style="background:rgba(239,68,68,0.18);color:#fca5a5;border:1px solid rgba(239,68,68,0.35);display:inline-flex;align-items:center;gap:5px;">
      <span style="width:6px;height:6px;border-radius:50%;background:#ef4444;animation:_livePulse 1.4s ease-in-out infinite;flex-shrink:0;"></span>LIVE
    </span>`;
  }
  if (status === 'completed') {
    return `<span class="status-badge confirmed" style="background:rgba(100,116,139,0.15);color:#94a3b8;border:1px solid rgba(100,116,139,0.25);">Completed</span>`;
  }
  const map = { pending:'pending', confirmed:'confirmed', approved:'confirmed', rejected:'rejected' };
  const cls = map[status] || 'pending';
  return `<span class="status-badge ${cls}">${status}</span>`;
}

const CAT_CLASS = {
  Equipment:'badge--conference', Furniture:'badge--birthday', Decor:'badge--wedding',
  Conference:'badge--conference', Wedding:'badge--wedding', Corporate:'badge--corporate', Birthday:'badge--birthday',
};

const AVATAR_COLORS = ['pink','teal','purple','green','orange'];
function avatarClass(idx) { return `avatar--${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`; }

/* ── Sidebar user from session (runs on every page) ── */
document.addEventListener('DOMContentLoaded', () => {
  const s = DB.getSession();
  const userName = s.user || 'Vendor';
  const userEmail = s.email || '';
  const userRole = s.role || 'Vendor';
  document.querySelectorAll('.user-name').forEach(el  => el.textContent = userName);
  document.querySelectorAll('.user-email').forEach(el => el.textContent = userEmail);
  document.querySelectorAll('.user-avatar').forEach(el => el.textContent = userName[0] || 'V');
  document.querySelectorAll('.brand-role').forEach(el  => el.textContent = userRole);

  /* Live notification badge = pending events count */
  const events = DB.getAll('events');
  const pending = Array.isArray(events) ? events.filter(e => e.status === 'pending').length : 0;
  document.querySelectorAll('.notif-badge').forEach(el => {
    el.textContent = pending || '';
    el.style.display = pending ? '' : 'none';
  });

  /* Logout */
  document.querySelectorAll('.logout-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      sessionStorage.removeItem('checkmate_session');
      sessionStorage.removeItem('accountType');
      localStorage.removeItem('checkmate_session');
      localStorage.removeItem('accountType');
      Toast.show('Logged out. Redirecting…', 'info', 1500);
      setTimeout(() => window.location.href = '../LandingPage/index.html', 1600);
    });
  });
});