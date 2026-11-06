import React from "react";
import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle2, Hourglass, LineChart } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { formatDate } from "../../utils/clientHelpers";

/**
 * ClientEventTableRow Component
 * ----------------------------------------------------------------------------
 * One row of the My Events table. The Actions button depends on the status:
 *   live      -> "Track Live"   (pulsing red, opens Track Progress)
 *   confirmed -> "Track"
 *   completed -> "View"
 *   rejected  -> "View Reason"  (opens the rejection reason popup)
 *   pending   -> "View"         (client still sees "awaiting approval")
 * Rejected rows also show the first 80 characters of the reason under the name.
 *
 * Props:
 *  - event: the event object
 *  - onViewReason: called with the event when "View Reason" is clicked
 */
function ActionButton({ event, onViewReason }) {
  const trackLink = `/client/track/${event.id}`;

  if (event.status === "live") {
    return <Link to={trackLink} className="cl-btn-sm cl-btn-live"><span className="live-dot" /> Track Live</Link>;
  }
  if (event.status === "completed") {
    return <Link to={trackLink} className="cl-btn-sm cl-btn-ghost"><CheckCircle2 size={14} /> View</Link>;
  }
  if (event.status === "confirmed" || event.status === "approved") {
    return <Link to={trackLink} className="cl-btn-sm cl-btn-ghost"><LineChart size={14} /> Track</Link>;
  }
  if (event.status === "rejected") {
    return (
      <button type="button" className="cl-btn-sm cl-btn-danger" onClick={() => onViewReason(event)}>
        <AlertCircle size={14} /> View Reason
      </button>
    );
  }
  return <Link to={trackLink} className="cl-btn-sm cl-btn-ghost"><Hourglass size={14} /> View</Link>;
}

function ClientEventTableRow({ event, onViewReason }) {
  const reason = event.rejectionReason || "";

  return (
    <tr>
      {/* Event ID */}
      <td className="col-id">{event.id}</td>

      {/* Name (+ short rejection reason) */}
      <td className="col-primary">
        {event.name || "—"}
        {event.status === "rejected" && reason && (
          <div className="cl-reject-line">
            <AlertCircle size={12} />
            {reason.length > 80 ? reason.slice(0, 80) + "…" : reason}
          </div>
        )}
      </td>

      {/* Type pill */}
      <td><span className={`cl-type cl-type--${(event.type || "").toLowerCase()}`}>{event.type || "—"}</span></td>

      <td>{formatDate(event.date)}</td>
      <td>{event.venue || "—"}</td>
      <td>{event.people || event.guests || "—"}</td>
      <td><StatusBadge status={event.status} /></td>

      {/* Status-dependent action */}
      <td className="table-actions-cell">
        <ActionButton event={event} onViewReason={onViewReason} />
      </td>
    </tr>
  );
}

export default ClientEventTableRow;
