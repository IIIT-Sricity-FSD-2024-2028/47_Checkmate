import {
    LayoutDashboard,
    ClipboardList,
    Package,
    Users,
    Box,
    Flag,
    AlertCircle,
    ShieldAlert,
    MessageSquare,
    Radio,
    Shield,
    ShieldCheck,
    CalendarCheck,
    PieChart,
    Bug,
    DollarSign,
    Activity,
    Settings,
    Inbox
} from "lucide-react";

export const clientMenuItems = [
    {
        label: "Dashboard",
        path: "/client/dashboard",
        icon: "ph ph-squares-four"
    },
    {
        label: "Create Event",
        path: "/client/create-event",
        icon: "ph ph-plus"
    },
    {
        label: "My Events",
        path: "/client/events",
        icon: "ph ph-list-bullets"
    },
    {
        label: "Browse Packages",
        path: "/client/packages",
        icon: "ph ph-tote"
    },
    {
        label: "Messages",
        path: "/client/messages",
        icon: "ph ph-chat-teardrop-dots"
    },
    {
        label: "Billing",
        path: "/client/billing",
        icon: "ph ph-credit-card"
    },
    {
        label: "Report Issue",
        path: "/client/report-issue",
        icon: "ph ph-warning-circle"
    }
];

export const vendorMenuItems = [
    {
        label: "Dashboard",
        path: "/vendor/dashboard",
        icon: LayoutDashboard,
    },
    {
        label: "Event Request",
        path: "/vendor/events",
        icon: ClipboardList,
    },
    {
        label: "Manage Resource",
        path: "/vendor/resources",
        icon: Package,
    },
    {
        label: "Manage Staff",
        path: "/vendor/staff",
        icon: Users,
    },
    {
        label: "Preset Package",
        path: "/vendor/packages",
        icon: Box,
    },
    {
        label: "Report Issue",
        icon: Flag,
        children: [
            {
                label: "Issue on Event",
                path: "/vendor/report-issue",
                icon: AlertCircle,
            },
            {
                label: "Issue to Admin",
                path: "/vendor/report-issue-admin",
                icon: ShieldAlert,
            },
        ],
    },
    {
        label: "Coordination Hub",
        icon: MessageSquare,
        children: [
            {
                label: "Event Coordination",
                path: "/vendor/coordination",
                icon: Radio,
            },
            {
                label: "Admin Coordination",
                path: "/vendor/coordination-admin",
                icon: Shield,
            },
        ],
    },
    {
        // Client <-> vendor bridge: issues clients report on this vendor's events
        label: "Client Issues",
        path: "/vendor/issues",
        icon: Inbox,
    },
    {
        label: "Monitor Live Events",
        path: "/vendor/monitoring",
        icon: Radio,
    },
    {
        label: "Verify Documents",
        path: "/vendor/verify-docs",
        icon: ShieldCheck,
    },
];

export const staffMenuItems = [
    {
        label: "Dashboard",
        path: "/staff/dashboard",
        icon: "ph ph-squares-four"
    },
    {
        label: "Assigned Events",
        path: "/staff/assigned-events",
        icon: "ph ph-calendar"
    },
    {
        label: "Task Board",
        path: "/staff/task-board",
        icon: "ph ph-chat-teardrop-dots"
    },
    {
        label: "Performance",
        path: "/staff/performance",
        icon: "ph ph-chart-bar"
    },
    {
        label: "Report Issue",
        path: "/staff/report-issue",
        icon: "ph ph-warning-circle"
    }
];

export const adminMenuItems = [
    {
        label: "Dashboard",
        path: "/admin/dashboard",
        icon: LayoutDashboard,
    },
    {
        label: "Vendor Approvals",
        path: "/admin/vendor-approvals",
        icon: ClipboardList,
    },
    {
        label: "Manage Users",
        path: "/admin/users",
        icon: Users,
    },
    {
        label: "Monitor Events",
        path: "/admin/events",
        icon: CalendarCheck,
    },
    {
        label: "Report & Analytics",
        path: "/admin/reports",
        icon: PieChart,
    },
    {
        label: "Issue Tracking",
        path: "/admin/issues",
        icon: Bug,
    },
    {
        label: "Service Moderation",
        path: "/admin/moderation",
        icon: Shield,
    },
    {
        label: "Financial Payouts",
        path: "/admin/payouts",
        icon: DollarSign,
    },
    {
        label: "Coordination Hub",
        path: "/admin/coordination",
        icon: MessageSquare,
    },
    {
        label: "System Logs",
        path: "/admin/logs",
        icon: Activity,
    },
    {
        label: "Global Settings",
        path: "/admin/settings",
        icon: Settings,
    }
];

export const superuserMenuItems = [
    {
        label: "Dashboard",
        path: "/superuser/dashboard",
        icon: "ph ph-squares-four"
    },
    {
        label: "Users",
        path: "/superuser/users",
        icon: "ph ph-users"
    },
    {
        label: "Events",
        path: "/superuser/events",
        icon: "ph ph-calendar"
    },
    {
        label: "Reports",
        path: "/superuser/reports",
        icon: "ph ph-chart-bar"
    },
    {
        label: "System Settings",
        path: "/superuser/settings",
        icon: "ph ph-gear"
    },
    {
        label: "Report Issue",
        path: "/superuser/report-issue",
        icon: "ph ph-warning-circle"
    }
];