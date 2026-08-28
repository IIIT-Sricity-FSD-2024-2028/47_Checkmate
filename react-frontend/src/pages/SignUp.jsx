import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import { Button, Input, ErrorMessage } from '../components/common/CommonComponents';

export const SignUp = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    accountType: 'Client',
    companyName: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (step === 1 && (!formData.name || !formData.email)) {
      setError('Please fill in required basic info');
      return;
    }
    setError('');
    if (step < 3) setStep(step + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await authService.register(formData);
      navigate('/signin');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#060a14', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: '#0f172a', border: '1px solid rgba(233,30,140,0.3)', borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 8px 0', color: '#fff' }}>Create Checkmate Account</h2>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Step {step} of 3 - Setup your credentials</p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px' }}>
            {[1, 2, 3].map((s) => (
              <div key={s} style={{ width: '40px', height: '4px', borderRadius: '2px', background: s <= step ? '#ec4899' : 'rgba(255,255,255,0.1)' }}></div>
            ))}
          </div>
        </div>

        {error && <ErrorMessage message={error} />}

        {step === 1 && (
          <form onSubmit={handleNextStep}>
            <Input label="Full Name" placeholder="John Doe" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} required />
            <Input label="Email Address" type="email" placeholder="john@example.com" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} required />
            <Input label="Phone Number" type="tel" placeholder="+1 (555) 000-0000" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} />
            <Button type="submit" style={{ width: '100%', padding: '12px', marginTop: '10px' }}>Next: Select Role &rarr;</Button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleNextStep}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>I want to register as:</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {['Client', 'Vendor', 'Staff', 'Admin'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleChange('accountType', type)}
                    style={{
                      padding: '14px',
                      borderRadius: '10px',
                      border: formData.accountType === type ? '2px solid #ec4899' : '1px solid rgba(255,255,255,0.1)',
                      background: formData.accountType === type ? 'rgba(233,30,140,0.15)' : 'rgba(255,255,255,0.03)',
                      color: '#fff',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            {formData.accountType === 'Vendor' && (
              <Input label="Company / Business Name" placeholder="Apex Events LLC" value={formData.companyName} onChange={(e) => handleChange('companyName', e.target.value)} required />
            )}
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button variant="secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>Back</Button>
              <Button type="submit" style={{ flex: 1 }}>Next: Security &rarr;</Button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit}>
            <Input label="Password" type="password" placeholder="••••••••" value={formData.password} onChange={(e) => handleChange('password', e.target.value)} required />
            <Input label="Confirm Password" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={(e) => handleChange('confirmPassword', e.target.value)} required />
            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <Button variant="secondary" onClick={() => setStep(2)} style={{ flex: 1 }}>Back</Button>
              <Button type="submit" disabled={loading} style={{ flex: 1 }}>{loading ? 'Creating...' : 'Finish & Register'}</Button>
            </div>
          </form>
        )}

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: '#94a3b8' }}>
          Already have an account? <Link to="/signin" style={{ color: '#ec4899', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
        </div>
      </div>
    </div>
  );
};
