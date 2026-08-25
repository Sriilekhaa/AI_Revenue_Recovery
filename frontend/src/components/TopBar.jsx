import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Download, Bell, UserCircle, FlaskConical } from 'lucide-react';
import JudgeSandboxModal from './JudgeSandboxModal';
import './TopBar.css';

export default function TopBar({ title, subtitle, onExportJSON, onExportCSV }) {
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <div className="topbar-title-group">
            <h1 className="topbar-title">{title || 'Recovery Dashboard'}</h1>
            {subtitle && <p className="topbar-subtitle">{subtitle}</p>}
          </div>
        </div>

        <div className="topbar-center">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input type="text" placeholder="Search batches, policies, telemetry..." className="search-input" />
          </div>

          <nav className="topbar-nav">
            <button
              className={`topbar-nav-item ${location.pathname === '/' ? 'active' : ''}`}
              onClick={() => navigate('/')}
            >
              Analytics
            </button>
            <button
              className={`topbar-nav-item ${location.pathname === '/agent-simulator' ? 'active' : ''}`}
              onClick={() => navigate('/agent-simulator')}
            >
              Agents
            </button>
            <button
              className={`topbar-nav-item ${location.pathname === '/audit' ? 'active' : ''}`}
              onClick={() => navigate('/audit')}
            >
              Audit
            </button>
          </nav>
        </div>

        <div className="topbar-right">
          <button className="sandbox-trigger-btn" onClick={() => setIsSandboxOpen(true)}>
            <FlaskConical size={15} />
            <span>Judge Sandbox</span>
          </button>
          <button className="topbar-export" onClick={onExportJSON}>
            <Download size={16} />
            <span>Download Audit<br />JSON/CSV</span>
          </button>
          <button className="topbar-icon-btn">
            <Bell size={18} />
            <span className="notification-dot"></span>
          </button>
          <button className="topbar-icon-btn">
            <UserCircle size={22} />
          </button>
        </div>
      </header>

      <JudgeSandboxModal isOpen={isSandboxOpen} onClose={() => setIsSandboxOpen(false)} />
    </>
  );
}
