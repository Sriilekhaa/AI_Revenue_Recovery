# Recovery AI 
> **"Don't just identify the problem. Show measured money recovered across a batch, with compliant escalation, stopping rules, and an audit trail."**

---

## Executive Summary

**Recovery AI** is an enterprise-grade autonomous revenue operating system built specifically for Indian digital commerce. It connects pre-flight risk prediction, failure detection, multi-signal diagnosis, policy decisioning, and idempotent execution across the three primary revenue degradation vectors:

1. **Payment Failure Recovery**: Card declines, UPI switch timeouts, bank network drops, 3DS authentication drop-offs, gateway errors.
2. **Checkout Abandonment Recovery**: Abandoned high-intent carts nudged with bounded dynamic incentives (max 5%) via WhatsApp/SMS.
3. **Failed Subscription / e-Mandate Recovery**: UPI AutoPay and eNACH recurring mandate failures handled with smart retries and mandate re-registration links.

---

## 4 Breakthrough Innovations (10x Ahead of Standard Recovery Pipelines)

### 1. Hinglish Conversational Recovery Agent Simulator
- **Natural Code-Switching**: Speaks natural conversational Hinglish (*"Namaste Rahul ji! Aapka ₹2,499 ka payment bank timeout ki wajah se fail ho gaya..."*), Hindi, or English.
- **Objection Handling**: Autonomously resolves customer friction points (*"Paise cut gaye par order confirm nahi hua"*, *"Abhi balance nahi hai, kal karunga"*, *"Thoda discount milega kya?"*).
- **Promise-to-Pay (PTP) Parsing**: Extracts customer payment commitments (e.g. *"Kal subah 11 baje"*), records the commitment date, and pauses aggressive nudges in compliance with TRAI regulations.
- **Bounded Incentives**: Grants dynamic instant recovery discounts strictly capped at 5% to prevent margin erosion.

### 2. B2B Receivables & Promise-to-Pay (PTP) Tracker
- **Aging Buckets**: Categorizes outstanding invoices into *Current*, *1–15 Days*, *16–30 Days*, and *30+ Days Overdue*.
- **Commitment SLA Management**: Automatically schedules reminders before the promised date and triggers automated escalations if the PTP is broken.
- **Dispute Resolution Triage**: Distinguishes invoice/billing discrepancies from temporary cashflow delays.

### 3. Pre-Flight AI Bank Degradation & Predictive Risk Radar
- **Live Infrastructure Telemetry**: Real-time switch status for major Indian banks (HDFC, SBI, ICICI, Axis) and UPI rails (NPCI UPI Switch).
- **Predictive Risk Scoring (0–100)**: Evaluates switch latency, historical failure rates, and transaction amounts before attempting debits to route around degraded payment corridors.

### 4. Interactive Judge Scenario Sandbox
- **Instant Interactive Test Bench**: Judges can input **any** custom payment failure scenario, transaction amount (e.g. ₹95,000 Mandate Timeout), payment method, and DND/consent parameters.
- **Real-Time 5-Layer Pipeline Execution**: Instantly renders the diagnosis confidence, fraud sieve check, stopping rules validation, policy assignment, and final execution log.

---

## 5-Layer Architecture

```mermaid
graph TB
    subgraph "Layer 1: Ingestion & Pre-Flight Radar"
        BR["Pre-Flight Bank Degradation Radar"]
        SG["Synthetic Ingestion Engine (Faker + Indian Distributions)"]
        WH["Webhook Simulators (payment.failed, order.created)"]
        DM["Detection Module (At-Risk Revenue Flagging)"]
        BR --> DM
        SG --> WH
        WH --> DM
    end

    subgraph "Layer 2: Diagnosis & Classification"
        DM --> RC["Root-Cause Classifier (Rule-based + LLM Inference)"]
        RC --> FS["Fraud Sieve (Exclusion Routing)"]
        FS -->|Fraud Suspected| FR["Flagged for Risk Team (100% Excluded)"]
    end

    subgraph "Layer 3: Intervention Policy & Agents"
        FS -->|Safe to Recover| PE["Policy Engine (6 Action Corridors)"]
        PE --> HA["Hinglish Conversational Agent (WhatsApp Simulator)"]
        PE --> B2B["B2B Promise-to-Pay (PTP) Sequencer"]
        PE --> SR["Stopping Rules (Retry Caps, Cooldowns)"]
        PE --> CC["TRAI / DND Consent & Contact Hours Guard (9 PM - 9 AM Block)"]
    end

    subgraph "Layer 4: Execution & Idempotency"
        CC --> EX["Action Executor"]
        EX --> RZ["Razorpay Test APIs (Payment Links, Orders)"]
        EX --> MSG["Omnichannel Messaging (WhatsApp, SMS, Email)"]
        EX --> ID["Composite Key Idempotency Guard"]
    end

    subgraph "Layer 5: Audit, Sandbox & Reporting"
        EX --> AL["Explainable Audit Log (Reasoning + Timestamps)"]
        AL --> UI["React Enterprise Dashboard"]
        AL --> EXP["CSV & JSON Full Audit Export"]
        SB["Judge Scenario Sandbox"] --> DM
    end
```

---

## Rubric Deliverables Alignment

| Rubric Criterion | Implementation & Proof Point |
|---|---|
| **1. Measured Money Recovered** | Live batch calculations computing total at-risk amount, recovered rupees (₹), recovery rate (%), and cost of recovery. |
| **2. Compliant Escalation** | Full TRAI / DND verification, strict contact hours (9 PM–9 AM blocked), multi-channel consent enforcement (WhatsApp, SMS, Email). |
| **3. Stopping Rules** | Hard-coded non-optional guardrails: Max 3 retries, 30-minute cooldown period, ₹50k+ mandatory Human-in-the-Loop (HITL), 5% discount ceiling. |
| **4. Audit Trail** | Every single decision logged with confidence scores, policy reasoning, trace IDs, and available for instantaneous JSON & CSV export. |

---

## Quick Start

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 2. Backend Setup (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python run.py
```
- API Server: `http://localhost:8000`
- Interactive Swagger Docs: `http://localhost:8000/docs`

### 3. Frontend Setup (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:5173`

---

## REST API Reference

- `POST /api/batch/generate` — Generate a synthetic batch run (150–500 events) and execute recovery pipeline.
- `GET /api/dashboard/` — Retrieve aggregated analytics, recovery funnel, method breakdown, and root cause distributions.
- `GET /api/audit/` — Search and filter the full audit log.
- `GET /api/audit/export/json` — Export complete audit trail as JSON.
- `GET /api/audit/export/csv` — Export complete audit trail as CSV.
- `GET /api/walkthrough/{transaction_id}` — Single-transaction lifecycle trace with step-by-step reasoning.
- `POST /api/agent/message` — Send customer message to Hinglish WhatsApp Recovery Agent.
- `GET /api/b2b/invoices` — Retrieve enterprise B2B receivables and PTP aging.
- `POST /api/b2b/promise-to-pay` — Register customer promise-to-pay date.
- `GET /api/sandbox/bank-radar` — Stream live banking switch health and latency telemetry.
- `POST /api/sandbox/run` — Run the full 5-layer pipeline on a custom scenario in real time.
