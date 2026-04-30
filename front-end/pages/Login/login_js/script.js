document.addEventListener('DOMContentLoaded', () => {

  // --- Premium Animations & Interactions ---

  // 1. Glowing Cursor Effect
  const cursorGlow = document.createElement('div');
  cursorGlow.classList.add('cursor-glow');
  document.body.appendChild(cursorGlow);

  document.addEventListener('mousemove', (e) => {
    cursorGlow.style.left = e.clientX + 'px';
    cursorGlow.style.top = e.clientY + 'px';
  });

  // 2. Parallax effect on the form card
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
      formCard.style.transform = `perspective(1000px) rotateY(0deg) rotateX(0deg) translateY(0)`;
    });
  }

  // 3. Floating Particles Background
  const createParticles = () => {
    if(!rightPanel) return;
    for (let i = 0; i < 15; i++) {
      const particle = document.createElement('div');
      particle.classList.add('particle');
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.animationDuration = `${Math.random() * 3 + 2}s`;
      particle.style.animationDelay = `${Math.random() * 2}s`;
      rightPanel.appendChild(particle);
    }
  };
  createParticles();

  // --- Core Functional Logic ---

  // Input validation and smooth page transitions
  const continueBtns = document.querySelectorAll('.btn-continue');
  
  continueBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const form = btn.closest('form');
      if (!form) return;

      const isSubmitType = btn.getAttribute('type') === 'submit';
      let isValid = true;
      const inputs = form.querySelectorAll('input[required]');
      
      inputs.forEach(input => {
        if (!input.value.trim()) {
          isValid = false;
          input.style.borderColor = '#ff2e88';
          input.classList.add('shake');
          setTimeout(() => {
            input.classList.remove('shake');
            input.style.borderColor = '';
          }, 800);
        }
      });

      // Password Validation (Step 2)
      const password = form.querySelector('#password');
      const confirmPwd = form.querySelector('#confirm-password');
      if (password && confirmPwd && password.value !== confirmPwd.value) {
        isValid = false;
        confirmPwd.style.borderColor = '#ff2e88';
        confirmPwd.classList.add('shake');
        setTimeout(() => confirmPwd.classList.remove('shake'), 800);
      }
      
      // If valid, save data and transition
      if (isValid) {
        e.preventDefault();

        // Save form data specifically avoiding passwords to localStorage (for demo)
        const formData = new FormData(form);
        for (let [key, value] of formData.entries()) {
          if(!key.toLowerCase().includes('password')) {
            localStorage.setItem(key, value);
          }
        }
        
        let targetUrl = btn.getAttribute('href');
        if(!targetUrl) targetUrl = form.getAttribute('action');

        if (targetUrl && targetUrl !== '#') {
          // Play exit animation
          document.querySelector('.container').classList.add('page-exit');
          setTimeout(() => {
            window.location.href = targetUrl;
          }, 450); // Matches animation duration
        }
      } else if (!isSubmitType) {
        e.preventDefault();
      }
    });
  });

  // Basic shake animation dynamically added if not in CSS
  if(!document.getElementById('shake-style')) {
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

  // Account Type Selection Logic for Step 3
  const typeCards = document.querySelectorAll('.type-card');
  if (typeCards.length > 0) {
    typeCards.forEach(card => {
      card.addEventListener('click', () => {
        typeCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        const type = card.dataset.type;
        localStorage.setItem('accountType', type);
      });
    });
    
    // Set first card default
    if (!document.querySelector('.type-card.selected')) {
      typeCards[0].classList.add('selected');
      localStorage.setItem('accountType', typeCards[0].dataset.type);
    }
  }

  // Password Strength meter for Step 2
  const pwdInput = document.getElementById('password');
  if (pwdInput) {
    const strengthContainer = document.createElement('div');
    strengthContainer.className = 'password-strength-container';
    strengthContainer.innerHTML = '<div class="strength-bar"></div>';
    pwdInput.parentNode.appendChild(strengthContainer);
    
    const strengthBar = strengthContainer.querySelector('.strength-bar');

    pwdInput.addEventListener('input', (e) => {
      const val = e.target.value;
      if (val.length > 0) {
        strengthContainer.classList.add('active');
        let strength = 0;
        if (val.length >= 8) strength += 33;
        if (/[A-Z]/.test(val) && /[a-z]/.test(val)) strength += 33;
        if (/[0-9!@#$%^&*]/.test(val)) strength += 34;

        strengthBar.style.width = strength + '%';
        
        if (strength < 40) strengthBar.style.backgroundColor = '#ff4b4b';
        else if (strength < 80) strengthBar.style.backgroundColor = '#fca130';
        else strengthBar.style.backgroundColor = '#2ecc71';
      } else {
        strengthContainer.classList.remove('active');
      }
    });
  }

  // Pre-fill inputs from localStorage
  const inputs = document.querySelectorAll('input:not([type="password"])');
  inputs.forEach(input => {
    if (input.name) {
      const savedValue = localStorage.getItem(input.name);
      if (savedValue) {
        input.value = savedValue;
      }
    }
  });

  // Final submission on step 3
  const submitBtn = document.querySelector('.btn-submit');
  if (submitBtn) {
    submitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      
      const btnText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<span style="animation: pulse 1s infinite;">Processing...</span>';
      
      setTimeout(() => {
        document.querySelector('.container').classList.add('page-exit');
        setTimeout(() => {
          const selectedTypeCard = document.querySelector('.type-card.selected');
          const type = selectedTypeCard ? selectedTypeCard.dataset.type : 'Vendor';
          
          let redirectUrl = '../vendor/dashboard.html';
          if (type === 'Client') {
            redirectUrl = '../client/client-dashboard.html';
          } else if (type === 'Staff') {
            redirectUrl = '../staff/staff.html';
          }
          
          window.location.href = redirectUrl;
        }, 450);
      }, 1500);
    });
  }

  // Handle back buttons smoothly
  const backBtns = document.querySelectorAll('.btn-secondary');
  backBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetUrl = btn.getAttribute('href');
      document.querySelector('.container').classList.add('page-exit');
      setTimeout(() => {
        window.location.href = targetUrl;
      }, 450);
    });
  });
  const loginBtn = document.getElementById("loginBtn");

if (loginBtn) {
  loginBtn.addEventListener("click", (e) => {
    e.preventDefault(); // ✅ STOP form reload

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if(password == '1234')
      {
        switch (email) {
  case 'admin@demo.com':
    window.location.href = "../admin/admin.html";
    break;
  case 'client@demo.com':
    window.location.href = "../client/client-dashboard.html";
    break;
  case 'vendor@demo.com':
    window.location.href = "../vendor/dashboard.html";
    break;
  case 'staff@demo.com':
    window.location.href = "../staff/staff.html";
    break;
  case 'superuser@demo.com':
    window.location.href = "../superuser/dashboard.html";
    break;
  default:
    alert("Invalid email or password");
}
}
      else{alert("Invalid email or password");}

  });
}

});


