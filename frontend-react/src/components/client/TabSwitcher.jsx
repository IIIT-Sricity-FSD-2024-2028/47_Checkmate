import React from "react";

/**
 * TabSwitcher Component
 * ----------------------------------------------------------------------------
 * Pill-style tabs used by Report Issue (Event Team / Admin) and
 * Messages (Event Chat / Admin Support).
 *
 * Props:
 *  - tabs: [{ value: "event", label: "Event Team", icon: LucideIcon }]
 *  - active: value of the selected tab
 *  - onChange: called with the clicked tab's value
 */
function TabSwitcher({ tabs = [], active, onChange }) {
  return (
    <div className="cl-tabs" role="tablist">
      {tabs.map(({ value, label, icon: Icon }) => (
        <button type="button" role="tab" key={value} aria-selected={active === value}
          className={active === value ? "active" : ""} onClick={() => onChange(value)}>
          {Icon && <Icon size={16} />} {label}
        </button>
      ))}
    </div>
  );
}

export default TabSwitcher;
