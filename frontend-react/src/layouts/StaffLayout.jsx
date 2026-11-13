import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { staffMenuItems } from "../routes/roleRoutes";
import { getAuthSession } from "../services/auth/authStorage";
import WelcomeOverlay from "../components/WelcomeOverlay";


function StaffLayout() {
    const authSession = getAuthSession();
    const userName = authSession?.user?.name || "User";

    return <div className="layout">
        <Sidebar role={"staff"} menuItems={staffMenuItems} userName={userName}></Sidebar>
        <main className="main-content">
            <Outlet></Outlet>
        </main>
        {/* Welcome popup: shown once per browser session, on whichever page opens first */}
        <WelcomeOverlay />
    </div>
}

export default StaffLayout