import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { vendorMenuItems } from "../routes/roleRoutes";
import { getAuthSession } from "../services/auth/authStorage";


function VendorLayout() {
    const authSession = getAuthSession();
    const userName = authSession?.user?.name || "User";

    return <div className="layout">
        <Sidebar role={"vendor"} menuItems={vendorMenuItems} userName={userName}></Sidebar>
        <main className="main-content">
            <Outlet></Outlet>
        </main>
    </div>
}

export default VendorLayout