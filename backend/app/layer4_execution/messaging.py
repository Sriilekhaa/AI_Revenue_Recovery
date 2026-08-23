"""Messaging simulation layer — logs outbound messages.

Simulates SMS/WhatsApp/Email delivery for the demo.
Can be swapped for Twilio/WhatsApp Business API in production.
"""

from datetime import datetime
from typing import Optional
import uuid


# In-memory message log
message_log: list[dict] = []


MESSAGE_TEMPLATES = {
    "payment_link": {
        "sms": (
            "Hi {name}, your payment of ₹{amount} couldn't be processed. "
            "Complete it here: {link} — Recovery AI"
        ),
        "whatsapp": (
            "🔔 Hi {name}! We noticed your payment of ₹{amount:,.2f} didn't go through. "
            "No worries — you can complete it securely here: {link}\n\n"
            "Need help? Reply to this message. — Recovery AI"
        ),
        "email_subject": "Complete your payment of ₹{amount:,.2f}",
        "email_body": (
            "Dear {name},\n\n"
            "We noticed that your recent payment of ₹{amount:,.2f} was unsuccessful. "
            "You can complete your payment using the secure link below:\n\n"
            "{link}\n\n"
            "If you need assistance, please don't hesitate to reach out.\n\n"
            "Best regards,\nRecovery AI Team"
        ),
    },
    "alt_payment": {
        "sms": (
            "Hi {name}, your {method} payment of ₹{amount:,.2f} failed. "
            "Try another payment method here: {link} — Recovery AI"
        ),
        "whatsapp": (
            "🔄 Hi {name}! Your {method} payment of ₹{amount:,.2f} didn't work. "
            "You can try a different payment method here: {link}\n\n"
            "— Recovery AI"
        ),
    },
    "discount_nudge": {
        "sms": (
            "Hi {name}, complete your ₹{amount:,.2f} order and get {discount}% off! "
            "Pay here: {link} — Recovery AI"
        ),
        "whatsapp": (
            "🎉 Hi {name}! Good news — complete your order of ₹{amount:,.2f} now "
            "and enjoy {discount}% off!\n\nPay securely: {link}\n\n— Recovery AI"
        ),
    },
    "retry_notification": {
        "sms": (
            "Hi {name}, we're retrying your payment of ₹{amount:,.2f}. "
            "No action needed. — Recovery AI"
        ),
        "whatsapp": (
            "🔄 Hi {name}, we're automatically retrying your payment of ₹{amount:,.2f}. "
            "You don't need to do anything!\n\n— Recovery AI"
        ),
    },
}


def send_message(
    channel: str,
    phone: Optional[str] = None,
    email: Optional[str] = None,
    template_key: str = "payment_link",
    template_vars: Optional[dict] = None,
    transaction_id: str = "",
) -> dict:
    """Simulate sending a message via the specified channel.

    All messages are logged for the audit trail.

    Returns:
        Dict with message details and delivery status
    """
    msg_id = f"msg_{uuid.uuid4().hex[:12]}"
    template_vars = template_vars or {}

    # Get template
    templates = MESSAGE_TEMPLATES.get(template_key, MESSAGE_TEMPLATES["payment_link"])
    channel_key = channel.lower()

    if channel_key == "email":
        subject = templates.get("email_subject", "Payment Recovery").format(**template_vars)
        body = templates.get("email_body", templates.get("sms", "")).format(**template_vars)
        content = f"Subject: {subject}\n\n{body}"
    else:
        content = templates.get(channel_key, templates.get("sms", "")).format(**template_vars)

    # Create log entry
    log_entry = {
        "message_id": msg_id,
        "transaction_id": transaction_id,
        "channel": channel,
        "recipient": email if channel_key == "email" else phone,
        "content": content,
        "template_key": template_key,
        "status": "delivered",  # Simulated
        "simulated": True,
        "sent_at": datetime.utcnow().isoformat(),
    }

    message_log.append(log_entry)

    return log_entry


def get_message_log() -> list[dict]:
    """Get all sent messages."""
    return message_log


def get_messages_for_transaction(transaction_id: str) -> list[dict]:
    """Get messages sent for a specific transaction."""
    return [m for m in message_log if m["transaction_id"] == transaction_id]
