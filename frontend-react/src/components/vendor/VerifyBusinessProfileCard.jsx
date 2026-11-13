import React from 'react';
import { Building2 } from 'lucide-react';

const CATEGORIES = [
  'Event Planning & Coordination',
  'Catering & Hospitality',
  'AV / Technical Production',
  'Decoration & Floral Design',
  'Photography & Media',
  'Security & Crowd Control',
  'Transportation & Logistics',
];

export default function VerifyBusinessProfileCard({
  vendorName,
  setVendorName,
  businessName,
  setBusinessName,
  email,
  setEmail,
  phone,
  setPhone,
  category,
  setCategory,
}) {
  return (
    <div className="card" style={{ marginBottom: '20px' }}>
      <div className="card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building2 size={16} className="text-pink" />
          <h3 style={{ margin: 0 }}>Business Profile Verification</h3>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          This information will appear in the Admin verification panel
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', padding: '6px 0' }}>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.5px', display: 'block', marginBottom: '8px' }}>
            Vendor / Primary Contact Name *
          </label>
          <input
            type="text"
            className="ri-input"
            placeholder="e.g. Sarah Williams"
            value={vendorName}
            onChange={(e) => setVendorName(e.target.value)}
            required
          />
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.5px', display: 'block', marginBottom: '8px' }}>
            Registered Business Entity *
          </label>
          <input
            type="text"
            className="ri-input"
            placeholder="e.g. Elite Events Co."
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
          />
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.5px', display: 'block', marginBottom: '8px' }}>
            Official Email Address *
          </label>
          <input
            type="email"
            className="ri-input"
            placeholder="sarah@eliteevents.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.5px', display: 'block', marginBottom: '8px' }}>
            Phone Number *
          </label>
          <input
            type="tel"
            className="ri-input"
            placeholder="+1 555-1002"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.5px', display: 'block', marginBottom: '8px' }}>
            Primary Service Category *
          </label>
          <div className="ri-select-wrap">
            <select
              className="ri-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

