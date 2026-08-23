"""Action execution orchestrator — dispatches recovery actions.

Handles all 6 intervention types, logs API req/res, coordinates
with idempotency guard, consent checks, and messaging layer.
"""

import random
from datetime import datetime, timedelta
from typing import Optional

from app.models.events import (
    RevenueEvent, InterventionAction, ContactChannel,
    EventStatus, PolicyDecision, ExecutionResult,
)
from app.models.audit import AuditEntry
from app.layer3_policy.consent_check import (
    run_compliance_checks, find_best_consented_channel,
)
from app.layer3_policy.stopping_rules import apply_stopping_rules
from app.layer4_execution.razorpay_client import razorpay_client
from app.layer4_execution.idempotency import is_already_executed, mark_executed
from app.layer4_execution.messaging import send_message
from app.database import db


def _simulate_recovery_outcome(event: RevenueEvent, action: InterventionAction) -> bool:
    """Simulate whether a recovery action succeeds.

    Uses realistic probabilities based on the action type and root cause.
    """
    # Base recovery probabilities by action type
    base_probs = {
        InterventionAction.SMART_RETRY: 0.65,
        InterventionAction.ALT_PAYMENT_METHOD: 0.45,
        InterventionAction.PAYMENT_LINK: 0.40,
        InterventionAction.DISCOUNT_NUDGE: 0.55,
        InterventionAction.HUMAN_ESCALATION: 0.30,
        InterventionAction.SNOOZE: 0.0,
    }

    prob = base_probs.get(action, 0.3)

    # Adjust based on root cause
    if event.root_cause in ("gateway_timeout", "network_error"):
        prob += 0.20  # Technical failures are highly recoverable
    elif event.root_cause == "insufficient_funds":
        prob += 0.05
    elif event.root_cause == "mandate_revoked":
        prob -= 0.15
    elif event.root_cause == "customer_abandoned":
        prob += 0.10

    # Adjust based on amount (lower amounts more likely to be recovered)
    if event.amount < 500:
        prob += 0.10
    elif event.amount > 50000:
        prob -= 0.10

    return random.random() < min(prob, 0.85)


def execute_action(
    event: RevenueEvent,
    decision: PolicyDecision,
    batch_id: str,
) -> ExecutionResult:
    """Execute a single recovery action.

    Handles idempotency, compliance checks, API calls, and outcome simulation.

    Args:
        event: The revenue event
        decision: The policy decision to execute
        batch_id: Current batch ID

    Returns:
        ExecutionResult with full details
    """
    action = decision.action
    channel = decision.channel

    # ── Idempotency Check ──
    if is_already_executed(event.transaction_id, action):
        return ExecutionResult(
            transaction_id=event.transaction_id,
            action=action,
            success=False,
            error_message="Idempotency check: action already executed for this transaction.",
            simulated=True,
        )

    # ── Compliance Checks (for contact actions) ──
    if channel != ContactChannel.NONE and action != InterventionAction.SNOOZE:
        # Find best consented channel
        best_channel = find_best_consented_channel(event, channel)
        if best_channel == ContactChannel.NONE:
            # No consented channel available
            _log_compliance_block(event, decision, batch_id, "No consented channel available")
            event.status = EventStatus.SNOOZED
            event.exception_reason = "No consented contact channel available"
            return ExecutionResult(
                transaction_id=event.transaction_id,
                action=action,
                success=False,
                error_message="No consented contact channel available. Action blocked.",
                simulated=True,
            )
        channel = best_channel

        # Run compliance checks
        compliance = run_compliance_checks(event, channel, event.retry_count)
        if not compliance.all_clear:
            _log_compliance_block(event, decision, batch_id, "; ".join(compliance.blocked_reasons))
            event.status = EventStatus.SNOOZED
            event.exception_reason = f"Compliance blocked: {'; '.join(compliance.blocked_reasons)}"
            return ExecutionResult(
                transaction_id=event.transaction_id,
                action=action,
                success=False,
                error_message=f"Compliance check failed: {'; '.join(compliance.blocked_reasons)}",
                simulated=True,
            )

    # ── Execute based on action type ──
    api_result = {}

    if action == InterventionAction.SMART_RETRY:
        api_result = razorpay_client.create_order(
            amount=event.amount,
            receipt=f"retry_{event.transaction_id}",
            notes={"recovery": True, "original_txn": event.transaction_id},
        )

    elif action == InterventionAction.PAYMENT_LINK:
        api_result = razorpay_client.create_payment_link(
            amount=event.amount,
            customer_email=event.customer_email,
            customer_phone=event.customer_phone,
            description=f"Recovery payment for {event.transaction_id}",
            reference_id=event.transaction_id,
        )

    elif action == InterventionAction.ALT_PAYMENT_METHOD:
        api_result = razorpay_client.create_payment_link(
            amount=event.amount,
            customer_email=event.customer_email,
            customer_phone=event.customer_phone,
            description=f"Try alternate payment for {event.transaction_id}",
            reference_id=f"alt_{event.transaction_id}",
        )

    elif action == InterventionAction.DISCOUNT_NUDGE:
        discount = decision.discount_percent or 5.0
        discounted_amount = event.amount * (1 - discount / 100)
        api_result = razorpay_client.create_payment_link(
            amount=discounted_amount,
            customer_email=event.customer_email,
            customer_phone=event.customer_phone,
            description=f"{discount}% discount recovery for {event.transaction_id}",
            reference_id=f"disc_{event.transaction_id}",
        )

    elif action == InterventionAction.HUMAN_ESCALATION:
        api_result = {
            "simulated": True,
            "request": {"action": "escalate_to_human", "transaction_id": event.transaction_id},
            "response": {"status": "escalated", "assigned_to": "recovery_team_queue"},
        }

    elif action == InterventionAction.SNOOZE:
        event.status = EventStatus.SNOOZED
        event.exception_reason = decision.reasoning
        mark_executed(event.transaction_id, action)
        return ExecutionResult(
            transaction_id=event.transaction_id,
            action=action,
            success=True,
            simulated=True,
        )

    # ── Send notification message if contact channel is set ──
    if channel != ContactChannel.NONE:
        link = ""
        if api_result and "response" in api_result:
            link = api_result["response"].get("short_url", api_result["response"].get("id", ""))

        template_key = {
            InterventionAction.SMART_RETRY: "retry_notification",
            InterventionAction.ALT_PAYMENT_METHOD: "alt_payment",
            InterventionAction.DISCOUNT_NUDGE: "discount_nudge",
        }.get(action, "payment_link")

        send_message(
            channel=channel,
            phone=event.customer_phone,
            email=event.customer_email,
            template_key=template_key,
            template_vars={
                "name": event.customer_id[:10],
                "amount": event.amount,
                "link": link,
                "method": event.payment_method,
                "discount": decision.discount_percent or 0,
            },
            transaction_id=event.transaction_id,
        )

    # ── Simulate recovery outcome ──
    recovered = _simulate_recovery_outcome(event, action)

    if recovered:
        recovered_amount = event.amount
        if action == InterventionAction.DISCOUNT_NUDGE and decision.discount_percent:
            recovered_amount = event.amount * (1 - decision.discount_percent / 100)

        event.status = EventStatus.RECOVERED
        event.recovered_amount = recovered_amount
        event.recovered_at = datetime.utcnow()
    else:
        event.status = EventStatus.CONTACTED
        event.retry_count += 1

    # Mark as executed for idempotency
    mark_executed(event.transaction_id, action)

    # ── Log audit entry ──
    _log_execution(event, decision, batch_id, api_result, recovered, channel)

    return ExecutionResult(
        transaction_id=event.transaction_id,
        action=action,
        success=recovered,
        channel_used=channel,
        api_request=api_result.get("request"),
        api_response=api_result.get("response"),
        simulated=api_result.get("simulated", True),
    )


