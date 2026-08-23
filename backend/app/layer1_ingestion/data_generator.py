"""Synthetic batch data generator with realistic Indian payment distributions.

Uses Faker + custom distribution logic to produce 150–500 revenue events
that mirror real-world Razorpay failure patterns.
"""

import random
import uuid
from datetime import datetime, timedelta
from typing import Optional

from faker import Faker

from app.models.events import (
    RevenueEvent, EventType, PaymentMethod, EventStatus,
    classify_amount_band, classify_customer_segment,
)

fake = Faker("en_IN")

# ─── Distribution Config ───────────────────────────────────────────

EVENT_TYPE_WEIGHTS = {
    EventType.PAYMENT_FAILED: 0.55,
    EventType.CHECKOUT_ABANDONED: 0.20,
    EventType.MANDATE_FAILED: 0.15,
    EventType.INVOICE_OVERDUE: 0.10,
}

PAYMENT_METHOD_WEIGHTS = {
    PaymentMethod.UPI: 0.45,
    PaymentMethod.CARD: 0.30,
    PaymentMethod.NETBANKING: 0.10,
    PaymentMethod.WALLET: 0.08,
    PaymentMethod.EMANDATE: 0.07,
}

# Failure reason codes mapped to root causes
FAILURE_CODES = {
    "INSUFFICIENT_FUNDS": {
        "code": "BAD_REQUEST_ERROR",
        "message": "Payment failed due to insufficient funds in the account",
        "weight": 0.30,
    },
    "CARD_EXPIRED": {
        "code": "BAD_REQUEST_ERROR",
        "message": "The card has expired. Please use a different card.",
        "weight": 0.08,
    },
    "BANK_DECLINED": {
        "code": "BAD_REQUEST_ERROR",
        "message": "Payment declined by issuing bank",
        "weight": 0.12,
    },
    "GATEWAY_TIMEOUT": {
        "code": "GATEWAY_ERROR",
        "message": "Payment gateway timed out while processing the transaction",
        "weight": 0.10,
    },
    "UPI_TIMEOUT": {
        "code": "BAD_REQUEST_ERROR",
        "message": "UPI transaction timed out. Customer did not respond to collect request.",
        "weight": 0.10,
    },
    "VPA_INVALID": {
        "code": "BAD_REQUEST_ERROR",
        "message": "The VPA address provided is invalid or not registered",
        "weight": 0.03,
    },
    "3DS_DROPOUT": {
        "code": "BAD_REQUEST_ERROR",
        "message": "Customer dropped off during 3D Secure authentication",
        "weight": 0.07,
    },
    "CUSTOMER_ABANDONED": {
        "code": "BAD_REQUEST_ERROR",
        "message": "Customer closed the checkout page without completing payment",
        "weight": 0.08,
    },
    "MANDATE_REVOKED": {
        "code": "BAD_REQUEST_ERROR",
        "message": "eMandate/AutoPay has been revoked by the customer",
        "weight": 0.04,
    },
    "FRAUD_SUSPECTED": {
        "code": "BAD_REQUEST_ERROR",
        "message": "Transaction flagged for suspected fraudulent activity",
        "weight": 0.05,
    },
    "NETWORK_ERROR": {
        "code": "SERVER_ERROR",
        "message": "Network connectivity issue between bank and payment gateway",
        "weight": 0.03,
    },
}

# Indian amount ranges (₹) — realistic e-commerce and subscription amounts
AMOUNT_RANGES = [
    (49, 199, 0.15),       # Micro — small subscriptions, digital goods
    (199, 499, 0.20),      # Low — food delivery, recharges
    (499, 2999, 0.30),     # Medium — e-commerce, fashion
    (2999, 14999, 0.20),   # High — electronics, travel
    (14999, 99999, 0.10),  # Premium — high-value purchases
    (99999, 500000, 0.05), # Ultra — B2B, enterprise
]


def _weighted_choice(weights_dict):
    """Pick a random item weighted by its assigned probability."""
    items = list(weights_dict.keys())
    weights = list(weights_dict.values())
    return random.choices(items, weights=weights, k=1)[0]


def _random_amount() -> float:
    """Generate a realistic Indian payment amount."""
    range_weights = [r[2] for r in AMOUNT_RANGES]
    chosen_range = random.choices(AMOUNT_RANGES, weights=range_weights, k=1)[0]
    amount = random.uniform(chosen_range[0], chosen_range[1])
    return round(amount, 2)


def _random_failure_code(event_type: EventType, payment_method: PaymentMethod) -> tuple[str, str, str]:
    """Pick a failure code appropriate for the event type and payment method."""
    # Filter appropriate failure codes
    if event_type == EventType.CHECKOUT_ABANDONED:
        candidates = ["CUSTOMER_ABANDONED", "3DS_DROPOUT"]
    elif event_type == EventType.MANDATE_FAILED:
        candidates = ["MANDATE_REVOKED", "INSUFFICIENT_FUNDS", "BANK_DECLINED", "GATEWAY_TIMEOUT"]
    elif payment_method == PaymentMethod.UPI:
        candidates = ["INSUFFICIENT_FUNDS", "UPI_TIMEOUT", "VPA_INVALID", "FRAUD_SUSPECTED", "NETWORK_ERROR"]
    elif payment_method == PaymentMethod.CARD:
        candidates = ["INSUFFICIENT_FUNDS", "CARD_EXPIRED", "BANK_DECLINED", "3DS_DROPOUT", "FRAUD_SUSPECTED", "GATEWAY_TIMEOUT"]
    elif payment_method == PaymentMethod.NETBANKING:
        candidates = ["INSUFFICIENT_FUNDS", "BANK_DECLINED", "GATEWAY_TIMEOUT", "NETWORK_ERROR"]
    else:
        candidates = list(FAILURE_CODES.keys())

    # Weight by configured probabilities
    weights = [FAILURE_CODES[c]["weight"] for c in candidates]
    chosen = random.choices(candidates, weights=weights, k=1)[0]
    info = FAILURE_CODES[chosen]
    return chosen, info["code"], info["message"]


