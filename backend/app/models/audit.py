"""Audit log models for the compliance and audit trail."""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid


class AuditEntry(BaseModel):
    """Single audit log entry — every decision and action gets one."""
    audit_id: str = Field(default_factory=lambda: f"aud_{uuid.uuid4().hex[:12]}")
    batch_id: str
    transaction_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    # What happened
    stage: str  # ingestion, detection, diagnosis, policy, execution, recovery, exception
    action: str  # The specific action taken

    # Why (root cause + policy reasoning)
    root_cause: Optional[str] = None
    diagnosis_confidence: Optional[float] = None
    diagnosis_reasoning: Optional[str] = None
    policy_reasoning: Optional[str] = None

    # Outcome
    outcome: str  # success, failed, blocked, skipped, pending
    outcome_detail: Optional[str] = None
    recovered_amount: Optional[float] = None

    # Compliance checks logged explicitly
    consent_checked: bool = False
    consent_status: Optional[str] = None  # granted, denied, not_required
    dnd_checked: bool = False
    dnd_status: Optional[str] = None  # clear, blocked
    retry_limit_checked: bool = False
    retry_limit_status: Optional[str] = None  # within_limit, exceeded
    cooldown_checked: bool = False
    cooldown_status: Optional[str] = None  # clear, in_cooldown
    contact_hours_checked: bool = False
    contact_hours_status: Optional[str] = None  # allowed, blocked

    # API details (for execution audit)
    api_endpoint: Optional[str] = None
    api_request_summary: Optional[str] = None
    api_response_code: Optional[int] = None
    api_response_summary: Optional[str] = None


class ComplianceCheckResult(BaseModel):
    """Result of all compliance checks for a contact action."""
    transaction_id: str
    consent_granted: bool = False
    consent_status: Optional[str] = None
    dnd_clear: bool = True
    dnd_status: Optional[str] = None
    within_retry_limit: bool = True
    retry_limit_status: Optional[str] = None
    cooldown_elapsed: bool = True
    cooldown_status: Optional[str] = None
    within_contact_hours: bool = True
    contact_hours_status: Optional[str] = None
    all_clear: bool = False
    blocked_reasons: list[str] = Field(default_factory=list)

    def compute_all_clear(self):
        self.all_clear = (
            self.consent_granted
            and self.dnd_clear
            and self.within_retry_limit
            and self.cooldown_elapsed
            and self.within_contact_hours
        )
        if not self.consent_granted:
            self.blocked_reasons.append("consent_not_granted")
        if not self.dnd_clear:
            self.blocked_reasons.append("dnd_registered")
        if not self.within_retry_limit:
            self.blocked_reasons.append("retry_limit_exceeded")
        if not self.cooldown_elapsed:
            self.blocked_reasons.append("cooldown_not_elapsed")
        if not self.within_contact_hours:
            self.blocked_reasons.append("outside_contact_hours")
        return self
