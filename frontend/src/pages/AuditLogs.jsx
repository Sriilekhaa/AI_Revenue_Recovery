import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { formatDateTime, truncateId } from '../utils/formatters';
import { API_BASE } from '../utils/constants';
import ExportButtons from '../components/ExportButtons';
import './AuditLogs.css';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [walkthrough, setWalkthrough] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/audit/?limit=100`)
      .then(r => r.json())
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadWalkthrough = async (txnId) => {
    setSelectedTxn(txnId);
    try {
      const res = await fetch(`${API_BASE}/api/walkthrough/${txnId}`);
      const data = await res.json();
      setWalkthrough(data);
    } catch (e) {
      setWalkthrough(null);
    }
  };

  return (
    <div className="audit-page animate-fade-in">
      <div className="page-header">
        <h2 className="page-title">Audit Logs</h2>
        <p className="page-subtitle">Full explainability trail — every decision, action, and compliance check.</p>
      </div>

      <div className="audit-layout">
        {/* Audit Table */}
        <div className="card audit-table-card">
          <div className="card-header">
            <h3 className="card-title">Audit Trail</h3>
            <span className="badge badge-neutral">{logs.length} entries</span>
          </div>

          {loading ? (
            <div className="skeleton" style={{ height: 400 }} />
          ) : (
            <div className="audit-table-wrapper">
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Transaction</th>
                    <th>Stage</th>
                    <th>Action</th>
                    <th>Outcome</th>
                    <th>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => (
                    <tr
                      key={i}
                      className={selectedTxn === log.transaction_id ? 'selected' : ''}
                      onClick={() => loadWalkthrough(log.transaction_id)}
                    >
                      <td className="mono">{formatDateTime(log.timestamp)}</td>
                      <td className="mono clickable">{truncateId(log.transaction_id)}</td>
                      <td><span className="stage-badge">{log.stage}</span></td>
                      <td className="action-cell">{log.action}</td>
                      <td>
                        <span className={`badge badge-${log.outcome === 'success' || log.outcome === 'recovered' ? 'success' : log.outcome === 'blocked' || log.outcome === 'flagged' ? 'danger' : 'neutral'}`}>
                          {log.outcome}
                        </span>
                      </td>
                      <td className="detail-cell">{log.outcome_detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <ExportButtons />
        </div>

        {/* Walkthrough Panel */}
        {walkthrough && (
          <div className="card walkthrough-panel animate-slide-in-left">
            <div className="card-header">
              <h3 className="card-title">
                <Search size={16} className="inline-icon" /> Transaction Walkthrough
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedTxn(null); setWalkthrough(null); }}>
                <X size={16} />
              </button>
            </div>

            <div className="walkthrough-summary">
              <div className="walkthrough-stat">
                <span className="ws-label">Status</span>
                <span className="ws-value">{walkthrough.summary?.final_status}</span>
              </div>
              <div className="walkthrough-stat">
                <span className="ws-label">Root Cause</span>
                <span className="ws-value">{walkthrough.summary?.root_cause}</span>
              </div>
              <div className="walkthrough-stat">
                <span className="ws-label">Intervention</span>
                <span className="ws-value">{walkthrough.summary?.intervention}</span>
              </div>
              {walkthrough.summary?.recovered_amount > 0 && (
                <div className="walkthrough-stat">
                  <span className="ws-label">Recovered</span>
                  <span className="ws-value recovered">₹{walkthrough.summary.recovered_amount?.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            <div className="walkthrough-timeline">
              <h4 className="timeline-title">Decision Timeline</h4>
              {(walkthrough.timeline || []).map((step, i) => (
                <div className="timeline-step" key={i}>
                  <div className="timeline-dot-wrapper">
                    <div className={`timeline-dot ${step.outcome === 'success' || step.outcome === 'recovered' ? 'success' : ''}`} />
                    {i < walkthrough.timeline.length - 1 && <div className="timeline-line" />}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <span className="stage-badge">{step.stage}</span>
                      <span className="timeline-time">{formatDateTime(step.timestamp)}</span>
                    </div>
                    <p className="timeline-action">{step.action}</p>
                    {step.reasoning && <p className="timeline-reasoning">{step.reasoning}</p>}
                    {step.compliance?.consent_checked && (
                      <div className="compliance-checks">
                        <span className={`compliance-check ${step.compliance.consent_status === 'granted' ? 'ok' : 'blocked'}`}>
                          Consent: {step.compliance.consent_status || '—'}
                        </span>
                        <span className={`compliance-check ${step.compliance.dnd_status === 'clear' ? 'ok' : 'blocked'}`}>
                          DND: {step.compliance.dnd_status || '—'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
