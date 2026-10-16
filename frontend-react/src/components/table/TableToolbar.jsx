import React from "react";
import { Search } from "lucide-react";
import "../../styles/components/table.css";

/**
 * Title on the left; filter selects and a search box on the right.
 *
 * @param {string} title
 * @param {{value: string, onChange: (v: string) => void, placeholder?: string}} search
 * @param {Array<{value: string, onChange: (v: string) => void,
 *                options: Array<{value: string, label: string}>, label: string}>} filters
 *        `label` is used as the select's accessible name.
 */
function TableToolbar({ title, search, filters = [] }) {
  return (
    <div className="table-toolbar">
      <div className="table-toolbar__title">{title}</div>
      <div className="table-toolbar__controls">
        {filters.map((filter) => (
          <select
            key={filter.label}
            aria-label={filter.label}
            className="table-select"
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
          >
            {filter.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ))}
        {search && (
          <div className="table-search">
            <Search size={15} className="table-search__icon" />
            <input
              type="text"
              value={search.value}
              placeholder={search.placeholder || "Search..."}
              onChange={(e) => search.onChange(e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default TableToolbar;
