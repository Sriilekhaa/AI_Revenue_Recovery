"""API endpoints for the interactive Hinglish Conversational Agent."""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from app.layer3_policy.hinglish_agent import (
    start_chat_session, process_customer_message, chat_sessions, ChatSession
)

router = APIRouter(prefix="/api/agent", tags=["Agent Simulator"])


class StartChatRequest(BaseModel):
    session_id: str
    transaction_id: str = "txn_demo_live"
    customer_name: str = "Rahul Sharma"
    amount: float = 2499.0
    payment_method: str = "UPI"
    failure_reason: str = "Bank Timeout (HDFC UPI Switch)"
    language: str = "hinglish"


class MessageRequest(BaseModel):
    session_id: str
    message: str


@router.post("/start")
async def api_start_chat(req: StartChatRequest):
    """Start or reset an interactive recovery chat session."""
    session = start_chat_session(
        session_id=req.session_id,
        transaction_id=req.transaction_id,
        customer_name=req.customer_name,
        amount=req.amount,
        payment_method=req.payment_method,
        failure_reason=req.failure_reason,
        language=req.language,
    )
    return session.model_dump(mode="json")


@router.post("/message")
async def api_send_message(req: MessageRequest):
    """Send a message to the Hinglish agent and get autonomous reply with PTP/discount actions."""
    agent_reply = process_customer_message(req.session_id, req.message)
    session = chat_sessions.get(req.session_id)
    return {
        "reply": agent_reply.model_dump(mode="json"),
        "session": session.model_dump(mode="json") if session else None,
    }


@router.get("/session/{session_id}")
async def api_get_session(session_id: str):
    """Get active chat session history."""
    session = chat_sessions.get(session_id)
    if not session:
        # initialize default
        session = start_chat_session(
            session_id=session_id,
            transaction_id="txn_demo_live",
            customer_name="Rahul Sharma",
            amount=2499.0,
            payment_method="UPI",
            failure_reason="Bank Timeout (HDFC UPI Switch)"
        )
    return session.model_dump(mode="json")
