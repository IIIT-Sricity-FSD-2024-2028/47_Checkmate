/**
 * Message System logic using localStorage to simulate real-time syncing across actors.
 */

const MSG_STORAGE_KEY = 'eventpro_messages';

// Initialize default messages if local storage is empty
const defaultMessages = [
  {
    id: 'msg-1',
    senderRole: 'Vendor',
    senderName: 'Elite Events Co.',
    receiverRole: 'Staff',
    receiverName: 'Staff Team',
    message: 'Equipment is ready for pickup',
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    status: 'Read',
    conversationId: 'Vendor-Staff'
  },
  {
    id: 'msg-2',
    senderRole: 'Staff',
    senderName: 'Staff Team',
    receiverRole: 'Vendor',
    receiverName: 'Elite Events Co.',
    message: 'Copy that, dispatching a team now.',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    status: 'Read',
    conversationId: 'Vendor-Staff'
  },
  {
    id: 'msg-3',
    senderRole: 'Client',
    senderName: 'Corporate Tech',
    receiverRole: 'Vendor',
    receiverName: 'Elite Events Co.',
    message: 'Are you sure the projectors support 4k?',
    timestamp: new Date(Date.now() - 500000).toISOString(),
    status: 'Delivered',
    conversationId: 'Vendor-Client'
  }
];

class MessageService {
  constructor() {
    this.initStorage();
    this.listenForStorageChanges();
  }

  initStorage() {
    const existing = localStorage.getItem(MSG_STORAGE_KEY);
    if (!existing) {
      localStorage.setItem(MSG_STORAGE_KEY, JSON.stringify(defaultMessages));
    }
  }

  getMessages() {
    return JSON.parse(localStorage.getItem(MSG_STORAGE_KEY) || '[]');
  }

  getMessagesByConversation(conversationId) {
    const all = this.getMessages();
    return all.filter(m => m.conversationId === conversationId);
  }

  sendMessage(senderRole, senderName, receiverRole, receiverName, messageText, conversationId) {
    const all = this.getMessages();
    
    const newMsg = {
      id: 'msg-' + Date.now(),
      senderRole,
      senderName,
      receiverRole,
      receiverName,
      message: messageText,
      timestamp: new Date().toISOString(),
      status: 'Sent',
      conversationId: conversationId
    };

    all.push(newMsg);
    localStorage.setItem(MSG_STORAGE_KEY, JSON.stringify(all));

    // Simulate network delay to change status to "Delivered"
    setTimeout(() => {
      this.updateMessageStatus(newMsg.id, 'Delivered');
    }, 1500);

    // Dispatch event locally for the current window
    this.triggerNotification(newMsg);
    
    return newMsg;
  }

  updateMessageStatus(msgId, newStatus) {
    const all = this.getMessages();
    const index = all.findIndex(m => m.id === msgId);
    if (index > -1) {
      all[index].status = newStatus;
      localStorage.setItem(MSG_STORAGE_KEY, JSON.stringify(all));
      window.dispatchEvent(new CustomEvent('messageStatusUpdated', { detail: all[index] }));
    }
  }

  markConversationAsRead(conversationId, readerRole) {
    let updated = false;
    const all = this.getMessages();
    
    all.forEach(m => {
      // If message belongs to this conversation and was sent to the reader, mark as read
      if (m.conversationId === conversationId && m.receiverRole === readerRole && m.status !== 'Read') {
        m.status = 'Read';
        updated = true;
      }
    });

    if (updated) {
      localStorage.setItem(MSG_STORAGE_KEY, JSON.stringify(all));
      // Notify so other tabs (senders) see the "Read" tick
      window.dispatchEvent(new Event('messagesReadUpdated'));
    }
  }

  listenForStorageChanges() {
    // This event fires when localStorage is modified from ANOTHER tab
    window.addEventListener('storage', (e) => {
      if (e.key === MSG_STORAGE_KEY && e.newValue) {
        
        // Figure out if a new message was added by comparing lengths
        try {
          const oldLen = e.oldValue ? JSON.parse(e.oldValue).length : 0;
          const newArr = JSON.parse(e.newValue);
          const newLen = newArr.length;

          if (newLen > oldLen) {
            // It's a new message
            const newestMsg = newArr[newLen - 1];
            this.triggerNotification(newestMsg);
          } else {
             // Status update or something else
             window.dispatchEvent(new Event('messagesReadUpdated'));
          }
        } catch(err) {}

        // Global event to refresh UI
        window.dispatchEvent(new Event('messageStorageUpdated'));
      }
    });

    // Fallback polling for robust real-time feel if storage event fails
    let lastData = localStorage.getItem(MSG_STORAGE_KEY);
    setInterval(() => {
      const currentData = localStorage.getItem(MSG_STORAGE_KEY);
      if (currentData !== lastData) {
        lastData = currentData;
        window.dispatchEvent(new Event('messageStorageUpdated'));
      }
    }, 2500);
  }

  triggerNotification(msgObj) {
    // Custom event containing message data
    const event = new CustomEvent('newMessage', {
      detail: msgObj
    });
    window.dispatchEvent(event);
  }

  formatTime(isoString) {
    const d = new Date(isoString);
    let hours = d.getHours();
    let mins = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    mins = mins < 10 ? '0' + mins : mins;
    return `${hours}:${mins} ${ampm}`;
  }

  getUnreadCount(role) {
      const all = this.getMessages();
      return all.filter(m => m.receiverRole === role && m.status !== 'Read').length;
  }
  
  getUnreadCountForConversation(role, conversationId) {
      const all = this.getMessages();
      return all.filter(m => m.receiverRole === role && m.conversationId === conversationId && m.status !== 'Read').length;
  }
}

// Instantiate globally
window.MsgService = new MessageService();
