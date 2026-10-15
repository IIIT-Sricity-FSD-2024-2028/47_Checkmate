import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "../pages/public/LandingPage";
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
import AdminLayout from "../layouts/AdminLayout";
import VendorLayout from "../layouts/VendorLayout";
import SuperuserLayout from "../layouts/SuperUser";
import SignIn from "../pages/auth/SignIn";
import Events from "../pages/vendor/Events";
import EventReview from "../pages/vendor/EventReview";
import SignUp1 from "../pages/auth/SignUp1";
import SignUp2 from "../pages/auth/SignUp2";
import VendorProfile from "../pages/vendor/Profile";
import ManageResource from "../pages/vendor/ManageResource";
import ClientProfile from "../pages/client/Profile";
import StaffProfile from "../pages/staff/Profile";


function AppRoutes() {
    return <BrowserRouter>
        <Routes>
            <Route path="/" element={<LandingPage />}></Route>
            <Route path="/signin" element={<SignIn />}></Route>
            <Route path="/signup-details" element={<SignUp1 />}></Route>
            <Route path="/signup-password" element={<SignUp2 />}></Route>

            <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="vendor-approvals" element={<AdminVendorApprovals />} />
                <Route path="users" element={<AdminManageUsers />} />
            </Route>
            <Route path="/client" element={<ClientLayout />}>
                <Route path="profile" element={<ClientProfile />}></Route>
                <Route path="dashboard" element={<ClientDashboard />}></Route>
                <Route path="create-event" element={<ClientCreateEvent />}></Route>
                <Route path="events" element={<ClientMyEvents />}></Route>
                <Route path="packages" element={<ClientBrowsePackages />}></Route>
                <Route path="billing" element={<ClientBilling />}></Route>
                <Route path="report-issue" element={<ReportIssue />}></Route>
            </Route>
            <Route path="/staff" element={<StaffLayout />}>
                <Route path="profile" element={<StaffProfile />}></Route>
                <Route path="dashboard" element={<StaffDashboard />}></Route>
                <Route path="assigned-events" element={<StaffAssignedEvents />}></Route>
                <Route path="task-board" element={<StaffTaskBoard />}></Route>
                <Route path="performance" element={<StaffPerformance />}></Route>
                <Route path="report-issue" element={<ReportIssue />}></Route>
            </Route>
            <Route path="/superuser" element={<SuperuserLayout />}>
                <Route path="dashboard" element={<SuperuserDashboard />}></Route>
                <Route path="assigned-events" element={<StaffAssignedEvents />}></Route>
                <Route path="task-board" element={<StaffTaskBoard />}></Route>
                <Route path="performance" element={<StaffPerformance />}></Route>
                <Route path="report-issue" element={<ReportIssue />}></Route>
            </Route>
            <Route path="/vendor" element={<VendorLayout />}>
                <Route path="profile" element={<VendorProfile />}></Route>
                <Route path="dashboard" element={<VendorDashboard />}></Route>
                <Route path="events" element={<Events />} />
                <Route path="events/:id/review" element={<EventReview />} />
                <Route path="event-review" element={<EventReview />} />
                <Route path="resources" element={<ManageResource />} />
                <Route path="manage-resource" element={<ManageResource />} />
                <Route path="assigned-events" element={<StaffAssignedEvents />}></Route>
                <Route path="task-board" element={<StaffTaskBoard />}></Route>
                <Route path="performance" element={<StaffPerformance />}></Route>
                <Route path="report-issue" element={<ReportIssue />}></Route>

            </Route>
        </Routes>
    </BrowserRouter>
}

export default AppRoutes