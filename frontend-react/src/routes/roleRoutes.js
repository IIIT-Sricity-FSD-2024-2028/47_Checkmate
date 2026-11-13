import {
    LayoutDashboard,
    ClipboardList,
    Package,
    Users,
    Box,
    Flag,
    AlertCircle,
    MessageSquare,
    Radio,
    Shield,
    CalendarCheck,
    PieChart,
    Bug,
    IndianRupee,
    Activity,
    Settings,
    UserPlus
} from "lucide-react";

export const clientMenuItems = [
    {
        label: "Dashboard",
        path: "/client/dashboard",
        icon: LayoutDashboard
    },
    {
        label: "Create Event",
        path: "/client/create-event",
        icon: ClipboardList
    },
    {
        label: "My Events",
        path: "/client/events",
        icon: CalendarCheck
    },
    {
        label: "Browse Packages",
        path: "/client/packages",
        icon: Package
    },
    {
        label: "Billing & Invoices",
        path: "/client/billing",
        icon: IndianRupee
    },
    {
        label: "Messages",
        path: "/client/messages",
        icon: MessageSquare
    },
    {
        label: "Report Issue",
        path: "/client/report-issue",
        icon: AlertCircle
    }
];

export const vendorMenuItems = [
    {
        label: "Dashboard",
        path: "/vendor/dashboard",
        icon: LayoutDashboard,
    },
    {
        label: "Events",
        path: "/vendor/events",
        icon: ClipboardList,
    },
    {
        label: "Services & Packages",
        path: "/vendor/packages",
        icon: Package,
    },
    {
        label: "Inventory / Resources",
        path: "/vendor/resources",
        icon: Box,
    },
    {
        label: "Staff Allocation",
        path: "/vendor/staff",
        icon: Users,
    },
    {
        label: "Staff Onboarding",
        path: "/vendor/staff-onboarding",
        icon: UserPlus,
    },
    {
        label: "Live Monitoring",
        path: "/vendor/monitoring",
        icon: Radio,
    },
    {
        label: "Coordination Hub",
        path: "/vendor/coordination",
        icon: MessageSquare,
    },
    {
        label: "Client Issues",
        path: "/vendor/issues",
        icon: AlertCircle,
    },
    {
        label: "Report Issue to Admin",
        path: "/vendor/report-issue",
        icon: Flag,
    },
];

export const staffMenuItems = [
    {
        label: "Dashboard",
        path: "/staff/dashboard",
        icon: LayoutDashboard,
    },
    {
        label: "Assigned Events",
        path: "/staff/assigned-events",
        icon: CalendarCheck,
    },
    {
        label: "Schedule",
        path: "/staff/schedule",
        icon: ClipboardList,
    },
    {
        label: "Messages",
        path: "/staff/messages",
        icon: MessageSquare,
    },
    {
        label: "Task Board",
        path: "/staff/task-board",
        icon: Package,
    },
    {
        label: "Performance",
        path: "/staff/performance",
        icon: Activity,
    },
    {
        label: "Report Issue",
        path: "/staff/report-issue",
        icon: AlertCircle,
    },
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
        icon: IndianRupee,
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
        icon: LayoutDashboard
    },
    {
        label: "Users",
        path: "/superuser/users",
        icon: Users
    },
    {
        label: "Events",
        path: "/superuser/events",
        icon: CalendarCheck
    },
    {
        label: "Resources",
        path: "/superuser/resources",
        icon: Package
    },
    {
        label: "Bookings",
        path: "/superuser/bookings",
        icon: IndianRupee
    },
    {
        label: "Reports",
        path: "/superuser/reports",
        icon: PieChart
    },
    {
        label: "System Settings",
        path: "/superuser/settings",
        icon: Settings
    },
    {
        label: "Report Issue",
        path: "/superuser/report-issue",
        icon: Bug
    }
];
