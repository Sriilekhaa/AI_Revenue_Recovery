"""Single-transaction walkthrough API — for the demo deep-dive."""

from fastapi import APIRouter, HTTPException
from app.database import db

router = APIRouter(prefix="/api/walkthrough", tags=["Walkthrough"])


@router.get("/{transaction_id}")
async def get_walkthrough(transaction_id: str):
    """Get a full walkthrough of a single transaction's journey.

    Returns the event details + complete audit trail ordered chronologically.
    This is the demo centerpiece for showing detect → diagnose → decide → execute → outcome.
    """
    event = db.get_event(transaction_id)
    if not event:
        raise HTTPException(status_code=404, detail="Transaction not found")

    audit_entries = db.get_audit_by_transaction(transaction_id)

    # Build timeline
    timeline = []
    for entry in sorted(audit_entries, key=lambda e: e.timestamp):
        timeline.append({
            "stage": entry.stage,
            "action": entry.action,
            "outcome": entry.outcome,
            "detail": entry.outcome_detail,
            "reasoning": entry.diagnosis_reasoning or entry.policy_reasoning,
            "compliance": {
                "consent_checked": entry.consent_checked,
                "consent_status": entry.consent_status,
                "dnd_checked": entry.dnd_checked,
                "dnd_status": entry.dnd_status,
                "retry_limit_checked": entry.retry_limit_checked,
                "retry_limit_status": entry.retry_limit_status,
            },
            "timestamp": entry.timestamp.isoformat(),
        })

    return {
        "transaction": event.model_dump(mode="json"),
        "timeline": timeline,
        "summary": {
            "stages_completed": len(set(e["stage"] for e in timeline)),
            "final_status": event.status,
            "recovered_amount": event.recovered_amount,
            "root_cause": event.root_cause,
            "intervention": event.assigned_action,
            "total_audit_entries": len(timeline),
        },
    }


@router.get("/")
async def list_walkthrough_candidates():
    """List transactions suitable for walkthrough demo.

    Returns a mix of recovered, exception, and fraud-flagged transactions.
    """
    all_events = list(db.events.values())

    recovered = [e for e in all_events if e.status == "recovered"][:5]
    exceptions = [e for e in all_events if e.status == "exception"][:3]
    fraud = [e for e in all_events if e.status == "fraud_flagged"][:2]

    candidates = []
    for e in recovered + exceptions + fraud:
        candidates.append({
            "transaction_id": e.transaction_id,
            "amount": e.amount,
            "status": e.status,
            "root_cause": e.root_cause,
            "event_type": e.event_type,
            "payment_method": e.payment_method,
            "recovered_amount": e.recovered_amount,
        })

    return candidates
