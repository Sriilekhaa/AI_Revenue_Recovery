"""Dashboard analytics queries."""

from typing import Optional
from app.database import db


def get_dashboard_data(batch_id: Optional[str] = None) -> dict:
    """Get all dashboard analytics for a batch or across all batches."""
    if batch_id:
        return db.get_batch_analytics(batch_id)

    # Aggregate across all batches
    all_batches = db.get_all_batches()
    if not all_batches:
        return {"total_events": 0, "total_at_risk": 0, "total_recovered": 0, "recovery_rate": 0}

    # Return latest batch data by default
    latest = all_batches[0]
    return db.get_batch_analytics(latest.batch_id)
