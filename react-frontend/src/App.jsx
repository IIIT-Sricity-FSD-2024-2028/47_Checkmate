import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Landing & Auth
import { LandingPage } from './pages/LandingPage';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { VendorApprovals } from './pages/admin/VendorApprovals';
import { ManageUsers } from './pages/admin/ManageUsers';
import { MonitorEvents } from './pages/admin/MonitorEvents';
import { AdminCoordination } from './pages/admin/AdminCoordination';
import { IssueTracking } from './pages/admin/IssueTracking';
import { AdminPayouts } from './pages/admin/AdminPayouts';
import { ReportAnalytics } from './pages/admin/ReportAnalytics';
import { AuditLogs } from './pages/admin/AuditLogs';
import { AdminSettings } from './pages/admin/AdminSettings';

// Client Pages
import { ClientDashboard } from './pages/client/ClientDashboard';
import { ClientBrowsePackages } from './pages/client/ClientBrowsePackages';
import { CreateEventClient } from './pages/client/CreateEventClient';
import { ClientMyEvents } from './pages/client/ClientMyEvents';
import { ClientTrackProgress } from './pages/client/ClientTrackProgress';
import { ClientCoordination } from './pages/client/ClientCoordination';
import { ClientBilling } from './pages/client/ClientBilling';
import { ClientReportIssue } from './pages/client/ClientReportIssue';

// Staff Pages
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { AssignedEvents } from './pages/staff/AssignedEvents';
import { TaskBoard } from './pages/staff/TaskBoard';
import { Schedule } from './pages/staff/Schedule';
import { StaffMessages } from './pages/staff/Messages';
import { Performance } from './pages/staff/Performance';
import { StaffReportIssue } from './pages/staff/StaffReportIssue';

// Vendor Pages
import { VendorDashboard } from './pages/vendor/VendorDashboard';
import { VendorEventRequest } from './pages/vendor/VendorEventRequest';
import { VendorPresetPackage } from './pages/vendor/VendorPresetPackage';
import { VendorManageResource } from './pages/vendor/VendorManageResource';
import { VendorManageStaff } from './pages/vendor/VendorManageStaff';
import { VendorCoordination } from './pages/vendor/VendorCoordination';
import { VendorMonitoring } from './pages/vendor/VendorMonitoring';
import { VendorVerifyDocs } from './pages/vendor/VendorVerifyDocs';
import { VendorReportIssue } from './pages/vendor/VendorReportIssue';

// Superuser Pages
import { SuperuserDashboard } from './pages/superuser/SuperuserDashboard';
import { SuperuserUsers } from './pages/superuser/SuperuserUsers';
import { SuperuserEvents } from './pages/superuser/SuperuserEvents';
import { SuperuserResources } from './pages/superuser/SuperuserResources';
import { SuperuserStaff } from './pages/superuser/SuperuserStaff';
import { SuperuserBookings } from './pages/superuser/SuperuserBookings';

