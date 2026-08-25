import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, Calendar, Shield, ArrowRight, RotateCcw, QrCode, ShieldAlert } from 'lucide-react';
import QRCodeModal from '../components/QRCodeModal';
import { API_BASE } from '../utils/constants';
import './AgentSimulator.css';

export default function AgentSimulator() {
  const [sessionId, setSessionId] = useState(`sess_${Date.now()}`);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('hinglish');
  const [isQrOpen, setIsQrOpen] = useState(false);
  const chatEndRef = useRef(null);

  const startSession = async (lang = language) => {
    setLoading(true);
    const newSessionId = `sess_${Date.now()}`;
    setSessionId(newSessionId);
    try {
      const res = await fetch(`${API_BASE}/api/agent/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: newSessionId,
          customer_name: 'Rahul Sharma',
          amount: 2499.0,
          payment_method: 'UPI',
          failure_reason: 'Bank Timeout (HDFC Switch)',
          language: lang,
        }),
      });
      const data = await res.json();
      setSessionData(data);
      setMessages(data.history || []);
    } catch (err) {
      console.error('Failed to start session:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    startSession('hinglish');
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    setInput('');
    // Optimistic customer message
    const userMsg = { sender: 'customer', text, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/agent/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: text,
        }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [...prev, data.reply]);
      }
      if (data.session) {
        setSessionData(data.session);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    startSession(lang);
  };

  return (
    <div className="agent-simulator-page animate-fade-in">
      <div className="page-header">
        <div className="agent-title-row">
          <div>
            <h2 className="page-title">Autonomous Conversational Agent</h2>
            <p className="page-subtitle">
              Live Hinglish code-switched WhatsApp recovery bot with objection handling & Promise-to-Pay extraction.
            </p>
          </div>
          <div className="agent-lang-selector">
            <button
              className={`lang-btn ${language === 'hinglish' ? 'active' : ''}`}
              onClick={() => handleLanguageChange('hinglish')}
            >
              Hinglish
            </button>
            <button
              className={`lang-btn ${language === 'english' ? 'active' : ''}`}
              onClick={() => handleLanguageChange('english')}
            >
              English
            </button>
            <button
              className={`lang-btn ${language === 'hindi' ? 'active' : ''}`}
              onClick={() => handleLanguageChange('hindi')}
            >
              हिन्दी
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => startSession(language)}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
        </div>
      </div>

      <div className="agent-layout">
        {/* Left: WhatsApp Chat Window */}
        <div className="whatsapp-card">
          <div className="whatsapp-header">
            <div className="wa-avatar">
              <Bot size={20} />
            </div>
            <div className="wa-info">
              <span className="wa-name">Razorpay Recovery AI</span>
              <span className="wa-status">
                <span className="online-dot"></span> Official Business Account • Verified
              </span>
            </div>
            <button
              className="btn btn-outline btn-xs upi-qr-trigger"
              onClick={() => setIsQrOpen(true)}
              style={{ marginLeft: 'auto', marginRight: '8px', gap: '4px', fontSize: '11px' }}
            >
              <QrCode size={12} />
              <span>Smart Intent & QR</span>
            </button>
            <span className="badge badge-success">Live Agent</span>
          </div>

          <div className="whatsapp-messages">
            {messages.map((m, i) => {
              const isAgent = m.sender === 'agent';
              return (
                <div key={i} className={`message-row ${isAgent ? 'agent' : 'customer'}`}>
                  <div className={`message-bubble ${isAgent ? 'agent-bubble' : 'customer-bubble'}`}>
                    <div className="message-sender">{isAgent ? 'Recovery AI Assistant' : 'Customer'}</div>
                    <div className="message-text" style={{ whiteSpace: 'pre-line' }}>{m.text}</div>
                    <div className="message-time">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>

                    {/* Quick Replies for Agent Messages */}
                    {isAgent && m.quick_replies && i === messages.length - 1 && (
                      <div className="quick-replies-wrap">
                        {m.quick_replies.map((qr, qi) => (
                          <button key={qi} className="quick-reply-chip" onClick={() => sendMessage(qr)}>
                            {qr}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="message-row agent">
                <div className="message-bubble agent-bubble typing-bubble">
                  <span className="loading-dots">
                    <span></span><span></span><span></span>
                  </span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="whatsapp-input-bar">
            <input
              type="text"
              placeholder="Type in Hinglish (e.g., 'Kal pay karunga', 'Discount milega?')..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button className="send-btn" onClick={() => sendMessage()} disabled={!input.trim() || loading}>
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* Right: Real-time Telemetry & Extracted Commitments */}
        <div className="agent-sidebar">
          {/* Active Context Card */}
          <div className="card context-card">
            <div className="card-header">
              <h3 className="card-title">Transaction Context</h3>
              <span className="badge badge-info">₹2,499.00</span>
            </div>
            <div className="context-list">
              <div className="context-item">
                <span className="ci-label">Customer</span>
                <span className="ci-value">{sessionData?.customer_name || 'Rahul Sharma'}</span>
              </div>
              <div className="context-item">
                <span className="ci-label">Payment Method</span>
                <span className="ci-value">UPI (Google Pay)</span>
              </div>
              <div className="context-item">
                <span className="ci-label">Initial Root Cause</span>
                <span className="ci-value danger">Bank Timeout (HDFC Switch)</span>
              </div>
              <div className="context-item">
                <span className="ci-label">Conversation Status</span>
                <span className={`badge badge-${sessionData?.status === 'recovered' ? 'success' : sessionData?.status === 'ptp_logged' ? 'warning' : 'info'}`}>
                  {sessionData?.status?.toUpperCase() || 'IN_PROGRESS'}
                </span>
              </div>
            </div>
          </div>

          {/* Promise-to-Pay (PTP) Commitment Card */}
          <div className="card ptp-card">
            <div className="card-header">
              <h3 className="card-title">
                <Calendar size={16} className="inline-icon" /> Promise-to-Pay (PTP)
              </h3>
              {sessionData?.ptp_date ? (
                <span className="badge badge-warning">PTP Logged</span>
              ) : (
                <span className="badge badge-neutral">Awaiting Promise</span>
              )}
            </div>
            {sessionData?.ptp_date ? (
              <div className="ptp-details animate-scale-in">
                <div className="ptp-date-box">
                  <span className="ptp-label">Committed Payment Date</span>
                  <span className="ptp-date">{sessionData.ptp_date}</span>
                </div>
                <div className="ptp-policy-note">
                  <Shield size={14} color="#059669" />
                  <span>TRAI Grace Period Activated: Outbound alerts paused until promise window.</span>
                </div>
              </div>
            ) : (
              <p className="ptp-empty-text">
                Ask the agent <em>"Kal subah pay karunga"</em> to watch the AI automatically parse and log the promise date.
              </p>
            )}
          </div>

          {/* Compliance & Discount Policy Bounds */}
          <div className="card policy-bounds-card">
            <div className="card-header">
              <h3 className="card-title">
                <Shield size={16} className="inline-icon" /> Autonomous Guardrails
              </h3>
            </div>
            <div className="bounds-list">
              <div className="bound-item">
                <span>Max Bounded Incentive</span>
                <strong>5.0% (Hard Cap)</strong>
              </div>
              <div className="bound-item">
                <span>Discount Applied</span>
                <strong className={sessionData?.discount_offered > 0 ? 'success-text' : ''}>
                  {sessionData?.discount_offered || 0}%
                </strong>
              </div>
              <div className="bound-item">
                <span>Anti-Spam Cooldown</span>
                <strong>30 mins enforced</strong>
              </div>
              <div className="bound-item">
                <span>Code-Switch Fluency</span>
                <strong>Native Hinglish NLP</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <QRCodeModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        upiData={sessionData?.upi_intent}
      />
    </div>
  );
}
