"""Intervention Policy Engine — the decision brain.

Maps (root_cause, customer_segment, amount_band, channel_consent) → best recovery action.
Uses a priority-ordered decision table with LLM-upgradeable reasoning.
"""

from app.models.events import (
    RevenueEvent, RootCause, InterventionAction, ContactChannel,
    CustomerSegment, AmountBand, EventStatus, PolicyDecision,
)
from app.config import settings


# ─── Policy Decision Table ──────────────────────────────────────────
# Priority-ordered rules. First matching rule wins.
# Format: (conditions_dict, action, channel, reasoning, extras)

POLICY_TABLE = [
    # ── Fraud: NEVER process (belt-and-suspenders, should be caught by sieve) ──
    {
        "root_cause": [RootCause.FRAUD_SUSPECTED],
        "action": InterventionAction.SNOOZE,
        "channel": ContactChannel.NONE,
        "reasoning": "Fraud-suspected: excluded from recovery. Routed to risk team.",
    },

    # ── Mandate Revoked: contact to re-register, don't force retry ──
    {
        "root_cause": [RootCause.MANDATE_REVOKED],
        "action": InterventionAction.PAYMENT_LINK,
        "channel": ContactChannel.WHATSAPP,
        "reasoning": "eMandate revoked by customer. Sending payment link with option to re-register mandate via preferred channel.",
    },

    # ── Technical failures (gateway/network): smart retry ──
    {
        "root_cause": [RootCause.GATEWAY_TIMEOUT, RootCause.NETWORK_ERROR],
        "action": InterventionAction.SMART_RETRY,
        "channel": ContactChannel.NONE,
        "retry_delay_minutes": 5,
        "reasoning": "Technical failure (gateway/network). Smart retry after 5-minute cooldown — high probability of success on retry.",
    },

    # ── UPI timeout: retry with slight delay ──
    {
        "root_cause": [RootCause.UPI_TIMEOUT],
        "action": InterventionAction.SMART_RETRY,
        "channel": ContactChannel.SMS,
        "retry_delay_minutes": 15,
        "reasoning": "UPI collect request timed out. Customer may have been unavailable. Retry after 15 minutes with SMS notification.",
    },

    # ── VPA Invalid: suggest alternate payment ──
    {
        "root_cause": [RootCause.VPA_INVALID],
        "action": InterventionAction.ALT_PAYMENT_METHOD,
        "channel": ContactChannel.SMS,
        "reasoning": "Invalid VPA address. Suggesting alternate payment methods (card/netbanking/wallet) via SMS.",
    },

    # ── Expired Card: suggest alternate method ──
    {
        "root_cause": [RootCause.EXPIRED_CARD],
        "action": InterventionAction.ALT_PAYMENT_METHOD,
        "channel": ContactChannel.EMAIL,
        "reasoning": "Card on file expired. Sending alternate payment method options via email with payment link.",
    },

    # ── 3DS Dropout: payment link to bypass friction ──
    {
        "root_cause": [RootCause.THREE_DS_DROPOUT],
        "action": InterventionAction.PAYMENT_LINK,
        "channel": ContactChannel.WHATSAPP,
        "reasoning": "Customer dropped off during 3DS authentication. Sending direct payment link via WhatsApp to reduce friction.",
    },

    # ── Customer Abandoned + High Value: personalized nudge ──
    {
        "root_cause": [RootCause.CUSTOMER_ABANDONED],
        "amount_band": [AmountBand.HIGH, AmountBand.PREMIUM],
        "action": InterventionAction.PAYMENT_LINK,
        "channel": ContactChannel.WHATSAPP,
        "reasoning": "High-value checkout abandoned. Sending personalized recovery link via WhatsApp.",
    },

    # ── Customer Abandoned + Low/Micro: discount nudge ──
    {
        "root_cause": [RootCause.CUSTOMER_ABANDONED],
        "amount_band": [AmountBand.MICRO, AmountBand.LOW],
        "customer_segment": [CustomerSegment.CHURNING, CustomerSegment.NEW],
        "action": InterventionAction.DISCOUNT_NUDGE,
        "channel": ContactChannel.SMS,
        "discount_percent": 5.0,
        "reasoning": "Low-value checkout abandoned by new/churning customer. Sending bounded 5% discount nudge via SMS to incentivize completion.",
    },

    # ── Customer Abandoned + Medium: payment link ──
    {
        "root_cause": [RootCause.CUSTOMER_ABANDONED],
        "action": InterventionAction.PAYMENT_LINK,
        "channel": ContactChannel.SMS,
        "reasoning": "Checkout abandoned. Sending payment link via SMS as a gentle recovery nudge.",
    },

    # ── Insufficient Funds + Premium: human escalation ──
    {
        "root_cause": [RootCause.INSUFFICIENT_FUNDS],
        "amount_band": [AmountBand.PREMIUM],
        "action": InterventionAction.HUMAN_ESCALATION,
        "channel": ContactChannel.EMAIL,
        "reasoning": "High-value payment failed due to insufficient funds. Escalating to human agent for personalized follow-up.",
    },

    # ── Insufficient Funds + High Value Customer: smart retry ──
    {
        "root_cause": [RootCause.INSUFFICIENT_FUNDS],
        "customer_segment": [CustomerSegment.HIGH_VALUE],
        "action": InterventionAction.SMART_RETRY,
        "channel": ContactChannel.WHATSAPP,
        "retry_delay_minutes": 60,
        "reasoning": "Insufficient funds for high-value customer. Smart retry after 1 hour (salary/transfer window) with WhatsApp notification.",
    },

    # ── Insufficient Funds: payment link with alt methods ──
    {
        "root_cause": [RootCause.INSUFFICIENT_FUNDS],
        "action": InterventionAction.PAYMENT_LINK,
        "channel": ContactChannel.SMS,
        "retry_delay_minutes": 30,
        "reasoning": "Insufficient funds. Sending payment link with multiple payment options after 30-minute cooldown.",
    },

    # ── Bank Declined + Premium: human escalation ──
    {
        "root_cause": [RootCause.BANK_DECLINED],
        "amount_band": [AmountBand.PREMIUM],
        "action": InterventionAction.HUMAN_ESCALATION,
        "channel": ContactChannel.EMAIL,
        "reasoning": "Premium-value bank decline. Escalating to human agent — may need bank-side resolution.",
    },

    # ── Bank Declined: smart retry with alternate method suggestion ──
    {
        "root_cause": [RootCause.BANK_DECLINED],
        "action": InterventionAction.ALT_PAYMENT_METHOD,
        "channel": ContactChannel.SMS,
        "reasoning": "Bank declined transaction. Suggesting alternate payment method to bypass bank-side block.",
    },

    # ── Unknown: conservative approach, payment link ──
    {
        "root_cause": [RootCause.UNKNOWN],
        "action": InterventionAction.PAYMENT_LINK,
        "channel": ContactChannel.EMAIL,
        "reasoning": "Unknown failure reason. Sending generic payment link via email as conservative recovery approach.",
    },
]


