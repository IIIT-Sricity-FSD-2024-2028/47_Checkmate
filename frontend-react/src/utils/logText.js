/** Readable title + one-line description for an activityLogs entry (System Logs page). */

// "EVENT_STATUS_CHANGED" -> "Event Status Changed"; HTTP rows keep their verb + path.
export function logTitle(log) {
  if (log.entityType === "HTTP") return String(log.action || "");
  return String(log.action || "")
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Entity id, up to three plain detail fields, and who did it, on one line.
export function logDescription(log) {
  const bits = [];
  if (log.entityId) bits.push(log.entityId);
  if (log.details && typeof log.details === "object") {
    Object.entries(log.details)
      .filter(([, v]) => v !== null && v !== undefined && typeof v !== "object")
      .slice(0, 3)
      .forEach(([k, v]) => bits.push(`${k}: ${v}`));
  }
  if (log.userRole) bits.push(`by ${log.userRole}`);
  return bits.join("  ·  ") || "—";
}