// Protected Route Guard
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return <div style={{ background: '#060a14', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Loading Checkmate...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  if (allowedRoles && !allowedRoles.map(r => r.toLowerCase()).includes((role || '').toLowerCase())) {
    return <Navigate to={`/${role.toLowerCase()}/dashboard`} replace />;
  }

  return children;
};

export function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/vendor-approvals" element={<ProtectedRoute allowedRoles={['admin']}><VendorApprovals /></ProtectedRoute>} />
          <Route path="/admin/manage-users" element={<ProtectedRoute allowedRoles={['admin']}><ManageUsers /></ProtectedRoute>} />
          <Route path="/admin/monitor-events" element={<ProtectedRoute allowedRoles={['admin']}><MonitorEvents /></ProtectedRoute>} />
          <Route path="/admin/coordination" element={<ProtectedRoute allowedRoles={['admin']}><AdminCoordination /></ProtectedRoute>} />
          <Route path="/admin/issue-tracking" element={<ProtectedRoute allowedRoles={['admin']}><IssueTracking /></ProtectedRoute>} />
          <Route path="/admin/payouts" element={<ProtectedRoute allowedRoles={['admin']}><AdminPayouts /></ProtectedRoute>} />
          <Route path="/admin/report-analytics" element={<ProtectedRoute allowedRoles={['admin']}><ReportAnalytics /></ProtectedRoute>} />
          <Route path="/admin/audit-logs" element={<ProtectedRoute allowedRoles={['admin']}><AuditLogs /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><AdminSettings /></ProtectedRoute>} />

          {/* Client Routes */}
          <Route path="/client/dashboard" element={<ProtectedRoute allowedRoles={['client']}><ClientDashboard /></ProtectedRoute>} />
          <Route path="/client/browse-packages" element={<ProtectedRoute allowedRoles={['client']}><ClientBrowsePackages /></ProtectedRoute>} />
          <Route path="/client/create-event" element={<ProtectedRoute allowedRoles={['client']}><CreateEventClient /></ProtectedRoute>} />
          <Route path="/client/my-events" element={<ProtectedRoute allowedRoles={['client']}><ClientMyEvents /></ProtectedRoute>} />
          <Route path="/client/track-progress" element={<ProtectedRoute allowedRoles={['client']}><ClientTrackProgress /></ProtectedRoute>} />
          <Route path="/client/coordination" element={<ProtectedRoute allowedRoles={['client']}><ClientCoordination /></ProtectedRoute>} />
          <Route path="/client/billing" element={<ProtectedRoute allowedRoles={['client']}><ClientBilling /></ProtectedRoute>} />
          <Route path="/client/report-issue" element={<ProtectedRoute allowedRoles={['client']}><ClientReportIssue /></ProtectedRoute>} />

          {/* Staff Routes */}
          <Route path="/staff/dashboard" element={<ProtectedRoute allowedRoles={['staff']}><StaffDashboard /></ProtectedRoute>} />
          <Route path="/staff/assigned-events" element={<ProtectedRoute allowedRoles={['staff']}><AssignedEvents /></ProtectedRoute>} />
          <Route path="/staff/task-board" element={<ProtectedRoute allowedRoles={['staff']}><TaskBoard /></ProtectedRoute>} />
          <Route path="/staff/schedule" element={<ProtectedRoute allowedRoles={['staff']}><Schedule /></ProtectedRoute>} />
          <Route path="/staff/messages" element={<ProtectedRoute allowedRoles={['staff']}><StaffMessages /></ProtectedRoute>} />
          <Route path="/staff/performance" element={<ProtectedRoute allowedRoles={['staff']}><Performance /></ProtectedRoute>} />
          <Route path="/staff/report-issue" element={<ProtectedRoute allowedRoles={['staff']}><StaffReportIssue /></ProtectedRoute>} />

          {/* Vendor Routes */}
          <Route path="/vendor/dashboard" element={<ProtectedRoute allowedRoles={['vendor']}><VendorDashboard /></ProtectedRoute>} />
          <Route path="/vendor/event-requests" element={<ProtectedRoute allowedRoles={['vendor']}><VendorEventRequest /></ProtectedRoute>} />
          <Route path="/vendor/preset-packages" element={<ProtectedRoute allowedRoles={['vendor']}><VendorPresetPackage /></ProtectedRoute>} />
          <Route path="/vendor/manage-resources" element={<ProtectedRoute allowedRoles={['vendor']}><VendorManageResource /></ProtectedRoute>} />
          <Route path="/vendor/manage-staff" element={<ProtectedRoute allowedRoles={['vendor']}><VendorManageStaff /></ProtectedRoute>} />
          <Route path="/vendor/coordination" element={<ProtectedRoute allowedRoles={['vendor']}><VendorCoordination /></ProtectedRoute>} />
          <Route path="/vendor/monitoring" element={<ProtectedRoute allowedRoles={['vendor']}><VendorMonitoring /></ProtectedRoute>} />
          <Route path="/vendor/verify-docs" element={<ProtectedRoute allowedRoles={['vendor']}><VendorVerifyDocs /></ProtectedRoute>} />
          <Route path="/vendor/report-issue" element={<ProtectedRoute allowedRoles={['vendor']}><VendorReportIssue /></ProtectedRoute>} />

          {/* Superuser Routes */}
          <Route path="/superuser/dashboard" element={<ProtectedRoute allowedRoles={['superuser']}><SuperuserDashboard /></ProtectedRoute>} />
          <Route path="/superuser/users" element={<ProtectedRoute allowedRoles={['superuser']}><SuperuserUsers /></ProtectedRoute>} />
          <Route path="/superuser/events" element={<ProtectedRoute allowedRoles={['superuser']}><SuperuserEvents /></ProtectedRoute>} />
          <Route path="/superuser/resources" element={<ProtectedRoute allowedRoles={['superuser']}><SuperuserResources /></ProtectedRoute>} />
          <Route path="/superuser/staff" element={<ProtectedRoute allowedRoles={['superuser']}><SuperuserStaff /></ProtectedRoute>} />
          <Route path="/superuser/bookings" element={<ProtectedRoute allowedRoles={['superuser']}><SuperuserBookings /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