def _matches_rule(event: RevenueEvent, rule: dict) -> bool:
    """Check if an event matches a policy rule's conditions."""
    # Check root cause
    if "root_cause" in rule:
        if event.root_cause not in [rc.value if isinstance(rc, RootCause) else rc for rc in rule["root_cause"]]:
            return False

    # Check amount band
    if "amount_band" in rule:
        if event.amount_band not in [ab.value if isinstance(ab, AmountBand) else ab for ab in rule["amount_band"]]:
            return False

    # Check customer segment
    if "customer_segment" in rule:
        if event.customer_segment not in [cs.value if isinstance(cs, CustomerSegment) else cs for cs in rule["customer_segment"]]:
            return False

    return True


def decide_intervention(event: RevenueEvent) -> PolicyDecision:
    """Decide the best intervention for a given event.

    Uses priority-ordered policy table. First matching rule wins.
    Checks HITL threshold for high-value transactions.

    Args:
        event: Diagnosed, non-fraud event

    Returns:
        PolicyDecision with action, channel, reasoning, and any extras
    """
    # HITL check for high-value transactions
    requires_hitl = event.amount >= settings.HITL_AMOUNT_THRESHOLD

    # Find first matching rule
    for rule in POLICY_TABLE:
        if _matches_rule(event, rule):
            # Cap discount at configured maximum
            discount = rule.get("discount_percent")
            if discount and discount > settings.MAX_DISCOUNT_PERCENT:
                discount = settings.MAX_DISCOUNT_PERCENT

            decision = PolicyDecision(
                transaction_id=event.transaction_id,
                action=rule["action"],
                reasoning=rule["reasoning"],
                channel=rule.get("channel", ContactChannel.NONE),
                retry_delay_minutes=rule.get("retry_delay_minutes"),
                discount_percent=discount,
                requires_hitl=requires_hitl,
            )

            if requires_hitl and rule["action"] != InterventionAction.HUMAN_ESCALATION:
                decision.action = InterventionAction.HUMAN_ESCALATION
                decision.reasoning = (
                    f"HITL override: Transaction amount ₹{event.amount:,.2f} exceeds threshold "
                    f"₹{settings.HITL_AMOUNT_THRESHOLD:,.2f}. Original action '{rule['action']}' "
                    f"upgraded to human escalation. Original reasoning: {rule['reasoning']}"
                )

            return decision

    # Fallback: snooze if nothing matches
    return PolicyDecision(
        transaction_id=event.transaction_id,
        action=InterventionAction.SNOOZE,
        reasoning="No matching policy rule found. Event snoozed for manual review.",
        requires_hitl=requires_hitl,
    )


def assign_interventions(events: list[RevenueEvent]) -> list[PolicyDecision]:
    """Assign interventions to a batch of diagnosed events.

    Args:
        events: Diagnosed, fraud-filtered events

    Returns:
        List of PolicyDecision objects
    """
    decisions = []
    for event in events:
        if event.status != EventStatus.DIAGNOSED:
            continue

        decision = decide_intervention(event)
        event.assigned_action = decision.action
        event.action_reasoning = decision.reasoning
        event.status = EventStatus.POLICY_ASSIGNED
        decisions.append(decision)

    return decisions
