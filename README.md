# 🚀 Recovery AI — Razorpay /buildathon 2026 (Track 03: AI Revenue Recovery)

> *"Don't just identify the problem. Show measured money recovered across a batch, with compliant escalation, stopping rules, and an audit trail."*

---

## 📌 Executive Summary

**Recovery AI** is an autonomous revenue recovery engine built for Indian digital commerce. It connects detection, diagnosis, decisioning, and execution across the three primary revenue degradation vectors:
1. **Payment Failure Recovery**: Card declines, UPI timeouts, bank timeouts, 3DS drop-offs, gateway errors.
2. **Checkout Abandonment Recovery**: Abandoned carts nudged with bounded incentives via WhatsApp/SMS.
3. **Failed Subscription / e-Mandate Recovery**: UPI AutoPay and eNACH mandate failures handled with smart retries and mandate re-registration links.

---

## 🏛 5-Layer Architecture

```
┌────────────────────────────────────────────────────────┐
│  Layer 1: Ingestion & Detection                        │
│  - Synthetic Generator (Faker + Indian distributions)  │
│  - Webhook Simulators (payment.failed, order.created)  │
└─────────────────────────┬──────────────────────────────┘
                          │
┌─────────────────────────▼──────────────────────────────┐
│  Layer 2: Diagnosis & Classification                   │
│  - Rule-based + AI keyword reasoning                   │
│  - Fraud Sieve (100% exclusion of suspicious txns)     │
└─────────────────────────┬──────────────────────────────┘
                          │
┌─────────────────────────▼──────────────────────────────┐
│  Layer 3: Intervention Policy Engine                   │
│  - 6 Recovery Actions                                  │
│  - Hard-coded Stopping Rules (3-retry cap, cooldown)   │
│  - TRAI/DND & Contact Hours (9 PM–9 AM block) Checks   │
└─────────────────────────┬──────────────────────────────┘
                          │
┌─────────────────────────▼──────────────────────────────┐
│  Layer 4: Execution Layer                              │
│  - Razorpay Test APIs (Payment Links, Orders)          │
│  - Messaging Simulation (WhatsApp / SMS / Email)       │
│  - Idempotency Guard (Composite Transaction Keys)      │
└─────────────────────────┬──────────────────────────────┘
                          │
┌─────────────────────────▼──────────────────────────────┐
│  Layer 5: Audit, Compliance & Reporting                │
│  - Real-time React Dashboard matching Track 03 Mockup  │
│  - JSON & CSV Audit Trail Exports                      │
│  - Single Transaction Timeline Walkthrough             │
└────────────────────────────────────────────────────────┘
```

---

## ⚡ Quick Start

### 1. Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python run.py
```
*Runs on `http://localhost:8000` (API Docs at `http://localhost:8000/docs`).*

### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
*Runs on `http://localhost:5173`.*

---

## 🎯 4 Rubric Deliverables

1. **Measured ₹ Recovered**: Generates real batch runs with live calculation of recovered rupees, recovery rates, and average recovery time.
2. **Compliant Escalation**: Checks customer consent channel flags, respects national DND registry, and enforces TRAI contact hours.
3. **Stopping Rules**: Non-optional bounded retries (max 3), 30m contact cooldowns, auto-exceptions for low-value stale transactions, and anti-discount stacking guards.
4. **Audit Trail**: Every diagnosis confidence score, policy reasoning string, and execution result is tracked and downloadable in CSV and JSON format.
