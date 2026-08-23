import { useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import LiveMonitor from './pages/LiveMonitor';
import BatchRuns from './pages/BatchRuns';
import InterventionPolicies from './pages/InterventionPolicies';
import AuditLogs from './pages/AuditLogs';
import { API_BASE } from './utils/constants';
import './App.css';

function App() {
  const [dashboardData, setDashboardData] = useState(null);
  const [events, setEvents] = useState([]);
  const [batchId, setBatchId] = useState(null);
  const [generating, setGenerating] = useState(false);

  const loadBatch = useCallback(async (id) => {
    try {
      const dashRes = await fetch(`${API_BASE}/api/dashboard/?batch_id=${id}`);
      const dashData = await dashRes.json();
      setDashboardData(dashData);

      const eventsRes = await fetch(`${API_BASE}/api/batch/${id}/events`);
      const eventsData = await eventsRes.json();
      setEvents(eventsData);
      setBatchId(id);
    } catch (err) {
      console.error('Failed to load batch:', err);
    }
  }, []);

  const generateBatch = useCallback(async () => {
    setGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/api/batch/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch_size: 300, hours_back: 48 }),
      });
      const batchResult = await res.json();
      await loadBatch(batchResult.batch_id);
    } catch (err) {
      console.error('Batch generation failed:', err);
    } finally {
      setGenerating(false);
    }
  }, [loadBatch]);

  // On initial mount, load latest batch or auto-generate one
  useEffect(() => {
    fetch(`${API_BASE}/api/batch/list`)
      .then(r => r.json())
      .then(batches => {
        if (batches && batches.length > 0) {
          loadBatch(batches[0].batch_id);
        } else {
          generateBatch();
        }
      })
      .catch(() => {
        generateBatch();
      });
  }, [loadBatch, generateBatch]);

  const handleExportJSON = useCallback(() => {
    const url = `${API_BASE}/api/audit/export/json${batchId ? `?batch_id=${batchId}` : ''}`;
    window.open(url, '_blank');
  }, [batchId]);

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar onGenerateBatch={generateBatch} generating={generating} />
        <div className="main-content">
          <TopBar
            title="Recovery Dashboard"
            onExportJSON={handleExportJSON}
          />
          <div className="page-content">
            <Routes>
              <Route
                path="/"
                element={
                  <LiveMonitor
                    dashboardData={dashboardData}
                    events={events}
                    batchId={batchId}
                  />
                }
              />
              <Route path="/batches" element={<BatchRuns />} />
              <Route path="/policies" element={<InterventionPolicies />} />
              <Route path="/audit" element={<AuditLogs />} />
              <Route path="*" element={<LiveMonitor dashboardData={dashboardData} events={events} batchId={batchId} />} />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
