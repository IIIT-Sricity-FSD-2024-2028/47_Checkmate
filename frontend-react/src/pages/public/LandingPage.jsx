import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  Box,
  Users,
  ArrowRight,
  ChevronRight,
  Star,
  Sparkles,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import {
  getAuthRole,
  getAuthToken,
  clearAuthSession,
} from "../../services/auth/authStorage";

import { getPublicDesignations } from "../../services/staffOnboardingService";

import "../../styles/landingpage.css";

function LandingPage() {
  const navigate = useNavigate();
  const token = getAuthToken();
  const role = getAuthRole();
  const isLoggedIn = Boolean(token && role);

  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [recruitments, setRecruitments] = useState([]);

  // Scroll listener for sticky navbar and active link highlighting
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);

      const sectionIds = ["home", "features", "how-it-works", "events"];
      let current = "home";
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 200) {
            current = id;
            break;
          }
        }
      }
      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // The work on offer, one per vendor
  useEffect(() => {
    getPublicDesignations()
      .then((data) => setRecruitments(Array.isArray(data) ? data : []))
      .catch(() => setRecruitments([]));
  }, []);

  const handleSignOut = () => {
    clearAuthSession();
    navigate("/");
    window.location.reload();
  };

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({
        top: el.offsetTop - 80,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="landing-page">
      {/* ── 1. Top Navigation Bar ── */}
      <nav id="navbar" className={scrolled ? "scrolled" : ""}>
        <div className="nav-container">
          <div className="logo" onClick={() => scrollTo("home")} style={{ cursor: "pointer" }}>
            <div className="logo-icon">
              <Calendar size={18} />
            </div>
            <span>EventPro</span>
          </div>

          <ul className="nav-links">
            <li>
              <a
                href="#home"
                className={activeSection === "home" ? "active" : ""}
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo("home");
                }}
              >
                Home
              </a>
            </li>
            <li>
              <a
                href="#features"
                className={activeSection === "features" ? "active" : ""}
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo("features");
                }}
              >
                Features
              </a>
            </li>
            <li>
              <a
                href="#how-it-works"
                className={activeSection === "how-it-works" ? "active" : ""}
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo("how-it-works");
                }}
              >
                How It Works
              </a>
            </li>
            <li>
              <a
                href="#events"
                className={activeSection === "events" ? "active" : ""}
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo("events");
                }}
              >
                Events
              </a>
            </li>
            <li>
              <Link to="/join-staff">We're Hiring</Link>
            </li>
          </ul>

          <div className="nav-auth">
            {isLoggedIn ? (
              <>
                <Link
                  to={`/${role.toLowerCase()}/dashboard`}
                  className="btn-primary"
                  title="Return to your session dashboard"
                >
                  <LayoutDashboard size={15} /> Go to Dashboard
                </Link>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={handleSignOut}
                  title="Sign out of current account"
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/signin" className="btn-text">
                  Sign In
                </Link>
                <Link to="/signup-details" className="btn-primary">
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── 2. Hero Section ── */}
      <section id="home" className="hero fade-in visible">
        <div className="hero-bg">
          <div className="overlay" />
          <div className="glow" />
        </div>
        <div className="container hero-content">
          <div className="hero-icon">
            <Calendar size={32} />
          </div>
          <h1>
            Manage Events With
            <br />
            <span className="highlight">Precision</span>
          </h1>
          <p>
            A smart platform that connects clients, vendors, and staff to organize
            events efficiently
          </p>
          <div className="hero-buttons">
            <Link to="/signup-details" className="btn-primary">
              Get Started <ArrowRight size={16} />
            </Link>
            <Link to="/signin" className="btn-outline">
              Sign In <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3. Powerful Features Section ── */}
      <section id="features" className="features fade-in visible">
        <div className="container">
          <div className="section-header">
            <h2>Powerful Features</h2>
            <p>Everything you need to manage successful events from start to finish</p>
          </div>
          <div className="features-grid">
            <div className="card feature-card">
              <div className="card-icon">
                <Calendar size={26} />
              </div>
              <h3>Event Planning</h3>
              <p>Create and manage events easily with smart scheduling and live milestones.</p>
            </div>
            <div className="card feature-card">
              <div className="card-icon">
                <Box size={26} />
              </div>
              <h3>Vendor Management</h3>
              <p>Connect vendors, allocate resources, and manage services in real time.</p>
            </div>
            <div className="card feature-card">
              <div className="card-icon">
                <Users size={26} />
              </div>
              <h3>Staff Coordination</h3>
              <p>Assign staff tasks, track shifts, and monitor execution seamlessly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. How It Works Section ── */}
      <section id="how-it-works" className="how-it-works fade-in visible">
        <div className="container">
          <div className="section-header">
            <h2>How It Works</h2>
            <p>A simple 4-step process to bring your events to life</p>
          </div>
          <div className="steps-timeline">
            <div className="timeline-line" />
            <div className="step">
              <div className="step-num">1</div>
              <h3>Client creates an event request</h3>
              <p>Submit event details, venue preferences, and requirements.</p>
            </div>
            <div className="step">
              <div className="step-num">2</div>
              <h3>Vendor reviews and approves request</h3>
              <p>Vendors evaluate feasibility, inventory, and accept events.</p>
            </div>
            <div className="step">
              <div className="step-num">3</div>
              <h3>Resources and staff are assigned</h3>
              <p>Allocate equipment, roster staff, and prepare logistics.</p>
            </div>
            <div className="step">
              <div className="step-num">4</div>
              <h3>Event progress tracked to completion</h3>
              <p>Monitor live delivery, resolve issues, and settle payouts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. KPI Stats Section ── */}
      <section id="stats" className="stats fade-in visible">
        <div className="container">
          <div className="stats-box">
            <h2>Trusted By Thousands</h2>
            <div className="stats-grid">
              <div className="stat-item">
                <h3>12,500+</h3>
                <p>Events Managed</p>
              </div>
              <div className="stat-item">
                <h3>98.5%</h3>
                <p>Completion Rate</p>
              </div>
              <div className="stat-item">
                <h3>850+</h3>
                <p>Active Vendors</p>
              </div>
              <div className="stat-item">
                <h3>45,000+</h3>
                <p>Satisfied Clients</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Events We Manage Section ── */}
      <section id="events" className="events fade-in visible">
        <div className="container">
          <div className="section-header">
            <h2>Events We Manage</h2>
            <p>From weddings to conferences, we handle it all</p>
          </div>
          <div className="events-grid">
            <div className="event-card">
              <img
                src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=600&h=400"
                alt="Weddings"
              />
              <div className="event-card-content">
                <h3>Weddings</h3>
                <p>Elegant ceremonies, catering, and memorable celebrations.</p>
              </div>
            </div>
            <div className="event-card">
              <img
                src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=600&h=400"
                alt="Corporate Events"
              />
              <div className="event-card-content">
                <h3>Corporate Events</h3>
                <p>Professional conferences, annual galas, and summits.</p>
              </div>
            </div>
            <div className="event-card">
              <img
                src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=600&h=400"
                alt="Special Events"
              />
              <div className="event-card-content">
                <h3>Special Events</h3>
                <p>Music festivals, auctions, banquets, and milestone celebrations.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Call To Action Section ── */}
      <section id="cta" className="cta fade-in visible">
        <div className="container">
          <div className="cta-card">
            <Star size={32} className="cta-icon" />
            <h2>Start Managing Events Smarter Today</h2>
            <p>
              Join thousands of event professionals who trust EventPro to bring
              their visions to life.
            </p>
            <div className="cta-buttons">
              <Link to="/signup-details" className="btn-primary">
                Create Account <ArrowRight size={16} />
              </Link>
              <Link to="/signin" className="btn-outline-dark">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. Final Hero Section ── */}
      <section id="final-hero" className="final-hero fade-in visible">
        <div className="final-hero-bg">
          <div className="overlay" />
        </div>
        <div className="container final-hero-content">
          <div className="final-icon">
            <Sparkles size={28} />
          </div>
          <h2>
            Ready to Plan Your
            <br />
            <span className="highlight">Next Event?</span>
          </h2>
          <p>
            Transform your event vision into reality with our comprehensive management platform.
          </p>
          <div className="final-buttons">
            <Link to="/signup-details" className="btn-primary">
              Get Started <ArrowRight size={16} />
            </Link>
            <Link to="/signin" className="btn-outline">
              Sign In <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 9. Global Footer ── */}
      <footer>
        <div className="container footer-content">
          <div className="footer-logo">
            <div className="logo">
              <div className="logo-icon">
                <Calendar size={18} />
              </div>
              <span>EventPro</span>
            </div>
            <p>
              The ultimate platform for seamless event management, vendor logistics,
              and staff coordination.
            </p>
          </div>

          <div className="footer-links">
            <div className="link-group">
              <h4>Quick Links</h4>
              <ul>
                <li>
                  <a href="#home" onClick={(e) => { e.preventDefault(); scrollTo("home"); }}>
                    Home
                  </a>
                </li>
                <li>
                  <a href="#features" onClick={(e) => { e.preventDefault(); scrollTo("features"); }}>
                    Features
                  </a>
                </li>
                <li>
                  <Link to="/signin">Sign In</Link>
                </li>
                <li>
                  <Link to="/signup-details">Register</Link>
                </li>
              </ul>
            </div>

            <div className="link-group">
              <h4>Platform</h4>
              <ul>
                <li>
                  <Link to="/client/dashboard">Client Portal</Link>
                </li>
                <li>
                  <Link to="/vendor/dashboard">Vendor Dashboard</Link>
                </li>
                <li>
                  <Link to="/staff/dashboard">Staff Management</Link>
                </li>
                <li>
                  <Link to="/admin/dashboard">Admin Console</Link>
                </li>
              </ul>
            </div>

            <div className="link-group">
              <h4>We're Hiring</h4>
              <ul>
                {recruitments.map((job) => (
                  <li key={job.vendorId}>
                    <Link to={`/join-staff?vendor=${job.vendorId}`}>
                      {job.designation} <span>({job.vendorName})</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            &copy; 2026 EventPro. All rights reserved. Built with precision for event excellence.
          </p>
        </div>
      </footer>

    </div>
  );
}

export default LandingPage;
