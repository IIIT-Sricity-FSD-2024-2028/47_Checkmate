import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Input, ErrorMessage } from '../components/common/CommonComponents';

export const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleSelect, setRoleSelect] = useState('Client');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const session = await login(email, password);
      const targetRole = roleSelect || session?.role || 'client';
      navigate(`/${targetRole.toLowerCase()}/dashboard`);
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#060a14', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: '#0f172a', border: '1px solid rgba(233,30,140,0.3)', borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
            <i className="ph-fill ph-calendar-blank" style={{ fontSize: '28px', color: '#fff' }}></i>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 8px 0', color: '#fff' }}>Welcome Back</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>Sign in to your Checkmate account</p>
        </div>

        {error && <ErrorMessage message={error} />}

        <form onSubmit={handleSubmit}>
          <Input
            label="Email Address"
            type="email"
            placeholder="admin@checkmate.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>Select Target Portal / Role</label>
            <select
              value={roleSelect}
              onChange={(e) => setRoleSelect(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }}
            >
              <option value="Client" style={{ background: '#0f172a' }}>Client Portal</option>
              <option value="Admin" style={{ background: '#0f172a' }}>Admin Console</option>
              <option value="Vendor" style={{ background: '#0f172a' }}>Vendor Dashboard</option>
              <option value="Staff" style={{ background: '#0f172a' }}>Staff Workspace</option>
              <option value="Superuser" style={{ background: '#0f172a' }}>Superuser Control</option>
            </select>
          </div>

          <Button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', borderRadius: '10px' }}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </Button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: '#94a3b8' }}>
          Don't have an account? <Link to="/signup" style={{ color: '#ec4899', fontWeight: 600, textDecoration: 'none' }}>Register Here</Link>
        </div>
      </div>
    </div>
  );
};
