import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, Play, Database, Search, ShieldCheck, Zap,
  TrendingUp, BarChart2, Lock, FileText, Sun, Moon, ArrowLeft,
  CheckCircle2, Sparkles, RefreshCw, Smartphone, CreditCard, Building2
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './LandingPage.css';

const SCENARIOS = [
  {
    id: 'upi',
    title: 'UPI Switch Timeout',
    tag: '⚡ UPI 1-Tap',
    amount: '₹2,499',
    customer: 'Rahul Verma',
    merchant: 'Zylo Retail',
    agentMessage: 'Hi Rahul! Your payment of ₹2,499 for Zylo Retail timed out due to bank switch latency. Complete it in 1-tap below?',
    userMessage: 'Haan, please send the UPI link',
    cardTitle: 'Zero-Redirect UPI Payment Link',
    recoveredAmount: '₹2,499',
    successMessage: 'Payment received via UPI! Order confirmed.',
    time: '10:24 AM'
  },
  {
    id: 'cart',
    title: 'Cart Drop-off',
    tag: '🛒 5% Dynamic Offer',
    amount: '₹4,890',
    customer: 'Priya Sharma',
    merchant: 'Urban Vogue',
    agentMessage: 'Namaste Priya ji! We reserved your cart items at Urban Vogue with an instant 5% recovery discount (₹245 off).',
    userMessage: 'Great! Pay kar rahi hoon abhi.',
    cardTitle: 'Discount Applied • ₹4,645',
    recoveredAmount: '₹4,645',
    successMessage: 'Payment verified! Your order is being packed.',
    time: '02:15 PM'
  },
  {
    id: 'b2b',
    title: 'B2B Invoice Due',
    tag: '💼 PTP Sequencer',
    amount: '₹68,500',
    customer: 'Vikram Mehta (CFO)',
    merchant: 'Nexus Cloud Enterprise',
    agentMessage: 'Hi Vikram, invoice #NX-8821 for ₹68,500 is due today. Shall we schedule the Auto-Debit or send a payment link?',
    userMessage: 'Kal dopahar 2 baje schedule kar do.',
    cardTitle: 'PTP Registered: Tomorrow 2:00 PM',
    recoveredAmount: '₹68,500',
    successMessage: 'Promise-to-Pay locked. Reminder set for tomorrow.',
    time: '11:40 AM'
  }
];

const PIPELINE_NODES = [
  {
    id: 'ingest',
    num: '01',
    name: 'Ingest',
    icon: Database,
    colorClass: 'exact-node-blue',
    sub: 'Failed payments across UPI, Cards, Invoices',
    telemetry: '1,420 events/sec ingested via Razorpay Webhooks'
  },
  {
    id: 'diagnose',
    num: '02',
    name: 'Diagnose',
    icon: Search,
    colorClass: 'exact-node-purple',
    sub: 'Find the real reason for failure',
    telemetry: '11+ Root Causes diagnosed with 99.4% confidence'
  },
  {
    id: 'filter',
    num: '03',
    name: 'Filter',
    icon: ShieldCheck,
    colorClass: 'exact-node-teal',
    sub: 'Block fraud, stay compliant',
    telemetry: '100% Fraud blocked • Strict TRAI 9PM–9AM quiet hours'
  },
  {
    id: 'engage',
    num: '04',
    name: 'Engage',
    icon: Zap,
    colorClass: 'exact-node-lavender',
    sub: 'AI agents take the right action',
    telemetry: 'Thompson Sampling MAB + Hinglish WhatsApp Agent'
  },
  {
    id: 'recover',
    num: '05',
    name: 'Recover',
    icon: BarChart2,
    colorClass: 'exact-node-green',
    sub: 'Settle payments with audit trails',
    telemetry: '₹1.86 Cr settled with CFO net margin proof'
  }
];

