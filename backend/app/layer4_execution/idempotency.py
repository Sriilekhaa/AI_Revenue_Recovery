"""Idempotency guard — prevents double-charge and double-message.

Uses composite keys (transaction_id + action_type) to ensure
each action is executed at most once per transaction.
"""

from app.database import db


def make_idempotency_key(transaction_id: str, action: str) -> str:
    """Create a composite idempotency key."""
    return f"{transaction_id}::{action}"


def is_already_executed(transaction_id: str, action: str) -> bool:
    """Check if an action has already been executed for this transaction.

    Returns:
        True if already executed (should skip), False if safe to proceed
    """
    key = make_idempotency_key(transaction_id, action)
    return db.check_idempotency(key)


def mark_executed(transaction_id: str, action: str):
    """Mark an action as executed for idempotency tracking."""
    key = make_idempotency_key(transaction_id, action)
    db.set_idempotency(key)
