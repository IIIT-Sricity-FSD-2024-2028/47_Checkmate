/**
 * Coloured pill showing an event's status.
 * "live" gets a pulsing red dot, like the old My Events table.
 */
const LABELS = {
    pending: "Pending",
    confirmed: "Approved",
    approved: "Approved",
    rejected: "Rejected",
    completed: "Completed",
    cancelled: "Cancelled",
};

function StatusBadge({ status }) {
    if (status === "live") {
        return (
            <span className="cl-badge cl-badge--live">
                <span className="live-dot" /> LIVE
            </span>
        );
    }
    // confirmed and approved share the same green style; cancelled reuses the red one
    const style = status === "confirmed" ? "approved" : status === "cancelled" ? "rejected" : status || "pending";
    return <span className={`cl-badge cl-badge--${style}`}>{LABELS[status] || status}</span>;
}

export default StatusBadge;
