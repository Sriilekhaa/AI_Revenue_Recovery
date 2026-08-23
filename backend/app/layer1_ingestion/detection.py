"""Detection module — flags unresolved events as at-risk revenue."""

from datetime import datetime, timedelta
from typing import Optional

from app.models.events import RevenueEvent, EventStatus


def detect_at_risk(
    events: list[RevenueEvent],
    detection_window_hours: float = 1.0,
) -> list[RevenueEvent]:
    """Flag events that remain unresolved within the detection window as at-risk.

    Args:
        events: List of ingested events
        detection_window_hours: Time window to consider events as at-risk

    Returns:
        List of events flagged as 'detected' (at-risk revenue)
    """
    now = datetime.utcnow()
    cutoff = now - timedelta(hours=detection_window_hours)
    detected = []

    for event in events:
        # Only process ingested (unresolved) events
        if event.status != EventStatus.INGESTED:
            continue

        # Events within the detection window are at-risk
        if event.timestamp <= now:
            event.status = EventStatus.DETECTED
            detected.append(event)

    return detected


def get_at_risk_summary(events: list[RevenueEvent]) -> dict:
    """Summarize at-risk revenue from detected events."""
    detected = [e for e in events if e.status == EventStatus.DETECTED]
    total_at_risk = sum(e.amount for e in detected)

    by_type = {}
    for e in detected:
        et = e.event_type
        if et not in by_type:
            by_type[et] = {"count": 0, "amount": 0}
        by_type[et]["count"] += 1
        by_type[et]["amount"] += e.amount

    by_method = {}
    for e in detected:
        pm = e.payment_method
        if pm not in by_method:
            by_method[pm] = {"count": 0, "amount": 0}
        by_method[pm]["count"] += 1
        by_method[pm]["amount"] += e.amount

    return {
        "total_detected": len(detected),
        "total_at_risk_amount": round(total_at_risk, 2),
        "by_event_type": {k: {"count": v["count"], "amount": round(v["amount"], 2)} for k, v in by_type.items()},
        "by_payment_method": {k: {"count": v["count"], "amount": round(v["amount"], 2)} for k, v in by_method.items()},
    }
