import { ShieldCheck, ShieldOff, AlertOctagon } from 'lucide-react';
import './ComplianceGuardrails.css';

export default function ComplianceGuardrails({ fraudCount = 0 }) {
  const guardrails = [
    {
      icon: ShieldCheck,
      label: 'NPCI Retry Limit',
      status: 'ON',
      statusType: 'success',
    },
    {
      icon: ShieldOff,
      label: 'DND Filter',
      status: 'ACTIVE',
      statusType: 'success',
    },
    {
      icon: AlertOctagon,
      label: 'Fraud Sieve',
      status: `${fraudCount} FLAGGED`,
      statusType: fraudCount > 0 ? 'danger' : 'success',
    },
  ];

  return (
    <div className="card compliance-guardrails">
      <div className="card-header">
        <h3 className="card-title">Compliance Guardrails</h3>
      </div>
      <div className="guardrails-list stagger-children">
        {guardrails.map((g, i) => {
          const Icon = g.icon;
          return (
            <div className="guardrail-item" key={i}>
              <div className="guardrail-left">
                <div className={`guardrail-icon ${g.statusType}`}>
                  <Icon size={16} />
                </div>
                <span className="guardrail-label">{g.label}</span>
              </div>
              <span className={`guardrail-status ${g.statusType}`}>
                {g.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
