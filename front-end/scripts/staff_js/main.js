export function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    Object.assign(container.style, {
      position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: '10px'
    });
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const bgColor = type === 'success' ? 'var(--green, #22c55e)' : 
                  (type === 'error' ? 'var(--red, #ef4444)' : 'var(--pink, #e0157a)');
                  
  Object.assign(toast.style, {
    background: bgColor,
    color: '#fff', padding: '12px 20px', borderRadius: '8px',
    fontSize: '13px', fontWeight: '500', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    opacity: '0', transform: 'translateY(10px)', transition: 'all 0.3s ease'
  });
  toast.innerText = message;
  
  container.appendChild(toast);
  requestAnimationFrame(() => { 
    toast.style.opacity = '1'; 
    toast.style.transform = 'translateY(0)'; 
  });
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Make globally accessible for any retained inline scripts
window.showToast = showToast;

document.addEventListener('DOMContentLoaded', () => {
  // 1. Page Transitions (Fade-in)
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.4s ease';
  requestAnimationFrame(() => document.body.style.opacity = '1');

  // 3. Hover Glow interactions
  document.querySelectorAll('.card, .stat-card, .event-card').forEach(el => {
    el.addEventListener('mouseenter', () => el.classList.add('hover-glow'));
    el.addEventListener('mouseleave', () => el.classList.remove('hover-glow'));
  });

  // 4. Client-side Routing to load page-specific JS
  const path = window.location.pathname.toLowerCase();
  
  if (path.includes('staff.html')) {
    import('./dashboard.js').then(m => m.initDashboard());
  } else if (path.includes('assignedevents.html')) {
    import('./assignedEvents.js').then(m => m.initAssignedEvents());
  } else if (path.includes('taskboard.html')) {
    import('./taskBoard.js').then(m => m.initTaskBoard());
  } else if (path.includes('schedule.html')) {
    import('./schedule.js').then(m => m.initSchedule());
  } else if (path.includes('performance.html')) {
    import('./performance.js').then(m => m.initPerformance());
  } else if (path.includes('report.html')) {
    import('./reportIssue.js').then(m => m.initReportIssue());
  } else if (path.includes('messages.html')) {
    import('./messages.js');
  }

  // 5. Initialize Animation System
  import('./animations.js').then(m => m.initAnimations());
});
