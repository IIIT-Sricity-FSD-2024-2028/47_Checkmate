import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { adminMenuItems } from "../routes/roleRoutes";
import { getAuthSession } from "../services/auth/authStorage";


function AdminLayout() {
    const authSession = getAuthSession();
    const userName = authSession?.user?.name || "User";

    return <div className="layout">
        <Sidebar role={"admin"} menuItems={adminMenuItems} userName={userName}></Sidebar>
        <main className="main-content">
            <Outlet></Outlet>
        </main>
    </div>
}

export default AdminLayout