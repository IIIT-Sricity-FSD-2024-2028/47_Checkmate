import React from "react";
import { FileText, Package, UserPlus, TrendingUp, Sparkles } from "lucide-react";

function QuickActionButton({ button, button_type, onClick }) {
    const label = button_type || button || "Action";
    const key = (label || "").toLowerCase();

    let Icon = FileText;
    let colorClass = "qa-icon--blue";

    if (key.includes("resource")) {
        Icon = Package;
        colorClass = "qa-icon--purple";
    } else if (key.includes("staff") || key.includes("assign") || key.includes("user")) {
        Icon = UserPlus;
        colorClass = "qa-icon--green";
    } else if (key.includes("package") || key.includes("trend") || key.includes("add")) {
        Icon = TrendingUp;
        colorClass = "qa-icon--orange";
    } else if (key.includes("review") || key.includes("event")) {
        Icon = FileText;
        colorClass = "qa-icon--blue";
    } else {
        Icon = Sparkles;
        colorClass = "qa-icon--blue";
    }

    return (
        <button className="qa-btn" onClick={onClick} type="button">
            <div className={`qa-icon ${colorClass}`}>
                <Icon size={19} />
            </div>
            <span>{label}</span>
        </button>
    );
}

export default QuickActionButton;