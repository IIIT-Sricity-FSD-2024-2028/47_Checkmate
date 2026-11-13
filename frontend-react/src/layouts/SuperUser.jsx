import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import PlatformBanner from "../components/PlatformBanner";
import { superuserMenuItems } from "../routes/roleRoutes";
import { getAuthSession } from "../services/auth/authStorage";


function SuperuserLayout() {
    const authSession = getAuthSession();
    const userName = authSession?.user?.name || "User";
    return <div className="layout">
        <Sidebar role={"superuser"} menuItems={superuserMenuItems} userName={userName}></Sidebar>
        <main className="main-content">
            <PlatformBanner showAnnouncements={false} />
            <Outlet></Outlet>
        </main>
    </div>
}

export default SuperuserLayout