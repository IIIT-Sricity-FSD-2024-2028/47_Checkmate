import { useState } from "react";
import { NavLink, useLocation, useNavigate, Link } from "react-router-dom";
import { CalendarCheck, ChevronDown, LogOut } from "lucide-react";

import "../styles/sidebar.css";
import { clearAuthSession, getAuthSession } from "../services/auth/authStorage";

const ROLE_SUBTITLES = {
  vendor: "Event Coordinator",
  admin: "Administrator",
  superuser: "Superuser Operations",
  staff: "Event Staff",
  client: "Client Portal",
};

function renderIcon(Icon) {
  if (!Icon) return null;
  if (typeof Icon === "string") {
    return <i className={Icon}></i>;
  }
  if (typeof Icon === "function" || typeof Icon === "object") {
    return <Icon size={17} className="nav-icon" />;
  }
  return null;
}

function Sidebar({ role, menuItems = [], userName, userEmail: propUserEmail }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [openGroups, setOpenGroups] = useState({});

  const session = getAuthSession();
  const effectiveName = userName || session?.user?.name || "User";
  const effectiveEmail =
    propUserEmail ||
    session?.user?.email ||
    session?.email ||
    "user@example.com";
  const userInitial = (
    effectiveName ? effectiveName.charAt(0) : "U"
  ).toUpperCase();

  const displayRole = ROLE_SUBTITLES[role?.toLowerCase()] || role || "User";

  const toggleGroup = (label) => {
    setOpenGroups((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const handleLogout = (e) => {
    e.preventDefault();
    clearAuthSession();
    navigate("/signin");
  };

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar__brand">
        <div className="brand-icon">
          <CalendarCheck size={18} className="icon-white" />
        </div>

        <div>
          <div className="brand-name">EventPro</div>
          <div className="brand-role">{displayRole}</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar__nav">
        {menuItems.map((item) => {
          // Dropdown group with submenus
          if (item.children && Array.isArray(item.children)) {
            const isChildActive = item.children.some(
              (child) => child.path && location.pathname.startsWith(child.path),
            );
            const isOpen = openGroups[item.label] ?? isChildActive;

            return (
              <div
                className={`nav-group ${isOpen ? "open" : ""}`}
                key={item.label}
              >
                <button
                  type="button"
                  className={`nav-item ${isChildActive ? "parent-active" : ""}`}
                  onClick={() => toggleGroup(item.label)}
                >
                  {renderIcon(item.icon)}
                  <span>{item.label}</span>
                  <ChevronDown size={14} className="nav-chevron" />
                </button>
                <div className="nav-sub">
                  {item.children.map((child) => (
                    <NavLink
                      to={child.path}
                      className={({ isActive }) =>
                        `nav-item ${isActive ? "active" : ""}`
                      }
                      key={child.path}
                    >
                      {renderIcon(child.icon)}
                      <span>{child.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          }

          // Standard nav item
          return (
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
              key={item.path}
            >
              {renderIcon(item.icon)}
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className="sidebar__footer">
        {["vendor", "client", "staff"].includes(role?.toLowerCase()) && (
          <Link to={`/${role}/profile`} className="user-profile-link">
            <div className="user-info">
              <div className="user-avatar">{userInitial}</div>
              <div className="user-details">
                <div className="user-name">{effectiveName}</div>
                <div className="user-email">{effectiveEmail}</div>
              </div>
            </div>
          </Link>
        )}
        <button type="button" className="logout-btn" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
