import { useState, useEffect } from 'react';
import { ShieldCheck, Cpu } from 'lucide-react';
import { API_BASE } from '../utils/constants';
import './InterventionPolicies.css';

export default function InterventionPolicies() {
  const [policies, setPolicies] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/policies/`)
      .then(r => r.json())
      .then(setPolicies)
      .catch(() => {});
  }, []);

  if (!policies) {
    return (
      <div className="policies-page animate-fade-in">
        <div className="page-header">
          <h2 className="page-title">Intervention Policies</h2>
          <p className="page-subtitle">AI decision engine rules and stopping rules configuration.</p>
        </div>
        <div className="skeleton" style={{ height: 400 }} />
      </div>
    );
  }

  return (
    <div className="policies-page animate-fade-in">
      <div className="page-header">
        <h2 className="page-title">Intervention Policies</h2>
        <p className="page-subtitle">AI decision engine rules and stopping rules configuration.</p>
      </div>

      {/* Stopping Rules */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h3 className="card-title">
            <ShieldCheck size={16} className="inline-icon" /> Hard-Coded Stopping Rules
          </h3>
          <span className="badge badge-danger">Non-Optional</span>
        </div>
        <div className="stopping-rules-grid">
          {Object.entries(policies.stopping_rules || {}).map(([key, value]) => (
            <div className="stopping-rule" key={key}>
              <span className="rule-label">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
              <span className="rule-value">{typeof value === 'number' ? value.toLocaleString('en-IN') : value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Policy Rules */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Cpu size={16} className="inline-icon" /> Policy Decision Table
          </h3>
          <span className="badge badge-info">{policies.policy_rules_count} rules</span>
        </div>
        <div className="policy-rules-list stagger-children">
          {(policies.policy_rules || []).map((rule, i) => (
            <div className="policy-rule" key={i}>
              <div className="rule-header">
                <span className="rule-root-causes">
                  {rule.root_causes?.map(rc => rc.replace(/RootCause\./g, '').replace(/_/g, ' ')).join(', ')}
                </span>
                <div className="rule-action-channel">
                  <span className="badge badge-info">{rule.action.replace(/InterventionAction\./g, '').replace(/_/g, ' ')}</span>
                  {rule.channel !== 'ContactChannel.NONE' && rule.channel !== 'none' && (
                    <span className="badge badge-neutral">{rule.channel.replace(/ContactChannel\./g, '')}</span>
                  )}
                </div>
              </div>
              <p className="rule-reasoning">{rule.reasoning}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
