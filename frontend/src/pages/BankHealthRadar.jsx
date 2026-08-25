import { useState, useEffect } from 'react';
import { Activity, ShieldAlert, CheckCircle2, Zap, AlertTriangle, RefreshCw } from 'lucide-react';
import { API_BASE } from '../utils/constants';
import './BankHealthRadar.css';

export default function BankHealthRadar() {
  const [radarData, setRadarData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRadar = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/sandbox/bank-radar`);
      const data = await res.json();
      setRadarData(data);
    } catch (err) {
      console.error('Failed to load bank radar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRadar();
    const timer = setInterval(fetchRadar, 15000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="radar-page animate-fade-in">
      <div className="page-header">
        <div className="radar-title-row">
          <div>
            <h2 className="page-title">Pre-Flight Bank Health & Degradation Radar</h2>
            <p className="page-subtitle">
              Live telemetry on Indian banking switches, NPCI UPI latencies, and predictive auto-rerouting before payments fail.
            </p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={fetchRadar} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spinning' : ''} /> Live Refresh
          </button>
        </div>
      </div>

      {/* Grid of Bank Cards */}
      <div className="bank-grid stagger-children">
        {radarData.map((bank) => {
          const isHealthy = bank.status === 'healthy';
          const isDegraded = bank.status === 'degraded';

          return (
            <div className={`card bank-card ${bank.status}`} key={bank.bank_code}>
              <div className="bank-card-top">
                <div className="bank-info-group">
                  <span className="bank-name">{bank.bank_name}</span>
                  <span className="bank-method">{bank.method}</span>
                </div>
                <span className={`badge badge-${isHealthy ? 'success' : isDegraded ? 'warning' : 'danger'}`}>
                  {bank.status.toUpperCase()}
                </span>
              </div>

              <div className="bank-metrics-row">
                <div className="bank-metric">
                  <span className="metric-label">Success Rate</span>
                  <span className={`metric-value ${bank.success_rate < 80 ? 'danger' : 'success'}`}>
                    {bank.success_rate}%
                  </span>
                </div>
                <div className="bank-metric">
                  <span className="metric-label">Switch Latency</span>
                  <span className={`metric-value ${bank.latency_ms > 1000 ? 'warning' : ''}`}>
                    {bank.latency_ms} ms
                  </span>
                </div>
              </div>

              {/* Incidents or Healthy Indicator */}
              <div className="incidents-box">
                {bank.active_incidents && bank.active_incidents.length > 0 ? (
                  <div className="incident-alert">
                    <AlertTriangle size={14} color="#d97706" />
                    <span>{bank.active_incidents[0]}</span>
                  </div>
                ) : (
                  <div className="incident-healthy">
                    <CheckCircle2 size={14} color="#0d9488" />
                    <span>Switch operational • Zero degradation detected</span>
                  </div>
                )}
              </div>

              {/* AI Autonomous Smart Route */}
              <div className="smart-route-box">
                <div className="sr-label">
                  <Zap size={12} /> Predictive AI Action
                </div>
                <p className="sr-text">{bank.smart_route_action}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
