import { useState, useEffect } from 'react';
import { formatINRFull, formatDateTime, formatPercent } from '../utils/formatters';
import { API_BASE, STATUS_CONFIG } from '../utils/constants';
import './BatchRuns.css';

export default function BatchRuns() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/batch/list`)
      .then(r => r.json())
      .then(setBatches)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="batch-runs animate-fade-in">
      <div className="page-header">
        <h2 className="page-title">Batch Runs</h2>
        <p className="page-subtitle">History of all pipeline batch executions.</p>
      </div>

      {loading ? (
        <div className="loading-placeholder">
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 80, marginBottom: 12 }} />)}
        </div>
      ) : batches.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🗂️</div>
          <h3>No batch runs yet</h3>
          <p>Generate your first batch to see pipeline execution history.</p>
        </div>
      ) : (
        <div className="batch-list stagger-children">
          {batches.map((batch) => (
            <div className="card batch-card" key={batch.batch_id}>
              <div className="batch-card-header">
                <div>
                  <span className="batch-id">{batch.batch_id}</span>
                  <span className="batch-time">{formatDateTime(batch.created_at)}</span>
                </div>
                <span className={`badge ${batch.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                  {batch.status}
                </span>
              </div>
              <div className="batch-stats-row">
                <div className="batch-stat">
                  <span className="batch-stat-value">{batch.total_events}</span>
                  <span className="batch-stat-label">Events</span>
                </div>
                <div className="batch-stat">
                  <span className="batch-stat-value recovered">{formatINRFull(batch.amount_recovered)}</span>
                  <span className="batch-stat-label">Recovered</span>
                </div>
                <div className="batch-stat">
                  <span className="batch-stat-value">{formatPercent(batch.recovery_rate)}</span>
                  <span className="batch-stat-label">Recovery Rate</span>
                </div>
                <div className="batch-stat">
                  <span className="batch-stat-value">{batch.events_recovered}</span>
                  <span className="batch-stat-label">Recovered Txns</span>
                </div>
                <div className="batch-stat">
                  <span className="batch-stat-value danger">{batch.events_fraud_flagged}</span>
                  <span className="batch-stat-label">Fraud Flagged</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
