"""Root-cause classifier — hybrid rule-based + LLM approach.

Classifies each at-risk event into a root cause with confidence score
and a human-readable reasoning string for the audit trail.
"""

from app.models.events import RevenueEvent, RootCause, EventStatus, DiagnosisResult


# ─── Rule-Based Classification ──────────────────────────────────────

# Maps failure_reason_code → (root_cause, confidence, reasoning_template)
FAILURE_CODE_RULES: dict[str, tuple[RootCause, float, str]] = {
    "INSUFFICIENT_FUNDS": (
        RootCause.INSUFFICIENT_FUNDS, 0.95,
        "Payment declined due to insufficient funds in customer's {method} account. "
        "This is a recoverable failure — customer may have funds available later."
    ),
    "CARD_EXPIRED": (
        RootCause.EXPIRED_CARD, 0.98,
        "Card on file has expired. Customer needs to update payment method. "
        "Recovery via alternate payment method suggestion recommended."
    ),
    "BANK_DECLINED": (
        RootCause.BANK_DECLINED, 0.90,
        "Issuing bank declined the transaction. Possible reasons: daily limit exceeded, "
        "international transaction block, or bank-side risk flag. Retry after cooldown may succeed."
    ),
    "GATEWAY_TIMEOUT": (
        RootCause.GATEWAY_TIMEOUT, 0.92,
        "Payment gateway timed out during processing. This is a technical failure, "
        "not customer-initiated. Smart retry is the recommended intervention."
    ),
    "UPI_TIMEOUT": (
        RootCause.UPI_TIMEOUT, 0.88,
        "UPI collect request timed out — customer did not approve within the window. "
        "May indicate customer was unavailable; retry at a different time recommended."
    ),
    "VPA_INVALID": (
        RootCause.VPA_INVALID, 0.97,
        "UPI VPA (Virtual Payment Address) is invalid or not registered. "
        "Customer needs to provide a valid VPA or use an alternate payment method."
    ),
    "3DS_DROPOUT": (
        RootCause.THREE_DS_DROPOUT, 0.85,
        "Customer dropped off during 3D Secure authentication. "
        "This may indicate friction in the authentication flow. Payment link may help bypass."
    ),
    "CUSTOMER_ABANDONED": (
        RootCause.CUSTOMER_ABANDONED, 0.80,
        "Customer initiated checkout but abandoned before completing payment. "
        "Recovery nudge via preferred channel recommended."
    ),
    "MANDATE_REVOKED": (
        RootCause.MANDATE_REVOKED, 0.96,
        "eMandate/AutoPay has been explicitly revoked by the customer. "
        "This is an intentional action — contact to re-register mandate, do not force retry."
    ),
    "FRAUD_SUSPECTED": (
        RootCause.FRAUD_SUSPECTED, 0.93,
        "Transaction flagged for suspected fraudulent activity by risk engine. "
        "EXCLUDED from recovery flow — routed to risk team for manual review."
    ),
    "NETWORK_ERROR": (
        RootCause.NETWORK_ERROR, 0.90,
        "Network connectivity issue between bank and payment gateway. "
        "Purely technical failure — smart retry after brief cooldown recommended."
    ),
}


def classify_event(event: RevenueEvent) -> DiagnosisResult:
    """Classify a single event's root cause using rule-based matching.

    Args:
        event: The revenue event to classify

    Returns:
        DiagnosisResult with root_cause, confidence, and reasoning
    """
    failure_code = event.failure_reason_code.upper().strip()

    # Try direct rule match
    if failure_code in FAILURE_CODE_RULES:
        root_cause, confidence, reasoning_template = FAILURE_CODE_RULES[failure_code]
        reasoning = reasoning_template.format(method=event.payment_method)

        # Adjust confidence based on available information
        if event.failure_reason_message:
            confidence = min(confidence + 0.02, 1.0)

        return DiagnosisResult(
            transaction_id=event.transaction_id,
            root_cause=root_cause,
            confidence=round(confidence, 2),
            reasoning=reasoning,
            is_fraud=(root_cause == RootCause.FRAUD_SUSPECTED),
            method="rule_based",
        )

    # Fallback: try to infer from failure message keywords
    msg = (event.failure_reason_message or "").lower()
    for keyword, (root_cause, conf, template) in _MESSAGE_KEYWORD_MAP.items():
        if keyword in msg:
            return DiagnosisResult(
                transaction_id=event.transaction_id,
                root_cause=root_cause,
                confidence=round(conf * 0.85, 2),  # Lower confidence for keyword match
                reasoning=f"Inferred from failure message keyword '{keyword}': {template.format(method=event.payment_method)}",
                is_fraud=(root_cause == RootCause.FRAUD_SUSPECTED),
                method="keyword_inference",
            )

    # Ultimate fallback: unknown
    return DiagnosisResult(
        transaction_id=event.transaction_id,
        root_cause=RootCause.UNKNOWN,
        confidence=0.30,
        reasoning=f"Unable to classify failure reason code '{event.failure_reason_code}' "
                  f"with message '{event.failure_reason_message}'. Manual review recommended.",
        is_fraud=False,
        method="fallback",
    )


# Keyword-based fallback classification
_MESSAGE_KEYWORD_MAP: dict[str, tuple[RootCause, float, str]] = {
    "insufficient": (RootCause.INSUFFICIENT_FUNDS, 0.85,
                     "Keyword match: insufficient funds detected in failure message"),
    "expired": (RootCause.EXPIRED_CARD, 0.85,
                "Keyword match: card expiry detected in failure message"),
    "declined": (RootCause.BANK_DECLINED, 0.80,
                 "Keyword match: bank decline detected in failure message"),
    "timeout": (RootCause.GATEWAY_TIMEOUT, 0.80,
                "Keyword match: timeout detected in failure message"),
    "timed out": (RootCause.GATEWAY_TIMEOUT, 0.80,
                  "Keyword match: timeout detected in failure message"),
    "fraud": (RootCause.FRAUD_SUSPECTED, 0.90,
              "Keyword match: fraud indicator detected in failure message"),
    "revoked": (RootCause.MANDATE_REVOKED, 0.85,
                "Keyword match: mandate revocation detected in failure message"),
    "abandoned": (RootCause.CUSTOMER_ABANDONED, 0.75,
                  "Keyword match: customer abandonment detected in failure message"),
    "vpa": (RootCause.VPA_INVALID, 0.80,
            "Keyword match: VPA issue detected in failure message"),
    "3d secure": (RootCause.THREE_DS_DROPOUT, 0.80,
                  "Keyword match: 3DS dropout detected in failure message"),
    "network": (RootCause.NETWORK_ERROR, 0.80,
                "Keyword match: network error detected in failure message"),
}


def classify_batch(events: list[RevenueEvent]) -> list[DiagnosisResult]:
    """Classify an entire batch of events.

    Args:
        events: List of detected (at-risk) events

    Returns:
        List of DiagnosisResult objects
    """
    results = []
    for event in events:
        if event.status not in (EventStatus.DETECTED, EventStatus.INGESTED):
            continue
        result = classify_event(event)
        # Update the event in-place
        event.root_cause = result.root_cause
        event.diagnosis_confidence = result.confidence
        event.diagnosis_reasoning = result.reasoning
        event.status = EventStatus.DIAGNOSED
        results.append(result)
    return results
