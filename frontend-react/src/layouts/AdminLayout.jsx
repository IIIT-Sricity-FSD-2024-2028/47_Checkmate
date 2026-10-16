import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { adminMenuItems } from "../routes/roleRoutes";
import { getAuthSession } from "../services/auth/authStorage";


function AdminLayout() {
    const authSession = getAuthSession();
    const userName = authSession?.user?.name || "Admin";
    const userEmail = authSession?.user?.email || authSession?.email;

    return (
        <div className="layout">
            <Sidebar
                role="admin"
                menuItems={adminMenuItems}
                userName={userName}
                userEmail={userEmail}
            />
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}

export default AdminLayout
