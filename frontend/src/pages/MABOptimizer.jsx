import React, { useState, useEffect } from 'react';
import { Cpu, Zap, TrendingUp, RefreshCw, BarChart2, CheckCircle2, Play, Compass, Target } from 'lucide-react';
import { formatINRFull, formatPercent } from '../utils/formatters';
import { API_BASE } from '../utils/constants';
import './MABOptimizer.css';

export default function MABOptimizer() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [lastSelectedArm, setLastSelectedArm] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/mab/analytics`);
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load MAB analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleSimulateDraw = async () => {
    setSimulating(true);
    try {
      const res = await fetch(`${API_BASE}/api/mab/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segment: 'high_value', amount: 3500 }),
      });
      const selectedArm = await res.json();
      setLastSelectedArm(selectedArm);

      // Record simulated probabilistic outcome
      const isSuccess = Math.random() < (selectedArm.conversion_rate / 100);
      await fetch(`${API_BASE}/api/mab/outcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          arm_id: selectedArm.arm_id,
          success: isSuccess,
          amount_recovered: isSuccess ? 3500 : 0,
        }),
      });

      fetchAnalytics();
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimulating(false);
    }
  };

  if (loading && !analytics) {
    return (
      <div className="mab-page animate-fade-in">
        <div className="page-header">
          <h2 className="page-title">Multi-Armed Bandit (MAB) Reinforcement Learning Optimizer</h2>
          <p className="page-subtitle">Continuous Bayesian policy discovery across recovery channels, incentives, and timing windows.</p>
        </div>
        <div className="skeleton" style={{ height: 400 }} />
      </div>
    );
  }

  return (
    <div className="mab-page animate-fade-in">
      <div className="page-header">
        <div className="mab-title-row">
          <div>
            <h2 className="page-title">Multi-Armed Bandit (MAB) Reinforcement Learning Optimizer</h2>
            <p className="page-subtitle">
              Self-optimizing Thompson Sampling engine that learns which intervention corridor maximizes ₹ recovered per rupee spent.
            </p>
          </div>
          <div className="mab-actions">
            <button className="btn btn-primary btn-sm" onClick={handleSimulateDraw} disabled={simulating}>
              <Play size={14} className={simulating ? 'spinning' : ''} />
              Simulate Bayesian Draw
            </button>
            <button className="btn btn-outline btn-sm" onClick={fetchAnalytics} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'spinning' : ''} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Top Level MAB KPIs */}
      <div className="mab-kpis stagger-children">
        <div className="card mab-kpi-card">
          <div className="kpi-label">
            <Target size={14} className="inline-icon" /> Overall MAB Conversion
          </div>
          <div className="kpi-val success">{analytics?.overall_conversion_rate}%</div>
          <div className="kpi-sub">
            <TrendingUp size={12} className="inline-icon" /> +{analytics?.relative_lift_pct}% lift vs static heuristic ({analytics?.baseline_conversion_rate}%)
          </div>
        </div>

        <div className="card mab-kpi-card">
          <div className="kpi-label">
            <Compass size={14} className="inline-icon" /> Policy Strategy Ratio
          </div>
          <div className="kpi-val info">{analytics?.exploitation_ratio}% Exploit</div>
          <div className="kpi-sub">{analytics?.exploration_ratio}% Explore (ε = {analytics?.epsilon})</div>
        </div>

        <div className="card mab-kpi-card">
          <div className="kpi-label">Total Decisions Optimized</div>
          <div className="kpi-val primary">{analytics?.total_decisions}</div>
          <div className="kpi-sub">{analytics?.total_conversions} successful recoveries</div>
        </div>

        <div className="card mab-kpi-card">
          <div className="kpi-label">Net Merchant Lift Generated</div>
          <div className="kpi-val success">{formatINRFull(analytics?.net_revenue_lift || 0)}</div>
          <div className="kpi-sub">After {formatINRFull(analytics?.total_cost_incurred || 0)} intervention expenses</div>
        </div>
      </div>

      {/* Last Selected Arm Live Feedback */}
      {lastSelectedArm && (
        <div className="last-arm-banner animate-slide-in-down">
          <Zap size={16} color="#2563eb" />
          <span>
            <strong>Thompson Sampling Sampled:</strong> [{lastSelectedArm.channel} • {lastSelectedArm.incentive_pct}% Incentive • {lastSelectedArm.delay_window}] — <em>{lastSelectedArm.description}</em>
          </span>
        </div>
      )}

      {/* Bandit Arms Comparison Table & Probability Bars */}
      <div className="card mab-arms-card">
        <div className="card-header">
          <h3 className="card-title">Active Bandit Arms & Bayesian Posterior Distributions</h3>
          <span className="badge badge-info">{analytics?.arms?.length || 0} Discovery Arms</span>
        </div>

        <div className="arms-list stagger-children">
          {(analytics?.arms || []).map((arm) => {
            const isBest = arm.arm_id === analytics?.best_performing_arm?.arm_id;

            return (
              <div className={`arm-card ${isBest ? 'best-arm' : ''}`} key={arm.arm_id}>
                <div className="arm-top">
                  <div className="arm-header-info">
                    <span className="arm-name">{arm.description}</span>
                    <div className="arm-tags">
                      <span className="badge badge-neutral">{arm.channel}</span>
                      <span className="badge badge-info">{arm.incentive_pct}% Incentive</span>
                      <span className="badge badge-neutral">+{arm.delay_window}</span>
                    </div>
                  </div>
                  {isBest && (
                    <span className="badge badge-success">
                      <CheckCircle2 size={12} className="inline-icon" /> Optimal Policy Arm
                    </span>
                  )}
                </div>

                {/* Conversion Probability Bar */}
                <div className="conversion-bar-wrap">
                  <div className="bar-labels">
                    <span className="bl-label">Empirical Conversion Rate</span>
                    <span className="bl-rate">{arm.conversion_rate}% ({arm.successes}/{arm.trials} converted)</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className={`progress-fill ${isBest ? 'fill-best' : ''}`}
                      style={{ width: `${Math.min(100, arm.conversion_rate * 2.5)}%` }}
                    />
                  </div>
                </div>

                {/* Economics for this arm */}
                <div className="arm-econ-row">
                  <span className="ae-item">
                    <strong>Recovered:</strong> {formatINRFull(arm.revenue_recovered)}
                  </span>
                  <span className="ae-item">
                    <strong>Intervention Cost:</strong> {formatINRFull(arm.cost_incurred)}
                  </span>
                  <span className="ae-item">
                    <strong>Bayesian Prior:</strong> Beta(α={arm.alpha}, β={arm.beta_param})
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
