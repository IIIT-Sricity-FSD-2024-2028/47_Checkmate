document.addEventListener('DOMContentLoaded', () => {
  // Check if we already showed the welcome modal this session
  if (sessionStorage.getItem('welcome_shown')) return;

  const session = typeof DB !== 'undefined' ? DB.getSession() : null;
  if (!session || !session.user) return;

  // Mark as shown for this session
  sessionStorage.setItem('welcome_shown', 'true');

  const role = String(session.role).toLowerCase();
  let summaryText = 'Welcome to your dashboard.';
  
  if (typeof DB !== 'undefined') {
    const events = DB.getAll('events') || [];
    const staff = DB.getAll('staff') || [];
    const assignments = DB.getAll('staffAssignments') || [];
    
    if (role === 'admin' || role === 'superuser') {
      const pendingApps = DB.getAll('vendorApplications')?.filter(a => a.status === 'pending').length || 0;
      summaryText = `You have ${pendingApps} pending vendor applications and ${events.filter(e => e.status === 'pending').length} event requests awaiting review.`;
    } else if (role === 'vendor') {
      const activeEvents = events.filter(e => e.status === 'confirmed' || e.status === 'live').length;
      summaryText = `You are managing ${activeEvents} active events. ${staff.filter(s => s.status === 'available').length} staff members are currently available.`;
    } else if (role === 'staff') {
      const myTasks = assignments.filter(a => a.staffName === session.user && a.status === 'pending').length;
      summaryText = `You have ${myTasks} new task assignments pending your acceptance.`;
    } else if (role === 'client') {
      const myEvents = events.filter(e => e.createdBy === 'client' && (e.status === 'live' || e.status === 'confirmed')).length;
      summaryText = `You have ${myEvents} events currently in progress or confirmed.`;
    }
  }

  const overlayHtml = `
    <div id="welcomeOverlay" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(6, 10, 20, 0.85); backdrop-filter: blur(8px); z-index: 999999; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.4s ease;">
      <div style="background: var(--bg-sidebar, #1a1f33); border: 1px solid rgba(233, 30, 140, 0.3); border-radius: 16px; padding: 32px; max-width: 400px; width: 90%; text-align: center; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(233, 30, 140, 0.15); transform: translateY(20px); transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
        <div style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, var(--pink, #e91e8c), var(--purple, #8b5cf6)); color: white; display: flex; align-items: center; justify-content: center; font-size: 32px; margin: 0 auto 20px;">
          <i class="ph-fill ph-hand-waving"></i>
        </div>
        <h2 style="font-family: var(--font-display, 'Inter', sans-serif); font-size: 22px; color: var(--text-primary, #fff); margin-bottom: 12px;">Welcome back, ${session.user.split(' ')[0]}!</h2>
        <p style="color: var(--text-secondary, #94a3b8); font-size: 14px; line-height: 1.6; margin-bottom: 24px;">${summaryText}</p>
        <button id="welcomeDismissBtn" class="ri-submit" style="width: 100%; padding: 12px; background: var(--pink, #e91e8c); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: filter 0.2s;">
          Go to Dashboard
        </button>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', overlayHtml);

  // Add phosphor icons if missing
  if (!document.querySelector('script[src*="phosphor-icons"]')) {
    const script = document.createElement('script');
    script.src = "https://unpkg.com/@phosphor-icons/web";
    document.head.appendChild(script);
  }

  const overlay = document.getElementById('welcomeOverlay');
  const innerCard = overlay.querySelector('div');
  
  // Trigger animation
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
    innerCard.style.transform = 'translateY(0)';
  });

  const dismiss = () => {
    overlay.style.opacity = '0';
    innerCard.style.transform = 'translateY(20px)';
    setTimeout(() => overlay.remove(), 400);
  };

  document.getElementById('welcomeDismissBtn').addEventListener('click', dismiss);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) dismiss();
  });
});
