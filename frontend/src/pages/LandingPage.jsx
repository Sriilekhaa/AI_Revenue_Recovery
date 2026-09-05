import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, Play, Database, Search, ShieldCheck, Zap,
  TrendingUp, BarChart2, Lock, FileText, Sun, Moon, ArrowLeft
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './LandingPage.css';

export default function LandingPage({ onRunBatch, generating }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

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
          <a href="#product" className="exact-nav-link">Product</a>
          <a href="#how-it-works" className="exact-nav-link">How it works</a>
          <a href="#use-cases" className="exact-nav-link">Use cases</a>
          <a href="#pricing" className="exact-nav-link">Pricing</a>
          <a href="#docs" className="exact-nav-link">Docs</a>
        </div>

        {/* Right Actions */}
        <div className="exact-nav-right">
          <div className="exact-live-pill">
            <span className="exact-live-dot"></span>
            <span>Live</span>
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
            <div className="exact-eyebrow-pill">
              <span>Built for Razorpay /buildathon 2026</span>
            </div>

            <h1 className="exact-hero-title">
              Turn failed payments<br />
              <span className="exact-gradient-highlight">into real revenue.</span>
            </h1>

            <p className="exact-hero-desc">
              Autonomous AI agents that recover dropped payments across UPI, Cards
              and Invoices — compliantly, intelligently, at scale.
            </p>

            <div className="exact-cta-row">
              <button
                className="exact-btn-batch"
                onClick={handleRunBatch}
                disabled={generating}
                type="button"
              >
                <span>{generating ? 'Running Batch...' : 'Run Live Recovery Batch (300 Events)'}</span>
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

            <div className="exact-kicker">
              <span className="exact-kicker-line"></span>
              <span className="exact-kicker-text">AI WORKS WHILE YOU GROW</span>
            </div>
          </div>

          {/* Right Column: Exact 3D Visual & Interactive WhatsApp Phone */}
          <div className="exact-hero-right">
            {/* Top Right Script Tagline */}
            <div className="exact-tagline-top">
              Same<br />Customers.<br />More Revenue.
            </div>

            {/* Left Arc Floating Pills */}
            <div className="exact-arc-pills">
              <div className="exact-arc-item">
                <span className="exact-arc-icon"><Database size={12} /></span>
                <span>Identify</span>
              </div>
              <div className="exact-arc-item">
                <span className="exact-arc-icon"><Search size={12} /></span>
                <span>Understand</span>
              </div>
              <div className="exact-arc-item active-arc">
                <span className="exact-arc-icon"><Zap size={12} /></span>
                <span>Engage</span>
              </div>
              <div className="exact-arc-item">
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
                      <span className="exact-wa-sub">online</span>
                    </div>
                  </div>
                  <Search size={13} className="exact-wa-search" />
                </div>

                {/* WhatsApp Chat Stream */}
                <div className="exact-wa-body">
                  {/* Bubble 1 */}
                  <div className="exact-bubble exact-bubble-agent">
                    <p>Hi! Your payment of ₹2,499 to Zylo Retail is pending. Would you like to complete it now?</p>
                    <span className="exact-bubble-time">10:24 AM</span>
                  </div>

                  {/* Bubble 2 */}
                  <div className="exact-bubble exact-bubble-user">
                    <p>Haan, bhejo UPI link</p>
                    <span className="exact-bubble-time">10:24 AM <span className="exact-ticks">✓✓</span></span>
                  </div>

                  {/* Bubble 3: Payment Card */}
                  <div className="exact-bubble exact-bubble-card">
                    <span className="exact-card-head">Here's your secure payment link</span>
                    <div className="exact-card-price">₹2,499</div>
                    <button className="exact-pay-btn" onClick={handleGoToDashboard} type="button">
                      <span>Pay Now</span>
                      <span className="exact-upi-badge">UPI</span>
                    </button>
                    <span className="exact-bubble-time">10:24 AM</span>
                  </div>

                  {/* Bubble 4 */}
                  <div className="exact-bubble exact-bubble-success">
                    <p>Payment successful! Thanks for completing this.</p>
                    <span className="exact-bubble-time">10:25 AM</span>
                  </div>
                </div>

                {/* WhatsApp Input Bar */}
                <div className="exact-wa-input-bar">
                  <div className="exact-input-mock">
                    <span className="exact-input-placeholder">Message...</span>
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
            <div className="exact-recovered-glass-card">
              <div className="exact-recovered-check">
                <ShieldCheck size={16} />
              </div>
              <div className="exact-recovered-text">
                <span className="exact-rc-sub">Recovered</span>
                <span className="exact-rc-amount">₹2,499</span>
                <span className="exact-rc-desc">Payment Successful</span>
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
          <div className="exact-metric-item">
            <div className="exact-m-icon exact-m-blue">
              <BarChart2 size={18} />
            </div>
            <div className="exact-m-details">
              <div className="exact-m-val-row">
                <span className="exact-m-number">₹12.4 Cr</span>
              </div>
              <span className="exact-m-label">Total At-Risk Analyzed</span>
              <span className="exact-m-trend exact-trend-green">↑ +18%</span>
            </div>
          </div>

          <div className="exact-m-divider"></div>

          {/* Metric 2 */}
          <div className="exact-metric-item">
            <div className="exact-m-icon exact-m-purple">
              <Lock size={18} />
            </div>
            <div className="exact-m-details">
              <div className="exact-m-val-row">
                <span className="exact-m-number">₹1.86 Cr</span>
              </div>
              <span className="exact-m-label">Net Money Recovered</span>
              <span className="exact-m-trend exact-trend-green">↑ +23%</span>
            </div>
          </div>

          <div className="exact-m-divider"></div>

          {/* Metric 3 */}
          <div className="exact-metric-item">
            <div className="exact-m-icon exact-m-teal">
              <ShieldCheck size={18} />
            </div>
            <div className="exact-m-details">
              <div className="exact-m-val-row">
                <span className="exact-m-number">99.7%</span>
              </div>
              <span className="exact-m-label">Compliance Score</span>
              <span className="exact-m-trend exact-trend-green">↑ +0.3%</span>
            </div>
          </div>

          <div className="exact-m-divider"></div>

          {/* Metric 4 */}
          <div className="exact-metric-item">
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
              A simple, powerful flow that works in the background, so you can focus on what's next.
            </p>
            <button className="exact-btn-flow" onClick={() => navigate('/policies')} type="button">
              <span>See the full flow</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Right Side 5 Circular Nodes */}
          <div className="exact-hiw-right">
            {/* 01 Ingest */}
            <div className="exact-node-box">
              <div className="exact-node-circle exact-node-blue">
                <Database size={20} />
              </div>
              <h4 className="exact-node-name">Ingest</h4>
              <p className="exact-node-sub">Failed payments across UPI, Cards, Invoices</p>
            </div>

            <span className="exact-node-arrow">→</span>

            {/* 02 Diagnose */}
            <div className="exact-node-box">
              <div className="exact-node-circle exact-node-purple">
                <Search size={20} />
              </div>
              <h4 className="exact-node-name">Diagnose</h4>
              <p className="exact-node-sub">Find the real reason for failure</p>
            </div>

            <span className="exact-node-arrow">→</span>

            {/* 03 Filter */}
            <div className="exact-node-box">
              <div className="exact-node-circle exact-node-teal">
                <ShieldCheck size={20} />
              </div>
              <h4 className="exact-node-name">Filter</h4>
              <p className="exact-node-sub">Block fraud, stay compliant</p>
            </div>

            <span className="exact-node-arrow">→</span>

            {/* 04 Engage */}
            <div className="exact-node-box">
              <div className="exact-node-circle exact-node-lavender">
                <Zap size={20} />
              </div>
              <h4 className="exact-node-name">Engage</h4>
              <p className="exact-node-sub">AI agents take the right action</p>
            </div>

            <span className="exact-node-arrow">→</span>

            {/* 05 Recover */}
            <div className="exact-node-box">
              <div className="exact-node-circle exact-node-green">
                <BarChart2 size={20} />
              </div>
              <h4 className="exact-node-name">Recover</h4>
              <p className="exact-node-sub">Settle payments with audit trails</p>
            </div>
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
