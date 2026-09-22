import React from "react";
import { Bell } from "lucide-react";
import "../styles/dashboard.css";

function TopHeaderBar({ title, badge = 1, onNotificationClick, children }) {
   
    return (
        <header className="topbar">
            <h1 className="page-title">{title}</h1>
            <div className="topbar__right">
                {children}
                <button 
                    type="button" 
                    className="notif-btn" 
                    onClick={onNotificationClick}
                    aria-label="Notifications"
                >
                    <Bell size={18} />
                    {badge > 0 && <span className="notif-badge">{badge}</span>}
                </button>
            </div>
        </header>
    );
}

export default TopHeaderBar;