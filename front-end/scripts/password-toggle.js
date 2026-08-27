document.addEventListener('DOMContentLoaded', () => {
  const eyeIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>`;
  const eyeOffIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>`;

  function initPasswordToggles() {
    const passwordInputs = document.querySelectorAll('input[type="password"]');

    passwordInputs.forEach((input) => {
      // Avoid double-wrapping if already initialized
      if (input.parentElement.classList.contains('pwd-wrapper')) return;

      // 1. Create Wrapper
      const wrapper = document.createElement('div');
      wrapper.className = 'pwd-wrapper';
      
      // Replace input with wrapper, then put input inside wrapper
      input.parentNode.insertBefore(wrapper, input);
      wrapper.appendChild(input);

      // 2. Create Toggle Button
      const btn = document.createElement('button');
      btn.type = 'button'; // critical: prevents form submission
      btn.className = 'pwd-toggle-btn';
      btn.setAttribute('aria-label', 'Show password');
      btn.setAttribute('title', 'Show password');
      btn.innerHTML = eyeOffIcon; // Default is hidden

      // 3. Bind Toggle Logic
      btn.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent any default action
        e.stopPropagation();

        if (input.type === 'password') {
          input.type = 'text';
          btn.innerHTML = eyeIcon;
          btn.setAttribute('aria-label', 'Hide password');
          btn.setAttribute('title', 'Hide password');
        } else {
          input.type = 'password';
          btn.innerHTML = eyeOffIcon;
          btn.setAttribute('aria-label', 'Show password');
          btn.setAttribute('title', 'Show password');
        }
      });

      wrapper.appendChild(btn);
    });
  }

  // Initial setup
  initPasswordToggles();

  // Expose global reset function
  window.resetAllPasswordToggles = () => {
    const wrappers = document.querySelectorAll('.pwd-wrapper');
    wrappers.forEach(wrapper => {
      const input = wrapper.querySelector('input');
      const btn = wrapper.querySelector('.pwd-toggle-btn');
      if (input && btn && input.type === 'text') {
        input.type = 'password';
        btn.innerHTML = eyeOffIcon;
        btn.setAttribute('aria-label', 'Show password');
        btn.setAttribute('title', 'Show password');
      }
    });
  };

  // Bind to all form submits globally to enforce hidden state on submission
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', () => {
      window.resetAllPasswordToggles();
    });
  });

  // Re-run init when modals might be dynamically injected (using MutationObserver)
  const observer = new MutationObserver((mutations) => {
    let shouldInit = false;
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldInit = true;
        break;
      }
    }
    if (shouldInit) {
      initPasswordToggles();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
});
