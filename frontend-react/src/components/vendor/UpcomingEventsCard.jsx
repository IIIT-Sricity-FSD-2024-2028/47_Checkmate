import React from "react";
import { Calendar } from "lucide-react";

function UpcomingEventsCard({ event_name, status, timeAndVenue }) {
    const statusLower = (status || "").toLowerCase().trim();

    return (
        <div className="event-item">
            <div className="event-info">
                <div className="event-name">{event_name}</div>
                <div className="event-meta">
                    <Calendar size={13} className="meta-icon" />
                    <span>{timeAndVenue}</span>
                </div>
            </div>
            <span className={`status-badge ${statusLower}`}>
                {statusLower === "live" && <span className="live-dot" />}
                {status}
            </span>
        </div>
    );
}

export default UpcomingEventsCard;