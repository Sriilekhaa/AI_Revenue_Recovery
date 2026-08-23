import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatINR, formatPercent } from '../utils/formatters';
import './StatCard.css';

export default function StatCard({ title, value, subtitle, type, icon, trend, delay = 0 }) {
  const isRecovered = type === 'recovered';
  const isAtRisk = type === 'atRisk';
  const isCompliance = type === 'compliance';

  return (
    <div className="stat-card animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        <div className="stat-card-indicator">
          {trend && (
            <span className="trend-badge">
              <TrendingUp size={13} />
              +{trend}%
            </span>
          )}
          {isAtRisk && (
            <div className="alert-icon-wrap">
              <AlertTriangle size={18} color="#e11d48" />
            </div>
          )}
          {isCompliance && (
            <div className="shield-icon-wrap">
              <CheckCircle2 size={18} color="#059669" />
            </div>
          )}
        </div>
      </div>

      <div className={`stat-card-value ${isCompliance ? 'compliance-val' : ''}`}>
        {value}
      </div>

      {isRecovered && (
        <div className="sparkline-container">
          <svg viewBox="0 0 160 30" className="sparkline-svg">
            <path
              d="M 0,22 Q 25,6 50,18 T 100,10 T 135,16 T 160,8"
              fill="none"
              stroke="#059669"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="160" cy="8" r="3" fill="#059669" />
          </svg>
        </div>
      )}

      {subtitle && (
        <div className="stat-card-subtitle">{subtitle}</div>
      )}
    </div>
  );
}

export function RecoveryRateCard({ rate, target = 75, delay = 0 }) {
  const circumference = 2 * Math.PI * 40;
  const progress = (rate / 100) * circumference;
  const remaining = circumference - progress;

  return (
    <div className="stat-card animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="stat-card-header">
        <span className="stat-card-title">Recovery Rate</span>
      </div>
      <div className="rate-card-content">
        <div className="rate-gauge">
          <svg width="90" height="90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--neutral-200)" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="40" fill="none"
              stroke={rate >= target ? 'var(--success-500)' : 'var(--primary-500)'}
              strokeWidth="8"
              strokeDasharray={`${progress} ${remaining}`}
              strokeDashoffset={circumference / 4}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 1s ease-out' }}
            />
            <text x="50" y="48" textAnchor="middle" fontSize="20" fontWeight="700" fill="var(--neutral-800)">
              {Math.round(rate)}%
            </text>
          </svg>
        </div>
        <div className="rate-info">
          <div className="rate-target">Target: {target}%</div>
          <div className="rate-label">Current open batch</div>
        </div>
      </div>
    </div>
  );
}
