"""Audit event logger — structured logging for every decision and action."""

from datetime import datetime
from app.models.events import RevenueEvent, EventStatus
from app.models.audit import AuditEntry
from app.database import db


def log_ingestion(event: RevenueEvent, batch_id: str):
    """Log an event ingestion."""
    db.log_audit(AuditEntry(
        batch_id=batch_id,
        transaction_id=event.transaction_id,
        stage="ingestion",
        action="event_ingested",
        outcome="success",
        outcome_detail=f"Event type: {event.event_type}, Amount: ₹{event.amount:,.2f}, Method: {event.payment_method}",
    ))


def log_detection(event: RevenueEvent, batch_id: str):
    """Log at-risk detection."""
    db.log_audit(AuditEntry(
        batch_id=batch_id,
        transaction_id=event.transaction_id,
        stage="detection",
        action="flagged_at_risk",
        outcome="success",
        outcome_detail=f"At-risk amount: ₹{event.amount:,.2f}. Failure: {event.failure_reason_code}",
    ))


def log_diagnosis(event: RevenueEvent, batch_id: str):
    """Log root-cause diagnosis."""
    db.log_audit(AuditEntry(
        batch_id=batch_id,
        transaction_id=event.transaction_id,
        stage="diagnosis",
        action="root_cause_classified",
        root_cause=event.root_cause,
        diagnosis_confidence=event.diagnosis_confidence,
        diagnosis_reasoning=event.diagnosis_reasoning,
        outcome="success",
        outcome_detail=f"Root cause: {event.root_cause} (confidence: {event.diagnosis_confidence:.0%})",
    ))


def log_fraud_flag(event: RevenueEvent, batch_id: str):
    """Log fraud flagging."""
    db.log_audit(AuditEntry(
        batch_id=batch_id,
        transaction_id=event.transaction_id,
        stage="diagnosis",
        action="fraud_flagged",
        root_cause="fraud_suspected",
        diagnosis_confidence=event.diagnosis_confidence,
        diagnosis_reasoning=event.diagnosis_reasoning,
        outcome="flagged",
        outcome_detail="Routed to risk team. Excluded from all recovery actions.",
    ))


def log_policy_decision(event: RevenueEvent, batch_id: str):
    """Log policy engine decision."""
    db.log_audit(AuditEntry(
        batch_id=batch_id,
        transaction_id=event.transaction_id,
        stage="policy",
        action=f"intervention_assigned: {event.assigned_action}",
        root_cause=event.root_cause,
        policy_reasoning=event.action_reasoning,
        outcome="success",
        outcome_detail=f"Action: {event.assigned_action}",
    ))


def log_exception(event: RevenueEvent, batch_id: str, reason: str):
    """Log an event moved to exception bucket."""
    db.log_audit(AuditEntry(
        batch_id=batch_id,
        transaction_id=event.transaction_id,
        stage="exception",
        action="moved_to_exception",
        root_cause=event.root_cause,
        outcome="exception",
        outcome_detail=reason,
    ))
