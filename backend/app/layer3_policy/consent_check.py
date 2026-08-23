"""Consent and DND verification — checked before every contact action.

Implements TRAI-style consent verification:
- Check consent flag for the selected channel
- Check DND registry status
- Enforce contact hours (no messages 9 PM – 9 AM)
"""

from datetime import datetime

from app.models.events import RevenueEvent, ContactChannel, InterventionAction
from app.models.audit import ComplianceCheckResult
from app.config import settings


def check_consent(event: RevenueEvent, channel: ContactChannel) -> tuple[bool, str]:
    """Check if the customer has granted consent for contact on this channel.

    Returns:
        (consent_granted, reason_string)
    """
    if channel == ContactChannel.NONE:
        return True, "No contact channel required. Consent check not applicable."

    consent_map = {
        ContactChannel.SMS: event.consent_sms,
        ContactChannel.WHATSAPP: event.consent_whatsapp,
        ContactChannel.EMAIL: event.consent_email,
    }

    has_consent = consent_map.get(channel, False)

    if has_consent:
        return True, f"Consent granted for {channel.value} contact."
    else:
        return False, (
            f"Consent NOT granted for {channel.value} contact. "
            f"Customer consent status — SMS: {event.consent_sms}, "
            f"WhatsApp: {event.consent_whatsapp}, Email: {event.consent_email}."
        )


def check_dnd(event: RevenueEvent) -> tuple[bool, str]:
    """Check DND (Do Not Disturb) registry status.

    Returns:
        (dnd_clear, reason_string) — True means not on DND, safe to contact
    """
    if event.dnd_registered:
        return False, (
            "Customer is registered on DND (Do Not Disturb) registry. "
            "All contact attempts blocked per TRAI compliance rules."
        )
    return True, "Customer not on DND registry. Contact permitted."


def check_contact_hours() -> tuple[bool, str]:
    """Check if current time is within allowed contact hours.

    No messages between 9 PM and 9 AM (TRAI guidelines).

    Returns:
        (within_hours, reason_string)
    """
    now = datetime.utcnow()
    # Approximate IST (UTC+5:30)
    ist_hour = (now.hour + 5) % 24
    if now.minute >= 30:
        ist_hour = (ist_hour + 1) % 24

    start_block = settings.NO_CONTACT_START_HOUR  # 21 (9 PM)
    end_block = settings.NO_CONTACT_END_HOUR       # 9 (9 AM)

    if ist_hour >= start_block or ist_hour < end_block:
        return False, (
            f"Outside allowed contact hours. Current IST hour: {ist_hour}:00. "
            f"Contact blocked between {start_block}:00 and {end_block}:00 per TRAI guidelines."
        )

    return True, f"Within allowed contact hours (IST {ist_hour}:00)."


def find_best_consented_channel(event: RevenueEvent, preferred: ContactChannel) -> ContactChannel:
    """Find the best consented channel, starting with the preferred one.

    Falls back through: preferred → WhatsApp → SMS → Email → NONE
    """
    if preferred != ContactChannel.NONE:
        consent_ok, _ = check_consent(event, preferred)
        if consent_ok:
            return preferred

    # Fallback order
    fallback_order = [ContactChannel.WHATSAPP, ContactChannel.SMS, ContactChannel.EMAIL]
    for ch in fallback_order:
        if ch == preferred:
            continue
        consent_ok, _ = check_consent(event, ch)
        if consent_ok:
            return ch

    return ContactChannel.NONE


def run_compliance_checks(
    event: RevenueEvent,
    channel: ContactChannel,
    retry_count: int = 0,
    max_retries: int = 3,
) -> ComplianceCheckResult:
    """Run all compliance checks for a contact action.

    Args:
        event: The revenue event
        channel: The proposed contact channel
        retry_count: Current retry count
        max_retries: Maximum allowed retries

    Returns:
        ComplianceCheckResult with all checks and overall verdict
    """
    result = ComplianceCheckResult(transaction_id=event.transaction_id)

    # 1. Consent check
    consent_ok, consent_reason = check_consent(event, channel)
    result.consent_granted = consent_ok
    result.consent_status = consent_reason if not consent_ok else "granted"

    # 2. DND check
    dnd_ok, dnd_reason = check_dnd(event)
    result.dnd_clear = dnd_ok
    result.dnd_status = dnd_reason if not dnd_ok else "clear"

    # 3. Retry limit
    result.within_retry_limit = retry_count < max_retries

    # 4. Contact hours
    hours_ok, hours_reason = check_contact_hours()
    result.within_contact_hours = hours_ok
    result.contact_hours_status = hours_reason if not hours_ok else "allowed"

    # Compute overall
    result.compute_all_clear()

    return result
