import React, { useState, useEffect } from 'react';
import { 
  Settings, Server, Database, Shield, Save, 
  RefreshCcw, CheckCircle2, AlertTriangle, ToggleLeft, ToggleRight
} from 'lucide-react';
import { getStateKey, setStateKey } from '../../services/stateService';
import '../../styles/superuser.css';

export default function SuperuserSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [settings, setSettings] = useState({
    multiVendorEnabled: true,
    instantBooking: false,
    debugLogging: true,
    jwtExpiryHours: 24,
    maxLoginAttempts: 5,
    concurrencyLocking: true,
    requireMFAForAdmins: false,
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await getStateKey('superuserEngineSettings');
      if (data && typeof data === 'object') {
        setSettings((prev) => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.error('Failed to load superuser settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleToggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    setSavedSuccess(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await setStateKey('superuserEngineSettings', settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to save engine settings:', err);
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="su-page-container" style={{ maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#fff', margin: 0 }}>System Engine Settings</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Low-level operational controls, concurrency locks, security policies, and feature toggles.
          </p>
        </div>

        <button
          onClick={fetchSettings}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '9px 14px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          <RefreshCcw size={14} className={loading ? 'spin' : ''} /> Reload
        </button>
      </div>

      {savedSuccess && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0, 230, 118, 0.15)', border: '1px solid rgba(0, 230, 118, 0.3)', padding: '12px 16px', borderRadius: '10px', color: '#00e676', fontSize: '13.5px', marginBottom: '20px' }}>
          <CheckCircle2 size={18} /> System engine settings synchronized!
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Core Engine Features */}
        <div className="su-card">
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Server size={18} color="#ec4899" /> Feature Engine Flags
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#fff' }}>Multi-Vendor Orchestration Mode</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Permit events to allocate resources and staff from multiple independent vendors</div>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('multiVendorEnabled')}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: settings.multiVendorEnabled ? '#00e676' : 'var(--text-muted)' }}
              >
                {settings.multiVendorEnabled ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#fff' }}>Concurrency Booking Lock</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Prevent double-booking of equipment by acquiring transaction locks</div>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('concurrencyLocking')}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: settings.concurrencyLocking ? '#00e676' : 'var(--text-muted)' }}
              >
                {settings.concurrencyLocking ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#fff' }}>Verbose Mutation Tracing</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Record full JSON mutation diffs into activityLogs</div>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('debugLogging')}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: settings.debugLogging ? '#00e676' : 'var(--text-muted)' }}
              >
                {settings.debugLogging ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
              </button>
            </div>
          </div>
        </div>

        {/* Security Policies */}
        <div className="su-card">
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} color="#3b82f6" /> Master Security Policies
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>JWT Auth Token Lifetime (Hours)</label>
              <input
                type="number"
                min="1"
                max="168"
                value={settings.jwtExpiryHours}
                onChange={(e) => setSettings((p) => ({ ...p, jwtExpiryHours: Number(e.target.value) }))}
                style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '13.5px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Max Failed Login Lockout Threshold</label>
              <input
                type="number"
                min="3"
                max="20"
                value={settings.maxLoginAttempts}
                onChange={(e) => setSettings((p) => ({ ...p, maxLoginAttempts: Number(e.target.value) }))}
                style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '13.5px' }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: '#ec4899',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            <Save size={16} /> {saving ? 'Saving...' : 'Save Engine Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
