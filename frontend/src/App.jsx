import { useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import LandingPage from './pages/LandingPage';
import LiveMonitor from './pages/LiveMonitor';
import BatchRuns from './pages/BatchRuns';
import InterventionPolicies from './pages/InterventionPolicies';
import AuditLogs from './pages/AuditLogs';
import AgentSimulator from './pages/AgentSimulator';
import B2BReceivables from './pages/B2BReceivables';
import BankHealthRadar from './pages/BankHealthRadar';
import MABOptimizer from './pages/MABOptimizer';
import { ThemeProvider } from './context/ThemeContext';
import { API_BASE } from './utils/constants';
import './App.css';

function DashboardLayout({ generateBatch, generating, handleExportJSON, children }) {
  return (
    <div className="app-layout">
      <Sidebar onGenerateBatch={generateBatch} generating={generating} />
      <div className="main-content">
        <TopBar
          title="Recovery Dashboard"
          onExportJSON={handleExportJSON}
        />
        <div className="page-content">
          {children}
        </div>
      </div>
    </div>
  );
}

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
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* 1. Public Landing Page */}
          <Route
            path="/"
            element={
              <LandingPage
                onRunBatch={generateBatch}
                generating={generating}
                batchStats={dashboardData}
              />
            }
          />

          {/* 2. Operations Dashboard & Sub-routes */}
          <Route
            path="/dashboard"
            element={
              <DashboardLayout
                generateBatch={generateBatch}
                generating={generating}
                handleExportJSON={handleExportJSON}
              >
                <LiveMonitor
                  dashboardData={dashboardData}
                  events={events}
                  batchId={batchId}
                />
              </DashboardLayout>
            }
          />

          <Route
            path="/mab-optimizer"
            element={
              <DashboardLayout
                generateBatch={generateBatch}
                generating={generating}
                handleExportJSON={handleExportJSON}
              >
                <MABOptimizer />
              </DashboardLayout>
            }
          />

          <Route
            path="/agent-simulator"
            element={
              <DashboardLayout
                generateBatch={generateBatch}
                generating={generating}
                handleExportJSON={handleExportJSON}
              >
                <AgentSimulator />
              </DashboardLayout>
            }
          />

          <Route
            path="/b2b"
            element={
              <DashboardLayout
                generateBatch={generateBatch}
                generating={generating}
                handleExportJSON={handleExportJSON}
              >
                <B2BReceivables />
              </DashboardLayout>
            }
          />

          <Route
            path="/bank-radar"
            element={
              <DashboardLayout
                generateBatch={generateBatch}
                generating={generating}
                handleExportJSON={handleExportJSON}
              >
                <BankHealthRadar />
              </DashboardLayout>
            }
          />

          <Route
            path="/batches"
            element={
              <DashboardLayout
                generateBatch={generateBatch}
                generating={generating}
                handleExportJSON={handleExportJSON}
              >
                <BatchRuns />
              </DashboardLayout>
            }
          />

          <Route
            path="/policies"
            element={
              <DashboardLayout
                generateBatch={generateBatch}
                generating={generating}
                handleExportJSON={handleExportJSON}
              >
                <InterventionPolicies />
              </DashboardLayout>
            }
          />

          <Route
            path="/audit"
            element={
              <DashboardLayout
                generateBatch={generateBatch}
                generating={generating}
                handleExportJSON={handleExportJSON}
              >
                <AuditLogs />
              </DashboardLayout>
            }
          />

          {/* Catch-all fallback */}
          <Route
            path="*"
            element={
              <DashboardLayout
                generateBatch={generateBatch}
                generating={generating}
                handleExportJSON={handleExportJSON}
              >
                <LiveMonitor
                  dashboardData={dashboardData}
                  events={events}
                  batchId={batchId}
                />
              </DashboardLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
