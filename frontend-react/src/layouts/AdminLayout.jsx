import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { adminMenuItems } from "../routes/roleRoutes";

function AdminLayout() {
    return <div className="layout">
        <Sidebar role={"admin"} menuItems={adminMenuItems} userName="John"></Sidebar>
        <main className="main-content">
            <Outlet></Outlet>
        </main>
    </div>
}

export default AdminLayout