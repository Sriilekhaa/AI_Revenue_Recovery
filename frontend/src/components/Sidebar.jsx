import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3, Activity, FileText, Settings, HelpCircle,
  LayoutDashboard, Layers, ShieldCheck, PlusCircle, MessageSquare, Building2, Radio
} from 'lucide-react';
import './Sidebar.css';

const NAV_ITEMS = [
  { path: '/', label: 'Live Monitor', icon: Activity },
  { path: '/agent-simulator', label: 'Hinglish Agent', icon: MessageSquare },
  { path: '/b2b', label: 'B2B & PTP Tracker', icon: Building2 },
  { path: '/bank-radar', label: 'Bank Radar', icon: Radio },
  { path: '/batches', label: 'Batch Runs', icon: Layers },
  { path: '/policies', label: 'Intervention Policies', icon: ShieldCheck },
  { path: '/audit', label: 'Audit Logs', icon: FileText },
];

const BOTTOM_ITEMS = [
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/support', label: 'Support', icon: HelpCircle },
];

export default function Sidebar({ onGenerateBatch, generating }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo" onClick={() => navigate('/')}>
        <div className="logo-icon">
          <BarChart3 size={22} />
        </div>
        <div className="logo-text">
          <span className="logo-title">Recovery AI</span>
          <span className="logo-subtitle">Enterprise Control</span>
        </div>
      </div>

      {/* Generate Button */}
      <button
        className="generate-btn"
        onClick={onGenerateBatch}
        disabled={generating}
      >
        <PlusCircle size={18} />
        {generating ? (
          <span className="loading-dots"><span></span><span></span><span></span></span>
        ) : (
          'Generate Batch Report'
        )}
      </button>

      {/* Main Nav */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
          <button
            key={path}
            className={`nav-item ${location.pathname === path ? 'active' : ''}`}
            onClick={() => navigate(path)}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom Nav */}
      <div className="sidebar-bottom">
        {BOTTOM_ITEMS.map(({ path, label, icon: Icon }) => (
          <button
            key={path}
            className={`nav-item ${location.pathname === path ? 'active' : ''}`}
            onClick={() => navigate(path)}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
