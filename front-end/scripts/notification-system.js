/**
 * Notification System
 * Listens for new messages and handles toast animations, sidebar badges, and UI highlights.
 */

class NotificationSystem {
  constructor() {
    this.currentUserRole = this.detectUserRole();
    this.setupToastContainer();
    this.listenForEvents();
    
    // Initial check for unread messages
    setTimeout(() => {
      this.updateSidebarBadge();
    }, 500);
  }

  detectUserRole() {
    // Basic detection based on URL or DOM elements
    const path = window.location.pathname.toLowerCase();
    if (path.includes('/staff/')) return 'Staff';
    if (path.includes('/vendor/')) return 'Vendor';
    if (path.includes('/client/')) return 'Client';
    if (path.includes('/admin/')) return 'Admin';
    if (path.includes('/superuser/')) return 'Superuser';
    return 'Unknown';
  }

  setupToastContainer() {
    let container = document.getElementById('sys-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'sys-toast-container';
      container.className = 'sys-toast-container';
      document.body.appendChild(container);
    }
    this.toastContainer = container;
  }

  listenForEvents() {
    // Listen for new messages
    window.addEventListener('newMessage', (e) => {
      const msg = e.detail;
      
      // If the message is intended for the current user's role
      if (msg.receiverRole === this.currentUserRole) {
        
        // Show Toast (unless they are currently looking at the exact conversation)
        // We can check if there's a global active conversation variable
        const isChatting = window.currentChatConversationId === msg.conversationId;
        
        if (!isChatting) {
          this.showToast(msg);
          // Play a tiny subtle sound if desired (omitted to stick strictly to UI)
        }

        // Always update badges
        this.updateSidebarBadge();
        this.highlightUnreadConversations();
      }
    });

    // Listen for generic storage updates (e.g. markings as read)
    window.addEventListener('messageStorageUpdated', () => {
       this.updateSidebarBadge();
       this.highlightUnreadConversations();
    });

    window.addEventListener('messagesReadUpdated', () => {
       this.updateSidebarBadge();
       this.highlightUnreadConversations();
    });
  }

  showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'sys-toast';
    
    // First letter of sender name for Avatar
    const initial = msg.senderName ? msg.senderName.charAt(0).toUpperCase() : 'U';

    toast.innerHTML = `
      <div class="sys-toast-avatar">${initial}</div>
      <div class="sys-toast-content">
        <div class="sys-toast-title">New message from ${msg.senderName || msg.senderRole}</div>
        <div class="sys-toast-preview">${msg.message}</div>
      </div>
    `;

    this.toastContainer.appendChild(toast);

    // Auto remove after 4 seconds
    setTimeout(() => {
      toast.classList.add('fading-out');
      toast.addEventListener('animationend', () => {
        toast.remove();
      });
    }, 4000);
  }

  updateSidebarBadge() {
    if (!window.MsgService) return;

    // Based on user role, count unread messages
    const unreadCount = window.MsgService.getUnreadCount(this.currentUserRole);
    
    // Find the Messages sidebar link
    // It's usually the one with 'Messages' or 'Coordination Hub' text
    const links = document.querySelectorAll('.sb-link, .nav-item');
    let messageLink = null;
    
    links.forEach(link => {
      const text = link.textContent.toLowerCase();
      if (text.includes('messages') || text.includes('coordination')) {
        messageLink = link;
      }
    });

    if (messageLink) {
      // Look for existing badge
      let badge = messageLink.querySelector('.msg-unread-pulse');
      
      if (unreadCount > 0) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'msg-unread-pulse';
          // Find where to append it. Usually next to the text.
          messageLink.appendChild(badge);
        }
        badge.textContent = unreadCount;
      } else {
        if (badge) badge.remove();
      }
    }
  }

  highlightUnreadConversations() {
    if (!window.MsgService) return;

    // Look for conversation list items in the DOM
    // In Staff view: .msg-conv-item
    // In Vendor view: maybe .ch-participant or custom list
    
    const convItems = document.querySelectorAll('.msg-conv-item');
    convItems.forEach(item => {
      // Assuming the title is inside .msg-conv-name
      const nameEl = item.querySelector('.msg-conv-name');
      if (nameEl) {
        // Extract plain text name to match conversation ID or sender
        // This is a naive heuristic for this simulation
        const name = nameEl.textContent.trim().split(/\s*1[0-9]|Yest/)[0].trim(); // Remove time info
        
        let hasUnread = false;
        const allMsgs = window.MsgService.getMessages();
        
        // Check if there are any unread messages from this sender to me
        hasUnread = allMsgs.some(m => 
          m.receiverRole === this.currentUserRole && 
          m.status !== 'Read' &&
          m.senderName.includes(name)
        );

        if (hasUnread) {
          item.classList.add('unread-glow');
        } else {
          item.classList.remove('unread-glow');
        }
      }
    });
  }
}

// Start notification system when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    window.SysNotifications = new NotificationSystem();
});