def _random_phone() -> str:
    """Generate a realistic Indian phone number."""
    prefixes = ["97", "98", "99", "96", "95", "94", "93", "91", "90", "88", "87", "86", "85", "84", "83", "82", "81", "80", "79", "78", "77", "76", "75", "74", "73", "72", "71", "70"]
    return f"+91{random.choice(prefixes)}{random.randint(10000000, 99999999)}"


def _random_email(name: str) -> str:
    """Generate a realistic Indian email."""
    domains = ["gmail.com", "yahoo.co.in", "outlook.com", "hotmail.com", "rediffmail.com"]
    clean = name.lower().replace(" ", ".").replace("'", "")
    return f"{clean}{random.randint(1, 999)}@{random.choice(domains)}"


def generate_batch(
    batch_size: int = 300,
    batch_id: Optional[str] = None,
    hours_back: int = 48,
) -> list[RevenueEvent]:
    """Generate a batch of synthetic revenue events.

    Args:
        batch_size: Number of events to generate (150–500)
        batch_id: Optional batch identifier
        hours_back: How far back in time events can be placed

    Returns:
        List of RevenueEvent objects ready for pipeline processing
    """
    batch_size = max(150, min(500, batch_size))
    batch_id = batch_id or f"batch_{uuid.uuid4().hex[:12]}"
    events = []
    now = datetime.utcnow()

    # Pre-generate a pool of customers (some will have multiple events)
    num_customers = int(batch_size * 0.7)  # ~30% repeat customers
    customers = []
    for _ in range(num_customers):
        name = fake.name()
        phone = _random_phone()
        email = _random_email(name)
        customer_id = f"cust_{uuid.uuid4().hex[:10]}"
        # Consent flags — ~75% have at least one consent
        has_consent = random.random() < 0.75
        dnd = random.random() < 0.08  # ~8% DND registered
        customers.append({
            "customer_id": customer_id,
            "name": name,
            "phone": phone,
            "email": email,
            "consent_sms": has_consent and random.random() < 0.6,
            "consent_whatsapp": has_consent and random.random() < 0.7,
            "consent_email": has_consent and random.random() < 0.8,
            "dnd_registered": dnd,
            "total_transactions": random.randint(1, 50),
            "days_since_first": random.randint(0, 365),
            "recent_failures": random.randint(0, 5),
        })

    for i in range(batch_size):
        # Pick event type and payment method
        event_type = _weighted_choice(EVENT_TYPE_WEIGHTS)
        payment_method = _weighted_choice(PAYMENT_METHOD_WEIGHTS)

        # For mandates, force emandate payment method
        if event_type == EventType.MANDATE_FAILED:
            payment_method = PaymentMethod.EMANDATE

        # Pick a customer (with some repeats)
        customer = random.choice(customers)

        # Generate amount
        amount = _random_amount()

        # Pick failure code
        failure_key, failure_code, failure_message = _random_failure_code(event_type, payment_method)

        # Random timestamp in the past hours_back hours
        event_time = now - timedelta(
            hours=random.uniform(0.5, hours_back),
            minutes=random.randint(0, 59),
        )

        # Classify customer
        segment = classify_customer_segment(
            total_transactions=customer["total_transactions"],
            days_since_first=customer["days_since_first"],
            recent_failures=customer["recent_failures"],
        )

        event = RevenueEvent(
            transaction_id=f"txn_{uuid.uuid4().hex[:16]}",
            customer_id=customer["customer_id"],
            amount=amount,
            currency="INR",
            payment_method=payment_method,
            failure_reason_code=failure_key,
            failure_reason_message=failure_message,
            timestamp=event_time,
            retry_count=random.choices([0, 1, 2], weights=[0.7, 0.2, 0.1])[0],
            customer_phone=customer["phone"],
            customer_email=customer["email"],
            consent_sms=customer["consent_sms"],
            consent_whatsapp=customer["consent_whatsapp"],
            consent_email=customer["consent_email"],
            dnd_registered=customer["dnd_registered"],
            event_type=event_type,
            subscription_id=f"sub_{uuid.uuid4().hex[:10]}" if event_type == EventType.MANDATE_FAILED else None,
            invoice_id=f"inv_{uuid.uuid4().hex[:10]}" if event_type == EventType.INVOICE_OVERDUE else None,
            order_id=f"order_{uuid.uuid4().hex[:10]}",
            status=EventStatus.INGESTED,
            customer_segment=segment,
            amount_band=classify_amount_band(amount),
            batch_id=batch_id,
        )
        events.append(event)

    return events
