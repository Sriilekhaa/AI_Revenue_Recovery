import { Search, Download, Bell, UserCircle } from 'lucide-react';
import './TopBar.css';

export default function TopBar({ title, subtitle, onExportJSON, onExportCSV }) {
  return (
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
          <input type="text" placeholder="Search batches, policies..." className="search-input" />
        </div>

        <nav className="topbar-nav">
          <button className="topbar-nav-item active">Analytics</button>
          <button className="topbar-nav-item">Agents</button>
          <button className="topbar-nav-item">Audit</button>
        </nav>
      </div>

      <div className="topbar-right">
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
  );
}