export default function LandingPage({ onRunBatch, generating }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Active interactive states
  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [paidState, setPaidState] = useState(false);
  const [chatStep, setChatStep] = useState(4); // 1: agent, 2: user, 3: card, 4: success
  const [activePipelineIdx, setActivePipelineIdx] = useState(3); // Default 'Engage'

  const currentScenario = SCENARIOS[activeScenarioIdx];

  // Auto-switch scenario simulator animation when user clicks a pill
  const handleSelectScenario = (idx) => {
    if (idx === activeScenarioIdx && paidState) {
      // Re-trigger animation
      triggerScenarioAnimation(idx);
      return;
    }
    triggerScenarioAnimation(idx);
  };

  const triggerScenarioAnimation = (idx) => {
    setActiveScenarioIdx(idx);
    setPaidState(false);
    setChatStep(1);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setChatStep(2);
      setTimeout(() => {
        setChatStep(3);
      }, 500);
    }, 600);
  };

  const handlePayClick = (e) => {
    e.stopPropagation();
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setPaidState(true);
      setChatStep(4);
    }, 450);
  };

  const handleRunBatch = () => {
    if (onRunBatch) {
      onRunBatch();
    }
    navigate('/dashboard');
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className={`landing-exact-container ${theme}`} id="recovery-ai">
      {/* Background Interactive Ambient Glows */}
      <div className="ambient-glow glow-top-right"></div>
      <div className="ambient-glow glow-mid-left"></div>
      <div className="ambient-grid-overlay"></div>

      {/* ─── TOP NAVIGATION ────────────────────────────────────────── */}
      <nav className="exact-nav">
        {/* Brand Logo */}
        <div className="exact-logo" onClick={() => navigate('/')}>
          <div className="exact-logo-mark">
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
              <path
                d="M4 3h12a7 7 0 0 1 7 7 7 7 0 0 1-7 7H9.5v8H4V3z"
                fill="url(#exact-logo-g)"
              />
              <path
                d="M14 17l9 8h-6.5l-5.5-5.5 3-2.5z"
                fill="#93C5FD"
              />
              <defs>
                <linearGradient id="exact-logo-g" x1="4" y1="3" x2="24" y2="25" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#60A5FA" />
                  <stop stopColor="#2563EB" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="exact-brand-text">
            <span className="exact-brand-name">Recovery AI</span>
            <span className="exact-brand-tag">Recover More. Power Growth.</span>
          </div>
        </div>

        {/* Center Nav Links */}
        <div className="exact-nav-center">
          <a href="#product" className="exact-nav-link" onClick={() => navigate('/dashboard')}>Live Engine</a>
          <a href="#how-it-works" className="exact-nav-link">How it works</a>
          <a href="#mab" className="exact-nav-link" onClick={() => navigate('/mab-optimizer')}>MAB Optimizer</a>
          <a href="#b2b" className="exact-nav-link" onClick={() => navigate('/b2b')}>B2B PTP</a>
          <a href="#bank-radar" className="exact-nav-link" onClick={() => navigate('/bank-radar')}>Bank Radar</a>
        </div>

        {/* Right Actions */}
        <div className="exact-nav-right">
          <div className="exact-live-pill">
            <span className="exact-live-dot"></span>
            <span>Live Engine</span>
          </div>

          <button className="exact-theme-toggle" onClick={toggleTheme} type="button" aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          <button className="exact-dashboard-btn" onClick={handleGoToDashboard} type="button">
            <span>Go to Dashboard</span>
            <ArrowRight size={14} className="exact-arrow" />
          </button>
        </div>
      </nav>

      {/* ─── HERO SECTION ─────────────────────────────────────────── */}
      <section className="exact-hero-section">
        <div className="exact-hero-content">
          {/* Left Column */}
          <div className="exact-hero-left">
            <div className="exact-eyebrow-pill animate-fade-in">
              <span className="pill-pulse"></span>
              <span>Razorpay /buildathon 2026 • Track 03: AI Revenue Recovery</span>
            </div>

            <h1 className="exact-hero-title animate-slide-up-1">
              Turn failed payments<br />
              <span className="exact-gradient-highlight">into real revenue.</span>
            </h1>

            <p className="exact-hero-desc animate-slide-up-2">
              Autonomous AI agents that recover dropped payments across UPI, Cards
              and Invoices — compliantly, intelligently, at scale.
            </p>

            <div className="exact-cta-row animate-slide-up-3">
              <button
                className="exact-btn-batch"
                onClick={handleRunBatch}
                disabled={generating}
                type="button"
              >
                <span>{generating ? 'Processing Live Batch...' : 'Run Live Recovery Batch (300 Events)'}</span>
                <ArrowRight size={16} />
              </button>

              <button
                className="exact-btn-watch"
                onClick={() => {
                  const el = document.getElementById('how-it-works');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                type="button"
              >
                <div className="exact-play-circle">
                  <Play size={10} fill="currentColor" />
                </div>
                <span>Watch how it works</span>
              </button>
            </div>

            {/* Quick Proof Badges */}
            <div className="exact-hero-proof-bar animate-slide-up-4">
              <div className="proof-pill">
                <CheckCircle2 size={13} className="proof-icon-green" />
                <span>Zero DND Violations</span>
              </div>
              <div className="proof-pill">
                <CheckCircle2 size={13} className="proof-icon-green" />
                <span>Max 5% Capped Incentives</span>
              </div>
              <div className="proof-pill">
                <CheckCircle2 size={13} className="proof-icon-green" />
                <span>₹50,000+ HITL Gate</span>
              </div>
            </div>

            <div className="exact-kicker">
              <span className="exact-kicker-line"></span>
              <span className="exact-kicker-text">AI WORKS WHILE YOU GROW</span>
            </div>
          </div>

          {/* Right Column: Interactive WhatsApp Phone with Live Scenario Switcher */}
          <div className="exact-hero-right">
            {/* Top Right Script Tagline */}
            <div className="exact-tagline-top">
              Same<br />Customers.<br />More Revenue.
            </div>

            {/* Scenario Switcher Tabs */}
            <div className="exact-scenario-tabs">
              {SCENARIOS.map((sc, i) => (
                <button
                  key={sc.id}
                  className={`exact-sc-tab ${activeScenarioIdx === i ? 'active' : ''}`}
                  onClick={() => handleSelectScenario(i)}
                  type="button"
                >
                  <span>{sc.tag}</span>
                </button>
              ))}
            </div>

            {/* Left Arc Floating Pills */}
            <div className="exact-arc-pills">
              <div className={`exact-arc-item ${activePipelineIdx === 0 ? 'active-arc' : ''}`} onClick={() => setActivePipelineIdx(0)}>
                <span className="exact-arc-icon"><Database size={12} /></span>
                <span>Identify</span>
              </div>
              <div className={`exact-arc-item ${activePipelineIdx === 1 ? 'active-arc' : ''}`} onClick={() => setActivePipelineIdx(1)}>
                <span className="exact-arc-icon"><Search size={12} /></span>
                <span>Understand</span>
              </div>
              <div className={`exact-arc-item ${activePipelineIdx === 3 ? 'active-arc' : ''}`} onClick={() => setActivePipelineIdx(3)}>
                <span className="exact-arc-icon"><Zap size={12} /></span>
                <span>Engage</span>
              </div>
              <div className={`exact-arc-item ${activePipelineIdx === 4 ? 'active-arc' : ''}`} onClick={() => setActivePipelineIdx(4)}>
                <span className="exact-arc-icon"><TrendingUp size={12} /></span>
                <span>Recover</span>
              </div>
            </div>

            {/* Smartphone Container */}
            <div className="exact-phone-wrapper">
              <div className="exact-phone-frame">
                {/* Speaker & Sensor */}
                <div className="exact-phone-speaker"></div>

                {/* WhatsApp Chat Header */}
                <div className="exact-wa-header">
                  <div className="exact-wa-header-left">
                    <ArrowLeft size={13} className="exact-wa-back" />
                    <div className="exact-wa-avatar">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M4 4h9a5 5 0 0 1 5 5 5 5 0 0 1-5 5H8v6H4V4z" fill="#fff" />
                      </svg>
                    </div>
                    <div className="exact-wa-contact">
                      <div className="exact-wa-name-line">
                        <span className="exact-wa-title">Recovery AI</span>
                        <span className="exact-wa-check">✓</span>
                      </div>
                      <span className="exact-wa-sub">
                        {isTyping ? <span className="typing-text">typing...</span> : 'online • Razorpay Agent'}
                      </span>
                    </div>
                  </div>
                  <button className="exact-wa-replay" onClick={() => triggerScenarioAnimation(activeScenarioIdx)} title="Replay Demo">
                    <RefreshCw size={12} />
                  </button>
                </div>

                {/* WhatsApp Chat Stream */}
                <div className="exact-wa-body">
                  {/* Bubble 1: Agent */}
                  {chatStep >= 1 && (
                    <div className="exact-bubble exact-bubble-agent animate-bubble">
                      <p>{currentScenario.agentMessage}</p>
                      <span className="exact-bubble-time">{currentScenario.time}</span>
                    </div>
                  )}

                  {/* Bubble 2: User */}
                  {chatStep >= 2 && (
                    <div className="exact-bubble exact-bubble-user animate-bubble">
                      <p>{currentScenario.userMessage}</p>
                      <span className="exact-bubble-time">{currentScenario.time} <span className="exact-ticks">✓✓</span></span>
                    </div>
                  )}

                  {/* Bubble 3: Payment Card */}
                  {chatStep >= 3 && (
                    <div className="exact-bubble exact-bubble-card animate-bubble">
                      <span className="exact-card-head">{currentScenario.cardTitle}</span>
                      <div className="exact-card-price">{currentScenario.amount}</div>
                      
                      {paidState ? (
                        <div className="exact-card-paid-pill">
                          <CheckCircle2 size={14} />
                          <span>Paid via UPI AutoPay</span>
                        </div>
                      ) : (
                        <button className="exact-pay-btn pulse-action" onClick={handlePayClick} type="button">
                          <span>Pay Now</span>
                          <span className="exact-upi-badge">1-TAP UPI</span>
                        </button>
                      )}
                      
                      <span className="exact-bubble-time">{currentScenario.time}</span>
                    </div>
                  )}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="exact-typing-indicator animate-fade-in">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  )}

                  {/* Bubble 4: Success confirmation */}
                  {paidState && chatStep >= 4 && (
                    <div className="exact-bubble exact-bubble-success animate-bubble-pop">
                      <div className="success-header">
                        <CheckCircle2 size={14} className="success-icon" />
                        <strong>{currentScenario.successMessage}</strong>
                      </div>
                      <span className="exact-bubble-time">Just now</span>
                    </div>
                  )}
                </div>

                {/* WhatsApp Input Bar */}
                <div className="exact-wa-input-bar">
                  <div className="exact-input-mock">
                    <span className="exact-input-placeholder">
                      {paidState ? 'Payment settled in audit log...' : 'Type message to agent...'}
                    </span>
                  </div>
                  <div className="exact-input-icons">
                    <span className="exact-icon-paperclip">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                      </svg>
                    </span>
                    <span className="exact-icon-camera">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                    </span>
                    <div className="exact-mic-circle">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Floating Glass Card */}
            <div className={`exact-recovered-glass-card ${paidState ? 'celebrate' : ''}`}>
              <div className="exact-recovered-check">
                <ShieldCheck size={16} />
              </div>
              <div className="exact-recovered-text">
                <span className="exact-rc-sub">{paidState ? 'Recovered & Verified' : 'Live At-Risk'}</span>
                <span className="exact-rc-amount">{currentScenario.recoveredAmount}</span>
                <span className="exact-rc-desc">{paidState ? 'Settled in Batch' : 'Ready to Recover'}</span>
              </div>
            </div>

            {/* Bottom Right Monospace Note */}
            <div className="exact-footer-note">
              FEWER FAILED PAYMENTS.<br />
              A STRONGER INDIA.
            </div>
          </div>
        </div>
      </section>

      {/* ─── METRICS STRIP ────────────────────────────────────────── */}
      <section className="exact-metrics-section">
        <div className="exact-metrics-bar">
          {/* Metric 1 */}
          <div className="exact-metric-item" onClick={() => navigate('/dashboard')}>
            <div className="exact-m-icon exact-m-blue">
              <BarChart2 size={18} />
            </div>
            <div className="exact-m-details">
              <div className="exact-m-val-row">
                <span className="exact-m-number">₹12.4 Cr</span>
              </div>
              <span className="exact-m-label">Total At-Risk Analyzed</span>
              <span className="exact-m-trend exact-trend-green">↑ +18% MoM</span>
            </div>
          </div>

          <div className="exact-m-divider"></div>

          {/* Metric 2 */}
          <div className="exact-metric-item" onClick={() => navigate('/dashboard')}>
            <div className="exact-m-icon exact-m-purple">
              <Lock size={18} />
            </div>
            <div className="exact-m-details">
              <div className="exact-m-val-row">
                <span className="exact-m-number">₹1.86 Cr</span>
              </div>
              <span className="exact-m-label">Net Money Recovered</span>
              <span className="exact-m-trend exact-trend-green">↑ +23% Net Lift</span>
            </div>
          </div>

          <div className="exact-m-divider"></div>

          {/* Metric 3 */}
          <div className="exact-metric-item" onClick={() => navigate('/policies')}>
            <div className="exact-m-icon exact-m-teal">
              <ShieldCheck size={18} />
            </div>
            <div className="exact-m-details">
              <div className="exact-m-val-row">
                <span className="exact-m-number">99.7%</span>
              </div>
              <span className="exact-m-label">Compliance Score</span>
              <span className="exact-m-trend exact-trend-green">TRAI / DND Enforced</span>
            </div>
          </div>

          <div className="exact-m-divider"></div>

          {/* Metric 4 */}
          <div className="exact-metric-item" onClick={() => navigate('/audit')}>
            <div className="exact-m-icon exact-m-slate">
              <FileText size={18} />
            </div>
            <div className="exact-m-details">
              <div className="exact-m-val-row">
                <span className="exact-m-number">0</span>
              </div>
              <span className="exact-m-label">DND Violations</span>
              <span className="exact-m-trend exact-trend-gray">Zero till date</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS (LOWER SECTION) ─────────────────────────── */}
      <section className="exact-hiw-section" id="how-it-works">
        <div className="exact-hiw-content">
          {/* Left Side */}
          <div className="exact-hiw-left">
            <span className="exact-hiw-eyebrow">HOW IT WORKS</span>
            <h2 className="exact-hiw-title">
              From failure<br />
              to recovery — <strong>autonomously.</strong>
            </h2>
            <p className="exact-hiw-desc">
              A closed-loop, multi-layer intelligence pipeline that diagnoses root causes, enforces hard-coded guardrails, and executes zero-redirect recoveries.
            </p>
            <div className="hiw-telemetry-badge">
              <span className="pulse-dot"></span>
              <span>{PIPELINE_NODES[activePipelineIdx].telemetry}</span>
            </div>
            <button className="exact-btn-flow" onClick={() => navigate('/policies')} type="button">
              <span>Inspect All 6 Intervention Policies</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Right Side 5 Interactive Circular Nodes with Pulse Flow */}
          <div className="exact-hiw-right">
            {PIPELINE_NODES.map((node, index) => {
              const IconComp = node.icon;
              const isActive = activePipelineIdx === index;

              return (
                <React.Fragment key={node.id}>
                  <div
                    className={`exact-node-box ${isActive ? 'active-node' : ''}`}
                    onClick={() => setActivePipelineIdx(index)}
                  >
                    <div className={`exact-node-circle ${node.colorClass}`}>
                      <IconComp size={20} />
                      <span className="node-step-tag">{node.num}</span>
                    </div>
                    <h4 className="exact-node-name">{node.name}</h4>
                    <p className="exact-node-sub">{node.sub}</p>
                  </div>

                  {index < PIPELINE_NODES.length - 1 && (
                    <div className="exact-node-connector">
                      <span className="connector-line"></span>
                      <span className="connector-pulse"></span>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </section>

      {/* Semantic anchors for in-page link navigation */}
      <div id="product" aria-hidden="true"></div>
      <div id="use-cases" aria-hidden="true"></div>
      <div id="pricing" aria-hidden="true"></div>
      <div id="docs" aria-hidden="true"></div>
    </div>
  );
}
