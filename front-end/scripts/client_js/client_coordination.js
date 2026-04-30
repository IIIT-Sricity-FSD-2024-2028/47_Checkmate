/* ═══════════════════════════════════════════
   client_coordination.js  —  Client Messages
   • Connects to shared DB ('vendor-client' channel)
   • Renders message history dynamically
   • Sends new messages from the client
 ═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    const chatWindow = document.getElementById('chatWindow');
    const chatInput = document.getElementById('chatInput');
    const btnSend = document.getElementById('btnSend');

    // Add slideUp animation if not present
    if (!document.getElementById('_clientSlideUp')) {
        const style = document.createElement('style');
        style.id = '_clientSlideUp';
        style.textContent = `
            @keyframes slideUp {
                from { opacity:0; transform:translateY(10px); }
                to { opacity:1; transform:translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }

    function renderMessages() {
        if (!chatWindow) return;
        
        const allMsgs = DB.get('messages') || {};
        const msgs = allMsgs['vendor-client'] || [];
        
        // Check if we already rendered this sequence. Very basic check for brevity.
        const currentCount = chatWindow.querySelectorAll('.msg, .sys-msg').length;
        if (currentCount === msgs.length) return; // No new messages to render

        chatWindow.innerHTML = '<div style="text-align:center; font-size:12px; color:var(--text-muted); margin-bottom:10px;">Today</div>';

        msgs.forEach(m => {
            // Note: DB messages use `m.self = true` for VENDOR messages.
            // Client is `m.self = false`, EXCEPT if they just sent it recently as the client?
            // Let's rely on sender name.
            let isClientSender = m.sender && (m.sender.toLowerCase().includes('client') || m.sender === 'John Carter (Client)');

            if (m.isSystem) {
                const sysHtml = `
                    <div class="sys-msg" style="text-align:center; margin: 12px 0; font-size:12px; color:var(--text-muted); background:rgba(255,255,255,0.02); padding:6px; border-radius:6px; border:1px solid var(--border);">
                        <i class="ph ph-info" style="vertical-align:middle; margin-right:4px;"></i> ${m.text}
                    </div>
                `;
                chatWindow.insertAdjacentHTML('beforeend', sysHtml);
                return;
            }

            if (isClientSender) {
                // Render as sent
                const msgHTML = `
                    <div class="msg msg-sent" style="animation: slideUp 0.3s ease;">
                        <div class="msg-bubble">${m.text}</div>
                        <div class="msg-time">${m.time} <i class="ph ph-check"></i></div>
                    </div>
                `;
                chatWindow.insertAdjacentHTML('beforeend', msgHTML);
            } else {
                // Render as received
                const msgHTML = `
                    <div class="msg msg-received" style="animation: slideUp 0.3s ease;">
                        <div style="font-size:11px; margin-bottom:4px; color:var(--text-secondary);">${m.sender}</div>
                        <div class="msg-bubble">${m.text}</div>
                        <div class="msg-time">${m.time}</div>
                    </div>
                `;
                chatWindow.insertAdjacentHTML('beforeend', msgHTML);
            }
        });

        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    function sendMessage() {
        if (!chatInput) return;
        const msgText = chatInput.value.trim();
        if (!msgText) return;

        const allMsgs = DB.get('messages') || {};
        if (!allMsgs['vendor-client']) allMsgs['vendor-client'] = [];

        const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        
        allMsgs['vendor-client'].push({
            id: 'c' + Date.now(),
            sender: 'John Carter (Client)', // Emulating the logged in user based on data.js dummy
            initials: 'JC',
            self: false, // from vendor's perspective this is false!
            text: msgText,
            time: now,
            avatar: 'blue'
        });

        DB.set('messages', allMsgs);
        chatInput.value = '';
        renderMessages();
    }

    if (btnSend) {
        btnSend.addEventListener('click', sendMessage);
    }

    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    // Initial render and polling
    renderMessages();
    setInterval(renderMessages, 3000);
});
