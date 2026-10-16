/**
 * ============================================================================
 * CLIENT PACKAGE TOOLBAR (ClientPackageToolbar.jsx)
 * ============================================================================
 * Role: Search & Category Filter Bar (Client Browse Packages page)
 * Location: src/components/client/ClientPackageToolbar.jsx
 *
 * Purpose:
 *   Category pills (All, Wedding, Birthday, Conference, Corporate, Party)
 *   on the left and a search box on the right.
 *
 * Props:
 *   @param {string} category / @param {Function} onCategoryChange
 *   @param {string} searchTerm / @param {Function} onSearchChange
 * ============================================================================
 */

import React from "react";
import { Search } from "lucide-react";

const CATEGORIES = ["All", "Wedding", "Birthday", "Conference", "Corporate", "Party"];

function ClientPackageToolbar({ category, onCategoryChange, searchTerm, onSearchChange }) {
  return (
    <div className="cl-toolbar cl-toolbar--between">
      <div className="cl-pills">
        {CATEGORIES.map((c) => (
          <button type="button" key={c} className={`cl-pill ${category === c ? "active" : ""}`}
            onClick={() => onCategoryChange(c)}>{c}</button>
        ))}
      </div>
      <div className="cl-search">
        <Search size={16} />
        <input type="text" placeholder="Search packages or services..."
          value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} />
      </div>
    </div>
  );
}

export default ClientPackageToolbar;
