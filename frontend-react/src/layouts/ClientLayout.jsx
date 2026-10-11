import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { clientMenuItems } from "../routes/roleRoutes";
import { getAuthSession } from "../services/auth/authStorage";

function ClientLayout() {
    const authSession = getAuthSession();
    const userName = authSession?.user?.name || "User";

    return <div className="layout">
        <Sidebar role={"client"} menuItems={clientMenuItems} userName={userName}></Sidebar>
        <main className="main-content">
            <Outlet></Outlet>
        </main>
    </div>
}

export default ClientLayout