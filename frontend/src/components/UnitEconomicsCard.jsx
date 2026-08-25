import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, ArrowUpRight, Scale, ShieldCheck } from 'lucide-react';
import { formatINRFull, formatPercent } from '../utils/formatters';
import { API_BASE } from '../utils/constants';
import './UnitEconomicsCard.css';

export default function UnitEconomicsCard({ batchId }) {
  const [econ, setEcon] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = `${API_BASE}/api/economics/${batchId ? `?batch_id=${batchId}` : ''}`;
    fetch(url)
      .then(r => r.json())
      .then(data => setEcon(data))
      .catch(err => console.error('Failed to load economics:', err))
      .finally(() => setLoading(false));
  }, [batchId]);

  if (loading) {
    return <div className="card unit-econ-card skeleton" style={{ height: 180 }} />;
  }

  if (!econ) return null;

  return (
    <div className="card unit-econ-card animate-fade-in">
      <div className="card-header">
        <div className="ue-title-group">
          <h3 className="card-title">
            <Scale size={16} className="inline-icon" /> CFO Net Recovery Margin & Unit Economics
          </h3>
          <span className="badge badge-success">
            ROI Multiplier: {econ.roi_multiplier}x
          </span>
        </div>
        <span className="ue-subtitle">Proving real net financial profit after deducting messaging & discount costs</span>
      </div>

      <div className="ue-grid">
        {/* Gross vs Net Stat */}
        <div className="ue-stat-box primary">
          <span className="ue-stat-label">Net Merchant Profit</span>
          <span className="ue-stat-value success">{formatINRFull(econ.net_merchant_profit)}</span>
          <span className="ue-stat-sub">
            Gross {formatINRFull(econ.gross_recovered)} ({econ.net_margin_pct}% Margin)
          </span>
        </div>

        {/* Total Cost Breakdown */}
        <div className="ue-stat-box">
          <span className="ue-stat-label">Total Intervention Costs</span>
          <span className="ue-stat-value warning">{formatINRFull(econ.total_recovery_cost)}</span>
          <span className="ue-stat-sub">
            WhatsApp {formatINRFull(econ.messaging_cost)} • Disc {formatINRFull(econ.discount_cost)}
          </span>
        </div>

        {/* Cost Efficiency */}
        <div className="ue-stat-box">
          <span className="ue-stat-label">Cost per ₹1 Recovered</span>
          <span className="ue-stat-value info">₹{econ.cost_per_recovered_rupee.toFixed(4)}</span>
          <span className="ue-stat-sub">
            ₹0.44 per ₹100 recovered
          </span>
        </div>

        {/* A/B Benchmark Lift */}
        <div className="ue-stat-box highlight">
          <span className="ue-stat-label">Lift over Naive Retries</span>
          <span className="ue-stat-value success">
            <TrendingUp size={16} className="inline-icon" /> +{formatINRFull(econ.ai_incremental_lift)}
          </span>
          <span className="ue-stat-sub">
            Baseline: {formatINRFull(econ.naive_baseline_recovered)}
          </span>
        </div>
      </div>
    </div>
  );
}
