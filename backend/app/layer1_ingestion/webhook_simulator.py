"""Webhook simulator — formats synthetic events as Razorpay-style webhook payloads."""

from datetime import datetime
from app.models.events import RevenueEvent, EventType, RazorpayWebhookEvent


def _payment_failed_payload(event: RevenueEvent) -> dict:
    """Build a payment.failed webhook payload."""
    return {
        "payment": {
            "entity": {
                "id": event.transaction_id,
                "entity": "payment",
                "amount": int(event.amount * 100),  # Razorpay uses paise
                "currency": event.currency,
                "status": "failed",
                "order_id": event.order_id,
                "method": event.payment_method,
                "description": f"Payment for order {event.order_id}",
                "error_code": event.failure_reason_code,
                "error_description": event.failure_reason_message,
                "error_source": "customer" if event.failure_reason_code in (
                    "INSUFFICIENT_FUNDS", "CARD_EXPIRED", "CUSTOMER_ABANDONED", "3DS_DROPOUT"
                ) else "bank",
                "error_step": "payment_processing",
                "error_reason": event.failure_reason_code.lower(),
                "contact": event.customer_phone,
                "email": event.customer_email,
                "created_at": int(event.timestamp.timestamp()),
            }
        }
    }


def _checkout_abandoned_payload(event: RevenueEvent) -> dict:
    """Build a checkout-abandoned event payload (custom event, not native Razorpay)."""
    return {
        "order": {
            "entity": {
                "id": event.order_id,
                "entity": "order",
                "amount": int(event.amount * 100),
                "currency": event.currency,
                "status": "created",  # Order created but not paid
                "attempts": event.retry_count,
                "notes": {
                    "abandonment_reason": event.failure_reason_code,
                    "customer_id": event.customer_id,
                },
                "created_at": int(event.timestamp.timestamp()),
            }
        }
    }


def _subscription_failed_payload(event: RevenueEvent) -> dict:
    """Build a subscription.charged.failed webhook payload."""
    return {
        "subscription": {
            "entity": {
                "id": event.subscription_id,
                "entity": "subscription",
                "plan_id": f"plan_{event.subscription_id[-8:] if event.subscription_id else 'default'}",
                "status": "halted",
                "current_start": int(event.timestamp.timestamp()) - 2592000,  # ~30 days ago
                "current_end": int(event.timestamp.timestamp()),
                "charge_at": int(event.timestamp.timestamp()),
                "customer_id": event.customer_id,
            }
        },
        "payment": {
            "entity": {
                "id": event.transaction_id,
                "amount": int(event.amount * 100),
                "status": "failed",
                "error_code": event.failure_reason_code,
                "error_description": event.failure_reason_message,
            }
        }
    }


def _invoice_expired_payload(event: RevenueEvent) -> dict:
    """Build an invoice.expired webhook payload."""
    return {
        "invoice": {
            "entity": {
                "id": event.invoice_id,
                "entity": "invoice",
                "type": "invoice",
                "status": "expired",
                "amount": int(event.amount * 100),
                "currency": event.currency,
                "customer_id": event.customer_id,
                "description": f"Invoice {event.invoice_id}",
                "expire_by": int(event.timestamp.timestamp()),
                "issued_at": int(event.timestamp.timestamp()) - 604800,  # 7 days ago
                "created_at": int(event.timestamp.timestamp()) - 604800,
            }
        }
    }


# Event type → (Razorpay event name, payload builder)
EVENT_TYPE_MAP = {
    EventType.PAYMENT_FAILED: ("payment.failed", _payment_failed_payload),
    EventType.CHECKOUT_ABANDONED: ("order.created", _checkout_abandoned_payload),
    EventType.MANDATE_FAILED: ("subscription.charged.failed", _subscription_failed_payload),
    EventType.INVOICE_OVERDUE: ("invoice.expired", _invoice_expired_payload),
}


def to_webhook_event(event: RevenueEvent) -> RazorpayWebhookEvent:
    """Convert a RevenueEvent to a Razorpay-style webhook event."""
    event_name, builder = EVENT_TYPE_MAP.get(
        event.event_type,
        ("payment.failed", _payment_failed_payload)
    )

    return RazorpayWebhookEvent(
        event=event_name,
        contains=[event_name.split(".")[0]],
        payload=builder(event),
        created_at=int(event.timestamp.timestamp()),
    )


def simulate_webhook_batch(events: list[RevenueEvent]) -> list[RazorpayWebhookEvent]:
    """Convert an entire batch of events to webhook payloads."""
    return [to_webhook_event(e) for e in events]
