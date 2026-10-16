/**
 * COMPONENT: SearchBar.jsx
 * WHAT IT DOES:
 *   Shared search input container with magnifying glass icon.
 *   Provides instant real-time filtering across superuser tables.
 *
 * PROPS:
 *   - value: Current text filter query
 *   - onChange: Handler invoked when the user types
 *   - placeholder: Helpful prompt for the search field
 *   - id: Element identifier
 */

import React from 'react';

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  id = 'q',
}) {
  // FACULTY MAY ASK: How do you add a clear ("X") button to reset the search?
  // HOW TO CHANGE: Add a conditional button next to the input: {value && <button onClick={() => onChange({ target: { value: '' } })}>✕</button>}
  return (
    <div className="sw">
      <span className="sw-ico">🔍</span>
      <input
        type="text"
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete="off"
      />
    </div>
  );
}
