"""B2B Receivables and Promise-to-Pay API routes."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.layer3_policy.b2b_ptp_engine import (
    get_all_b2b_invoices, record_promise_to_pay, get_b2b_analytics
)

router = APIRouter(prefix="/api/b2b", tags=["B2B Receivables"])


class PTPRequest(BaseModel):
    invoice_id: str
    ptp_date: str
    note: Optional[str] = "Customer confirmed via WhatsApp follow-up"


@router.get("/invoices")
async def api_get_invoices():
    """Get all B2B enterprise invoices and their aging / PTP status."""
    invoices = get_all_b2b_invoices()
    return [i.model_dump(mode="json") for i in invoices]


@router.get("/analytics")
async def api_get_b2b_analytics():
    """Get B2B receivables aging buckets and commitment stats."""
    return get_b2b_analytics()


@router.post("/promise-to-pay")
async def api_record_ptp(req: PTPRequest):
    """Log a promise-to-pay date for a B2B invoice."""
    inv = record_promise_to_pay(req.invoice_id, req.ptp_date, req.note or "")
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return inv.model_dump(mode="json")
