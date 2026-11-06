import React from 'react';
import { AlertTriangle, ShieldCheck, Zap, CloudRain, Users, AlertOctagon } from 'lucide-react';

export default function MonitoringRisksAndContingency({
  risks = [],
  contingencies = [],
  onTriggerContingency,
  contingencyRef = null,
}) {
  return (
    <div className="mon-risks-contingency-wrap">
      {/* ── Active Risks ── */}
      <div className="mon-risks">
        <div className="mon-risks__header">
          <AlertTriangle size={16} className="text-yellow" />
          <h4>Active Live Risks</h4>
          {risks.length > 0 && (
            <span className="mon-counter-badge mon-counter-badge--yellow">
              {risks.length} Active
            </span>
          )}
        </div>

        <div className="mon-risk-list">
          {risks.length === 0 ? (
            <div className="mon-empty-sub">
              <ShieldCheck size={16} className="text-green" style={{ display: 'inline', marginRight: '6px' }} />
              All conditions normal. No operational risks flagged.
            </div>
          ) : (
            risks.map((risk) => {
              const sev = String(risk.severity || risk.priority || 'medium').toLowerCase();
              return (
                <div key={risk.id} className="mon-risk-item">
                  <div className="mon-risk-item__body">
                    <div className="mon-risk-item__title">{risk.title || risk.description}</div>
                    <div className="mon-risk-item__time">{risk.location || 'On-site'} · {risk.time || '10m ago'}</div>
                  </div>
                  <span className={`risk-pill risk-pill--${sev}`}>
                    {sev}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Contingency Plans ── */}
      <div className="mon-contingency" ref={contingencyRef}>
        <div className="mon-contingency__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={16} className="text-orange" />
            <h4 style={{ margin: 0 }}>Emergency Contingency Protocols</h4>
          </div>
          <span className="mon-synced-pill">Ready to Deploy</span>
        </div>

        <div className="mon-contingency__list">
          {contingencies.map((plan) => {
            const isActivated = plan.status === 'activated';
            const IconComponent =
              plan.id === 'rain'
                ? CloudRain
                : plan.id === 'power'
                ? Zap
                : plan.id === 'overflow'
                ? Users
                : AlertOctagon;

            return (
              <button
                key={plan.id}
                type="button"
                className={`mon-contig-btn ${isActivated ? 'mon-contig-btn--active' : 'mon-contig-btn--orange'}`}
                onClick={() => onTriggerContingency(plan.id)}
                title={plan.actionText || 'Trigger protocol'}
              >
                <IconComponent size={18} />
                <div style={{ flex: 1 }}>
                  <div className="mon-contig-btn__title">
                    {plan.name} {isActivated ? '· [ACTIVE]' : ''}
                  </div>
                  <div className="mon-contig-btn__sub">{plan.desc}</div>
                </div>
                <span className="mon-contig-btn__tag">
                  {isActivated ? 'DEPLOYED' : 'EXECUTE'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

