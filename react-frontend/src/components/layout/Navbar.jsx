import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Navbar = () => {
  const location = useLocation();
  const { isAuthenticated, role, user, logout } = useAuth();

  return (
    <nav id="navbar" style={{ background: 'rgba(6, 10, 20, 0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'sticky', top: 0, zIndex: 1000 }}>
      <div className="nav-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto', padding: '16px 24px' }}>
        <Link to="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: '#fff', fontWeight: 700, fontSize: '20px' }}>
          <div className="logo-icon" style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyCenter: 'center', color: '#fff', fontSize: '20px' }}>
            <i className="ph-fill ph-calendar-blank"></i>
          </div>
          <span>Checkmate</span>
        </Link>

        <ul className="nav-links" style={{ display: 'flex', gap: '24px', listStyle: 'none', margin: 0, padding: 0 }}>
          <li><Link to="/" style={{ color: location.pathname === '/' ? '#ec4899' : '#cbd5e1', textDecoration: 'none', fontWeight: 500 }}>Home</Link></li>
          <li><a href="#features" style={{ color: '#cbd5e1', textDecoration: 'none', fontWeight: 500 }}>Features</a></li>
          <li><a href="#how-it-works" style={{ color: '#cbd5e1', textDecoration: 'none', fontWeight: 500 }}>How It Works</a></li>
        </ul>

        <div className="nav-auth" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {isAuthenticated ? (
            <>
              <span style={{ color: '#94a3b8', fontSize: '14px' }}>Welcome, <strong style={{ color: '#fff' }}>{user?.name || role}</strong></span>
              <Link to={`/${role.toLowerCase()}/dashboard`} className="btn-primary" style={{ padding: '8px 16px', borderRadius: '8px', background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>
                Dashboard
              </Link>
              <button onClick={logout} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#cbd5e1', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/signin" className="btn-text" style={{ color: '#cbd5e1', textDecoration: 'none', fontWeight: 500, padding: '8px 14px' }}>
                Sign In
              </Link>
              <Link to="/signup" className="btn-primary" style={{ padding: '8px 16px', borderRadius: '8px', background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>
                Create Account
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
