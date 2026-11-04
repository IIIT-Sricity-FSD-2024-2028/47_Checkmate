import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "../pages/public/LandingPage";
import ProtectedRoute from "../components/auth/ProtectedRoute";

import AdminDashboard from "../pages/admin/Dashboard";
import AdminVendorApprovals from "../pages/admin/VendorApprovals";
import AdminManageUsers from "../pages/admin/ManageUsers";
import ClientDashboard from "../pages/client/Dashboard";
import StaffDashboard from "../pages/staff/Dashboard";
import SuperuserDashboard from "../pages/superuser/Dashboard";
import VendorDashboard from "../pages/vendor/Dashboard";

import ClientLayout from "../layouts/ClientLayout";
import ClientBilling from "../pages/client/Billing";
import ClientCreateEvent from "../pages/client/CreateEvent";
import ClientMyEvents from "../pages/client/MyEvents";
import ClientBrowsePackages from "../pages/client/BrowsePackages";
import ReportIssue from "../pages/client/ReportIssue";

import StaffLayout from "../layouts/StaffLayout";
import StaffAssignedEvents from "../pages/staff/AssignedEvents";
import StaffTaskBoard from "../pages/staff/TaskBoard";
import StaffPerformance from "../pages/staff/Performance";
import StaffSchedule from "../pages/staff/Schedule";
import StaffReportIssue from "../pages/staff/ReportIssue";
import StaffMessages from "../pages/staff/Messages";

import AdminLayout from "../layouts/AdminLayout";
import VendorLayout from "../layouts/VendorLayout";
import SuperuserLayout from "../layouts/SuperUser";

import SignIn from "../pages/auth/SignIn";
import SignUp1 from "../pages/auth/SignUp1";
import SignUp2 from "../pages/auth/SignUp2";

import Events from "../pages/vendor/Events";
import EventReview from "../pages/vendor/EventReview";
import VendorProfile from "../pages/vendor/Profile";
import ManageResource from "../pages/vendor/ManageResource";
import ClientProfile from "../pages/client/Profile";
import StaffProfile from "../pages/staff/Profile";
import PresetPackage from "../pages/vendor/PresetPackage";
import ManageStaff from "../pages/vendor/ManageStaff";

import Monitoring from "../pages/vendor/Monitoring";
import Coordination from "../pages/vendor/Coordination";
import ReportIssueVendor from "../pages/vendor/ReportIssueVendor";
import VerifyDocs from "../pages/vendor/VerifyDocs";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Entry Redirect: Forwards directly to /signin or role dashboard ── */}
        <Route path="/" element={<LandingPage />} />

        {/* ── Public Auth Routes ── */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup-details" element={<SignUp1 />} />
        <Route path="/signup-password" element={<SignUp2 />} />

        {/* ── Protected Admin Portal ── */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="vendor-approvals" element={<AdminVendorApprovals />} />
            <Route path="users" element={<AdminManageUsers />} />
          </Route>
        </Route>

        {/* ── Protected Client Portal ── */}
        <Route element={<ProtectedRoute allowedRoles={["client"]} />}>
          <Route path="/client" element={<ClientLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="profile" element={<ClientProfile />} />
            <Route path="dashboard" element={<ClientDashboard />} />
            <Route path="create-event" element={<ClientCreateEvent />} />
            <Route path="events" element={<ClientMyEvents />} />
            <Route path="packages" element={<ClientBrowsePackages />} />
            <Route path="billing" element={<ClientBilling />} />
            <Route path="report-issue" element={<ReportIssue />} />
          </Route>
        </Route>

        {/* ── Protected Staff Portal ── */}
        <Route element={<ProtectedRoute allowedRoles={["staff"]} />}>
          <Route path="/staff" element={<StaffLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="profile" element={<StaffProfile />} />
            <Route path="dashboard" element={<StaffDashboard />} />
            <Route path="assigned-events" element={<StaffAssignedEvents />} />
            <Route path="task-board" element={<StaffTaskBoard />} />
            <Route path="schedule" element={<StaffSchedule />} />
            <Route path="performance" element={<StaffPerformance />} />
            <Route path="report-issue" element={<StaffReportIssue />} />
            <Route path="messages" element={<StaffMessages />} />
          </Route>
        </Route>

        {/* ── Protected Superuser Portal ── */}
        <Route element={<ProtectedRoute allowedRoles={["superuser"]} />}>
          <Route path="/superuser" element={<SuperuserLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<SuperuserDashboard />} />
            <Route path="assigned-events" element={<StaffAssignedEvents />} />
            <Route path="task-board" element={<StaffTaskBoard />} />
            <Route path="performance" element={<StaffPerformance />} />
            <Route path="report-issue" element={<ReportIssue />} />
          </Route>
        </Route>

        {/* ── Protected Vendor Portal ── */}
        <Route element={<ProtectedRoute allowedRoles={["vendor"]} />}>
          <Route path="/vendor" element={<VendorLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="profile" element={<VendorProfile />} />
            <Route path="dashboard" element={<VendorDashboard />} />
            <Route path="events" element={<Events />} />
            <Route path="events/:id/review" element={<EventReview />} />
            <Route path="event-review" element={<EventReview />} />
            <Route path="resources" element={<ManageResource />} />
            <Route path="manage-resource" element={<ManageResource />} />
            <Route path="staff" element={<ManageStaff />} />
            <Route path="manage-staff" element={<ManageStaff />} />
            <Route path="packages" element={<PresetPackage />} />
            <Route path="preset-package" element={<PresetPackage />} />
            <Route path="monitoring" element={<Monitoring />} />
            <Route path="coordination" element={<Coordination mode="event" />} />
            <Route path="coordination-admin" element={<Coordination mode="admin" />} />
            <Route path="report-issue" element={<ReportIssueVendor target="event" />} />
            <Route path="report-issue-admin" element={<ReportIssueVendor target="admin" />} />
            <Route path="verify-docs" element={<VerifyDocs />} />
          </Route>
        </Route>

        {/* ── Catch-All Fallback ── */}
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
