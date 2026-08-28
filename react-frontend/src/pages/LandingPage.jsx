import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';

export const LandingPage = () => {
  return (
    <div style={{ background: '#060a14', color: '#fff', minHeight: '100vh' }}>
      <Navbar />

      <section id="home" className="hero fade-in" style={{ padding: '80px 24px', textAlign: 'center', position: 'relative' }}>
        <div className="container hero-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="hero-icon" style={{ fontSize: '48px', color: '#ec4899', marginBottom: '16px' }}>
            <i className="ph-fill ph-calendar-blank"></i>
          </div>
          <h1 style={{ fontSize: '48px', fontWeight: 800, lineHeight: 1.2, margin: '0 0 20px 0' }}>
            Manage Events With<br />
            <span className="highlight" style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Precision</span>
          </h1>
          <p style={{ fontSize: '18px', color: '#94a3b8', margin: '0 0 32px 0' }}>
            A smart platform that connects clients, vendors, and staff to organize events efficiently.
          </p>
          <div className="hero-buttons" style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link to="/signup" className="btn-primary" style={{ padding: '14px 28px', borderRadius: '10px', background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', color: '#fff', textDecoration: 'none', fontWeight: 600 }}>
              Get Started <i className="ph ph-arrow-right"></i>
            </Link>
            <Link to="/signin" className="btn-outline" style={{ padding: '14px 28px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', textDecoration: 'none', fontWeight: 600 }}>
              Sign In <i className="ph ph-caret-right"></i>
            </Link>
          </div>
        </div>
      </section>

      <section id="features" style={{ padding: '80px 24px', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 700 }}>Powerful Features</h2>
            <p style={{ color: '#94a3b8' }}>Everything you need to manage successful events from start to finish</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <div className="card feature-card" style={{ background: '#0f172a', padding: '32px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <i className="ph ph-calendar-blank" style={{ fontSize: '32px', color: '#ec4899', marginBottom: '16px', display: 'block' }}></i>
              <h3 style={{ fontSize: '20px', margin: '0 0 10px 0' }}>Event Planning</h3>
              <p style={{ color: '#94a3b8', margin: 0 }}>Create and manage events easily with smart scheduling and progress tracking.</p>
            </div>
            <div className="card feature-card" style={{ background: '#0f172a', padding: '32px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <i className="ph ph-cube" style={{ fontSize: '32px', color: '#8b5cf6', marginBottom: '16px', display: 'block' }}></i>
              <h3 style={{ fontSize: '20px', margin: '0 0 10px 0' }}>Vendor Management</h3>
              <p style={{ color: '#94a3b8', margin: 0 }}>Connect vendors, allocate resources, and manage services in one location.</p>
            </div>
            <div className="card feature-card" style={{ background: '#0f172a', padding: '32px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <i className="ph ph-users" style={{ fontSize: '32px', color: '#3b82f6', marginBottom: '16px', display: 'block' }}></i>
              <h3 style={{ fontSize: '20px', margin: '0 0 10px 0' }}>Staff Coordination</h3>
              <p style={{ color: '#94a3b8', margin: 0 }}>Assign staff tasks and track live event progress in real time.</p>
            </div>
          </div>
        </div>
      </section>

      <footer style={{ padding: '40px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
        <p>&copy; 2026 Checkmate Event Manager. Built with React and NestJS backend.</p>
      </footer>
    </div>
  );
};
