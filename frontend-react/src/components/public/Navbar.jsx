import { useEffect, useState } from "react";

const links = [
  { label: "Home", id: "home" },
  { label: "Features", id: "features" },
  { label: "How It Works", id: "how-it-works" }
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 50);

      // Find the last section that has reached the top part of the screen.
      let currentSection = "home";
      links.forEach((link) => {
        const section = document.getElementById(link.id);
        if (section && window.scrollY >= section.offsetTop - 250) {
          currentSection = link.id;
        }
      });
      setActiveSection(currentSection);
    }

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav id="navbar" className={scrolled ? "scrolled" : ""}>
      <div className="nav-container">
        <a className="logo" href="#home">
          <span className="logo-icon"><i className="ph-fill ph-calendar-blank" /></span>
          <span>Event Manager</span>
        </a>

        <ul className="nav-links">
          {links.map((link) => (
            <li key={link.id}>
              <a
                href={`#${link.id}`}
                className={activeSection === link.id ? "active" : ""}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="nav-auth">
          <a href="/signin" className="btn-text">Sign In</a>
          <a href="/signup-details" className="btn-primary">Create Account</a>
        </div>
      </div>
    </nav>
  );
}
