/* ═══════════════════════════════════════════
   messages.js  —  Staff Messages & Requests
 ═══════════════════════════════════════════ */

// Global state
window.currentChatConversationId = 'Vendor-Staff';
window.currentChatHeaderName = 'Elite Events Co.';

// ── 1. Render Chat Messages ──
function initMessages() {
    function renderChat() {
       const chatEl = document.getElementById('chat-messages');
       if(!chatEl || !window.MsgService) return;
       
       const msgs = window.MsgService.getMessagesByConversation(window.currentChatConversationId);
       
       let html = msgs.map(m => {
           // Staff perspective: self is when senderRole is Staff
           const isVendor = m.senderRole !== 'Staff'; 
           
           if(m.message && m.message.startsWith('[SYSTEM]')) {
               return `<div class="msg-enter-anim" style="text-align:center;font-size:11px;color:var(--pink);padding:12px 20px;margin:10px auto;max-width:80%;background:rgba(233,30,140,0.1);border-radius:12px;border:1px solid rgba(233,30,140,0.2);font-weight:600;">${m.message}</div>`;
           }

           const timeStr = window.MsgService.formatTime(m.timestamp);
           const statusTick = m.senderRole === 'Staff' ? `<span style="font-size:10px;margin-left:5px;opacity:0.7">✓ ${m.status}</span>` : '';

           if(isVendor) {
               return `
                 <div class="msg-bubble-wrap them msg-enter-anim">
                   <div class="msg-sender">${m.senderName || m.senderRole} <span class="sender-badge" style="background:rgba(6,182,212,0.15);color:var(--cyan);padding:1px 5px;border-radius:8px;font-size:9px;font-weight:700">${m.senderRole}</span></div>
                   <div class="msg-bubble">${m.message}</div>
                   <div class="msg-time">${timeStr}</div>
                 </div>`;
           } else {
               return `
                 <div class="msg-bubble-wrap me msg-enter-anim">
                   <div class="msg-bubble">${m.message}</div>
                   <div class="msg-time">${timeStr} ${statusTick}</div>
                 </div>`;
           }
       }).join('');
       
       if (chatEl.innerHTML !== html) {
          chatEl.innerHTML = html;
          chatEl.scrollTop = chatEl.scrollHeight;
       }

       // Mark as read since we are viewing
       window.MsgService.markConversationAsRead(window.currentChatConversationId, 'Staff');
    }

    renderChat();
    
    // Listen for events from MsgService instead of polling blindly
    window.addEventListener('messageStorageUpdated', renderChat);
    window.addEventListener('newMessage', renderChat);
    window.addEventListener('messageStatusUpdated', renderChat);

    // ── 2. Handle Sending New Chat ──
    window.sendMsg = function() {
       const input = document.getElementById('msg-input');
       if(!input || !input.value.trim() || !window.MsgService) return;
       
       const text = input.value.trim();
       
       // Handle sending based on which tab is open
       if (window.currentChatConversationId === 'Vendor-Client-Staff' || window.currentChatConversationId.includes('Client')) {
           window.MsgService.sendMessage('Staff', 'Mike Staff', 'Client', window.currentChatHeaderName, text, window.currentChatConversationId);
       } else {
           window.MsgService.sendMessage('Staff', 'Mike Staff', 'Vendor', window.currentChatHeaderName, text, window.currentChatConversationId);
       }
       
       input.value = '';
       renderChat();
    };

    // Attach listeners defensively
    const sendBtn = document.querySelector('.chat-send-btn');
    if (sendBtn) {
        sendBtn.addEventListener('click', window.sendMsg);
    }
    const msgInput = document.getElementById('msg-input');
    if (msgInput) {
        msgInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                window.sendMsg();
            }
        });
    }

    // ── 2.5 Handle UI selections ──
    window.selectConv = function(elem, name, avatar, text) {
       document.querySelectorAll('.msg-conv-item').forEach(el => el.classList.remove('active'));
       elem.classList.add('active');
       
       const cName = document.querySelector('.chat-name');
       const cAvatar = document.querySelector('.chat-avatar');
       
       if(cName) cName.innerHTML = name + ' <span style="font-size:10px;background:var(--cyan-dim);color:var(--cyan);padding:1px 6px;border-radius:10px;font-weight:700;vertical-align:middle">' + (name.includes('Corporate') ? 'Client' : 'Vendor') + '</span>';
       if(cAvatar) cAvatar.innerHTML = avatar + '<div class="online-dot"></div>';
       
       window.currentChatHeaderName = name;
       
       if (name === 'Premium Catering') window.currentChatConversationId = 'Vendor-Staff-Premium';
       else if (name === 'Sound & Lighting Pro') window.currentChatConversationId = 'Vendor-Staff-Sound';
       else if (name === 'Corporate Tech') window.currentChatConversationId = 'Vendor-Client';
       else window.currentChatConversationId = 'Vendor-Staff';

       renderChat();
    };

    window.switchTab = function(type) {
       document.querySelectorAll('.msg-tab').forEach(e => e.style.opacity = '0.5');
       const tab = document.getElementById('tab-' + type);
       if(tab) tab.style.opacity = '1';
       // Mock UI update for tabs
       const list = document.querySelector('.msg-conv-list');
       if(type === 'client' && list) {
          list.innerHTML = `
            <div class="msg-conv-item" onclick="selectConv(this,'Corporate Tech','C','Thanks for the update')">
              <div class="msg-conv-avatar" style="background:var(--blue)">C</div>
              <div class="msg-conv-body">
                <div class="msg-conv-name">Corporate Tech</div>
                <div class="msg-conv-preview">Thanks for the update</div>
              </div>
            </div>`;
       } else if (list) {
          list.innerHTML = `
            <div class="msg-conv-item active" onclick="selectConv(this,'Elite Events Co.','E','Equipment is ready for pickup')">
              <div class="msg-conv-avatar">E<div class="online-dot"></div></div>
              <div class="msg-conv-body">
                <div class="msg-conv-name">Elite Events Co.</div>
                <div class="msg-conv-preview">Equipment is ready for pickup</div>
              </div>
            </div>`;
          window.currentChatConversationId = 'Vendor-Staff';
          renderChat();
       }
    };
    
    // ── 3. Handle Request Modal ──
    const btnCreateRequest = document.getElementById('btnCreateRequest');
    const requestModal = document.getElementById('requestModal');
    const reqClose = document.getElementById('reqClose');
    const reqCancel = document.getElementById('reqCancel');
    const reqSubmit = document.getElementById('reqSubmit');
    const reqEventId = document.getElementById('reqEventId');

    function populateLiveEvents() {
        if(!reqEventId || !window.DB) return;
        const events = window.DB.getAll('events').filter(e => e.status === 'live' || e.status === 'confirmed');
        if (events.length === 0) {
            reqEventId.innerHTML = '<option value="">No Active Events Found</option>';
        } else {
            reqEventId.innerHTML = events.map(e => `<option value="${e.id}">${e.name} (${e.status.toUpperCase()})</option>`).join('');
        }
    }

    function openModal() {
        if(!requestModal) return;
        populateLiveEvents();
        document.getElementById('reqItem').value = '';
        document.getElementById('reqQty').value = '1';
        requestModal.style.display = 'flex';
    }

    function closeModal() {
        if(requestModal) requestModal.style.display = 'none';
    }

    if(btnCreateRequest) btnCreateRequest.addEventListener('click', openModal);
    if(reqClose) reqClose.addEventListener('click', closeModal);
    if(reqCancel) reqCancel.addEventListener('click', closeModal);

    if(requestModal) {
        requestModal.addEventListener('click', (e) => {
            if (e.target === requestModal) closeModal();
        });
    }

    if(reqSubmit) {
        reqSubmit.addEventListener('click', () => {
            if(!window.DB) return;
            const evId = reqEventId.value;
            const type = document.getElementById('reqType').value;
            const item = document.getElementById('reqItem').value.trim();
            const qty = parseInt(document.getElementById('reqQty').value, 10);

            if (!evId) { alert("Please select a target event."); return; }
            if (!item) { alert("Please specify the requested item or staff role."); return; }
            if (!qty || qty < 1) { alert("Please enter a valid quantity."); return; }

            const newReq = {
                id: 'sr_' + Date.now(),
                eventId: evId,
                type: type,
                item: item,
                qty: qty,
                status: 'pending',
                requestedBy: 'Mike Staff',
                createdAt: new Date().toISOString()
            };

            if(!window.DB.get('staffRequests')) window.DB.set('staffRequests', []);
            window.DB.add('staffRequests', newReq);

            if(window.showToast) {
                window.showToast("Request successfully dispatched to the Event Coordinator!");
            } else {
                alert("Request successfully dispatched to the Event Coordinator!");
            }
            
            closeModal();
            
            // System message to chat
            window.sendMsgText(`[SYSTEM] Dispatch Request: ${qty}x ${item} for event ${evId}`);
        });
    }

    // Helper for system messages
    window.sendMsgText = function(text) {
        if(!window.MsgService) return;
        window.MsgService.sendMessage('Staff', 'System', 'Vendor', window.currentChatHeaderName, text, window.currentChatConversationId);
        renderChat();
    };
} // end initMessages

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMessages);
} else {
    initMessages();
}
