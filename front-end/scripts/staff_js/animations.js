/**
 * animations.js
 * Handles scroll intersection observing and interactive dynamic animation classes.
 */

export function initAnimations() {
  // 1. Setup Intersection Observer for scroll-into-view fade ups
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -20px 0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    // Process all entries, filter to visible ones
    const visibleEntries = entries.filter(e => e.isIntersecting);
    
    // Sort vertically to ensure top-to-bottom sequence if they enter simultaneously
    visibleEntries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
    
    // Apply class with sequential stagger
    visibleEntries.forEach((entry, index) => {
      setTimeout(() => {
        entry.target.classList.add('anim-visible');
      }, index * 80); // 80ms stagger
      // Optional: unobserve if you only want animations once
      observer.unobserve(entry.target);
    });
  }, observerOptions);

  // Apply target class to elements we want to animate
  const targets = document.querySelectorAll('.card, .stat-card, .event-card, .ach-item');
  targets.forEach(target => {
    target.classList.add('anim-target'); // adds base CSS transform/opacity
    observer.observe(target);
  });

  // 2. Add visual flare to Kanban Dragging
  // We hook into the global drag functions mapped by taskBoard.js
  document.addEventListener('dragstart', (e) => {
    if(e.target && e.target.classList && e.target.classList.contains('task-card')) {
       e.target.classList.add('dragging');
    }
  });

  document.addEventListener('dragend', (e) => {
    if(e.target && e.target.classList && e.target.classList.contains('task-card')) {
       e.target.classList.remove('dragging');
    }
  });

  // 3. Make the report issue form handle shake on empty
  // Intercept global submitIssue if it exists
  const origSubmit = window.submitIssue;
  if(typeof window.submitIssue === 'function') {
      window.submitIssue = function() {
        const title = document.querySelector('.form-input').value.trim();
        if(!title) {
            const wrap = document.querySelector('.form-input').parentElement;
            wrap.classList.remove('shake');
            void wrap.offsetWidth; // trigger reflow to restart animation
            wrap.classList.add('shake');
        }
        origSubmit.apply(this, arguments);
      }
  }
}
