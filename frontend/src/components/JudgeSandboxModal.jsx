import { useState } from 'react';
import { FlaskConical, Play, CheckCircle2, AlertTriangle, Shield, ArrowRight, Loader2, X, QrCode } from 'lucide-react';
import { formatINRFull } from '../utils/formatters';
import { API_BASE } from '../utils/constants';
import QRCodeModal from './QRCodeModal';
import './JudgeSandboxModal.css';

export default function JudgeSandboxModal({ isOpen, onClose }) {
  const [amount, setAmount] = useState('85000');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [failureCode, setFailureCode] = useState('INSUFFICIENT_FUNDS');
  const [failureMessage, setFailureMessage] = useState('Customer bank balance below order value');
  const [dndRegistered, setDndRegistered] = useState(false);
  const [consentWhatsapp, setConsentWhatsapp] = useState(true);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [isQrOpen, setIsQrOpen] = useState(false);

  if (!isOpen) return null;

  const handleRun = async () => {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/sandbox/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount) || 1000,
          payment_method: paymentMethod,
          failure_reason_code: failureCode,
          failure_message: failureMessage,
          dnd_registered: dndRegistered,
          consent_whatsapp: consentWhatsapp,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error('Failed to run sandbox:', err);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="sandbox-modal-card animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="sandbox-modal-header">
          <div className="smh-left">
            <FlaskConical size={20} color="#2563eb" />
            <div>
              <h3>Judge Scenario Sandbox</h3>
              <p>Test arbitrary failure amounts, error messages, and compliance states live.</p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="sandbox-modal-grid">
          {/* Inputs */}
          <div className="sandbox-inputs">
            {/* Quick 1-Click Adversarial Presets */}
            <div className="form-group">
              <label>1-Click Adversarial & Rubric Presets:</label>
              <div className="preset-chips-row" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-xs"
                  onClick={() => {
                    setAmount('85000');
                    setPaymentMethod('upi');
                    setFailureCode('INSUFFICIENT_FUNDS');
                    setFailureMessage('Customer bank balance below ₹85,000 order value');
                    setDndRegistered(false);
                    setConsentWhatsapp(true);
                  }}
                >
                  ₹85k HITL Barrier
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-xs"
                  onClick={() => {
                    setAmount('12000');
                    setPaymentMethod('card');
                    setFailureCode('FRAUD_SUSPECTED');
                    setFailureMessage('Anomalous geo-velocity transaction flagged by risk heuristic');
                    setDndRegistered(false);
                    setConsentWhatsapp(false);
                  }}
                >
                  Fraud Sieve Exclusion
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-xs"
                  onClick={() => {
                    setAmount('2499');
                    setPaymentMethod('upi');
                    setFailureCode('GATEWAY_TIMEOUT');
                    setFailureMessage('NPCI UPI Switch timed out after 30000ms');
                    setDndRegistered(true);
                    setConsentWhatsapp(false);
                  }}
                >
                  TRAI DND Guard
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Amount (₹):</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 85000"
              />
              <span className="input-hint">
                {parseFloat(amount) >= 50000 ? 'Exceeds ₹50,000 HITL threshold -> Triggers Human Escalation' : 'Standard autonomous recovery band'}
              </span>
            </div>

            <div className="form-group">
              <label>Payment Method:</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="upi">UPI (Google Pay / PhonePe)</option>
                <option value="card">Credit / Debit Card</option>
                <option value="emandate">eMandate / UPI AutoPay</option>
                <option value="netbanking">Netbanking</option>
              </select>
            </div>

            <div className="form-group">
              <label>Failure Reason Preset:</label>
              <select
                value={failureCode}
                onChange={(e) => {
                  setFailureCode(e.target.value);
                  if (e.target.value === 'FRAUD_SUSPECTED') setFailureMessage('Transaction flagged by risk heuristic');
                  else if (e.target.value === 'GATEWAY_TIMEOUT') setFailureMessage('Issuer bank switch timed out');
                  else setFailureMessage('Customer bank balance below order value');
                }}
              >
                <option value="INSUFFICIENT_FUNDS">Insufficient Funds</option>
                <option value="GATEWAY_TIMEOUT">Gateway / Bank Timeout</option>
                <option value="FRAUD_SUSPECTED">Fraud Suspected (Tests Sieve)</option>
                <option value="CARD_EXPIRED">Expired Card</option>
                <option value="MANDATE_REVOKED">eMandate Revoked</option>
                <option value="3DS_DROPOUT">3DS Dropout / Abandonment</option>
              </select>
            </div>

            <div className="form-group">
              <label>Raw Failure Description:</label>
              <input
                type="text"
                value={failureMessage}
                onChange={(e) => setFailureMessage(e.target.value)}
              />
            </div>

            <div className="checkbox-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={dndRegistered}
                  onChange={(e) => setDndRegistered(e.target.checked)}
                />
                Customer is on TRAI DND Registry
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={consentWhatsapp}
                  onChange={(e) => setConsentWhatsapp(e.target.checked)}
                />
                WhatsApp Consent Granted
              </label>
            </div>

            <button className="btn btn-primary btn-run" onClick={handleRun} disabled={running}>
              {running ? <Loader2 size={16} className="spinning" /> : <Play size={16} />}
              Run 5-Layer Pipeline Live
            </button>
          </div>

          {/* Real-time Output Trace */}
          <div className="sandbox-output">
            <h4 className="output-title">Autonomous Execution Trace</h4>

            {!result && !running && (
              <div className="output-placeholder">
                <p>Configure transaction parameters on the left and click <strong>"Run 5-Layer Pipeline Live"</strong>.</p>
              </div>
            )}

            {running && (
              <div className="output-loading">
                <Loader2 size={24} className="spinning" color="#2563eb" />
                <span>Running Root-Cause Diagnosis, Policy Table, Stopping Rules & Razorpay APIs...</span>
              </div>
            )}

            {result && (
              <div className="output-results animate-fade-in">
                <div className="result-status-banner">
                  <span className="rs-label">Final Outcome:</span>
                  <span className={`badge badge-${result.final_status === 'recovered' ? 'success' : result.final_status === 'fraud_flagged' ? 'danger' : 'info'}`}>
                    {result.final_status?.toUpperCase() || result.status?.toUpperCase()}
                  </span>
                </div>

                <div className="trace-steps">
                  <div className="trace-step">
                    <span className="step-num">1</span>
                    <div className="step-body">
                      <strong>Layer 2 Diagnosis:</strong>
                      <p>{result.diagnosis?.reasoning || 'Diagnosed'}</p>
                    </div>
                  </div>

                  <div className="trace-step">
                    <span className="step-num">2</span>
                    <div className="step-body">
                      <strong>Layer 3 Policy Decision:</strong>
                      <p>
                        Action: <strong>{result.policy?.action || result.action_taken}</strong> via {result.policy?.channel || 'None'}
                      </p>
                      {result.policy?.requires_hitl && (
                        <span className="hitl-badge">HITL Escalation Active (&gt; ₹50,000)</span>
                      )}
                    </div>
                  </div>

                  <div className="trace-step">
                    <span className="step-num">3</span>
                    <div className="step-body">
                      <strong>Layer 4 Execution & Outcome:</strong>
                      <p>
                        Recovered: <strong>{formatINRFull(result.amount_recovered || 0)}</strong>
                      </p>
                      {result.upi_smart_intent && (
                        <button
                          type="button"
                          className="btn btn-outline btn-xs"
                          onClick={() => setIsQrOpen(true)}
                          style={{ marginTop: '8px', gap: '4px' }}
                        >
                          <QrCode size={12} /> View Dynamic UPI QR & Smart Intent
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <QRCodeModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        upiData={result?.upi_smart_intent}
      />
    </div>
  );
}
