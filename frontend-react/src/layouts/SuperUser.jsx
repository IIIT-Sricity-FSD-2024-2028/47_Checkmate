import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { superuserMenuItems } from "../routes/roleRoutes";

function SuperuserLayout() {
    return <div className="layout">
        <Sidebar role={"superuser"} menuItems={superuserMenuItems} userName="John"></Sidebar>
        <main className="main-content">
            <Outlet></Outlet>
        </main>
    </div>
}

export default SuperuserLayout