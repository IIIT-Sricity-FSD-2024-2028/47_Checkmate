import React from "react"
import { Calendar, TrendingUp, Package, CheckCircle2, DollarSign } from "lucide-react"

function StatisticCard({ title, value, description = null, status, icon: IconProp, color }) {
    const key = (title || "").toLowerCase().trim()

    let Icon = IconProp
    let iconClass = color ? `stat-icon--${color}` : ""

    if (!Icon) {
        if (key.includes("earning") || key.includes("payout") || key.includes("net") || key.includes("dollar")) {
            Icon = DollarSign
            iconClass = iconClass || "stat-icon--green"
        } else if (key.includes("pending")) {
            Icon = Calendar
            iconClass = iconClass || "stat-icon--blue"
        } else if (key.includes("active") || key.includes("live")) {
            Icon = TrendingUp
            iconClass = iconClass || "stat-icon--green"
        } else if (key.includes("total")) {
            Icon = Package
            iconClass = iconClass || "stat-icon--purple"
        } else if (key.includes("complete") || key.includes("done")) {
            Icon = CheckCircle2
            iconClass = iconClass || "stat-icon--orange"
        } else {
            Icon = Calendar
            iconClass = iconClass || "stat-icon--blue"
        }
    }

    return (
        <div className="stat-card">
            <div className="stat-card__top">
                <div className={`stat-icon ${iconClass}`.trim()}>
                    {React.isValidElement(Icon) ? Icon : Icon ? <Icon size={20} /> : null}
                </div>
                {status && <span className="stat-trend up">{status}</span>}
            </div>
            <div className="stat-label">{title}</div>
            <div className="stat-value">{value}</div>
            {description && <div className="stat-description">{description}</div>}
        </div>
    )
}

export default StatisticCard


