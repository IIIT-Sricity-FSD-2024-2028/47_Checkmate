import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { clientMenuItems } from "../routes/roleRoutes";
import { getAuthSession } from "../services/auth/authStorage";
import WelcomeOverlay from "../components/client/WelcomeOverlay";

function ClientLayout() {
    const authSession = getAuthSession();
    const userName = authSession?.user?.name || "User";

    return <div className="layout">
        <Sidebar role={"client"} menuItems={clientMenuItems} userName={userName}></Sidebar>
        <main className="main-content">
            <Outlet></Outlet>
        </main>
        {/* Shown once per browser session, on whichever client page opens first */}
        <WelcomeOverlay />
    </div>
}

export default ClientLayout