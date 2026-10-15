import React from "react";
import Modal from "./Modal";

/**
 * Notifications list shown from the TopHeaderBar bell. Each item is
 * { id, title, description, time, color: "blue" | "pink" | "orange", icon, onClick }.
 * Item styles live in styles/admin.css (.notif-item*).
 */
function NotificationModal({ open, items = [], onClose }) {
  return (
    <Modal open={open} title="Notifications" onClose={onClose} width={420} flush>
      {items.length === 0 && <div className="notif-empty">You're all caught up.</div>}
      {items.map(({ id, title, description, time, color = "blue", icon: Icon, onClick }) => (
        <div key={id} className={`notif-item notif-item--${color}`} onClick={onClick}>
          <div className={`notif-item-icon ${color}`}>{Icon && <Icon size={18} />}</div>
          <div className="notif-item-content">
            <div className="notif-item-title">{title}</div>
            <div className="notif-item-desc">{description}</div>
            {time && <span className="notif-item-time">{time}</span>}
          </div>
        </div>
      ))}
    </Modal>
  );
}

export default NotificationModal;
