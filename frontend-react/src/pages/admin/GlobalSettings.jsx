import React, { useState, useEffect } from 'react';
import { 
  Settings, Save, RefreshCcw, ShieldCheck, AlertTriangle, 
  CheckCircle2, IndianRupee, Bell, Mail, ToggleLeft, ToggleRight
} from 'lucide-react';
import { getStateKey, setStateKey } from '../../services/stateService';
import '../../styles/admin.css';

export default function GlobalSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [settings, setSettings] = useState({
    platformName: 'Checkmate Event Management',
    supportEmail: 'support@checkmate.com',
    commissionRate: 10,
    autoApproveVendors: false,
    maintenanceMode: false,
    emergencyBanner: '',
    requireDeposit: true,
    minEventBudget: 1000,
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await getStateKey('platformSettings');
      if (data && typeof data === 'object') {
        setSettings((prev) => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.error('Failed to load platform settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setSavedSuccess(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await setStateKey('platformSettings', settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Failed to persist global settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page-container" style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#fff', margin: 0 }}>Global Platform Settings</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Configure system-wide parameters, escrow fees, moderation thresholds, and operational flags.
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
          <CheckCircle2 size={18} /> Platform configuration saved successfully!
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Core Settings Card */}
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: '600', color: '#fff', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={18} color="#ec4899" /> General Configuration
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Platform Brand Name</label>
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) => handleChange('platformName', e.target.value)}
                style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '13.5px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Primary Support Email</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => handleChange('supportEmail', e.target.value)}
                style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '13.5px' }}
              />
            </div>
          </div>
        </div>

        {/* Financial & Fee Rules */}
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: '600', color: '#fff', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IndianRupee size={18} color="#00e676" /> Financial & Commission Parameters
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Platform Take Rate / Commission (%)</label>
              <input
                type="number"
                min="0"
                max="50"
                value={settings.commissionRate}
                onChange={(e) => handleChange('commissionRate', Number(e.target.value))}
                style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '13.5px' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>Default: 10% retained from vendor gross</span>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Minimum Event Budget (₹)</label>
              <input
                type="number"
                min="100"
                step="100"
                value={settings.minEventBudget}
                onChange={(e) => handleChange('minEventBudget', Number(e.target.value))}
                style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '13.5px' }}
              />
            </div>
          </div>
        </div>

        {/* Operational Security & Modes */}
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: '600', color: '#fff', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color="#3b82f6" /> System Security & Operating Modes
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#fff' }}>Auto-Approve Verified Vendors</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Automatically approve applicants meeting compliance criteria</div>
              </div>
              <button
                type="button"
                onClick={() => handleChange('autoApproveVendors', !settings.autoApproveVendors)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: settings.autoApproveVendors ? '#00e676' : 'var(--text-muted)' }}
              >
                {settings.autoApproveVendors ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#fff' }}>Maintenance Lockdown Mode</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Prevent new event submissions and marketplace checkout during upgrades</div>
              </div>
              <button
                type="button"
                onClick={() => handleChange('maintenanceMode', !settings.maintenanceMode)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: settings.maintenanceMode ? '#ef4444' : 'var(--text-muted)' }}
              >
                {settings.maintenanceMode ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
              </button>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Global Alert Banner (Broadcast banner across all pages)</label>
              <input
                type="text"
                placeholder="Leave blank for no banner..."
                value={settings.emergencyBanner}
                onChange={(e) => handleChange('emergencyBanner', e.target.value)}
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
            <Save size={16} /> {saving ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}