def _log_execution(
    event: RevenueEvent,
    decision: PolicyDecision,
    batch_id: str,
    api_result: dict,
    recovered: bool,
    channel: ContactChannel,
):
    """Log the execution action to the audit trail."""
    db.log_audit(AuditEntry(
        batch_id=batch_id,
        transaction_id=event.transaction_id,
        stage="execution",
        action=f"{decision.action} via {channel}",
        root_cause=event.root_cause,
        diagnosis_confidence=event.diagnosis_confidence,
        diagnosis_reasoning=event.diagnosis_reasoning,
        policy_reasoning=decision.reasoning,
        outcome="recovered" if recovered else "contacted",
        outcome_detail=f"Amount: ₹{event.recovered_amount:,.2f}" if recovered else "Awaiting response",
        recovered_amount=event.recovered_amount if recovered else None,
        consent_checked=True,
        consent_status="granted",
        dnd_checked=True,
        dnd_status="clear",
        retry_limit_checked=True,
        retry_limit_status=f"{event.retry_count}/{3}",
        api_endpoint=str(api_result.get("request", {}).get("action", "razorpay_api")),
        api_request_summary=str(api_result.get("request", ""))[:200],
        api_response_code=200 if not api_result.get("error") else 500,
        api_response_summary=str(api_result.get("response", ""))[:200],
    ))


def _log_compliance_block(
    event: RevenueEvent,
    decision: PolicyDecision,
    batch_id: str,
    reason: str,
):
    """Log a compliance-blocked action to the audit trail."""
    db.log_audit(AuditEntry(
        batch_id=batch_id,
        transaction_id=event.transaction_id,
        stage="execution",
        action=f"{decision.action} — BLOCKED",
        root_cause=event.root_cause,
        policy_reasoning=decision.reasoning,
        outcome="blocked",
        outcome_detail=reason,
        consent_checked=True,
        consent_status="denied",
        dnd_checked=True,
        dnd_status="blocked" if event.dnd_registered else "clear",
    ))


def execute_batch(
    events: list[RevenueEvent],
    decisions: list[PolicyDecision],
    batch_id: str,
) -> list[ExecutionResult]:
    """Execute recovery actions for an entire batch.

    Args:
        events: Events with policy decisions assigned
        decisions: Corresponding policy decisions
        batch_id: Current batch ID

    Returns:
        List of ExecutionResult objects
    """
    decision_map = {d.transaction_id: d for d in decisions}
    results = []

    for event in events:
        if event.status != EventStatus.POLICY_ASSIGNED:
            continue

        decision = decision_map.get(event.transaction_id)
        if not decision:
            continue

        result = execute_action(event, decision, batch_id)
        results.append(result)

    return results
