import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { vendorMenuItems } from "../routes/roleRoutes";
import { getAuthSession } from "../services/auth/authStorage";
import WelcomeOverlay from "../components/WelcomeOverlay";


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
            {/* Welcome popup: shown once per browser session, on whichever page opens first */}
            <WelcomeOverlay />
        </div>
    );
}

export default VendorLayout