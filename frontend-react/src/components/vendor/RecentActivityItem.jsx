import React from "react";

function RecentActivityItem({ activity, description, when }) {
    return (
        <div className="activity-item">
            <span className="activity-dot" />
            <div className="activity-body">
                <div className="activity-title">{activity}</div>
                <div className="activity-sub">{description}</div>
            </div>
            <div className="activity-time">{when}</div>
        </div>
    );
}

export default RecentActivityItem;