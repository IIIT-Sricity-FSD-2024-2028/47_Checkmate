import React from "react";
import "../../styles/dashboard.css";

function BrowsePackages() {
  return (
    <div className="client-page">
      <header className="topbar">
        <h1 className="page-title">Browse Packages</h1>
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
            Curated Event Packages
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Explore vendor packages for weddings, corporate summits, and social celebrations.
          </p>
        </div>
      </div>
    </div>
  );
}

export default BrowsePackages;
