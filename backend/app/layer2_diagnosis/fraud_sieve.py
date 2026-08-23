"""Fraud sieve — routes fraud-suspected events out of the recovery flow.

Fraud-flagged transactions are NEVER nudged or retried. They are routed
to a "flagged for risk team" bucket with a full audit entry.
"""

from app.models.events import RevenueEvent, RootCause, EventStatus, DiagnosisResult


def apply_fraud_sieve(
    events: list[RevenueEvent],
    diagnosis_results: list[DiagnosisResult],
) -> tuple[list[RevenueEvent], list[RevenueEvent]]:
    """Separate fraud-suspected events from recoverable ones.

    Args:
        events: All diagnosed events
        diagnosis_results: Diagnosis results for the events

    Returns:
        (safe_events, fraud_flagged_events)
    """
    safe = []
    fraud_flagged = []

    # Build a lookup for diagnosis results
    diag_map = {d.transaction_id: d for d in diagnosis_results}

    for event in events:
        if event.status != EventStatus.DIAGNOSED:
            continue

        diag = diag_map.get(event.transaction_id)

        if diag and diag.is_fraud:
            event.status = EventStatus.FRAUD_FLAGGED
            event.exception_reason = (
                "Transaction flagged as fraud-suspected by diagnosis engine. "
                "Excluded from all recovery actions and routed to risk team for manual review. "
                f"Confidence: {diag.confidence:.0%}. Reasoning: {diag.reasoning}"
            )
            fraud_flagged.append(event)
        elif event.root_cause == RootCause.FRAUD_SUSPECTED:
            # Belt-and-suspenders: catch any fraud that slipped through
            event.status = EventStatus.FRAUD_FLAGGED
            event.exception_reason = (
                "Transaction root cause classified as fraud_suspected. "
                "Excluded from recovery pipeline as per compliance rules."
            )
            fraud_flagged.append(event)
        else:
            safe.append(event)

    return safe, fraud_flagged


def get_fraud_summary(fraud_events: list[RevenueEvent]) -> dict:
    """Generate a summary of fraud-flagged events."""
    total_amount = sum(e.amount for e in fraud_events)
    by_method = {}
    for e in fraud_events:
        pm = e.payment_method
        if pm not in by_method:
            by_method[pm] = {"count": 0, "amount": 0}
        by_method[pm]["count"] += 1
        by_method[pm]["amount"] += e.amount

    return {
        "total_flagged": len(fraud_events),
        "total_amount_flagged": round(total_amount, 2),
        "by_payment_method": {k: {"count": v["count"], "amount": round(v["amount"], 2)} for k, v in by_method.items()},
    }
