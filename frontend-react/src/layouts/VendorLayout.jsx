import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { vendorMenuItems } from "../routes/roleRoutes";
import { getAuthSession } from "../services/auth/authStorage";


function VendorLayout() {
    const authSession = getAuthSession();
    const userName = authSession?.user?.name || "Vendor";
    const userEmail = authSession?.user?.email || authSession?.email;

    return (
        <div className="layout">
            <Sidebar
                role="vendor"
                menuItems={vendorMenuItems}
                userName={userName}
                userEmail={userEmail}
            />
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}

export default VendorLayout