import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { vendorMenuItems } from "../routes/roleRoutes";

function VendorLayout() {
    return <div className="layout">
        <Sidebar role={"vendor"} menuItems={vendorMenuItems} userName="John"></Sidebar>
        <main className="main-content">
            <Outlet></Outlet>
        </main>
    </div>
}

export default VendorLayout