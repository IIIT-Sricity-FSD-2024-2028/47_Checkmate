import "../../styles/dashboard.css"
import StatisticCard from "../../components/StatisticCard"
import { Calendar, TrendingUp, Package, CheckCircle2, DollarSign, Sidebar } from "lucide-react"
import WelcomeCard from "../../components/WelcomeCard"

function VendorDashboard() {
    return (
        <div className="vendor-dashboard">
            <h1 className="page-title">Vendor Dashboard</h1>
            <WelcomeCard user_name={"vendor_name"} description={"Here's what's happening with your events today."}/>
            <div className="stats-grid">
                <StatisticCard 
                    value="5" 
                    title="Pending Requests" 
                    status="Awaiting"
                    icon={Calendar}
                    color="blue"
                />
                <StatisticCard 
                    value="4" 
                    title="Active Events" 
                    status="Live"
                    icon={TrendingUp}
                    color="green"
                />
                <StatisticCard 
                    value="8" 
                    title="Total Events" 
                    status="All"
                    icon={Package}
                    color="purple"
                />
                <StatisticCard 
                    value="1" 
                    title="Completed Events" 
                    status="Done"
                    icon={CheckCircle2}
                    color="orange"
                />
                <StatisticCard 
                    value="$0.00" 
                    title="Net Earnings" 
                    status="Live"
                    icon={DollarSign}
                    color="green"
                />
            </div>
        </div>
    )
}

export default VendorDashboard


