"""CFO Unit Economics & Net Recovery Margin API routes."""

from fastapi import APIRouter
from typing import Optional
from app.layer5_audit.unit_economics import calculate_unit_economics

router = APIRouter(prefix="/api/economics", tags=["Unit Economics"])


@router.get("/")
async def api_get_unit_economics(batch_id: Optional[str] = None):
    """Get CFO net merchant margin, messaging costs, and ROI multiplier metrics."""
    return calculate_unit_economics(batch_id).model_dump(mode="json")
