import { useState, useEffect, useCallback } from 'react';
import { BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import StatCard, { RecoveryRateCard } from '../components/StatCard';
import LivePipeline from '../components/LivePipeline';
import BatchProgress from '../components/BatchProgress';
import ComplianceGuardrails from '../components/ComplianceGuardrails';
import ExportButtons from '../components/ExportButtons';
import { formatINR, formatINRFull, formatPercent, formatDuration } from '../utils/formatters';
import { ROOT_CAUSE_LABELS, ACTION_LABELS, CHART_COLORS, API_BASE } from '../utils/constants';
import './LiveMonitor.css';

export default function LiveMonitor({ dashboardData, events, batchId }) {
  if (!dashboardData || !dashboardData.total_events) {
    return (
      <div className="live-monitor">
        <div className="page-header">
          <h2 className="page-title">Live Recovery Monitor</h2>
          <p className="page-subtitle">Real-time pipeline analysis and automated interventions.</p>
        </div>
        <div className="empty-state">
          <div className="empty-icon"><BarChart3 size={36} color="var(--neutral-400)" /></div>
          <h3>No batch data yet</h3>
          <p>Click "Generate Batch Report" in the sidebar to run the AI recovery pipeline on synthetic data.</p>
        </div>
      </div>
    );
  }

  const d = dashboardData;

  // Chart data
  const failureData = Object.entries(d.failure_breakdown || {}).map(([key, count]) => ({
    name: ROOT_CAUSE_LABELS[key] || key,
    value: count,
  }));

  const interventionData = Object.entries(d.intervention_breakdown || {}).map(([key, count]) => ({
    name: ACTION_LABELS[key] || key,
    value: count,
  }));

  return (
    <div className="live-monitor">
      <div className="page-header">
        <h2 className="page-title">Live Recovery Monitor</h2>
        <p className="page-subtitle">Real-time pipeline analysis and automated interventions.</p>
      </div>

      {/* KPI Row */}
      <div className="kpi-row stagger-children">
        <StatCard
          title="Total ₹ Recovered"
          value={formatINRFull(d.total_recovered)}
          trend={12}
          type="recovered"
          delay={0}
        />
        <RecoveryRateCard
          rate={d.recovery_rate || 0}
          target={75}
          delay={60}
        />
        <StatCard
          title="At-Risk Revenue"
          value={formatINRFull(d.total_at_risk)}
          subtitle="Pending diagnosis"
          type="atRisk"
          delay={120}
        />
        <StatCard
          title="Compliance Score"
          value="100%"
          subtitle="DND/Stop-rules followed"
          type="compliance"
          delay={180}
        />
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Left Column: Pipeline + Charts */}
        <div className="dashboard-left">
          <LivePipeline events={events} />

          {/* Charts Section */}
          <div className="charts-row">
            {/* Failure Breakdown */}
            <div className="card chart-card">
              <div className="card-header">
                <h3 className="card-title">Failure Type Breakdown</h3>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={failureData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {failureData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v} events`, '']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="chart-legend">
                  {failureData.slice(0, 6).map((item, i) => (
                    <div className="legend-item" key={i}>
                      <span className="legend-dot" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="legend-label">{item.name}</span>
                      <span className="legend-value">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Intervention Breakdown */}
            <div className="card chart-card">
              <div className="card-header">
                <h3 className="card-title">Intervention Type Breakdown</h3>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={interventionData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--neutral-200)" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
                    <Tooltip />
                    <Bar dataKey="value" fill="var(--primary-500)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recovery Funnel */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Recovery Funnel</h3>
            </div>
            <div className="funnel-visualization">
              {[
                { label: 'Detected', count: d.funnel?.ingested || 0, color: 'var(--neutral-400)', width: 100 },
                { label: 'Diagnosed', count: d.funnel?.diagnosed || 0, color: 'var(--primary-400)', width: 90 },
                { label: 'Contacted', count: d.funnel?.contacted || 0, color: 'var(--primary-500)', width: 70 },
                { label: 'Recovered', count: d.funnel?.recovered || 0, color: 'var(--success-500)', width: 50 },
              ].map((stage, i) => (
                <div className="funnel-stage" key={i}>
                  <div
                    className="funnel-bar"
                    style={{
                      width: `${stage.width}%`,
                      background: stage.color,
                      animationDelay: `${i * 100}ms`,
                    }}
                  >
                    <span className="funnel-count">{stage.count}</span>
                  </div>
                  <span className="funnel-label">{stage.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Exception List */}
          {d.exception_list && d.exception_list.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Exception List</h3>
                <span className="badge badge-neutral">{d.exception_list.length} cases</span>
              </div>
              <div className="exception-table-wrapper">
                <table className="exception-table">
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>Amount</th>
                      <th>Root Cause</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.exception_list.slice(0, 10).map((ex, i) => (
                      <tr key={i}>
                        <td className="mono">{ex.transaction_id?.slice(0, 16)}...</td>
                        <td>{formatINRFull(ex.amount)}</td>
                        <td>{ROOT_CAUSE_LABELS[ex.root_cause] || ex.root_cause}</td>
                        <td className="reason-cell">{ex.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Progress + Compliance + Export */}
        <div className="dashboard-right">
          <BatchProgress funnel={d.funnel || {}} />
          <ComplianceGuardrails fraudCount={d.events_fraud_flagged || 0} />
          <ExportButtons batchId={batchId} />

          {/* Quick Stats */}
          <div className="card quick-stats">
            <div className="card-header">
              <h3 className="card-title">Quick Stats</h3>
            </div>
            <div className="quick-stats-grid">
              <div className="quick-stat">
                <span className="quick-stat-value">{d.total_events || 0}</span>
                <span className="quick-stat-label">Total Events</span>
              </div>
              <div className="quick-stat">
                <span className="quick-stat-value">{d.events_diagnosed || 0}</span>
                <span className="quick-stat-label">Diagnosed</span>
              </div>
              <div className="quick-stat">
                <span className="quick-stat-value">{d.events_recovered || 0}</span>
                <span className="quick-stat-label">Recovered</span>
              </div>
              <div className="quick-stat">
                <span className="quick-stat-value">{d.events_fraud_flagged || 0}</span>
                <span className="quick-stat-label">Fraud Flagged</span>
              </div>
              <div className="quick-stat">
                <span className="quick-stat-value">
                  {d.avg_time_to_recovery_mins ? formatDuration(d.avg_time_to_recovery_mins) : '—'}
                </span>
                <span className="quick-stat-label">Avg Recovery Time</span>
              </div>
              <div className="quick-stat">
                <span className="quick-stat-value">{d.events_exception || 0}</span>
                <span className="quick-stat-label">Exceptions</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
