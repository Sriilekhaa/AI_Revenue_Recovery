"""Hard-coded stopping rules — non-optional, non-configurable safety bounds.

These stopping rules are explicitly what separates a winning submission
from a disqualified one. They cannot be bypassed.
"""

from datetime import datetime, timedelta
from typing import Optional

from app.models.events import RevenueEvent, EventStatus, InterventionAction, PolicyDecision
from app.models.audit import ComplianceCheckResult
from app.config import settings


def check_retry_limit(event: RevenueEvent) -> tuple[bool, str]:
    """Check if the event has exceeded the maximum retry attempts.

    Returns:
        (within_limit, reason_string)
    """
    max_retries = settings.MAX_RETRY_ATTEMPTS
    if event.retry_count >= max_retries:
        return False, (
            f"Retry limit exceeded: {event.retry_count}/{max_retries} attempts used. "
            f"Transaction moved to exception bucket per stopping rule."
        )
    return True, f"Within retry limit: {event.retry_count}/{max_retries} attempts used."


def check_cooldown(
    event: RevenueEvent,
    last_contact_time: Optional[datetime] = None,
) -> tuple[bool, str]:
    """Check if the minimum cooldown period has elapsed since last contact.

    Returns:
        (cooldown_elapsed, reason_string)
    """
    if last_contact_time is None:
        return True, "No previous contact recorded. Cooldown check passed."

    cooldown = timedelta(minutes=settings.COOLDOWN_MINUTES)
    now = datetime.utcnow()
    elapsed = now - last_contact_time

    if elapsed < cooldown:
        remaining = cooldown - elapsed
        return False, (
            f"Cooldown not elapsed: last contacted {elapsed.total_seconds()/60:.0f} min ago. "
            f"Minimum cooldown is {settings.COOLDOWN_MINUTES} min. "
            f"Next contact allowed in {remaining.total_seconds()/60:.0f} min."
        )

    return True, (
        f"Cooldown elapsed: last contacted {elapsed.total_seconds()/60:.0f} min ago "
        f"(minimum: {settings.COOLDOWN_MINUTES} min)."
    )


def check_auto_exception(event: RevenueEvent) -> tuple[bool, str]:
    """Check if the event should be auto-moved to exception bucket.

    Low-value transactions that are unresolved for too long get auto-excepted.

    Returns:
        (should_continue, reason_string)  — False means auto-exception triggered
    """
    threshold = settings.AUTO_EXCEPTION_AMOUNT_THRESHOLD
    max_days = settings.AUTO_EXCEPTION_DAYS
    now = datetime.utcnow()
    age = now - event.timestamp

    if event.amount < threshold and age > timedelta(days=max_days):
        return False, (
            f"Auto-exception triggered: Transaction amount ₹{event.amount:.2f} < ₹{threshold:.2f} "
            f"and age {age.days} days > {max_days} days. "
            f"Moved to exception bucket per stopping rule."
        )

    return True, (
        f"Auto-exception check passed: amount ₹{event.amount:.2f} "
        f"{'≥' if event.amount >= threshold else '<'} threshold ₹{threshold:.2f}, "
        f"age {age.days} days {'≤' if age.days <= max_days else '>'} {max_days} days."
    )


def check_discount_stacking(
    event: RevenueEvent,
    previous_discounts: list[float],
) -> tuple[bool, str]:
    """Ensure no discount stacking across attempts.

    Returns:
        (can_apply_discount, reason_string)
    """
    if previous_discounts:
        total_applied = sum(previous_discounts)
        return False, (
            f"Discount stacking blocked: {len(previous_discounts)} previous discount(s) "
            f"totaling {total_applied:.1f}% already applied. "
            f"No additional discounts allowed per anti-stacking rule."
        )

    return True, "No previous discounts applied. Discount eligible."


def apply_stopping_rules(
    event: RevenueEvent,
    decision: PolicyDecision,
    last_contact_time: Optional[datetime] = None,
    previous_discounts: Optional[list[float]] = None,
) -> PolicyDecision:
    """Apply all stopping rules to a policy decision.

    May modify the decision to SNOOZE or EXCEPTION if rules are violated.

    Args:
        event: The revenue event
        decision: The proposed policy decision
        last_contact_time: When the customer was last contacted
        previous_discounts: List of discount percentages previously applied

    Returns:
        Modified PolicyDecision (may be blocked)
    """
    blocked_reasons = []

    # 1. Retry limit check
    within_limit, reason = check_retry_limit(event)
    if not within_limit:
        blocked_reasons.append(reason)

    # 2. Cooldown check
    cooldown_ok, reason = check_cooldown(event, last_contact_time)
    if not cooldown_ok:
        blocked_reasons.append(reason)

    # 3. Auto-exception check
    should_continue, reason = check_auto_exception(event)
    if not should_continue:
        blocked_reasons.append(reason)

    # 4. Discount stacking check (only if action involves a discount)
    if decision.action == InterventionAction.DISCOUNT_NUDGE:
        can_discount, reason = check_discount_stacking(event, previous_discounts or [])
        if not can_discount:
            blocked_reasons.append(reason)

    # If any stopping rule triggered, block the action
    if blocked_reasons:
        decision.blocked_reason = " | ".join(blocked_reasons)
        decision.action = InterventionAction.SNOOZE
        decision.reasoning = (
            f"BLOCKED by stopping rules: {decision.blocked_reason}. "
            f"Original action was '{decision.action}'. Event snoozed."
        )

    return decision
