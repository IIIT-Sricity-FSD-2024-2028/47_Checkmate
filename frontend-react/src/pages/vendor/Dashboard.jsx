import "../../styles/dashboard.css"
import StatisticCard from "../../components/StatisticCard"
import { Calendar, TrendingUp, Package, CheckCircle2, DollarSign } from "lucide-react"
import WelcomeCard from "../../components/WelcomeCard"
import TopHeaderBar from "../../components/TopHeaderBar"
import UpcomingEventsCard from "../../components/vendor/UpcomingEventsCard"
import RecentActivityItem from "../../components/vendor/RecentActivityItem"
import AlertItem from "../../components/vendor/AlertItem"
import QuickActionButton from "../../components/vendor/QuickActionButton"
import { Link } from "react-router-dom";
import { getAuthSession } from "../../services/auth/authStorage"

function VendorDashboard() {

    const authSession = getAuthSession();
    const userName = authSession?.user?.name || "User";
    return (
        <div className="vendor-dashboard">
            <TopHeaderBar title="Vendor Dashboard" />
            <div className="content">
                <WelcomeCard name={userName} description="Here's what's happening with your events today." />
                <div className="stats-grid">
                    <StatisticCard 
                        value="5" 
                        title="Pending Requests" 
                        status="↗ Active"
                        icon={Calendar}
                        color="blue"
                    />
                    <StatisticCard 
                        value="4" 
                        title="Active Events" 
                        status="↗ Live"
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
                        status="90% Net Payout"
                        icon={DollarSign}
                        color="green"
                    />
                </div>
                <div className="bottom-grid">
                    <div className="left-col">
                        <div className="card event-card">
                            <div className="card__header">
                                <h3>Upcoming Events</h3>
                                <Link to="/vendor/events" className="view-all">
                                    View All →
                                </Link>
                            </div>
                            <div className="event-list">
                                <UpcomingEventsCard event_name="Tech Summit 2026" status="pending" timeAndVenue="May 10, 2026 Convention Center"/>
                                <UpcomingEventsCard event_name="Sarah & Mike Wedding" status="confirmed" timeAndVenue="May 18, 2026 Grand Hotel Ballroom"/>
                                <UpcomingEventsCard event_name="Annual Corporate Gala" status="Live" timeAndVenue="May 21, 2026 Skyline Ballroom"/>
                                <UpcomingEventsCard event_name="FinTech Global Keynote" status="confirmed" timeAndVenue="Jun 18, 2026 Convention Center"/>
                                <UpcomingEventsCard event_name="25th Anniversary Banquet" status="Completed" timeAndVenue="Jul 2, 2026 Grand Hotel Ballroom"/>
                            </div>
                        </div>

                        <div className="card Recent-Activity-card">
                            <div className="card__header">
                                <h3>Recent Activity</h3>
                            </div>
                            <div className="activity-list">
                                <RecentActivityItem activity="Staff accepted assignment" when="Just now" description="Chloe Bennett -> Annual Corporate Gala" />
                                <RecentActivityItem activity="Staff accepted assignment" when="10 mins ago" description="Elena Rostova -> Annual Corporate Gala" />
                                <RecentActivityItem activity="Staff accepted assignment" when="30 mins ago" description="Mike Johnson -> Annual Corporate Gala" />
                                <RecentActivityItem activity="Staff accepted assignment" when="2 hours ago" description="Marcus Sterling -> Sarah & Mike Wedding" />
                            </div>
                        </div>
                    </div>

                    <div className="right-col">
                        <div className="card Alertitem-card">
                            <div className="card__header alerts-header">
                                <span className="alert-icon">⚠</span>
                                <h3>Critical Alerts</h3>
                            </div>
                            <div className="alert-list">
                                <AlertItem what_alert="Low stock: Audio equipment for Tech Summit" when="2 hours ago" type="yellow" />
                                <AlertItem what_alert="Staff conflict: 2 events on Apr 2" when="5 hours ago" type="orange" />
                                <AlertItem what_alert="1 event request(s) awaiting review" when="1 day ago" type="blue" />
                            </div>
                        </div>

                        <div className="card Quckaction-card">
                            <div className="card__header">
                                <h3>Quick Actions</h3>
                            </div>
                            <div className="quick-actions">
                                <QuickActionButton button="1" button_type="Review Event" />
                                <QuickActionButton button="2" button_type="Manage Resources" />
                                <QuickActionButton button="3" button_type="Assign Staff" />
                                <QuickActionButton button="4" button_type="Add Package" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default VendorDashboard


