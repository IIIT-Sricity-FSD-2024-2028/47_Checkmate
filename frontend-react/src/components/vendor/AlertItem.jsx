import React from "react";
import { Clock } from "lucide-react";

function AlertItem({ what_alert, when, type }) {
    let alertType = type;
    if (!alertType) {
        const text = (what_alert || "").toLowerCase();
        if (text.includes("stock") || text.includes("equipment")) {
            alertType = "yellow";
        } else if (text.includes("conflict") || text.includes("staff") || text.includes("capacity")) {
            alertType = "orange";
        } else if (text.includes("urgent") || text.includes("critical")) {
            alertType = "red";
        } else {
            alertType = "blue";
        }
    }

    return (
        <div className={`alert-item alert-item--${alertType}`}>
            <div className="alert-msg">{what_alert}</div>
            <div className="alert-time">
                <Clock size={12} className="meta-icon" />
                <span>{when}</span>
            </div>
        </div>
    );
}

export default AlertItem;