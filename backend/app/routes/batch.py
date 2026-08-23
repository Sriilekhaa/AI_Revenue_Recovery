"""Batch run API endpoints — the core pipeline orchestrator."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

from app.models.events import BatchRun, EventStatus
from app.database import db
from app.layer1_ingestion.data_generator import generate_batch
from app.layer1_ingestion.detection import detect_at_risk
from app.layer2_diagnosis.classifier import classify_batch
from app.layer2_diagnosis.fraud_sieve import apply_fraud_sieve
from app.layer3_policy.engine import assign_interventions
from app.layer4_execution.executor import execute_batch
from app.layer5_audit.logger import (
    log_ingestion, log_detection, log_diagnosis,
    log_fraud_flag, log_policy_decision, log_exception,
)

router = APIRouter(prefix="/api/batch", tags=["Batch Runs"])


class BatchRequest(BaseModel):
    batch_size: int = 300
    hours_back: int = 48


class BatchResponse(BaseModel):
    batch_id: str
    status: str
    total_events: int
    total_at_risk: float
    events_diagnosed: int
    events_fraud_flagged: int
    events_contacted: int
    events_recovered: int
    events_exception: int
    amount_recovered: float
    recovery_rate: float


@router.post("/generate", response_model=BatchResponse)
async def generate_and_run_batch(request: BatchRequest):
    """Generate a synthetic batch and run the full recovery pipeline.

    This is the main demo endpoint — generates events, runs all 5 layers,
    and returns the headline recovery numbers.
    """
    batch_id = f"batch_{uuid.uuid4().hex[:12]}"

    # ── Layer 1: Generate + Ingest ──
    events = generate_batch(
        batch_size=request.batch_size,
        batch_id=batch_id,
        hours_back=request.hours_back,
    )

    # Store events
    db.store_events(events)

    # Log ingestion
    for event in events:
        log_ingestion(event, batch_id)

    # Create batch record
    batch = BatchRun(
        batch_id=batch_id,
        total_events=len(events),
        total_amount_at_risk=sum(e.amount for e in events),
    )
    db.store_batch(batch)

    # ── Layer 1b: Detection ──
    detected = detect_at_risk(events)
    for event in detected:
        log_detection(event, batch_id)

    # ── Layer 2: Diagnosis ──
    diagnosis_results = classify_batch(detected)
    for event in detected:
        if event.root_cause:
            log_diagnosis(event, batch_id)

    # ── Layer 2b: Fraud Sieve ──
    safe_events, fraud_events = apply_fraud_sieve(detected, diagnosis_results)
    for event in fraud_events:
        log_fraud_flag(event, batch_id)

    # ── Layer 3: Policy Engine ──
    decisions = assign_interventions(safe_events)
    for event in safe_events:
        if event.assigned_action:
            log_policy_decision(event, batch_id)

    # ── Layer 4: Execution ──
    execution_results = execute_batch(safe_events, decisions, batch_id)

    # ── Compute Final Stats ──
    recovered_events = [e for e in events if e.status == EventStatus.RECOVERED]
    exception_events = [e for e in events if e.status == EventStatus.EXCEPTION]
    contacted_events = [e for e in events if e.status in (
        EventStatus.CONTACTED, EventStatus.RETRY_SCHEDULED, EventStatus.RECOVERED
    )]
    snoozed_events = [e for e in events if e.status == EventStatus.SNOOZED]

    # Mark snoozed as exceptions for reporting
    for event in snoozed_events:
        event.status = EventStatus.EXCEPTION
        event.exception_reason = event.exception_reason or "Snoozed by policy/compliance"
        log_exception(event, batch_id, event.exception_reason)

    total_recovered = sum(e.recovered_amount or 0 for e in recovered_events)
    total_at_risk = sum(e.amount for e in events)
    recovery_rate = (total_recovered / total_at_risk * 100) if total_at_risk > 0 else 0

    # Update batch record
    db.update_batch(batch_id,
        events_detected=len(detected),
        events_diagnosed=len(diagnosis_results),
        events_contacted=len(contacted_events),
        events_recovered=len(recovered_events),
        events_exception=len(exception_events) + len(snoozed_events),
        events_fraud_flagged=len(fraud_events),
        amount_recovered=total_recovered,
        recovery_rate=recovery_rate,
        status="completed",
        completed_at=datetime.utcnow(),
    )

    return BatchResponse(
        batch_id=batch_id,
        status="completed",
        total_events=len(events),
        total_at_risk=round(total_at_risk, 2),
        events_diagnosed=len(diagnosis_results),
        events_fraud_flagged=len(fraud_events),
        events_contacted=len(contacted_events),
        events_recovered=len(recovered_events),
        events_exception=len(exception_events) + len(snoozed_events),
        amount_recovered=round(total_recovered, 2),
        recovery_rate=round(recovery_rate, 2),
    )


@router.get("/list")
async def list_batches():
    """List all batch runs."""
    batches = db.get_all_batches()
    return [b.model_dump(mode="json") for b in batches]


@router.get("/{batch_id}")
async def get_batch(batch_id: str):
    """Get details of a specific batch run."""
    batch = db.get_batch(batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return batch.model_dump(mode="json")


@router.get("/{batch_id}/events")
async def get_batch_events(batch_id: str):
    """Get all events for a batch."""
    events = db.get_events_by_batch(batch_id)
    if not events:
        raise HTTPException(status_code=404, detail="No events found for this batch")
    return [e.model_dump(mode="json") for e in events]
