"""Policy configuration models."""

from pydantic import BaseModel
from typing import Optional


class PolicyRule(BaseModel):
    """A single policy rule mapping conditions to an intervention action."""
    rule_id: str
    root_cause: str
    customer_segment: Optional[str] = None  # None = all segments
    amount_band: Optional[str] = None       # None = all bands
    action: str
    channel: str = "none"
    priority: int = 0  # Higher priority rules evaluated first
    retry_delay_minutes: Optional[int] = None
    discount_percent: Optional[float] = None
    description: str = ""


class PolicyConfig(BaseModel):
    """Full policy configuration."""
    rules: list[PolicyRule] = []
    max_retry_attempts: int = 3
    cooldown_minutes: int = 30
    auto_exception_days: int = 7
    auto_exception_amount_threshold: float = 500.0
    max_discount_percent: float = 5.0
    hitl_amount_threshold: float = 50000.0
