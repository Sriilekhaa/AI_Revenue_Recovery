"""Event/transaction API endpoints."""

from fastapi import APIRouter, HTTPException
from typing import Optional
from app.database import db

router = APIRouter(prefix="/api/events", tags=["Events"])


@router.get("/")
async def list_events(
    batch_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
):
    """List events with optional filters."""
    if batch_id:
        events = db.get_events_by_batch(batch_id)
    elif status:
        events = db.get_events_by_status(status)
    else:
        events = list(db.events.values())

    # Sort by timestamp descending
    events = sorted(events, key=lambda e: e.timestamp, reverse=True)

    return [e.model_dump(mode="json") for e in events[:limit]]


@router.get("/{transaction_id}")
async def get_event(transaction_id: str):
    """Get a single event by transaction ID."""
    event = db.get_event(transaction_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event.model_dump(mode="json")
