import React from "react";
import "../styles/dashboard.css";

function WelcomeCard({name, description }) {
    
    return (
        <div className="welcome-banner">
            <h2>Welcome back, {name}! 👋</h2>
            <p>{description}</p>
        </div>
    );
}
export default WelcomeCard;
