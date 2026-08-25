"""MAB Reinforcement Learning Optimizer API routes."""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from app.layer3_policy.mab_optimizer import mab_engine

router = APIRouter(prefix="/api/mab", tags=["MAB Optimizer"])


class SelectArmRequest(BaseModel):
    segment: str = "standard"
    amount: float = 2499.0


class OutcomeRequest(BaseModel):
    arm_id: str
    success: bool
    amount_recovered: float = 0.0


@router.get("/analytics")
async def api_get_mab_analytics():
    """Get summarized multi-armed bandit learning analytics and arms comparison."""
    return mab_engine.get_analytics()


@router.post("/select")
async def api_select_arm(req: SelectArmRequest):
    """Dynamically select optimal recovery arm using Thompson Sampling."""
    arm = mab_engine.select_arm(req.segment, req.amount)
    return arm.model_dump(mode="json")


@router.post("/outcome")
async def api_record_outcome(req: OutcomeRequest):
    """Record recovery conversion or drop-off to update posterior distribution."""
    mab_engine.record_outcome(req.arm_id, req.success, req.amount_recovered)
    return {"status": "updated", "analytics": mab_engine.get_analytics()}
