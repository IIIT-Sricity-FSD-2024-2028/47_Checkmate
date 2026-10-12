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
    ShieldCheck
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
        icon: "ph ph-squares-four"
    },
    {
        label: "Events",
        path: "/admin/events",
        icon: "ph ph-calendar"
    },
    {
        label: "Users",
        path: "/admin/users",
        icon: "ph ph-users"
    },
    {
        label: "Packages",
        path: "/admin/packages",
        icon: "ph ph-tote"
    },
    {
        label: "Reports",
        path: "/admin/reports",
        icon: "ph ph-chart-bar"
    },
    {
        label: "Report Issue",
        path: "/admin/report-issue",
        icon: "ph ph-warning-circle"
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