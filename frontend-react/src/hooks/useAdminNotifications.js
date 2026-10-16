import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bug, ClipboardCheck } from "lucide-react";
import { getIssues, getVendorApplications } from "../services";
import { formatRelativeTime } from "../utils/formatRelativeTime";

const MAX_PER_KIND = 3;

/**
 * Builds the admin bell notifications from live data:
 *  - newest pending vendor applications -> /admin/vendor-approvals
 *  - newest open issues                 -> /admin/issues
 *
 * Failures are logged and produce an empty list; the bell is never worth an error banner.
 * Returns an array of NotificationModal items.
 */
export function useAdminNotifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [apps, issues] = await Promise.allSettled([getVendorApplications(), getIssues()]);
      if (cancelled) return;

      const vendorItems = (apps.status === "fulfilled" ? apps.value || [] : [])
        .filter((a) => a.status === "pending")
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
        .slice(0, MAX_PER_KIND)
        .map((app) => ({
          id: `app-${app.id}`,
          title: "New Vendor Approval",
          description: `${app.businessName} has submitted their documents for review.`,
          time: formatRelativeTime(app.submittedAt),
          color: "blue",
          icon: ClipboardCheck,
          onClick: () => navigate("/admin/vendor-approvals"),
        }));

      const issueItems = (issues.status === "fulfilled" ? issues.value || [] : [])
        .filter((i) => String(i.status).toLowerCase() === "open")
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, MAX_PER_KIND)
        .map((issue) => ({
          id: `issue-${issue.id}`,
          title: "Issue Reported",
          description: `${issue.reporter} reported: ${issue.title}`,
          time: formatRelativeTime(issue.createdAt),
          color: "orange",
          icon: Bug,
          onClick: () => navigate("/admin/issues"),
        }));

      if (apps.status === "rejected" || issues.status === "rejected") {
        console.error("Admin notifications failed:", apps.reason || issues.reason);
      }
      setItems([...vendorItems, ...issueItems]);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return items;
}
