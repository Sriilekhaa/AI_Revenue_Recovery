"""Pydantic models for all event types in the revenue recovery pipeline."""

from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
from enum import Enum
import uuid


# ─── Enums ─────────────────────────────────────────────────────────

class EventType(str, Enum):
    PAYMENT_FAILED = "payment_failed"
    CHECKOUT_ABANDONED = "checkout_abandoned"
    MANDATE_FAILED = "mandate_failed"
    INVOICE_OVERDUE = "invoice_overdue"


class PaymentMethod(str, Enum):
    UPI = "upi"
    CARD = "card"
    NETBANKING = "netbanking"
    WALLET = "wallet"
    EMANDATE = "emandate"


class RootCause(str, Enum):
    INSUFFICIENT_FUNDS = "insufficient_funds"
    EXPIRED_CARD = "expired_card"
    BANK_DECLINED = "bank_declined"
    GATEWAY_TIMEOUT = "gateway_timeout"
    CUSTOMER_ABANDONED = "customer_abandoned"
    MANDATE_REVOKED = "mandate_revoked"
    FRAUD_SUSPECTED = "fraud_suspected"
    THREE_DS_DROPOUT = "3ds_dropout"
    UPI_TIMEOUT = "upi_timeout"
    VPA_INVALID = "vpa_invalid"
    NETWORK_ERROR = "network_error"
    UNKNOWN = "unknown"


class EventStatus(str, Enum):
    INGESTED = "ingested"
    DETECTED = "detected"
    DIAGNOSED = "diagnosed"
    FRAUD_FLAGGED = "fraud_flagged"
    POLICY_ASSIGNED = "policy_assigned"
    CONTACTED = "contacted"
    RETRY_SCHEDULED = "retry_scheduled"
    RECOVERED = "recovered"
    EXCEPTION = "exception"
    SNOOZED = "snoozed"
    HITL_PENDING = "hitl_pending"


class InterventionAction(str, Enum):
    SMART_RETRY = "smart_retry"
    ALT_PAYMENT_METHOD = "alt_payment_method"
    PAYMENT_LINK = "payment_link"
    DISCOUNT_NUDGE = "discount_nudge"
    HUMAN_ESCALATION = "human_escalation"
    SNOOZE = "snooze"


class ContactChannel(str, Enum):
    SMS = "sms"
    WHATSAPP = "whatsapp"
    EMAIL = "email"
    NONE = "none"


class CustomerSegment(str, Enum):
    HIGH_VALUE = "high_value"
    REGULAR = "regular"
    NEW = "new"
    CHURNING = "churning"


class AmountBand(str, Enum):
    MICRO = "micro"        # < ₹100
    LOW = "low"            # ₹100–₹500
    MEDIUM = "medium"      # ₹500–₹5,000
    HIGH = "high"          # ₹5,000–₹50,000
    PREMIUM = "premium"    # > ₹50,000


# ─── Core Event Model ──────────────────────────────────────────────

class RevenueEvent(BaseModel):
    """Core event model representing a revenue-at-risk event."""
    transaction_id: str = Field(default_factory=lambda: f"txn_{uuid.uuid4().hex[:16]}")
    customer_id: str
    amount: float
    currency: str = "INR"
    payment_method: PaymentMethod
    failure_reason_code: str
    failure_reason_message: str = ""
    timestamp: datetime
    retry_count: int = 0
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    consent_sms: bool = False
    consent_whatsapp: bool = False
    consent_email: bool = False
    dnd_registered: bool = False
    event_type: EventType
    subscription_id: Optional[str] = None
    invoice_id: Optional[str] = None
    order_id: Optional[str] = None

    # Populated by pipeline
    status: EventStatus = EventStatus.INGESTED
    root_cause: Optional[RootCause] = None
    diagnosis_confidence: Optional[float] = None
    diagnosis_reasoning: Optional[str] = None
    assigned_action: Optional[InterventionAction] = None
    action_reasoning: Optional[str] = None
    customer_segment: Optional[CustomerSegment] = None
    amount_band: Optional[AmountBand] = None
    batch_id: Optional[str] = None
    recovered_amount: Optional[float] = None
    recovered_at: Optional[datetime] = None
    exception_reason: Optional[str] = None

    class Config:
        use_enum_values = True


# ─── Webhook Event Models ──────────────────────────────────────────

class RazorpayWebhookEvent(BaseModel):
    """Simulated Razorpay webhook event."""
    event: str  # e.g. payment.failed, subscription.charged.failed
    account_id: str = "acc_test_recovery_ai"
    contains: list[str] = []
    payload: dict
    created_at: int  # Unix timestamp


# ─── Batch Run Model ───────────────────────────────────────────────

class BatchRun(BaseModel):
    """Represents a batch run of the recovery pipeline."""
    batch_id: str = Field(default_factory=lambda: f"batch_{uuid.uuid4().hex[:12]}")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    total_events: int = 0
    total_amount_at_risk: float = 0.0
    events_detected: int = 0
    events_diagnosed: int = 0
    events_contacted: int = 0
    events_recovered: int = 0
    events_exception: int = 0
    events_fraud_flagged: int = 0
    amount_recovered: float = 0.0
    recovery_rate: float = 0.0
    avg_time_to_recovery_mins: Optional[float] = None
    status: str = "running"  # running, completed, failed
    completed_at: Optional[datetime] = None


# ─── Diagnosis Result ──────────────────────────────────────────────

class DiagnosisResult(BaseModel):
    """Output of the root-cause classification."""
    transaction_id: str
    root_cause: RootCause
    confidence: float = Field(ge=0.0, le=1.0)
    reasoning: str
    is_fraud: bool = False
    method: str = "rule_based"  # rule_based or llm


# ─── Policy Decision ──────────────────────────────────────────────

class PolicyDecision(BaseModel):
    """Output of the intervention policy engine."""
    transaction_id: str
    action: InterventionAction
    reasoning: str
    channel: ContactChannel = ContactChannel.NONE
    retry_delay_minutes: Optional[int] = None
    discount_percent: Optional[float] = None
    payment_link_url: Optional[str] = None
    requires_hitl: bool = False
    blocked_reason: Optional[str] = None  # If action was blocked by stopping rules


# ─── Execution Result ──────────────────────────────────────────────

class ExecutionResult(BaseModel):
    """Result of executing a recovery action."""
    transaction_id: str
    action: InterventionAction
    success: bool
    channel_used: Optional[ContactChannel] = None
    api_request: Optional[dict] = None
    api_response: Optional[dict] = None
    payment_link_id: Optional[str] = None
    simulated: bool = True
    error_message: Optional[str] = None
    executed_at: datetime = Field(default_factory=datetime.utcnow)


# ─── Helper Functions ──────────────────────────────────────────────

def classify_amount_band(amount: float) -> AmountBand:
    """Classify an amount into a band."""
    if amount < 100:
        return AmountBand.MICRO
    elif amount < 500:
        return AmountBand.LOW
    elif amount < 5000:
        return AmountBand.MEDIUM
    elif amount < 50000:
        return AmountBand.HIGH
    else:
        return AmountBand.PREMIUM


def classify_customer_segment(
    total_transactions: int = 1,
    days_since_first: int = 0,
    recent_failures: int = 0
) -> CustomerSegment:
    """Classify a customer into a segment based on history."""
    if days_since_first < 30:
        return CustomerSegment.NEW
    elif recent_failures > 3:
        return CustomerSegment.CHURNING
    elif total_transactions > 20:
        return CustomerSegment.HIGH_VALUE
    else:
        return CustomerSegment.REGULAR
