/**
 * ADMIN DASHBOARD (pages/admin/Dashboard.jsx)
 * Replaces legacy: front-end/pages/admin/admin.html + the dashboard sections of
 * scripts/admin_js/admin.js and admin-alerts.js.
 *
 * One request: getSnapshot() returns users, vendors, events and vendor applications
 * (passwords removed by the backend). Everything on the page is counted from it.
 * The bell comes from AdminTopBar.
 *
 * Difference from legacy: the "+2 since last login" trend lines are gone. They compared
 * against a baseline saved in localStorage that was never updated, so they were wrong.
 */

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, Clock, ShieldCheck, Store, User, Users } from "lucide-react";

import "../../styles/dashboard.css";
import "../../styles/admin.css";

import StatisticCard from "../../components/StatisticCard";
import WelcomeCard from "../../components/WelcomeCard";
import AdminTopBar from "../../components/admin/AdminTopBar";
import ApprovalItem from "../../components/admin/ApprovalItem";
import DistributionRow from "../../components/admin/DistributionRow";

import { getAuthSession } from "../../services/auth/authStorage";
import { getSnapshot } from "../../services";
import { formatRelativeTime } from "../../utils/formatRelativeTime";

const MAX_PENDING_SHOWN = 5;
const FINISHED = ["completed", "cancelled", "rejected"];

const lower = (v) => String(v || "").toLowerCase();
const countRole = (users, role) => users.filter((u) => lower(u.role) === role).length;

function AdminDashboard() {
  const navigate = useNavigate();
  const userName = getAuthSession()?.user?.name || "Admin";

  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load everything once, when the page opens.
  useEffect(() => {
    getSnapshot()
      .then((data) => setSnapshot(data))
      .catch((err) => {
        console.error("Admin dashboard load failed:", err);
        setError("Could not load dashboard data. Is the backend running on port 3000?");
      })
      .finally(() => setLoading(false));
  }, []);

  const users = snapshot?.users || [];
  const vendors = snapshot?.vendors || [];
  const events = snapshot?.events || [];
  const pending = (snapshot?.vendorApplications || []).filter((a) => a.status === "pending");
  const activeEvents = events.filter((e) => !FINISHED.includes(lower(e.status)));

  const show = (value) => (loading ? "-" : value);

  return (
    <div className="admin-dashboard">
      <AdminTopBar title="Admin Dashboard" />

      <div className="content">
        <WelcomeCard name={userName} description="System overview and management." />

        {error && <div className="admin-error">{error}</div>}

        <div className="stats-grid">
          <StatisticCard title="Total Users" value={show(users.length)} icon={Users} color="blue" />
          <StatisticCard title="Total Vendors" value={show(vendors.length)} icon={Store} color="purple" />
          <StatisticCard title="Active Events" value={show(activeEvents.length)} icon={Calendar} color="green" />
          <StatisticCard title="Pending Approvals" value={show(pending.length)} icon={Clock} color="orange" />
        </div>

        <div className="admin-dashboard-grid">
          <div className="card">
            <div className="card__header">
              <h3>Pending Vendor Approvals</h3>
              <Link to="/admin/vendor-approvals" className="admin-link">
                View All →
              </Link>
            </div>
            <div className="approval-list">
              {!loading && pending.length === 0 && <div className="admin-empty">No pending vendor approvals.</div>}
              {pending.slice(0, MAX_PENDING_SHOWN).map((app, index) => (
                <ApprovalItem
                  key={app.id}
                  index={index}
                  businessName={app.businessName}
                  submitted={formatRelativeTime(app.submittedAt)}
                  onReview={() => navigate(`/admin/vendor-approvals?review=${app.id}`)}
                />
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card__header">
              <h3>User Distribution</h3>
            </div>
            <div className="distribution-list">
              <DistributionRow icon={User} label="Clients" color="blue" value={show(countRole(users, "client"))} />
              <DistributionRow icon={Store} label="Vendors" color="purple" value={show(countRole(users, "vendor"))} />
              <DistributionRow icon={ShieldCheck} label="Staff" color="green" value={show(countRole(users, "staff"))} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
