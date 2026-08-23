"""Policy configuration API endpoints."""

from fastapi import APIRouter

router = APIRouter(prefix="/api/policies", tags=["Policies"])


@router.get("/")
async def get_policies():
    """Get current policy configuration."""
    from app.config import settings
    from app.layer3_policy.engine import POLICY_TABLE

    return {
        "stopping_rules": {
            "max_retry_attempts": settings.MAX_RETRY_ATTEMPTS,
            "cooldown_minutes": settings.COOLDOWN_MINUTES,
            "auto_exception_days": settings.AUTO_EXCEPTION_DAYS,
            "auto_exception_amount_threshold": settings.AUTO_EXCEPTION_AMOUNT_THRESHOLD,
            "max_discount_percent": settings.MAX_DISCOUNT_PERCENT,
            "hitl_amount_threshold": settings.HITL_AMOUNT_THRESHOLD,
            "no_contact_hours": f"{settings.NO_CONTACT_START_HOUR}:00 - {settings.NO_CONTACT_END_HOUR}:00",
        },
        "intervention_actions": [
            "smart_retry", "alt_payment_method", "payment_link",
            "discount_nudge", "human_escalation", "snooze"
        ],
        "policy_rules_count": len(POLICY_TABLE),
        "policy_rules": [
            {
                "root_causes": [str(rc) for rc in rule.get("root_cause", [])],
                "action": str(rule["action"]),
                "channel": str(rule.get("channel", "none")),
                "reasoning": rule.get("reasoning", ""),
            }
            for rule in POLICY_TABLE
        ],
    }
