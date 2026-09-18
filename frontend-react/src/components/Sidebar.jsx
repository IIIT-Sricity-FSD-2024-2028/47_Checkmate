function Sidebar({ role, menuItems, userName }) {
    return (
        <aside className="sidebar">

            {/* Brand */}
            <div className="sidebar__brand">
                <div className="brand-icon">
                    <i className="ph-fill ph-calendar-blank"></i>
                </div>

                <div>
                    <div className="brand-name">EventPro</div>
                    <div className="brand-role">{role}</div>
                </div>
            </div>

            <nav className="sidebar__nav">
                {menuItems.map((item) => (
                    <a href={item.path} className="nav-item" key={item.path}>
                        <i className={item.icon}></i>
                        {item.label}
                    </a>
                ))}
            </nav>

            <div className="sidebar__footer">
                <div className="user-info">
                    <div className="user-name">
                        {userName}
                    </div>
                </div>
                <a href="/" className="logout-btn">
                    <i className="ph ph-sign-out"></i>
                    Logout
                </a>

            </div>

        </aside>
    );
}

export default Sidebar;