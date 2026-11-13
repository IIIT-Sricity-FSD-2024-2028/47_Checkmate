import React, { useState } from 'react';
import {
  X,
  KeyRound,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Copy,
  Check,
  Mail,
  Phone,
  Eye,
  EyeOff,
} from 'lucide-react';
import { forgotPassword, resetPassword, findAccount } from '../../services/auth/authService';

export default function AccountRecoveryModal({ isOpen, onClose, onEmailFound, defaultTab = 'password' }) {
  const [activeTab, setActiveTab] = useState(defaultTab); // 'password' | 'email'

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab || 'password');
      setResetStep(1);
      setErrorMessage('');
      setSuccessMessage('');
      setFoundAccount(null);
    }
  }, [isOpen, defaultTab]);

  // Tab 1: Forgot Password State
  const [resetStep, setResetStep] = useState(1); // 1 = enter email, 2 = enter otp & new pwd, 3 = success
  const [resetEmail, setResetEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [phoneLast4, setPhoneLast4] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);

  // Tab 2: Find Email State
  const [searchPhone, setSearchPhone] = useState('');
  const [foundAccount, setFoundAccount] = useState(null);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  // Clear messages on tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    const cleanEmail = resetEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPassword(cleanEmail);
      setDemoOtp(res.otp || '');
      setPhoneLast4(res.phoneLast4 || '');
      setResetStep(2);
      setSuccessMessage(res.message || 'Verification code sent to your registered contact.');
    } catch (err) {
      setErrorMessage(err.data?.message || err.message || 'Unable to locate account with that email.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Confirm OTP & Set New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!otpCode.trim()) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword({
        email: resetEmail.trim().toLowerCase(),
        otp: otpCode.trim(),
        newPassword: newPassword,
      });
      setResetStep(3);
    } catch (err) {
      setErrorMessage(err.data?.message || err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  // Search Email by Phone Number
  const handleFindAccount = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setFoundAccount(null);

    const clean = searchPhone.trim();
    if (!clean) {
      setErrorMessage('Please enter your registered phone number.');
      return;
    }

    setLoading(true);
    try {
      const res = await findAccount(clean);
      setFoundAccount(res);
    } catch (err) {
      setErrorMessage(err.data?.message || err.message || 'No registered account found with that phone number.');
    } finally {
      setLoading(false);
    }
  };

  // Copy demo OTP
  const handleCopyOtp = () => {
    if (demoOtp) {
      navigator.clipboard?.writeText(demoOtp);
      setOtpCode(demoOtp);
      setCopiedOtp(true);
      setTimeout(() => setCopiedOtp(false), 2000);
    }
  };

  // Use retrieved email
  const handleUseEmail = (email) => {
    if (onEmailFound) {
      onEmailFound(email);
    }
    onClose();
  };

  return (
    <div className="modal-overlay open" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal"
        style={{
          width: '520px',
          maxWidth: '92vw',
          background: 'linear-gradient(145deg, #1f122e 0%, #12091c 100%)',
          border: '1px solid rgba(233, 30, 140, 0.25)',
          borderRadius: '16px',
          padding: '28px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.75), 0 0 30px rgba(233, 30, 140, 0.12)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(233, 30, 140, 0.15)',
                border: '1px solid rgba(233, 30, 140, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--pink, #e91e8c)',
              }}
            >
              <KeyRound size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fff' }}>
                Account Recovery
              </h3>
              <span style={{ fontSize: '12.5px', color: 'var(--text-secondary, #9b8db0)' }}>
                Restore access to your EventPro account
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #726285)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.15s ease',
            }}
            title="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Tabs */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '4px',
            borderRadius: '10px',
            marginBottom: '20px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <button
            type="button"
            onClick={() => handleTabChange('password')}
            style={{
              flex: 1,
              padding: '8px 14px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: activeTab === 'password' ? 'var(--pink, #e91e8c)' : 'transparent',
              color: activeTab === 'password' ? '#fff' : 'var(--text-secondary, #9b8db0)',
              boxShadow: activeTab === 'password' ? '0 2px 10px rgba(233, 30, 140, 0.35)' : 'none',
            }}
          >
            <KeyRound size={14} />
            <span>Reset Password</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('email')}
            style={{
              flex: 1,
              padding: '8px 14px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: activeTab === 'email' ? 'var(--pink, #e91e8c)' : 'transparent',
              color: activeTab === 'email' ? '#fff' : 'var(--text-secondary, #9b8db0)',
              boxShadow: activeTab === 'email' ? '0 2px 10px rgba(233, 30, 140, 0.35)' : 'none',
            }}
          >
            <Search size={14} />
            <span>Find Login Email</span>
          </button>
        </div>

        {/* Alerts / Error Messages */}
        {errorMessage && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ── TAB 1: RESET PASSWORD ── */}
        {activeTab === 'password' && (
          <div>
            {/* Step 1: Input Email */}
            {resetStep === 1 && (
              <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary, #9b8db0)', lineHeight: 1.5 }}>
                  Enter the email address associated with your account. We will issue a 6-digit verification code.
                </p>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary, #9b8db0)', display: 'block', marginBottom: '6px' }}>
                    Registered Email Address *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      className="ri-input"
                      placeholder="e.g. sarah@eliteevents.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      style={{ paddingLeft: '38px' }}
                    />
                    <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, #726285)' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                  <button type="button" className="ri-cancel" onClick={onClose}>
                    Cancel
                  </button>
                  <button type="submit" className="ri-submit" disabled={loading}>
                    {loading ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Loader2 size={15} className="animate-spin" /> Verifying...
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        Send Verification Code <ArrowRight size={15} />
                      </span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Enter OTP & New Password */}
            {resetStep === 2 && (
              <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Demo OTP Banner */}
                {demoOtp && (
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      background: 'rgba(34, 197, 94, 0.12)',
                      border: '1px solid rgba(34, 197, 94, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#86efac' }}>
                        Verification Code Generated
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
                        Simulated code for {resetEmail} (Phone ending in ***{phoneLast4}):
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 700, color: '#22c55e', letterSpacing: '2px' }}>
                        {demoOtp}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyOtp}
                        style={{
                          background: 'rgba(34, 197, 94, 0.2)',
                          border: 'none',
                          borderRadius: '4px',
                          color: '#86efac',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                        }}
                        title="Copy and fill code"
                      >
                        {copiedOtp ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedOtp ? 'Filled' : 'Fill'}</span>
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary, #9b8db0)', display: 'block', marginBottom: '6px' }}>
                    6-Digit Verification Code *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    className="ri-input"
                    placeholder="Enter 6-digit code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    required
                    style={{ letterSpacing: '4px', fontSize: '16px', fontWeight: 700, textAlign: 'center' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary, #9b8db0)', display: 'block', marginBottom: '6px' }}>
                    New Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      className="ri-input"
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      style={{ paddingRight: '38px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted, #726285)',
                        cursor: 'pointer',
                      }}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary, #9b8db0)', display: 'block', marginBottom: '6px' }}>
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    className="ri-input"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setResetStep(1);
                      setErrorMessage('');
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted, #726285)', fontSize: '12.5px', cursor: 'pointer' }}
                  >
                    &larr; Back to Email
                  </button>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" className="ri-cancel" onClick={onClose}>
                      Cancel
                    </button>
                    <button type="submit" className="ri-submit" disabled={loading}>
                      {loading ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Loader2 size={15} className="animate-spin" /> Updating...
                        </span>
                      ) : (
                        'Save & Reset Password'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Step 3: Success Screen */}
            {resetStep === 3 && (
              <div style={{ textAlign: 'center', padding: '16px 0 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'rgba(34, 197, 94, 0.15)',
                    border: '1px solid rgba(34, 197, 94, 0.4)',
                    color: '#22c55e',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircle2 size={30} />
                </div>

                <div>
                  <h4 style={{ margin: '0 0 6px', fontSize: '17px', color: '#fff' }}>
                    Password Updated Successfully!
                  </h4>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary, #9b8db0)' }}>
                    Your password for <strong>{resetEmail}</strong> has been securely changed in the system database.
                  </p>
                </div>

                <button
                  type="button"
                  className="ri-submit"
                  style={{ width: '100%', marginTop: '10px' }}
                  onClick={() => handleUseEmail(resetEmail)}
                >
                  Sign In with New Password &rarr;
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: FIND LOGIN EMAIL ── */}
        {activeTab === 'email' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary, #9b8db0)', lineHeight: 1.5 }}>
              Forgot your login email address? Enter your registered phone number to look up your account.
            </p>

            <form onSubmit={handleFindAccount} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary, #9b8db0)', display: 'block', marginBottom: '6px' }}>
                  Registered Phone Number *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="ri-input"
                    placeholder="e.g. +1 555-1002 or 5551002"
                    value={searchPhone}
                    onChange={(e) => setSearchPhone(e.target.value)}
                    required
                    style={{ paddingLeft: '38px' }}
                  />
                  <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, #726285)' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="ri-cancel" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="ri-submit" disabled={loading}>
                  {loading ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Loader2 size={15} className="animate-spin" /> Searching...
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Search size={15} /> Search Account
                    </span>
                  )}
                </button>
              </div>
            </form>

            {/* Found Account Result Card */}
            {foundAccount && (
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(233, 30, 140, 0.35)',
                  borderRadius: '12px',
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  animation: 'fadeUpVendor 0.25s ease-out',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={18} className="text-green" />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>Account Identified</span>
                  </div>
                  <span className="mon-staff-role-pill" style={{ color: 'var(--pink, #e91e8c)' }}>
                    {foundAccount.role} Account
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12.5px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted, #726285)', display: 'block', fontSize: '11px' }}>Full Name</span>
                    <strong style={{ color: '#fff' }}>{foundAccount.name}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted, #726285)', display: 'block', fontSize: '11px' }}>Login Email</span>
                    <strong style={{ color: '#86efac' }}>{foundAccount.email}</strong>
                  </div>
                </div>

                <button
                  type="button"
                  className="ri-submit"
                  style={{ width: '100%', marginTop: '6px' }}
                  onClick={() => handleUseEmail(foundAccount.email)}
                >
                  Use {foundAccount.email} to Sign In &rarr;
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
