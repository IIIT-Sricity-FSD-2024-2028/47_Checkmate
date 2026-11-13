import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import PlatformBanner from "../components/PlatformBanner";
import { staffMenuItems } from "../routes/roleRoutes";
import { getAuthSession } from "../services/auth/authStorage";


function StaffLayout() {
    const authSession = getAuthSession();
    const userName = authSession?.user?.name || "User";

    return <div className="layout">
        <Sidebar role={"staff"} menuItems={staffMenuItems} userName={userName}></Sidebar>
        <main className="main-content">
            <PlatformBanner />
            <Outlet></Outlet>
        </main>
    </div>
}

export default StaffLayout