document.addEventListener('DOMContentLoaded', () => {
    const notifBtns = document.querySelectorAll('.notif-btn');
    const modalOverlay = document.getElementById('globalNotifModal');
    
    if (!modalOverlay) return;

    const closeBtn = modalOverlay.querySelector('.notif-close-btn');

    // Auto-calculate notification badge based on items
    const notifItemsCount = modalOverlay.querySelectorAll('.notif-item').length;
    notifBtns.forEach(btn => {
        const badge = btn.querySelector('.notif-badge');
        if (badge && notifItemsCount > 0) {
            badge.textContent = notifItemsCount;
            badge.style.display = 'flex'; // Ensure it's visible if there are items
        } else if (badge) {
            badge.style.display = 'none';
        }
    });

    // Open Modal
    notifBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modalOverlay.classList.add('active');
            // Prevent body scroll visually but keep layout intact
            document.body.style.overflow = 'hidden';
            
            // Mark as viewed: Hide the badges and reset counter visually
            const badge = btn.querySelector('.notif-badge');
            if (badge) badge.style.display = 'none';

            // Wait for DOM layout then redraw icons for late-loaded content
            setTimeout(() => {
                if(window.lucide) {
                    lucide.createIcons();
                }
            }, 50);
        });
    });

    // Close Modal via top right Button
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modalOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    // Close Modal via Outside Overlay Click
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Handle Notification Routing
    const notifItems = modalOverlay.querySelectorAll('.notif-item');
    notifItems.forEach(item => {
        item.addEventListener('click', () => {
            if (item.classList.contains('notif-item--blue')) {
                window.location.href = 'vendor-approvals.html';
            } else if (item.classList.contains('notif-item--pink')) {
                window.location.href = 'admin-coordination.html';
            } else if (item.classList.contains('notif-item--orange')) {
                window.location.href = 'issue-tracking.html';
            }
        });
    });
});
