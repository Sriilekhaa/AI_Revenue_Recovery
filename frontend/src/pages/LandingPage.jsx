import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, Play, Database, Search, ShieldCheck, Zap,
  TrendingUp, BarChart2, Lock, FileText, Sun, Moon, ArrowLeft,
  CheckCircle2, RefreshCw, CreditCard, Building2, Sparkles,
  Activity, Clock, Check, ChevronRight, Pause
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './LandingPage.css';

const SCENARIOS = [
  {
    id: 'upi',
    title: 'UPI Switch Timeout',
    tag: 'UPI Timeout',
    icon: Zap,
    amount: '₹2,499',
    customer: 'Rahul Verma',
    merchant: 'Zylo Retail',
    agentMessage: 'Hi Rahul, your payment of ₹2,499 for Zylo Retail timed out due to bank switch latency. Complete it in 1-tap below:',
    userMessage: 'Haan, please send the UPI link',
    cardTitle: '1-Tap UPI Payment Link',
    recoveredAmount: '₹2,499',
    successMessage: 'Payment received via UPI. Order confirmed.',
    time: '10:24 AM',
    badge: 'Switch Latency Detected',
    recoveryType: 'Zero-Redirect UPI'
  },
  {
    id: 'cart',
    title: 'Cart Drop-off',
    tag: 'Cart Drop-off',
    icon: CreditCard,
    amount: '₹4,890',
    customer: 'Priya Sharma',
    merchant: 'Urban Vogue',
    agentMessage: 'Namaste Priya ji, we reserved your items at Urban Vogue with an instant 5% recovery discount (₹245 off).',
    userMessage: 'Great, paying now.',
    cardTitle: '5% Recovery Discount Applied • ₹4,645',
    recoveredAmount: '₹4,645',
    successMessage: 'Payment verified. Order is being packed.',
    time: '02:15 PM',
    badge: 'MAB Thompson Sampling Selected',
    recoveryType: '5% Dynamic Incentive'
  },
  {
    id: 'b2b',
    title: 'B2B Invoice Due',
    tag: 'B2B Invoice',
    icon: Building2,
    amount: '₹68,500',
    customer: 'Vikram Mehta (CFO)',
    merchant: 'Nexus Cloud Enterprise',
    agentMessage: 'Hi Vikram, invoice #NX-8821 for ₹68,500 is due today. Shall we schedule the auto-debit or send a payment link?',
    userMessage: 'Schedule for tomorrow at 2:00 PM.',
    cardTitle: 'PTP Registered: Tomorrow 2:00 PM',
    recoveredAmount: '₹68,500',
    successMessage: 'Promise-to-Pay locked. Reminder scheduled.',
    time: '11:40 AM',
    badge: 'HITL Safeguard Verified',
    recoveryType: 'Auto-Debit Lock'
  }
];

const LIVE_TICKER_EVENTS = [
  { id: 1, text: 'UPI Switch Latency bypassed for Rahul V. — ₹2,499 settled (HDFC)', time: '2s ago', type: 'upi' },
  { id: 2, text: 'Thompson MAB selected WhatsApp Hinglish for Priya S. — ₹4,645 recovered', time: '8s ago', type: 'cart' },
  { id: 3, text: 'B2B Invoice #NX-8821 Promise-to-Pay locked for Vikram M. — ₹68,500', time: '14s ago', type: 'b2b' },
  { id: 4, text: 'Zero DND violations enforced across 1,420 events — TRAI 100% compliant', time: '22s ago', type: 'guard' },
  { id: 5, text: 'Razorpay Test Mode Link verified with zero-redirect webhooks', time: '35s ago', type: 'webhook' }
];

const PIPELINE_STEPS = [
  {
    id: 1,
    title: 'Ingest',
    subtitle: 'Failed payments across UPI, Cards, Invoices',
    icon: Database,
    colorClass: 'exact-node-blue',
    stat: '300 events / batch',
    latency: '< 15ms'
  },
  {
    id: 2,
    title: 'Diagnose',
    subtitle: 'Find the real root cause of failure',
    icon: Search,
    colorClass: 'exact-node-purple',
    stat: '12 failure modes',
    latency: '28ms'
  },
  {
    id: 3,
    title: 'Filter',
    subtitle: 'Block fraud, enforce TRAI & HITL gates',
    icon: ShieldCheck,
    colorClass: 'exact-node-teal',
    stat: '99.7% compliance',
    latency: '0 violations'
  },
  {
    id: 4,
    title: 'Engage',
    subtitle: 'MAB agents execute optimal channel & copy',
    icon: Zap,
    colorClass: 'exact-node-lavender',
    stat: '+14.2% lift',
    latency: 'Hinglish NLP'
  },
  {
    id: 5,
    title: 'Recover',
    subtitle: 'Settle payments with immutable audit trails',
    icon: BarChart2,
    colorClass: 'exact-node-green',
    stat: '₹1.86 Cr recovered',
    latency: '1-tap UPI'
  }
];

