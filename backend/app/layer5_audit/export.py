"""CSV and JSON export of the audit trail."""

from typing import Optional
from app.database import db


def export_json(batch_id: Optional[str] = None) -> str:
    """Export audit trail as JSON."""
    return db.export_audit_json(batch_id)


def export_csv(batch_id: Optional[str] = None) -> str:
    """Export audit trail as CSV."""
    return db.export_audit_csv(batch_id)
