export default function Footer() {
  return (
    <footer>
      <div className="container footer-content">
        <div className="footer-logo">
          <a className="logo" href="#home">
            <span className="logo-icon"><i className="ph-fill ph-calendar-blank" /></span>
            <span>Event Manager</span>
          </a>
          <p>The ultimate platform for seamless event management and coordination.</p>
        </div>

        <div className="footer-links">
          <div className="link-group">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="#home">Home</a></li>
              <li><a href="#features">Features</a></li>
              <li><a href="/signin">Login</a></li>
              <li><a href="/signup-details">Register</a></li>
            </ul>
          </div>

          <div className="link-group">
            <h4>Platform</h4>
            <ul>
              <li><a >Client Portal</a></li>
              <li><a >Vendor Dashboard</a></li>
              <li><a >Staff Management</a></li>
              <li><a >Admin Console</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 Event Manager. All rights reserved. Built with precision for event excellence.</p>
      </div>
    </footer>
  );
}
