document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = window.CHECKMATE_API_BASE || 'http://localhost:3000/api';
  const SIGNUP_KEY = 'checkmate_signup_draft';

  const redirectByRole = {
    admin: '../admin/admin.html',
    superuser: '../superuser/dashboard.html',
    vendor: '../vendor/dashboard.html',
    client: '../client/client-dashboard.html',
    staff: '../staff/staff.html',
  };

  const roleHeader = {
    Admin: 'admin',
    Superuser: 'superuser',
    Vendor: 'vendor',
    Client: 'client',
    Staff: 'staff',
  };

  function api(method, path, body) {
    const xhr = new XMLHttpRequest();
    xhr.open(method, `${API_BASE}/${path}`, false);
    xhr.setRequestHeader('Content-Type', 'application/json');
    try {
      xhr.send(body === undefined ? null : JSON.stringify(body));
    } catch (error) {
      throw new Error('Cannot reach the backend. Start NestJS on http://localhost:3000.');
    }
    const data = xhr.responseText ? JSON.parse(xhr.responseText) : null;
    if (xhr.status >= 400) {
      throw new Error(data?.message || 'Request failed.');
    }
    return data;
  }

  function draft() {
    try { return JSON.parse(localStorage.getItem(SIGNUP_KEY) || '{}'); } catch { return {}; }
  }

  function saveDraft(patch) {
    localStorage.setItem(SIGNUP_KEY, JSON.stringify({ ...draft(), ...patch }));
  }

  function setSession(payload) {
    const user = payload.user;
    const role = payload.role || roleHeader[user.role] || 'client';
    sessionStorage.setItem('checkmate_session', JSON.stringify({ token: payload.token, user, role }));
    sessionStorage.setItem('accountType', user.role);
  }

  function showError(message) {
    alert(message);
  }

  const cursorGlow = document.createElement('div');
  cursorGlow.classList.add('cursor-glow');
  document.body.appendChild(cursorGlow);
  document.addEventListener('mousemove', (e) => {
    cursorGlow.style.left = e.clientX + 'px';
    cursorGlow.style.top = e.clientY + 'px';
  });

  const formCard = document.querySelector('.form-card');
  const rightPanel = document.querySelector('.right-panel');
  if (rightPanel && formCard) {
    rightPanel.addEventListener('mousemove', (e) => {
      const rect = rightPanel.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      formCard.style.transform = `perspective(1000px) rotateY(${x * 0.02}deg) rotateX(${-y * 0.02}deg) translateY(-5px)`;
    });
    rightPanel.addEventListener('mouseleave', () => {
      formCard.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) translateY(0)';
    });
  }

  if (rightPanel) {
    for (let i = 0; i < 15; i++) {
      const particle = document.createElement('div');
      particle.classList.add('particle');
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.animationDuration = `${Math.random() * 3 + 2}s`;
      particle.style.animationDelay = `${Math.random() * 2}s`;
      rightPanel.appendChild(particle);
    }
  }

  if (!document.getElementById('shake-style')) {
    const style = document.createElement('style');
    style.id = 'shake-style';
    style.innerHTML = `
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-6px) rotate(-1deg); }
        75% { transform: translateX(6px) rotate(1deg); }
      }
      .shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
    `;
    document.head.appendChild(style);
  }

  function validateRequired(form) {
    let ok = true;
    form.querySelectorAll('input[required]').forEach((input) => {
      if (!input.value.trim()) {
        ok = false;
        input.style.borderColor = '#ff2e88';
        input.classList.add('shake');
        setTimeout(() => {
          input.classList.remove('shake');
          input.style.borderColor = '';
        }, 800);
      }
    });
    return ok;
  }

  document.querySelectorAll('input:not([type="password"])').forEach((input) => {
    const value = draft()[input.name];
    if (value) input.value = value;
  });

  const step1 = document.getElementById('signup-form-1');
  if (step1) {
    step1.querySelector('.btn-continue')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (!validateRequired(step1)) return;
      saveDraft({
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
      });
      document.querySelector('.container').classList.add('page-exit');
      setTimeout(() => { window.location.href = 'signup-step2.html'; }, 450);
    });
  }

  const step2 = document.getElementById('signup-form-2');
  if (step2) {
    step2.querySelector('.btn-continue')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (!validateRequired(step2)) return;
      const password = document.getElementById('password').value;
      const confirm = document.getElementById('confirm-password').value;
      if (password.length < 8 || password !== confirm) {
        showError(password.length < 8 ? 'Password must be at least 8 characters.' : 'Passwords do not match.');
        return;
      }
      saveDraft({ password });
      document.querySelector('.container').classList.add('page-exit');
      setTimeout(() => { window.location.href = 'signup-step3.html'; }, 450);
    });
  }

  const typeCards = document.querySelectorAll('.type-card');
  typeCards.forEach((card) => {
    card.addEventListener('click', () => {
      typeCards.forEach((item) => item.classList.remove('selected'));
      card.classList.add('selected');
      saveDraft({ role: card.dataset.type });
    });
  });
  if (typeCards.length > 0 && !document.querySelector('.type-card.selected')) {
    typeCards[0].classList.add('selected');
    saveDraft({ role: typeCards[0].dataset.type });
  }

  const pwdInput = document.getElementById('password');
  if (pwdInput) {
    const strengthContainer = document.createElement('div');
    strengthContainer.className = 'password-strength-container';
    strengthContainer.innerHTML = '<div class="strength-bar"></div>';
    pwdInput.parentNode.appendChild(strengthContainer);
    const strengthBar = strengthContainer.querySelector('.strength-bar');
    pwdInput.addEventListener('input', (e) => {
      const val = e.target.value;
      strengthContainer.classList.toggle('active', val.length > 0);
      let strength = 0;
      if (val.length >= 8) strength += 33;
      if (/[A-Z]/.test(val) && /[a-z]/.test(val)) strength += 33;
      if (/[0-9!@#$%^&*]/.test(val)) strength += 34;
      strengthBar.style.width = strength + '%';
      strengthBar.style.backgroundColor = strength < 40 ? '#ff4b4b' : strength < 80 ? '#fca130' : '#2ecc71';
    });
  }

  const step3Btn = document.querySelector('#signup-form-3 .btn-submit');
  if (step3Btn) {
    step3Btn.addEventListener('click', (e) => {
      e.preventDefault();
      const selectedTypeCard = document.querySelector('.type-card.selected');
      const data = { ...draft(), role: selectedTypeCard ? selectedTypeCard.dataset.type : draft().role || 'Vendor' };
      
      if (data.role === 'Vendor') {
        saveDraft({ role: data.role });
        document.querySelector('.container').classList.add('page-exit');
        setTimeout(() => { window.location.href = 'signup-step4.html'; }, 450);
        return;
      }
      
      const submitBtn = e.currentTarget;
      submitBtn.innerHTML = '<span style="animation: pulse 1s infinite;">Creating account...</span>';
      try {
        const payload = api('POST', 'auth/register', {
          name: `${data.firstName} ${data.lastName}`.trim(),
          email: data.email,
          phone: data.phone,
          password: data.password,
          role: data.role,
        });
        setSession(payload);
        localStorage.removeItem(SIGNUP_KEY);
        document.querySelector('.container').classList.add('page-exit');
        setTimeout(() => { window.location.href = redirectByRole[payload.role]; }, 450);
      } catch (error) {
        submitBtn.innerHTML = 'Finish &rarr;';
        showError(error.message);
      }
    });
  }

  const step4Btn = document.querySelector('#signup-form-4 .btn-submit');
  if (step4Btn) {
    step4Btn.addEventListener('click', (e) => {
      e.preventDefault();
      const data = draft();
      const businessName = document.getElementById('businessName').value.trim();
      
      if (!businessName) {
        showError('Business Name is required.');
        return;
      }

      // Capture actual file names from file inputs
      const fileInputs = document.querySelectorAll('#signup-form-4 input[type="file"]');
      const documents = [];
      const docTypes = ['license', 'tax_id'];
      const docLabels = ['Business License', 'Tax ID / GST'];
      fileInputs.forEach((input, idx) => {
        if (input.files && input.files.length > 0) {
          documents.push({ name: input.files[0].name, type: docTypes[idx] || 'document' });
        } else {
          // Even if no file chosen, record the expected document type
          documents.push({ name: docLabels[idx] || 'Document', type: docTypes[idx] || 'document' });
        }
      });
      
      const submitBtn = e.currentTarget;
      submitBtn.innerHTML = '<span style="animation: pulse 1s infinite;">Submitting...</span>';
      try {
        const payload = api('POST', 'vendor-applications', {
          vendorName: `${data.firstName} ${data.lastName}`.trim(),
          businessName: businessName,
          email: data.email,
          phone: data.phone || '',
          category: 'General',
          documents: documents,
          passwordHash: data.password // Raw password; will be hashed on approval by backend
        });
        localStorage.removeItem(SIGNUP_KEY);
        alert('Application submitted successfully! Please wait for admin approval.');
        document.querySelector('.container').classList.add('page-exit');
        setTimeout(() => { window.location.href = '../LandingPage/index.html'; }, 450);
      } catch (error) {
        submitBtn.innerHTML = 'Submit Application &rarr;';
        showError(error.message);
      }
    });
  }

  document.querySelectorAll('.btn-secondary').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetUrl = btn.getAttribute('href');
      document.querySelector('.container').classList.add('page-exit');
      setTimeout(() => { window.location.href = targetUrl; }, 450);
    });
  });

  document.getElementById('loginBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    if (!email || !password) {
      showError('Enter your email and password.');
      return;
    }
    try {
      const payload = api('POST', 'auth/login', { email, password });
      setSession(payload);
      localStorage.removeItem('checkmate_admin_baseline');
      window.location.href = redirectByRole[payload.role] || '../LandingPage/index.html';
    } catch (error) {
      showError(error.message);
    }
  });
});
