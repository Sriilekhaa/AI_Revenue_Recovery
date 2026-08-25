"""Judge Scenario Sandbox API.

Allows judges or evaluators to test ANY custom failure scenario in real time:
- Custom Amount (e.g. ₹85,000)
- Custom Failure Code / Free-text Error (e.g. "Bank core switch down")
- Custom Customer Flags (DND registered, consent flags, VIP segment)
- Observes the entire 5-layer pipeline execute live with instant audit trail.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

from app.models.events import (
    RevenueEvent, EventType, PaymentMethod, EventStatus,
    classify_amount_band, classify_customer_segment
)
from app.layer2_diagnosis.classifier import classify_event
from app.layer2_diagnosis.fraud_sieve import apply_fraud_sieve
from app.layer3_policy.engine import decide_intervention
from app.layer3_policy.consent_check import run_compliance_checks
from app.layer4_execution.executor import execute_action
from app.layer1_ingestion.bank_radar import predict_preflight_risk, get_bank_health_radar
from app.database import db

router = APIRouter(prefix="/api/sandbox", tags=["Judge Sandbox"])


class SandboxScenarioRequest(BaseModel):
    amount: float = 4500.0
    payment_method: str = "upi"
    failure_reason_code: str = "INSUFFICIENT_FUNDS"
    failure_message: str = "Payment failed due to low account balance"
    customer_name: str = "Arjun Kapoor"
    customer_phone: str = "+919876543210"
    customer_email: str = "arjun.kapoor@example.in"
    dnd_registered: bool = False
    consent_whatsapp: bool = True
    consent_sms: bool = True
    retry_count: int = 0
    event_type: str = "payment_failed"


@router.post("/run")
async def run_custom_scenario(req: SandboxScenarioRequest):
    """Execute the full 5-layer pipeline on a custom user/judge-defined scenario."""
    batch_id = f"sandbox_{uuid.uuid4().hex[:8]}"
    now = datetime.utcnow()

    # 1. Build Revenue Event
    event = RevenueEvent(
        transaction_id=f"txn_sb_{uuid.uuid4().hex[:10]}",
        customer_id=f"cust_sb_{uuid.uuid4().hex[:6]}",
        amount=req.amount,
        currency="INR",
        payment_method=PaymentMethod(req.payment_method.lower()) if req.payment_method.lower() in [e.value for e in PaymentMethod] else PaymentMethod.UPI,
        failure_reason_code=req.failure_reason_code,
        failure_reason_message=req.failure_message,
        timestamp=now,
        retry_count=req.retry_count,
        customer_phone=req.customer_phone,
        customer_email=req.customer_email,
        consent_sms=req.consent_sms,
        consent_whatsapp=req.consent_whatsapp,
        consent_email=True,
        dnd_registered=req.dnd_registered,
        event_type=EventType(req.event_type.lower()) if req.event_type.lower() in [e.value for e in EventType] else EventType.PAYMENT_FAILED,
        status=EventStatus.DETECTED,
        customer_segment=classify_customer_segment(total_transactions=15, days_since_first=120),
        amount_band=classify_amount_band(req.amount),
        batch_id=batch_id,
    )

    db.store_event(event)

    # 2. Diagnosis
    diag_res = classify_event(event)
    event.root_cause = diag_res.root_cause
    event.diagnosis_confidence = diag_res.confidence
    event.diagnosis_reasoning = diag_res.reasoning
    event.status = EventStatus.DIAGNOSED

    # 3. Fraud Sieve Check
    is_fraud = diag_res.is_fraud or event.root_cause == "fraud_suspected"
    if is_fraud:
        event.status = EventStatus.FRAUD_FLAGGED
        event.exception_reason = "Excluded from recovery by Fraud Sieve guardrail."
        return {
            "transaction_id": event.transaction_id,
            "status": "fraud_flagged",
            "diagnosis": diag_res.model_dump(mode="json"),
            "compliance_verdict": "BLOCKED — Suspicious Activity",
            "action_taken": "ROUTED_TO_RISK_TEAM",
            "amount_recovered": 0.0,
            "pipeline_trace": [
                {"stage": "Ingestion", "status": "Ingested", "details": f"Amount ₹{req.amount:,.2f}"},
                {"stage": "Diagnosis", "status": "Diagnosed", "details": diag_res.reasoning},
                {"stage": "Fraud Sieve", "status": "Flagged", "details": "100% excluded from recovery"},
            ]
        }

    # 4. Policy Decision
    decision = decide_intervention(event)
    event.assigned_action = decision.action
    event.action_reasoning = decision.reasoning
    event.status = EventStatus.POLICY_ASSIGNED

    # 5. Execution & Outcome
    exec_result = execute_action(event, decision, batch_id)

    # 6. Pre-flight telemetry
    preflight = predict_preflight_risk(req.amount, req.payment_method)

    return {
        "transaction_id": event.transaction_id,
        "final_status": event.status,
        "amount": req.amount,
        "amount_recovered": event.recovered_amount or 0.0,
        "diagnosis": {
            "root_cause": event.root_cause,
            "confidence": event.diagnosis_confidence,
            "reasoning": event.diagnosis_reasoning,
        },
        "policy": {
            "action": decision.action,
            "channel": decision.channel,
            "reasoning": decision.reasoning,
            "requires_hitl": decision.requires_hitl,
        },
        "execution": exec_result.model_dump(mode="json"),
        "preflight_telemetry": preflight,
    }


@router.get("/bank-radar")
async def api_get_bank_radar():
    """Get live Indian bank & switch degradation telemetry."""
    return [b.model_dump(mode="json") for b in get_bank_health_radar()]
