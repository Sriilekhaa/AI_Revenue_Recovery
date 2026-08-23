import { Download } from 'lucide-react';
import { API_BASE } from '../utils/constants';
import './ExportButtons.css';

export default function ExportButtons({ batchId }) {
  const handleExport = (format) => {
    const url = `${API_BASE}/api/audit/export/${format}${batchId ? `?batch_id=${batchId}` : ''}`;
    window.open(url, '_blank');
  };

  return (
    <div className="export-section">
      <span className="export-label">Export Results</span>
      <div className="export-buttons">
        <button className="btn btn-outline btn-sm" onClick={() => handleExport('json')}>
          <Download size={14} />
          JSON
        </button>
        <button className="btn btn-outline btn-sm" onClick={() => handleExport('csv')}>
          <Download size={14} />
          CSV
        </button>
      </div>
    </div>
  );
}