export default function LandingPage({ onRunBatch, generating }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [paidState, setPaidState] = useState(false);
  const [chatStep, setChatStep] = useState(3);
  const [autoPlay, setAutoPlay] = useState(true);
  const [tickerIdx, setTickerIdx] = useState(0);
  const [activePipelineStep, setActivePipelineStep] = useState(0);
  const [celebrating, setCelebrating] = useState(false);

  const autoTimerRef = useRef(null);
  const currentScenario = SCENARIOS[activeScenarioIdx];

  // 1. Live Recovery Ticker Interval
  useEffect(() => {
    const tickerTimer = setInterval(() => {
      setTickerIdx((prev) => (prev + 1) % LIVE_TICKER_EVENTS.length);
    }, 4000);
    return () => clearInterval(tickerTimer);
  }, []);

  // 2. Continuous How-it-Works pipeline flow animation
  useEffect(() => {
    const pipeTimer = setInterval(() => {
      setActivePipelineStep((prev) => (prev + 1) % PIPELINE_STEPS.length);
    }, 2200);
    return () => clearInterval(pipeTimer);
  }, []);

  // 3. Automated Scenario Auto-Play Simulation
  useEffect(() => {
    if (!autoPlay) return;

    const runScenarioCycle = () => {
      // Step 1: Scenario start
      setPaidState(false);
      setCelebrating(false);
      setChatStep(1);
      setIsTyping(true);

      const t1 = setTimeout(() => {
        setIsTyping(false);
        setChatStep(2);

        const t2 = setTimeout(() => {
          setChatStep(3);

          const t3 = setTimeout(() => {
            // Simulate 1-tap auto pay
            setPaidState(true);
            setCelebrating(true);
            setChatStep(4);

            const t4 = setTimeout(() => {
              // Move to next scenario after showing success
              setActiveScenarioIdx((prev) => (prev + 1) % SCENARIOS.length);
            }, 3000);

            return () => clearTimeout(t4);
          }, 2000);

          return () => clearTimeout(t3);
        }, 800);

        return () => clearTimeout(t2);
      }, 700);

      return () => clearTimeout(t1);
    };

    const cleanup = runScenarioCycle();
    return () => {
      if (cleanup) cleanup();
    };
  }, [activeScenarioIdx, autoPlay]);

  const handleSelectScenario = (idx) => {
    setAutoPlay(false); // Switch to manual control when clicked
    setActiveScenarioIdx(idx);
    setPaidState(false);
    setCelebrating(false);
    setChatStep(1);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setChatStep(2);
      setTimeout(() => {
        setChatStep(3);
      }, 400);
    }, 500);
  };

  const handlePayClick = (e) => {
    e.stopPropagation();
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setPaidState(true);
      setCelebrating(true);
      setChatStep(4);
    }, 450);
  };

  const handleReplay = (e) => {
    e.stopPropagation();
    handleSelectScenario(activeScenarioIdx);
  };

  const handleRunBatch = () => {
    if (onRunBatch) {
      onRunBatch();
    }
    navigate('/dashboard');
  };

  return (
    <div className={`clean-landing ${theme}`} id="recovery-ai">
      {/* Background Animated Floating Ambient Mesh & Glows */}
      <div className="landing-ambient-glow glow-1 animate-glow-drift"></div>
      <div className="landing-ambient-glow glow-2 animate-glow-drift-rev"></div>
      <div className="landing-grid-overlay"></div>

      {/* ─── NAVIGATION ────────────────────────────────────────────── */}
      <header className="clean-nav">
        <div className="clean-nav-inner">
          <div className="clean-logo" onClick={() => navigate('/')}>
            <div className="clean-logo-badge pulse-logo">
              <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
                <path d="M4 3h12a7 7 0 0 1 7 7 7 7 0 0 1-7 7H9.5v8H4V3z" fill="url(#logo-grad)" />
                <path d="M14 17l9 8h-6.5l-5.5-5.5 3-2.5z" fill="#93C5FD" />
                <defs>
                  <linearGradient id="logo-grad" x1="4" y1="3" x2="24" y2="25" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#3B82F6" />
                    <stop stopColor="#1D4ED8" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="clean-logo-text">
              <span className="brand-title">Recovery AI</span>
            </div>
          </div>

          <div className="clean-nav-center-pill">
            <button className="landing-nav-link" onClick={() => navigate('/dashboard')} type="button">Dashboard</button>
            <button className="landing-nav-link" onClick={() => navigate('/mab-optimizer')} type="button">MAB Optimizer</button>
            <button className="landing-nav-link" onClick={() => navigate('/b2b')} type="button">B2B Receivables</button>
            <button className="landing-nav-link" onClick={() => navigate('/bank-radar')} type="button">Bank Health Radar</button>
            <button className="landing-nav-link" onClick={() => navigate('/audit')} type="button">Audit Logs</button>
          </div>

          <div className="clean-nav-actions">
            <div className="status-indicator">
              <span className="status-dot animate-ping-subtle"></span>
              <span className="status-label">Live Engine</span>
            </div>

            <button className="theme-btn" onClick={toggleTheme} type="button" aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <button className="btn-dash-primary shimmer-btn" onClick={() => navigate('/dashboard')} type="button">
              <span>Launch Dashboard</span>
              <ArrowRight size={14} className="arrow-hover" />
            </button>
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION ──────────────────────────────────────────── */}
      <section className="clean-hero">
        {/* Live Event Stream Ticker Pill */}
        <div className="hero-top-ticker animate-fade-down">
          <div className="ticker-badge">
            <Activity size={12} className="ticker-pulse-icon" />
            <span>LIVE TELEMETRY</span>
          </div>
          <div className="ticker-content" key={LIVE_TICKER_EVENTS[tickerIdx].id}>
            <span className="ticker-text">{LIVE_TICKER_EVENTS[tickerIdx].text}</span>
            <span className="ticker-time">{LIVE_TICKER_EVENTS[tickerIdx].time}</span>
          </div>
        </div>

        <div className="clean-hero-grid">
          {/* Left Column: Value Proposition */}
          <div className="hero-left">
            <h1 className="hero-heading animate-fade-up-1">
              Turn failed payments<br />
              <span className="heading-accent animated-gradient-text">into recovered revenue.</span>
            </h1>

            <p className="hero-subtext animate-fade-up-2">
              An autonomous revenue operating system for Indian commerce. Diagnoses drop-offs across UPI, Cards, and Invoices, enforces strict TRAI compliance, and recovers lost transactions with zero-redirect payments.
            </p>

            <div className="hero-cta-group animate-fade-up-3">
              <button
                className="btn-batch-cta pulse-cta shimmer-btn"
                onClick={handleRunBatch}
                disabled={generating}
                type="button"
              >
                <span>{generating ? 'Processing Live Batch...' : 'Run Live Recovery Batch (300 Events)'}</span>
                <ArrowRight size={16} className="btn-icon-slide" />
              </button>

              <button
                className="btn-secondary-cta hover-elevate"
                onClick={() => {
                  const el = document.getElementById('how-it-works');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                type="button"
              >
                <Play size={13} fill="currentColor" className="play-icon-pulse" />
                <span>How it works</span>
              </button>
            </div>

            {/* Clean Value Metric Callouts */}
            <div className="hero-metrics-pill-row animate-fade-up-4">
              <div className="metric-pill">
                <span className="mp-num highlight-stat">+14.2%</span>
                <span className="mp-label">MAB Recovery Lift</span>
              </div>
              <div className="metric-pill-divider"></div>
              <div className="metric-pill">
                <span className="mp-num">0</span>
                <span className="mp-label">DND Violations</span>
              </div>
              <div className="metric-pill-divider"></div>
              <div className="metric-pill">
                <span className="mp-num">₹50k+</span>
                <span className="mp-label">HITL Safety Gate</span>
              </div>
            </div>
          </div>

          {/* Right Column: Clean WhatsApp Interactive Emulator */}
          <div className="hero-right animate-float-device">
            {/* Top Control Bar: Scenarios & Auto-Play Toggle */}
            <div className="emulator-controls-bar">
              <div className="scenario-segmented-control">
                {SCENARIOS.map((sc, i) => {
                  const Icon = sc.icon;
                  return (
                    <button
                      key={sc.id}
                      className={`seg-btn ${activeScenarioIdx === i ? 'active' : ''}`}
                      onClick={() => handleSelectScenario(i)}
                      type="button"
                    >
                      <Icon size={12} className={activeScenarioIdx === i ? 'icon-spin-subtle' : ''} />
                      <span>{sc.tag}</span>
                    </button>
                  );
                })}
              </div>

              <button
                className={`auto-toggle-btn ${autoPlay ? 'auto-active' : ''}`}
                onClick={() => setAutoPlay(!autoPlay)}
                title={autoPlay ? 'Pause Auto-Simulation' : 'Play Auto-Simulation'}
                type="button"
              >
                {autoPlay ? <Pause size={11} /> : <Play size={11} />}
                <span>{autoPlay ? 'Auto-Demo ON' : 'Auto-Demo OFF'}</span>
                {autoPlay && <span className="auto-pulse-dot"></span>}
              </button>
            </div>

            {/* Phone Emulator Container */}
            <div className="phone-card-container">
              <div className={`phone-device ${celebrating ? 'celebrate-glow' : ''}`}>
                <div className="phone-notch"></div>

                {/* WhatsApp Chat Header */}
                <div className="phone-header">
                  <div className="phone-header-left">
                    <ArrowLeft size={13} className="back-arrow" />
                    <div className="contact-avatar">
                      <Zap size={13} color="#ffffff" className="avatar-zap" />
                    </div>
                    <div className="contact-info">
                      <div className="contact-title">
                        <span>Recovery AI</span>
                        <span className="verified-check">✓</span>
                      </div>
                      <span className="contact-status">
                        {isTyping ? (
                          <span className="typing-status">
                            typing<span className="typing-dots-text">...</span>
                          </span>
                        ) : (
                          'Razorpay Verified Agent'
                        )}
                      </span>
                    </div>
                  </div>
                  <button
                    className="replay-btn"
                    onClick={handleReplay}
                    title="Replay Scenario"
                    type="button"
                  >
                    <RefreshCw size={12} className="replay-icon" />
                  </button>
                </div>

                {/* WhatsApp Message Thread */}
                <div className="phone-body">
                  {/* Real-time Scenario Banner */}
                  <div className="scenario-context-pill animate-fade-in">
                    <span>{currentScenario.badge}</span>
                  </div>

                  {chatStep >= 1 && (
                    <div className="chat-bubble bubble-agent animate-bubble-in">
                      <p>{currentScenario.agentMessage}</p>
                      <span className="bubble-time">{currentScenario.time}</span>
                    </div>
                  )}

                  {chatStep >= 2 && (
                    <div className="chat-bubble bubble-user animate-bubble-in">
                      <p>{currentScenario.userMessage}</p>
                      <span className="bubble-time">{currentScenario.time} <span className="blue-ticks">✓✓</span></span>
                    </div>
                  )}

                  {chatStep >= 3 && (
                    <div className={`chat-bubble bubble-payment-card animate-card-appear ${paidState ? 'card-settled' : ''}`}>
                      <div className="card-label-row">
                        <span className="card-label">{currentScenario.cardTitle}</span>
                        <span className="card-secure-tag">
                          <Lock size={10} /> Razorpay Secure
                        </span>
                      </div>
                      <div className="card-amount">{currentScenario.amount}</div>

                      {paidState ? (
                        <div className="paid-status-box animate-pop-in">
                          <CheckCircle2 size={15} className="paid-check-icon animate-spin-once" />
                          <div>
                            <div className="paid-main-text">Payment Verified via UPI</div>
                            <div className="paid-sub-text">Instant webhook ack (0-redirect)</div>
                          </div>
                        </div>
                      ) : (
                        <button className="pay-now-action-btn pulse-action shimmer-btn" onClick={handlePayClick} type="button">
                          <span className="pay-label-group">
                            <Zap size={12} fill="#ffffff" />
                            <span>Pay Now</span>
                          </span>
                          <span className="pay-tag">{currentScenario.recoveryType}</span>
                        </button>
                      )}

                      <span className="bubble-time">{currentScenario.time}</span>
                    </div>
                  )}

                  {isTyping && (
                    <div className="typing-dots animate-fade-in">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  )}

                  {paidState && chatStep >= 4 && (
                    <div className="chat-bubble bubble-success animate-pop-in">
                      <div className="success-row">
                        <CheckCircle2 size={14} className="success-check animate-bounce-subtle" />
                        <span>{currentScenario.successMessage}</span>
                      </div>
                      <span className="bubble-time">Just now</span>
                    </div>
                  )}
                </div>

                {/* Input Bar */}
                <div className="phone-footer">
                  <div className="mock-input">
                    <span>{paidState ? 'Recovery recorded in immutable audit log...' : 'Message Recovery AI...'}</span>
                  </div>
                  <div className={`mock-send-circle ${paidState ? 'mock-send-green' : ''}`}>
                    {paidState ? <Check size={12} color="#ffffff" /> : <ArrowRight size={12} color="#ffffff" />}
                  </div>
                </div>
              </div>

              {/* Floating Verified Pill with Fluid Animation */}
              <div className={`floating-verified-pill animate-float-pill ${paidState ? 'pill-success' : ''}`}>
                <div className={`fvp-icon ${paidState ? 'fvp-icon-green' : ''}`}>
                  <ShieldCheck size={16} />
                </div>
                <div className="fvp-text">
                  <span className="fvp-label">{paidState ? 'Revenue Recovered' : 'At-Risk Amount'}</span>
                  <span className="fvp-val">{currentScenario.recoveredAmount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4-METRICS STRIP ───────────────────────────────────────── */}
      <section className="clean-metrics-section">
        <div className="clean-metrics-bar">
          <div className="metric-box hover-card-lift" onClick={() => navigate('/dashboard')}>
            <div className="metric-icon-wrap icon-blue">
              <BarChart2 size={18} />
            </div>
            <div className="metric-content">
              <span className="metric-num">₹12.4 Cr</span>
              <span className="metric-title">Total At-Risk Analyzed</span>
              <span className="metric-trend trend-green">
                <span className="trend-arrow">↑</span> +18% MoM
              </span>
            </div>
          </div>

          <div className="metric-sep"></div>

          <div className="metric-box hover-card-lift" onClick={() => navigate('/dashboard')}>
            <div className="metric-icon-wrap icon-purple">
              <Lock size={18} />
            </div>
            <div className="metric-content">
              <span className="metric-num">₹1.86 Cr</span>
              <span className="metric-title">Net Money Recovered</span>
              <span className="metric-trend trend-green">
                <span className="trend-arrow">↑</span> +23% Net Lift
              </span>
            </div>
          </div>

          <div className="metric-sep"></div>

          <div className="metric-box hover-card-lift" onClick={() => navigate('/policies')}>
            <div className="metric-icon-wrap icon-teal">
              <ShieldCheck size={18} />
            </div>
            <div className="metric-content">
              <span className="metric-num">99.7%</span>
              <span className="metric-title">Compliance Score</span>
              <span className="metric-trend trend-neutral">
                <span className="live-dot-mini"></span> TRAI DND Enforced
              </span>
            </div>
          </div>

          <div className="metric-sep"></div>

          <div className="metric-box hover-card-lift" onClick={() => navigate('/audit')}>
            <div className="metric-icon-wrap icon-slate">
              <FileText size={18} />
            </div>
            <div className="metric-content">
              <span className="metric-num">0</span>
              <span className="metric-title">DND Violations</span>
              <span className="metric-trend trend-neutral">Zero to date</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS (LOWER SECTION) ─────────────────────────── */}
      <section className="exact-hiw-section" id="how-it-works">
        <div className="exact-hiw-content">
          {/* Left Side */}
          <div className="exact-hiw-left">
            <div className="hiw-eyebrow-pill">
              <Sparkles size={11} className="eyebrow-sparkle" />
              <span>HOW IT WORKS</span>
            </div>
            <h2 className="exact-hiw-title">
              From failure<br />
              to recovery — <strong className="animated-gradient-text">autonomously.</strong>
            </h2>
            <p className="exact-hiw-desc">
              An intelligent 5-stage pipeline that works silently in the background, making recovery seamless and compliant at scale.
            </p>
            <button className="exact-btn-flow shimmer-btn" onClick={() => navigate('/policies')} type="button">
              <span>See the full flow</span>
              <ArrowRight size={14} className="arrow-hover" />
            </button>
          </div>

          {/* Right Side 5 Circular Nodes with Continuous Traveling Beam Pulse */}
          <div className="exact-hiw-right">
            {PIPELINE_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = activePipelineStep === idx;
              return (
                <React.Fragment key={step.id}>
                  <div
                    className={`exact-node-box ${isActive ? 'node-active' : ''}`}
                    onClick={() => setActivePipelineStep(idx)}
                  >
                    <div className={`exact-node-circle ${step.colorClass} ${isActive ? 'circle-active-glow' : ''}`}>
                      <Icon size={20} className={isActive ? 'icon-step-active' : ''} />
                      {isActive && <div className="active-ring-wave"></div>}
                    </div>
                    <div className="exact-node-header">
                      <span className="node-step-index">0{step.id}</span>
                      <h4 className="exact-node-name">{step.title}</h4>
                    </div>
                    <p className="exact-node-sub">{step.subtitle}</p>
                    <div className="node-meta-tag">
                      <span>{step.stat}</span>
                    </div>
                  </div>

                  {idx < PIPELINE_STEPS.length - 1 && (
                    <div className={`exact-node-connector ${activePipelineStep === idx ? 'connector-active' : ''}`}>
                      <span className="connector-line"></span>
                      <span className="connector-beam"></span>
                      <span className="connector-photon"></span>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

