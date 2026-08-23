"""Audit log and export API endpoints."""

from fastapi import APIRouter
from fastapi.responses import PlainTextResponse, JSONResponse
from typing import Optional

from app.database import db
from app.layer5_audit.export import export_json, export_csv

router = APIRouter(prefix="/api/audit", tags=["Audit"])


@router.get("/")
async def get_audit_log(batch_id: Optional[str] = None, limit: int = 100):
    """Get audit log entries."""
    if batch_id:
        entries = db.get_audit_by_batch(batch_id)
    else:
        entries = db.get_all_audit_entries()

    return [e.model_dump(mode="json") for e in entries[:limit]]


@router.get("/transaction/{transaction_id}")
async def get_transaction_audit(transaction_id: str):
    """Get full audit trail for a single transaction."""
    entries = db.get_audit_by_transaction(transaction_id)
    return [e.model_dump(mode="json") for e in entries]


@router.get("/export/json")
async def export_audit_json(batch_id: Optional[str] = None):
    """Export audit trail as JSON."""
    data = export_json(batch_id)
    return JSONResponse(
        content={"data": data},
        headers={"Content-Disposition": "attachment; filename=audit_trail.json"},
    )


@router.get("/export/csv")
async def export_audit_csv(batch_id: Optional[str] = None):
    """Export audit trail as CSV."""
    data = export_csv(batch_id)
    return PlainTextResponse(
        content=data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=audit_trail.csv"},
    )
