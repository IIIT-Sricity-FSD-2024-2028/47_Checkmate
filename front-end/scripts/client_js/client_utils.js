document.addEventListener('DOMContentLoaded', () => {
    
    // Inject dynamic CSS for the magnificent Notification Modal
    const styleBlock = document.createElement('style');
    styleBlock.innerHTML = `
        .notif-modal-overlay {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(6, 10, 20, 0.75);
            backdrop-filter: blur(12px);
            z-index: 99999;
            display: flex; align-items: center; justify-content: center;
            opacity: 0; visibility: hidden; transition: all 0.3s ease;
        }
        .notif-modal-overlay.show { opacity: 1; visibility: visible; }
        
        .notif-modal-card {
            background: var(--bg-sidebar);
            border: 1px solid rgba(233, 30, 140, 0.3);
            border-radius: 16px;
            width: 90%; max-width: 500px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(233, 30, 140, 0.1);
            transform: scale(0.9) translateY(20px);
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            overflow: hidden;
            display: flex; flex-direction: column;
        }
        .notif-modal-overlay.show .notif-modal-card {
            transform: scale(1) translateY(0);
        }
        
        .n-modal-header {
            padding: 24px; border-bottom: 1px solid var(--border);
            display: flex; justify-content: space-between; align-items: center;
            background: linear-gradient(90deg, rgba(233,30,140,0.1) 0%, transparent 100%);
        }
        .n-modal-header h3 { font-family: var(--font-display); font-size: 18px; font-weight: 600; display:flex; align-items:center; gap:8px; margin:0;}
        .n-modal-header h3 i { color: var(--pink); font-size: 24px; }
        
        .n-btn-close {
            background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius:8px; width:36px; height:36px; display:flex; align-items:center; justify-content:center; color: var(--text-muted); font-size: 18px; cursor: pointer; transition: all 0.2s;
        }
        .n-btn-close:hover { color: var(--pink); border-color:var(--pink); background:rgba(233,30,140,0.1); }

        .n-modal-body {
            padding: 0; max-height: 480px; overflow-y: auto;
        }

        .n-item {
            padding: 24px; border-bottom: 1px solid var(--border);
            display: flex; gap: 16px; transition: background 0.2s; cursor: pointer;
            align-items: flex-start;
            position:relative;
            overflow:hidden;
        }
        .n-item:hover { background: var(--bg-hover); }
        .n-item.unread { background: rgba(233, 30, 140, 0.03); }
        .n-item.unread::before { content:''; position:absolute; left:0; top:0; height:100%; width:4px; background:var(--pink); }

        .n-icon {
            width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
            display: flex; align-items: center; justify-content: center; font-size: 22px;
            background: rgba(255, 255, 255, 0.05); color: var(--text-primary); transition:all 0.3s;
        }
        .n-item.unread .n-icon {
            background: linear-gradient(135deg, var(--pink), var(--purple)); color: #fff;
            box-shadow: 0 4px 15px rgba(233, 30, 140, 0.3);
        }

        .n-content { flex: 1; }
        .n-text { font-size: 14px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 8px; }
        .n-text strong { color: var(--text-primary); font-weight: 600; }
        
        .n-meta { display: flex; justify-content: space-between; align-items: center; }
        .n-time { font-size: 11.5px; color: var(--text-muted); display:flex; gap:6px; align-items:center;}
        .n-action { font-size: 13px; color: var(--pink); font-weight: 600; opacity: 0; transition: all 0.2s; transform:translateX(-10px); display:flex; align-items:center; gap:4px; }
        .n-item:hover .n-action { opacity: 1; transform:translateX(0); text-decoration: none;}

        .n-modal-footer {
            padding: 16px 24px; border-top: 1px solid var(--border);
            text-align: center; background:rgba(0,0,0,0.2);
        }
        .n-mark-read {
            background: transparent; border: none; color: var(--text-muted); font-size: 13px; font-weight: 600; cursor: pointer; transition: color 0.2s; display:inline-flex; gap:6px; align-items:center;
        }
        .n-mark-read:hover { color: var(--text-primary); }
    `;
    document.head.appendChild(styleBlock);

    // 1. Generate Modal Overlay HTML Universally
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'notif-modal-overlay';
    modalOverlay.id = 'dynamicNotifModal';
    
    modalOverlay.innerHTML = `
        <div class="notif-modal-card" onclick="event.stopPropagation()">
            <div class="n-modal-header">
                <h3><i class="ph-fill ph-bell-ringing"></i> Notifications Center</h3>
                <button class="n-btn-close" id="closeNotifModal"><i class="ph ph-x"></i></button>
            </div>
            
            <div class="n-modal-body">
                <div class="n-item unread" onclick="window.location.href='client_trackprogress.html'">
                    <div class="n-icon"><i class="ph ph-rocket-launch"></i></div>
                    <div class="n-content">
                        <div class="n-text"><strong>Corporate Gala</strong> execution sequence has initiated! Live tracking is now engaged.</div>
                        <div class="n-meta">
                            <span class="n-time"><i class="ph ph-clock"></i> Just now</span>
                            <span class="n-action">Track Live &rarr;</span>
                        </div>
                    </div>
                </div>
                
                <div class="n-item unread" onclick="window.location.href='client_coordination.html'">
                    <div class="n-icon"><i class="ph ph-chat-teardrop-text"></i></div>
                    <div class="n-content">
                        <div class="n-text"><strong>Sarah Johnson</strong> sent you a direct message regarding the catering selections.</div>
                        <div class="n-meta">
                            <span class="n-time"><i class="ph ph-clock"></i> 1 hour ago</span>
                            <span class="n-action">Reply &rarr;</span>
                        </div>
                    </div>
                </div>
                
                <div class="n-item unread" onclick="window.location.href='client_billing.html'">
                    <div class="n-icon"><i class="ph ph-receipt"></i></div>
                    <div class="n-content">
                        <div class="n-text">A new secure invoice <strong>INV-2026-081</strong> has been automatically generated for review.</div>
                        <div class="n-meta">
                            <span class="n-time"><i class="ph ph-clock"></i> Yesterday</span>
                            <span class="n-action">View Invoice &rarr;</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="n-modal-footer">
                <button class="n-mark-read" id="markAllReadModal"><i class="ph ph-checks"></i> Mark all as read</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modalOverlay);

    // 2. Logic for Modal Control
    const closeModalBtn = modalOverlay.querySelector('#closeNotifModal');
    const markAllBtn = modalOverlay.querySelector('#markAllReadModal');
    const notifItems = modalOverlay.querySelectorAll('.n-item');
    
    closeModalBtn.addEventListener('click', () => modalOverlay.classList.remove('show'));
    modalOverlay.addEventListener('click', () => modalOverlay.classList.remove('show'));

    // 3. Inject Bell Button to Topbar globally
    const topbars = document.querySelectorAll('.topbar');
    
    topbars.forEach(topbar => {
        let rightContainer = topbar.querySelector('.topbar__right');
        
        // Fix Topbar Alignment Structural Issues precisely
        topbar.style.display = 'flex';
        topbar.style.justifyContent = 'space-between';
        topbar.style.alignItems = 'center';
        
        if (!rightContainer) {
            rightContainer = document.createElement('div');
            rightContainer.className = 'topbar__right';
            rightContainer.style.display = 'flex';
            rightContainer.style.gap = '16px';
            rightContainer.style.alignItems = 'center';
            topbar.appendChild(rightContainer);
        } else {
            rightContainer.style.display = 'flex';
            rightContainer.style.gap = '16px';
            rightContainer.style.alignItems = 'center';
        }

        // The Bell Button
        const bellBtn = document.createElement('button');
        bellBtn.className = 'notif-btn';
        bellBtn.innerHTML = `
            <i class="ph ph-bell"></i>
            <span class="notif-badge" id="bellBadgeNode" style="transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);">3</span>
        `;
        
        // Securely append it LAST to the right container so it's beautifully aligned on the far right edge
        rightContainer.appendChild(bellBtn);

        // Click Logic
        bellBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            modalOverlay.classList.add('show');
            // Give the badge a cool bounce effect when clicked
            const badge = bellBtn.querySelector('.notif-badge');
            if(badge) {
                badge.style.transform = 'scale(1.5)';
                setTimeout(() => badge.style.transform = 'scale(1)', 200);
            }
        });
    });

    // 4. Global Unread State Management Logic
    function updateBadgeCount() {
        let count = modalOverlay.querySelectorAll('.n-item.unread').length;
        document.querySelectorAll('.notif-badge').forEach(badge => {
            if (count > 0) {
                badge.innerText = count;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        });
    }

    markAllBtn.addEventListener('click', () => {
        notifItems.forEach(item => item.classList.remove('unread'));
        updateBadgeCount();
        // Dynamic cool success effect
        markAllBtn.innerHTML = '<i class="ph ph-check-circle" style="color:#22c55e;"></i> All logic circuits cleared!';
        setTimeout(() => modalOverlay.classList.remove('show'), 800);
    });

    notifItems.forEach(item => {
        item.addEventListener('click', () => {
             // Let the native href routing trigger via HTML onClick, but manage state first
             item.classList.remove('unread');
             updateBadgeCount();
        });
    });
});
