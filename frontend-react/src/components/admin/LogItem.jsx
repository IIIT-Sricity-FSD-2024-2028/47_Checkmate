import React from "react";
import { Activity, CalendarDays, FileText, Settings, ShieldCheck } from "lucide-react";
import { logDescription, logTitle } from "../../utils/logText";

// One colour + icon per entityType so the list scans quickly.
const TYPES = {
  EVENT: { tone: "blue", icon: CalendarDays },
  VENDOR_APPLICATION: { tone: "green", icon: ShieldCheck },
  HTTP: { tone: "orange", icon: Activity },
  SYSTEM: { tone: "pink", icon: Settings },
};
const FALLBACK = { tone: "gray", icon: FileText };

function formatWhen(value) {
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** One row of the System Logs list. */
function LogItem({ log }) {
  const { tone, icon: Icon } = TYPES[log.entityType] || FALLBACK;
  return (
    <div className={`approval-item log-item log-item--${tone}`}>
      <div className="vendor-info">
        <div className={`log-item__icon log-item__icon--${tone}`}>
          <Icon size={18} />
        </div>
        <div style={{ minWidth: 0 }}>
          <h4>{logTitle(log)}</h4>
          <p className="log-item__desc">{logDescription(log)}</p>
        </div>
      </div>
      <span className="log-item__time">{formatWhen(log.createdAt)}</span>
    </div>
  );
}

export default LogItem;
