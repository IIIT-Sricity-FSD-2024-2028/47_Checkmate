document.addEventListener('DOMContentLoaded', () => {
  // 1. Inject the Modal HTML
  const modalHtml = `
    <style>
      .pm-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(6, 10, 20, 0.85); backdrop-filter: blur(8px); z-index: 999999; display: flex; align-items: center; justify-content: center; opacity: 0; visibility: hidden; transition: all 0.3s ease; }
      .pm-card { background: var(--bg-sidebar, #1a1f33); border: 1px solid var(--border, #2a3149); border-radius: 16px; width: 90%; max-width: 650px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(233, 30, 140, 0.08); transform: scale(0.96) translateY(10px); transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); overflow: hidden; font-family: var(--font-body, 'Inter', sans-serif); }
      .pm-header-bar { padding: 20px 28px; border-bottom: 1px solid var(--border, #2a3149); display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.2); }
      .pm-header-bar h3 { margin: 0; font-family: var(--font-display, 'Inter', sans-serif); font-size: 18px; font-weight: 600; color: #fff; }
      .pm-close { background: transparent; border: none; color: var(--text-muted, #64748b); font-size: 20px; cursor: pointer; transition: color 0.2s; }
      .pm-close:hover { color: #fff; }
      
      .pm-content { flex: 1; overflow-y: auto; padding: 32px 28px; display: flex; flex-direction: column; gap: 32px; }
      .pm-content::-webkit-scrollbar { width: 6px; }
      .pm-content::-webkit-scrollbar-thumb { background: var(--border, #2a3149); border-radius: 10px; }
      
      .pm-hero { display: flex; gap: 24px; align-items: center; }
      .pm-avatar-wrapper { position: relative; width: 100px; height: 100px; border-radius: 50%; border: 3px solid var(--pink, #e91e8c); padding: 3px; }
      .pm-avatar { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; background: #2a3149; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 700; color: #fff; }
      .pm-avatar-upload { position: absolute; bottom: 0; right: -4px; width: 32px; height: 32px; background: var(--pink, #e91e8c); color: #fff; border-radius: 50%; display: none; align-items: center; justify-content: center; cursor: pointer; border: 2px solid var(--bg-sidebar, #1a1f33); transition: transform 0.2s; }
      .pm-avatar-upload:hover { transform: scale(1.1); }
      .edit-mode .pm-avatar-upload { display: flex; }
      
      .pm-hero-info { flex: 1; }
      .pm-name { margin: 0 0 8px 0; font-size: 24px; font-family: var(--font-display, 'Inter', sans-serif); font-weight: 700; color: #fff; display: flex; align-items: center; gap: 12px; }
      .pm-role-badge { font-size: 11px; padding: 4px 10px; border-radius: 20px; background: rgba(233,30,140,0.15); color: var(--pink, #e91e8c); border: 1px solid rgba(233,30,140,0.3); text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; }
      .pm-hero-meta { color: var(--text-secondary, #94a3b8); font-size: 13.5px; display: flex; flex-direction: column; gap: 4px; }
      .pm-hero-meta span { display: flex; align-items: center; gap: 8px; }
      
      .pm-edit-toggle { background: rgba(255,255,255,0.05); border: 1px solid var(--border, #2a3149); color: #fff; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
      .pm-edit-toggle:hover { background: rgba(255,255,255,0.1); }
      .edit-mode .pm-edit-toggle { display: none; }
      
      .pm-section { display: flex; flex-direction: column; gap: 16px; }
      .pm-section-title { font-size: 12px; font-weight: 700; color: var(--text-muted, #64748b); text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid var(--border, #2a3149); padding-bottom: 8px; margin: 0; }
      
      .pm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
      .pm-field { display: flex; flex-direction: column; gap: 6px; }
      .pm-field.full { grid-column: 1 / -1; }
      .pm-label { font-size: 12px; font-weight: 600; color: var(--text-secondary, #9b8db0); }
      .pm-value { font-size: 14px; color: #fff; font-weight: 500; min-height: 20px; word-break: break-word; }
      .pm-value.empty { color: var(--text-muted, #64748b); font-style: italic; }
      
      .pm-input { background: rgba(0,0,0,0.2); border: 1px solid var(--border, #2a3149); color: #fff; padding: 10px 12px; border-radius: 8px; font-size: 14px; font-family: inherit; width: 100%; transition: border-color 0.2s; }
      .pm-input:focus { outline: none; border-color: var(--pink, #e91e8c); }
      .pm-input:disabled, .pm-input[readonly] { opacity: 0.6; cursor: not-allowed; }
      
      .pm-footer { padding: 16px 28px; border-top: 1px solid var(--border, #2a3149); display: none; justify-content: flex-end; gap: 12px; background: rgba(0,0,0,0.2); }
      .edit-mode .pm-footer { display: flex; }
      
      /* View/Edit Toggling logic via CSS */
      .pm-input-el { display: none; }
      .edit-mode .pm-input-el { display: block; }
      .edit-mode .pm-value { display: none; }
      
      .pm-loader { position: absolute; inset: 0; background: var(--bg-sidebar, #1a1f33); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 10; color: var(--text-secondary); }
      .pm-spinner { width: 32px; height: 32px; border: 3px solid rgba(233,30,140,0.2); border-top-color: var(--pink, #e91e8c); border-radius: 50%; animation: pm-spin 1s linear infinite; margin-bottom: 16px; }
      @keyframes pm-spin { to { transform: rotate(360deg); } }
    </style>
    
    <div id="pmOverlay" class="pm-overlay">
      <div class="pm-card">
        <div id="pmLoader" class="pm-loader">
          <div class="pm-spinner"></div>
          <span id="pmLoaderText">Loading Profile...</span>
        </div>
        
        <div class="pm-header-bar">
          <h3>Your Profile</h3>
          <button id="pmCloseBtn" class="pm-close"><i class="ph ph-x"></i></button>
        </div>
        
        <div id="pmContentWrapper" class="pm-content">
          <div class="pm-hero">
            <div class="pm-avatar-wrapper">
              <div id="pmAvatarDisplay" class="pm-avatar"></div>
              <label for="pmAvatarUpload" class="pm-avatar-upload">
                <i class="ph-fill ph-camera"></i>
              </label>
              <input type="file" id="pmAvatarUpload" style="display: none;" accept="image/jpeg, image/png, image/webp" />
            </div>
            <div class="pm-hero-info">
              <h2 class="pm-name">
                <span class="pm-value" data-field="name"></span>
                <input type="text" class="pm-input pm-input-el" data-input="name" />
                <span class="pm-role-badge" id="pmRoleBadge">Role</span>
              </h2>
              <div class="pm-hero-meta">
                <span><i class="ph ph-envelope-simple"></i> <span id="pmEmailDisplay"></span></span>
                <span><i class="ph ph-map-pin"></i> <span class="pm-value" data-field="location"></span><input type="text" class="pm-input pm-input-el" data-input="location" placeholder="City, Country" style="padding:4px 8px; font-size:12px; margin-left:4px;"/></span>
                <span style="font-size:11px; margin-top:4px;"><i class="ph ph-clock"></i> Member since: <span id="pmCreatedDisplay"></span></span>
              </div>
            </div>
            <button id="pmEditToggleBtn" class="pm-edit-toggle"><i class="ph ph-pencil-simple"></i> Edit Profile</button>
          </div>
          
          <div class="pm-section">
            <h4 class="pm-section-title">Personal Information</h4>
            <div class="pm-grid">
              <div class="pm-field">
                <label class="pm-label">Phone Number</label>
                <div class="pm-value" data-field="phone"></div>
                <input type="text" class="pm-input pm-input-el" data-input="phone" placeholder="+1 (555) 000-0000" />
              </div>
              <div class="pm-field">
                <label class="pm-label">Date of Birth</label>
                <div class="pm-value" data-field="date_of_birth"></div>
                <input type="date" class="pm-input pm-input-el" data-input="date_of_birth" />
              </div>
              <div class="pm-field full">
                <label class="pm-label">Full Address</label>
                <div class="pm-value" data-field="address"></div>
                <input type="text" class="pm-input pm-input-el" data-input="address" placeholder="123 Main St, Appt 4B..." />
              </div>
            </div>
          </div>
          
          <div class="pm-section">
            <h4 class="pm-section-title">Professional Details</h4>
            <div class="pm-grid">
              <div class="pm-field">
                <label class="pm-label">Years of Experience</label>
                <div class="pm-value" data-field="years_experience"></div>
                <input type="number" class="pm-input pm-input-el" data-input="years_experience" placeholder="e.g. 5" min="0" />
              </div>
              <div class="pm-field">
                <label class="pm-label">Skills / Expertise</label>
                <div class="pm-value" data-field="skills"></div>
                <input type="text" class="pm-input pm-input-el" data-input="skills" placeholder="e.g. Management, DJ, Catering (Comma separated)" />
              </div>
              <div class="pm-field">
                <label class="pm-label">Website</label>
                <div class="pm-value" data-field="website_url"></div>
                <input type="url" class="pm-input pm-input-el" data-input="website_url" placeholder="https://example.com" />
              </div>
              <div class="pm-field">
                <label class="pm-label">LinkedIn URL</label>
                <div class="pm-value" data-field="linkedin_url"></div>
                <input type="url" class="pm-input pm-input-el" data-input="linkedin_url" placeholder="https://linkedin.com/in/..." />
              </div>
            </div>
          </div>
          
          <div class="pm-section">
            <h4 class="pm-section-title">About</h4>
            <div class="pm-field full">
              <div class="pm-value" data-field="bio" style="white-space: pre-wrap; line-height: 1.6;"></div>
              <textarea class="pm-input pm-input-el" data-input="bio" rows="4" placeholder="Tell us about yourself..." style="resize: vertical;"></textarea>
            </div>
          </div>
        </div>
        
        <div class="pm-footer">
          <button id="pmCancelBtn" class="btn btn-ghost" style="padding: 10px 20px;">Cancel</button>
          <button id="pmSaveBtn" class="btn btn-primary" style="padding: 10px 20px;">Save Changes</button>
        </div>
      </div>
    </div>
  `;

  const oldOverlay = document.getElementById('pmOverlay');
  if (oldOverlay) oldOverlay.remove();
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  if (!document.querySelector('script[src*="phosphor-icons"]')) {
    const script = document.createElement('script');
    script.src = "https://unpkg.com/@phosphor-icons/web";
    document.head.appendChild(script);
  }

  // --- Elements ---
  const overlay = document.getElementById('pmOverlay');
  const card = overlay.querySelector('.pm-card');
  const contentWrapper = document.getElementById('pmContentWrapper');
  const loader = document.getElementById('pmLoader');
  const loaderText = document.getElementById('pmLoaderText');
  
  const editToggleBtn = document.getElementById('pmEditToggleBtn');
  const cancelBtn = document.getElementById('pmCancelBtn');
  const saveBtn = document.getElementById('pmSaveBtn');
  const closeBtn = document.getElementById('pmCloseBtn');
  const avatarUpload = document.getElementById('pmAvatarUpload');
  
  // --- Data state ---
  let currentProfileData = null;

  // --- Helpers ---
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getSessionHeaders = () => {
    // Always read fresh from sessionStorage/localStorage — do NOT rely on DB cache
    // which may not be initialised yet when profile-modal.js runs.
    try {
      const raw = sessionStorage.getItem('checkmate_session') || localStorage.getItem('checkmate_session');
      if (raw) {
        const s = JSON.parse(raw);
        if (s && s.user && s.user.email) {
          const role = (s.role || s.user.role || 'vendor').toLowerCase();
          return { 'x-role': role, 'x-email': s.user.email };
        }
      }
    } catch (e) {}
    // Fallback: try DB if available (for pages that initialise DB before this script)
    if (typeof DB !== 'undefined' && typeof DB.getSession === 'function') {
      const s = DB.getSession();
      if (s && s.email) return { 'x-role': (s.role || 'vendor').toLowerCase(), 'x-email': s.email };
    }
    return null;
  };

  const apiCall = async (method, path, body, isFormData = false) => {
    const headers = getSessionHeaders();
    if (!headers) throw new Error("No active session found.");
    if (!isFormData) headers['Content-Type'] = 'application/json';
    
    const opts = { method, headers };
    if (body) opts.body = isFormData ? body : JSON.stringify(body);
    
    const res = await fetch(`http://localhost:3000/api/${path}`, opts);
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || 'API Error');
    }
    if (method !== 'DELETE') return res.json();
  };

  const setViewMode = () => {
    card.classList.remove('edit-mode');
  };

  const setEditMode = () => {
    card.classList.add('edit-mode');
  };

  const populateUI = (data) => {
    currentProfileData = data;
    
    // Header special fields
    document.getElementById('pmRoleBadge').textContent = data.role || 'User';
    document.getElementById('pmEmailDisplay').textContent = data.email || 'No email';
    document.getElementById('pmCreatedDisplay').textContent = data.created ? new Date(data.created).toLocaleDateString() : 'Recently';
    
    // Avatar
    const avatarContainer = document.getElementById('pmAvatarDisplay');
    if (data.profile_picture_url) {
      avatarContainer.innerHTML = `<img src="http://localhost:3000${data.profile_picture_url}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" />`;
    } else {
      avatarContainer.innerHTML = getInitials(data.name);
    }
    
    // Standard fields (text & inputs)
    const fields = ['name', 'location', 'phone', 'date_of_birth', 'address', 'years_experience', 'skills', 'website_url', 'linkedin_url', 'bio'];
    fields.forEach(f => {
      const val = data[f] || '';
      
      // Update View span
      const viewEl = document.querySelector(`.pm-value[data-field="${f}"]`);
      if (viewEl) {
        viewEl.textContent = val;
        if (!val) {
          viewEl.textContent = 'Not provided';
          viewEl.classList.add('empty');
        } else {
          viewEl.classList.remove('empty');
        }
      }
      
      // Update Edit input
      const inputEl = document.querySelector(`.pm-input[data-input="${f}"]`);
      if (inputEl) {
        inputEl.value = val;
      }
    });
  };

  const showInlineError = (msg) => {
    loader.style.display = 'none';
    
    // Remove existing error if any
    const existingErr = document.getElementById('pmInlineError');
    if (existingErr) existingErr.remove();
    
    const errHtml = `
      <div id="pmInlineError" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 10px; color: #fca5a5; font-size: 13px;">
          <i class="ph-fill ph-warning-circle" style="font-size: 18px; color: #ef4444;"></i>
          <span>${msg}</span>
        </div>
        <button id="pmRetryBtn" style="background: transparent; border: 1px solid #ef4444; color: #ef4444; padding: 4px 12px; border-radius: 4px; font-size: 12px; cursor: pointer; transition: all 0.2s;">Retry</button>
      </div>
    `;
    
    contentWrapper.insertAdjacentHTML('afterbegin', errHtml);
    document.getElementById('pmRetryBtn').addEventListener('click', () => {
      document.getElementById('pmInlineError').remove();
      openProfileModal();
    });
  };

  const openProfileModal = async () => {
    overlay.style.visibility = 'visible';
    overlay.style.opacity = '1';
    card.style.transform = 'scale(1) translateY(0)';
    loader.style.display = 'flex';
    setViewMode();
    
    try {
      const profile = await apiCall('GET', 'users/profile');
      if (profile) {
        populateUI(profile);
        loader.style.display = 'none';
      } else {
        showInlineError("Profile data not found for this account.");
      }
    } catch (e) {
      console.error('Profile fetch error:', e);
      showInlineError("Error loading profile. Check authentication or server status.");
    }
  };

  const closeProfileModal = () => {
    overlay.style.opacity = '0';
    card.style.transform = 'scale(0.96) translateY(10px)';
    setTimeout(() => { 
      overlay.style.visibility = 'hidden'; 
      setViewMode();
      // Reset loader for next open
      loader.innerHTML = '<div class="pm-spinner"></div><span id="pmLoaderText">Loading Profile...</span>';
    }, 300);
  };

  // --- Event Listeners ---
  closeBtn.addEventListener('click', closeProfileModal);
  cancelBtn.addEventListener('click', () => {
    // Revert inputs to currentProfileData
    if (currentProfileData) populateUI(currentProfileData);
    setViewMode();
  });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeProfileModal(); });
  editToggleBtn.addEventListener('click', setEditMode);

  saveBtn.addEventListener('click', async () => {
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="ph ph-spinner pm-spin" style="animation: pm-spin 1s linear infinite"></i> Saving...';
    saveBtn.disabled = true;
    
    try {
      // Gather data
      const payload = {};
      const fields = ['name', 'location', 'phone', 'date_of_birth', 'address', 'years_experience', 'skills', 'website_url', 'linkedin_url', 'bio'];
      fields.forEach(f => {
        const inputEl = document.querySelector(`.pm-input[data-input="${f}"]`);
        if (inputEl) {
          const val = inputEl.value.trim();
          if (f === 'years_experience' && val !== '') {
            payload[f] = parseInt(val, 10);
          } else {
            payload[f] = val;
          }
        }
      });
      
      const updatedProfile = await apiCall('PUT', 'users/profile', payload);
      
      // Update session cache with latest name — preserve the full user object structure
      if (typeof DB !== 'undefined') {
        try {
          const raw = sessionStorage.getItem('checkmate_session') || localStorage.getItem('checkmate_session');
          if (raw) {
            const stored = JSON.parse(raw);
            if (stored && stored.user) {
              stored.user.name = updatedProfile.name;
              const key = sessionStorage.getItem('checkmate_session') ? 'checkmate_session' : 'checkmate_session';
              sessionStorage.setItem('checkmate_session', JSON.stringify(stored));
            }
          }
        } catch(e) {}
      }
      
      populateUI(updatedProfile);
      syncSidebarDOM(updatedProfile);
      
      if (typeof Toast !== 'undefined') {
        Toast.show('Profile updated successfully!', 'success');
      } else if (typeof window.showToast === 'function') {
        window.showToast('Profile updated successfully!', 'success');
      }
      setViewMode();
    } catch (e) {
      console.error(e);
      if (typeof Toast !== 'undefined') {
        Toast.show('Failed to update profile. Please try again.', 'error');
      } else {
        alert('Failed to update profile. Please try again.');
      }
    } finally {
      saveBtn.innerHTML = originalText;
      saveBtn.disabled = false;
    }
  });

  avatarUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      if (typeof Toast !== 'undefined') { Toast.show('File too large. Maximum 5MB.', 'error'); } else { alert('File too large. Maximum 5MB.'); }
      return;
    }
    
    // Optimistic UI preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      document.getElementById('pmAvatarDisplay').innerHTML = `<img src="${ev.target.result}" style="width:100%; height:100%; border-radius:50%; object-fit:cover; opacity: 0.5;" />`;
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const updatedUser = await apiCall('POST', 'users/profile/avatar', formData, true);
      if (updatedUser && updatedUser.profile_picture_url) {
        populateUI(updatedUser);
        syncSidebarDOM(updatedUser);
      }
    } catch (e) {
      console.error('Avatar upload failed:', e);
      if (typeof Toast !== 'undefined') { Toast.show('Failed to upload avatar.', 'error'); } else { alert('Failed to upload avatar.'); }
      if (currentProfileData) populateUI(currentProfileData); // revert
    }
  });

  // --- Sidebar DOM Sync ---
  const syncSidebarDOM = (data) => {
    if (!data) return;
    const name = data.name || data.user || '';
    const email = data.email || '';

    // Sync names
    document.querySelectorAll('.user-name, .sb-uname').forEach(el => {
      if (name) el.textContent = name;
    });
    // Sync emails
    document.querySelectorAll('.user-email').forEach(el => {
      if (email) el.textContent = email;
    });
    // Sync avatars
    document.querySelectorAll('.user-avatar, .sb-uavatar').forEach(el => {
      if (data.profile_picture_url) {
        el.innerHTML = `<img src="http://localhost:3000${data.profile_picture_url}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" />`;
        el.style.background = 'transparent';
      } else if (name) {
        el.textContent = getInitials(name);
        el.style.background = 'var(--pink, #e91e8c)';
      }
    });
  };

  // Auto-sync sidebar with active logged-in session data on page load
  const initSidebarFromSession = () => {
    try {
      const raw = sessionStorage.getItem('checkmate_session') || localStorage.getItem('checkmate_session');
      if (raw) {
        const s = JSON.parse(raw);
        if (s) {
          let u = {};
          if (typeof s.user === 'object' && s.user !== null) {
            u = {
              name: s.user.name || s.user.user || '',
              email: s.user.email || s.email || '',
              profile_picture_url: s.user.profile_picture_url || ''
            };
          } else if (typeof s.user === 'string') {
            u = {
              name: s.user,
              email: s.email || ''
            };
          }
          if (!u.name && s.name) u.name = s.name;
          if (!u.email && s.email) u.email = s.email;

          if (u.name || u.email) {
            syncSidebarDOM(u);
          }
        }
      }
    } catch(e) {}
  };

  initSidebarFromSession();
  setTimeout(initSidebarFromSession, 50);
  setTimeout(initSidebarFromSession, 200);
  setTimeout(initSidebarFromSession, 600);

  // --- Attach Triggers to Sidebar Elements ---
  const attachTriggers = () => {
    const triggers = document.querySelectorAll('.user-name, .sb-uname, .user-info, .user-email, .user-avatar');
    triggers.forEach(el => {
      if (el.dataset.pmBound) return;
      el.dataset.pmBound = 'true';
      el.style.cursor = 'pointer';
      el.addEventListener('click', (e) => {
        e.preventDefault();
        openProfileModal();
      });
    });
    // Re-run sidebar sync after binding triggers to ensure content is fresh
    initSidebarFromSession();
  };

  setTimeout(attachTriggers, 100);
  setTimeout(attachTriggers, 500);
});


