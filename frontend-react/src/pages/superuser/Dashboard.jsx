import React from "react";
import "../../styles/dashboard.css";

function SuperuserDashboard() {
  return (
    <div className="superuser-page">
      <header className="topbar">
        <h1 className="page-title">Superuser Operations</h1>
      </header>
      <div className="content">
        <div
          className="card"
          style={{
            padding: "36px 28px",
            borderRadius: "var(--radius, 12px)",
            background: "var(--bg-card, #2e1c40)",
            border: "1px solid var(--border, rgba(255, 255, 255, 0.08))",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "700",
              marginBottom: "8px",
              color: "var(--text-primary)",
            }}
          >
            System Administration & Audit
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Monitor multi-tenant infrastructure, system health, and cross-portal audit logs.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SuperuserDashboard;
