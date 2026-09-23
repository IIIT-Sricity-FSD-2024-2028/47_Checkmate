import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "../pages/public/LandingPage";
import AdminDashboard from "../pages/admin/Dashboard";
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
import Events from "../pages/vendor/Events";


function AppRoutes() {
    return <BrowserRouter>
        <Routes>
            <Route path="/" element={<LandingPage />}></Route>

            <Route path="/admin" element={<AdminLayout />}>
                <Route path="dashboard" element={<AdminDashboard />}></Route>
                <Route path="create-event" element={<ClientCreateEvent />}></Route>
                <Route path="events" element={<ClientMyEvents />}></Route>
                <Route path="packages" element={<ClientBrowsePackages />}></Route>
                <Route path="billing" element={<ClientBilling />}></Route>
                <Route path="report-issue" element={<ReportIssue />}></Route>
            </Route>
            <Route path="/client" element={<ClientLayout />}>
                <Route path="dashboard" element={<ClientDashboard />}></Route>
                <Route path="create-event" element={<ClientCreateEvent />}></Route>
                <Route path="events" element={<ClientMyEvents />}></Route>
                <Route path="packages" element={<ClientBrowsePackages />}></Route>
                <Route path="billing" element={<ClientBilling />}></Route>
                <Route path="report-issue" element={<ReportIssue />}></Route>
            </Route>
            <Route path="/staff" element={<StaffLayout />}>
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
                <Route path="dashboard" element={<VendorDashboard />}></Route>
                 <Route path="events" element={<Events />} />
                <Route path="assigned-events" element={<StaffAssignedEvents />}></Route>
                <Route path="task-board" element={<StaffTaskBoard />}></Route>
                <Route path="performance" element={<StaffPerformance />}></Route>
                <Route path="report-issue" element={<ReportIssue />}></Route>

            </Route>
        </Routes>
    </BrowserRouter>
}

export default AppRoutes