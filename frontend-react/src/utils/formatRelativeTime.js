/**
 * Converts an ISO date string into a human-friendly relative time
 * ("Just now", "15 mins ago", "2 hours ago", "Yesterday", "Oct 12").
 */
export function formatRelativeTime(dateString) {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return String(dateString);

  const diffMins = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
  if (diffMins < 5) return "Just now";
  if (diffMins < 60) return `${diffMins} mins ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
