import React from "react";
import "../../styles/dashboard.css";

function ReportIssue() {
  return (
    <div className="client-page">
      <header className="topbar">
        <h1 className="page-title">Support & Incident Reporting</h1>
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
            Need Assistance?
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Submit tickets regarding event coordination, vendor communication, or technical issues.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ReportIssue;
