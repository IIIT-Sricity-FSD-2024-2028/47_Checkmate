import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { clientMenuItems } from "../routes/roleRoutes";

function ClientLayout() {
    return <div className="layout">
        <Sidebar role={"client"} menuItems={clientMenuItems} userName="John"></Sidebar>
        <main className="main-content">
            <Outlet></Outlet>
        </main>
    </div>
}

export default ClientLayout