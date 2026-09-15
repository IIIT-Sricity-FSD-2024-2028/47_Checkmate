import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { staffMenuItems } from "../routes/roleRoutes";

function StaffLayout() {
    return <div className="layout">
        <Sidebar role={"staff"} menuItems={staffMenuItems} userName="John"></Sidebar>
        <main className="main-content">
            <Outlet></Outlet>
        </main>
    </div>
}

export default StaffLayout