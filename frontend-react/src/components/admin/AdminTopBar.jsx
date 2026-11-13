import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bug, ClipboardCheck } from "lucide-react";
import TopHeaderBar from "../TopHeaderBar";
import NotificationModal from "../NotificationModal";
import { getIssues, getVendorApplications } from "../../services";
import { formatRelativeTime } from "../../utils/formatRelativeTime";

const MAX_PER_KIND = 3;

const newestFirst = (field) => (a, b) => new Date(b[field]) - new Date(a[field]);

/**
 * The top bar on every admin page: page title + notifications bell.
 * The bell lists the newest pending vendor applications and open issues;
 * clicking one goes to the page that handles it.
 */
function AdminTopBar({ title }) {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [issues, setIssues] = useState([]);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(false);

  // Load once when the page opens. The bell is never worth an error banner:
  // if a request fails, that part of the list is just empty.
  useEffect(() => {
    getVendorApplications()
      .then((data) => setApplications(data || []))
      .catch((err) => console.error("Bell: could not load vendor applications", err));
    getIssues()
      .then((data) => setIssues(data || []))
      .catch((err) => console.error("Bell: could not load issues", err));
  }, []);

  const applicationItems = applications
    .filter((a) => a.status === "pending")
    .sort(newestFirst("submittedAt"))
    .slice(0, MAX_PER_KIND)
    .map((app) => ({
      id: `app-${app.id}`,
      title: "New Vendor Approval",
      description: `${app.businessName} has submitted their documents for review.`,
      time: formatRelativeTime(app.submittedAt),
      color: "blue",
      icon: ClipboardCheck,
      onClick: () => navigate(`/admin/vendor-approvals?review=${app.id}`),
    }));

  const issueItems = issues
    .filter((i) => String(i.status).toLowerCase() === "open")
    .sort(newestFirst("createdAt"))
    .slice(0, MAX_PER_KIND)
    .map((issue) => ({
      id: `issue-${issue.id}`,
      title: "Issue Reported",
      description: `${issue.reporter || "Someone"} reported: ${issue.title}`,
      time: formatRelativeTime(issue.createdAt),
      color: "orange",
      icon: Bug,
      onClick: () => navigate("/admin/issues"),
    }));

  const notifications = [...applicationItems, ...issueItems];

  return (
    <>
      <TopHeaderBar
        title={title}
        badge={seen ? 0 : notifications.length}
        onNotificationClick={() => {
          setOpen(true);
          setSeen(true);
        }}
      />
      <NotificationModal open={open} items={notifications} onClose={() => setOpen(false)} />
    </>
  );
}

export default AdminTopBar;
