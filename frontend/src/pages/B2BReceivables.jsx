import { useState, useEffect } from 'react';
import { Building2, Calendar, AlertCircle, CheckCircle2, Clock, DollarSign, Send, ArrowUpRight, X } from 'lucide-react';
import { formatINRFull, formatDateTime } from '../utils/formatters';
import { API_BASE } from '../utils/constants';
import './B2BReceivables.css';

export default function B2BReceivables() {
  const [invoices, setInvoices] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [ptpInput, setPtpInput] = useState('');

  const fetchB2BData = async () => {
    setLoading(true);
    try {
      const [invRes, anaRes] = await Promise.all([
        fetch(`${API_BASE}/api/b2b/invoices`),
        fetch(`${API_BASE}/api/b2b/analytics`),
      ]);
      const invData = await invRes.json();
      const anaData = await anaRes.json();
      setInvoices(invData);
      setAnalytics(anaData);
    } catch (err) {
      console.error('Failed to load B2B data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchB2BData();
  }, []);

  const handleSavePTP = async (invoiceId) => {
    if (!ptpInput) return;
    try {
      await fetch(`${API_BASE}/api/b2b/promise-to-pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: invoiceId,
          ptp_date: new Date(ptpInput).toISOString(),
          note: 'Logged via B2B Receivables dashboard',
        }),
      });
      setPtpInput('');
      fetchB2BData();
    } catch (err) {
      console.error('Failed to record PTP:', err);
    }
  };

  return (
    <div className="b2b-page animate-fade-in">
      <div className="page-header">
        <h2 className="page-title">B2B Receivables & Promise-to-Pay (PTP) Sequencer</h2>
        <p className="page-subtitle">
          Autonomous enterprise invoice recovery, dynamic aging buckets, commitment tracking, and dispute escalation.
        </p>
      </div>

      {/* KPI Summary Cards */}
      <div className="b2b-kpis stagger-children">
        <div className="card b2b-kpi-card">
          <div className="kpi-label">Total Outstanding Receivables</div>
          <div className="kpi-val warning">{formatINRFull(analytics?.total_receivables || 0)}</div>
          <div className="kpi-sub">Across {analytics?.invoices_count || 0} enterprise accounts</div>
        </div>

        <div className="card b2b-kpi-card">
          <div className="kpi-label">Recovered via PTP Cadence</div>
          <div className="kpi-val success">{formatINRFull(analytics?.total_recovered || 0)}</div>
          <div className="kpi-sub">100% automated collection</div>
        </div>

        <div className="card b2b-kpi-card">
          <div className="kpi-label">Active Commitments (PTP)</div>
          <div className="kpi-val info">{analytics?.promises?.committed || 0} Active</div>
          <div className="kpi-sub">{analytics?.promises?.kept || 0} kept • {analytics?.promises?.broken || 0} broken SLA</div>
        </div>

        <div className="card b2b-kpi-card">
          <div className="kpi-label">TRAI & B2B Compliance</div>
          <div className="kpi-val success">100% Compliant</div>
          <div className="kpi-sub">Snooze on active promise dates</div>
        </div>
      </div>

      {/* Aging Buckets Visualization */}
      <div className="card aging-card">
        <div className="card-header">
          <h3 className="card-title">Receivables Aging Distribution</h3>
          <span className="badge badge-neutral">DSO Health Index: 28 Days</span>
        </div>
        <div className="aging-buckets-grid">
          {[
            { label: 'Current (< Due)', key: 'current', color: '#0d9488' },
            { label: '1–15 Days Overdue', key: 'overdue_1_15', color: '#3b82f6' },
            { label: '16–30 Days Overdue', key: 'overdue_16_30', color: '#f59e0b' },
            { label: '30–60 Days Overdue', key: 'overdue_30_60', color: '#ea580c' },
            { label: '60+ Days (Critical)', key: 'overdue_60_plus', color: '#dc2626' },
          ].map((bucket) => {
            const amt = analytics?.buckets?.[bucket.key] || 0;
            return (
              <div className="aging-box" key={bucket.key} style={{ borderTopColor: bucket.color }}>
                <span className="aging-box-label">{bucket.label}</span>
                <span className="aging-box-amount">{formatINRFull(amt)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="card invoices-card">
        <div className="card-header">
          <h3 className="card-title">Enterprise Accounts & Recovery Status</h3>
          <span className="badge badge-info">{invoices.length} Invoices</span>
        </div>

        <div className="table-responsive">
          <table className="b2b-table">
            <thead>
              <tr>
                <th>Invoice & Client</th>
                <th>Amount</th>
                <th>Aging Status</th>
                <th>Promise to Pay (PTP)</th>
                <th>AI Action Log</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const isPtpCommitted = inv.promise_status === 'committed';
                const isPtpBroken = inv.promise_status === 'broken';
                const isPaid = inv.status === 'paid';

                return (
                  <tr key={inv.invoice_id}>
                    <td>
                      <div className="client-cell">
                        <span className="inv-id">{inv.invoice_id}</span>
                        <span className="comp-name">{inv.company_name}</span>
                        <span className="contact-name">{inv.contact_person}</span>
                      </div>
                    </td>
                    <td className="amount-cell">{formatINRFull(inv.amount)}</td>
                    <td>
                      <span className={`badge badge-${isPaid ? 'success' : inv.status.includes('30') || inv.status.includes('60') ? 'danger' : 'warning'}`}>
                        {inv.status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {inv.promise_to_pay_date ? (
                        <div className="ptp-cell">
                          <span className={`ptp-badge ${isPtpBroken ? 'broken' : 'committed'}`}>
                            <Calendar size={12} className="inline-icon" /> {new Date(inv.promise_to_pay_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                          <span className="ptp-status-sub">{inv.promise_status.toUpperCase()}</span>
                        </div>
                      ) : (
                        <span className="ptp-none">No Promise</span>
                      )}
                    </td>
                    <td className="notes-cell">
                      {inv.notes?.[inv.notes.length - 1] || 'Scheduled for automated WhatsApp follow-up.'}
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => setSelectedInvoice(inv)}
                        >
                          Log PTP
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log PTP Modal */}
      {selectedInvoice && (
        <div className="modal-backdrop" onClick={() => setSelectedInvoice(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Log Promise-to-Pay Commitment</h3>
              <button className="btn-close" onClick={() => setSelectedInvoice(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <p>
                <strong>Client:</strong> {selectedInvoice.company_name} ({selectedInvoice.invoice_id})
              </p>
              <p>
                <strong>Amount:</strong> {formatINRFull(selectedInvoice.amount)}
              </p>
              <div className="form-group">
                <label>Promise Date Promised by Client:</label>
                <input
                  type="date"
                  className="ptp-date-input"
                  value={ptpInput}
                  onChange={(e) => setPtpInput(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setSelectedInvoice(null)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  handleSavePTP(selectedInvoice.invoice_id);
                  setSelectedInvoice(null);
                }}
                disabled={!ptpInput}
              >
                Save Commitment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
