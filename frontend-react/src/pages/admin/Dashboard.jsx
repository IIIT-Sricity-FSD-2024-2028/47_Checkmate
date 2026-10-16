/**
 * ADMIN DASHBOARD (pages/admin/Dashboard.jsx)
 * Replaces legacy: front-end/pages/admin/admin.html + the dashboard sections of
 * scripts/admin_js/admin.js and admin-alerts.js.
 *
 * Data (all via services/, JWT + x-role attached by apiClient):
 *  - getSnapshot()            -> users, vendors, events for the KPI cards and user distribution
 *  - getVendorApplications()  -> pending approvals list + "Pending Approvals" KPI
 *  Notifications (bell) come from AdminTopBar / hooks/useAdminNotifications.
 *
 * Trend lines ("+2 since last login") compare against a baseline kept in localStorage
 * under the same key the legacy page used, so existing browsers keep their baseline.
 */

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Clock,
  Calendar,
  Minus,
  ShieldCheck,
  Store,
  TrendingDown,
  TrendingUp,
  User,
  Users,
} from "lucide-react";

import "../../styles/dashboard.css";
import "../../styles/admin.css";

import StatisticCard from "../../components/StatisticCard";
import WelcomeCard from "../../components/WelcomeCard";
import AdminTopBar from "../../components/admin/AdminTopBar";
import ApprovalItem from "../../components/admin/ApprovalItem";
import DistributionRow from "../../components/admin/DistributionRow";

import { getAuthSession } from "../../services/auth/authStorage";
import { getSnapshot, getVendorApplications } from "../../services";
import { formatRelativeTime } from "../../utils/formatRelativeTime";

const BASELINE_KEY = "checkmate_admin_baseline";
const MAX_PENDING_SHOWN = 5;

function readBaseline(current) {
  try {
    const stored = JSON.parse(localStorage.getItem(BASELINE_KEY));
    if (stored) return stored;
    localStorage.setItem(BASELINE_KEY, JSON.stringify(current));
  } catch {
    // Storage unavailable or corrupt: fall back to "no change".
  }
  return current;
}

function TrendLine({ current, baseline }) {
  const diff = current - baseline;
  if (diff > 0) {
    return (
      <span className="stat-trend-line stat-trend-line--up">
        <TrendingUp size={13} /> +{diff} since last login
      </span>
    );
  }
  if (diff < 0) {
    return (
      <span className="stat-trend-line stat-trend-line--down">
        <TrendingDown size={13} /> {diff} since last login
      </span>
    );
  }
  return (
    <span className="stat-trend-line stat-trend-line--flat">
      <Minus size={13} /> No change
    </span>
  );
}

function countRole(users, role) {
  return users.filter((u) => String(u.role).toLowerCase() === role).length;
}

function AdminDashboard() {
  const navigate = useNavigate();
  const userName = getAuthSession()?.user?.name || "Admin";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snapshot, setSnapshot] = useState(null);
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Independent requests: one failing must not blank the whole page.
      const [snap, apps] = await Promise.allSettled([getSnapshot(), getVendorApplications()]);
      if (cancelled) return;

      if (snap.status === "fulfilled") setSnapshot(snap.value);
      if (apps.status === "fulfilled") setApplications(apps.value || []);

      if (snap.status === "rejected" || apps.status === "rejected") {
        console.error("Admin dashboard load failed:", snap.reason || apps.reason);
        setError("Could not load dashboard data. Is the backend running on port 3000?");
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const pending = useMemo(
    () => applications.filter((a) => a.status === "pending"),
    [applications]
  );

  const stats = useMemo(() => {
    const users = snapshot?.users || [];
    return {
      users: users.length,
      vendors: (snapshot?.vendors || []).length,
      events: (snapshot?.events || []).filter((e) => e.status !== "completed").length,
      pendingApps: pending.length,
      clients: countRole(users, "client"),
      vendorUsers: countRole(users, "vendor"),
      staff: countRole(users, "staff"),
    };
  }, [snapshot, pending]);

  // Only establish/compare a baseline once real data has arrived.
  const baseline = useMemo(
    () => (snapshot ? readBaseline(stats) : stats),
    [snapshot, stats]
  );

  return (
    <div className="admin-dashboard">
      <AdminTopBar title="Admin Dashboard" />

      <div className="content">
        <WelcomeCard name={userName} description="System overview and management." />

        {error && <div className="admin-error">{error}</div>}

        <div className="stats-grid">
          <StatisticCard
            title="Total Users"
            value={loading ? "-" : stats.users}
            icon={Users}
            color="blue"
            description={!loading && <TrendLine current={stats.users} baseline={baseline.users} />}
          />
          <StatisticCard
            title="Total Vendors"
            value={loading ? "-" : stats.vendors}
            icon={Store}
            color="purple"
            description={!loading && <TrendLine current={stats.vendors} baseline={baseline.vendors} />}
          />
          <StatisticCard
            title="Active Events"
            value={loading ? "-" : stats.events}
            icon={Calendar}
            color="green"
            description={!loading && <TrendLine current={stats.events} baseline={baseline.events} />}
          />
          <StatisticCard
            title="Pending Approvals"
            value={loading ? "-" : stats.pendingApps}
            icon={Clock}
            color="orange"
            description={
              !loading && <TrendLine current={stats.pendingApps} baseline={baseline.pendingApps} />
            }
          />
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
              {!loading && pending.length === 0 && (
                <div className="admin-empty">No pending vendor approvals.</div>
              )}
              {pending.slice(0, MAX_PENDING_SHOWN).map((app, index) => (
                <ApprovalItem
                  key={app.id}
                  index={index}
                  businessName={app.businessName}
                  submitted={formatRelativeTime(app.submittedAt)}
                  onReview={() =>
                    navigate(`/admin/vendor-approvals?review=${encodeURIComponent(app.id)}`)
                  }
                />
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card__header">
              <h3>User Distribution</h3>
            </div>
            <div className="distribution-list">
              <DistributionRow
                icon={User}
                label="Clients"
                color="blue"
                value={loading ? "-" : stats.clients}
              />
              <DistributionRow
                icon={Store}
                label="Vendors"
                color="purple"
                value={loading ? "-" : stats.vendorUsers}
              />
              <DistributionRow
                icon={ShieldCheck}
                label="Staff"
                color="green"
                value={loading ? "-" : stats.staff}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
