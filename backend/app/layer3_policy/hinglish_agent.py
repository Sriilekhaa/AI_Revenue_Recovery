"""Hinglish Conversational Recovery Agent Engine.

Simulates an intelligent, empathetic Indian AI recovery agent on WhatsApp/SMS.
Capabilities:
- Code-switched Hinglish, conversational Hindi, and English.
- Natural objection handling (debited but not received, insufficient balance, request for discount, retry later).
- Dynamic offer generation (split payment, max 5% bounded incentive).
- Automatic Promise-to-Pay (PTP) commitment extraction and date logging.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timedelta
import re


class ChatMessage(BaseModel):
    sender: str  # "customer" or "agent"
    text: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    quick_replies: Optional[list[str]] = None


class ChatSession(BaseModel):
    session_id: str
    transaction_id: str
    customer_name: str
    amount: float
    payment_method: str
    failure_reason: str
    history: list[ChatMessage] = []
    ptp_date: Optional[str] = None
    discount_offered: float = 0.0
    status: str = "in_progress"  # in_progress, recovered, ptp_logged, escalated, closed


# In-memory sessions
chat_sessions: dict[str, ChatSession] = {}


def start_chat_session(
    session_id: str,
    transaction_id: str,
    customer_name: str,
    amount: float,
    payment_method: str,
    failure_reason: str,
    language: str = "hinglish",
) -> ChatSession:
    """Initialize a new conversation with a tailored, empathetic opening."""
    
    first_name = customer_name.split()[0] if customer_name else "Customer"
    
    if language == "hinglish":
        intro_text = (
            f"Namaste {first_name} ji!\n"
            f"Humne notice kiya ki aapka ₹{amount:,.2f} ka payment for {payment_method.upper()} "
            f"'{failure_reason}' ki wajah se complete nahi ho paya.\n\n"
            f"Koi baat nahi, aap secure Razorpay payment link se 1-click mein complete kar sakte hain:\n"
            f"https://rzp.io/i/rcv_{transaction_id[:6]}\n\n"
            f"Kya main aapko koi aur payment method ya split option suggest karun?"
        )
        quick_replies = [
            "Link se abhi pay karta hoon",
            "Kal subah pay karunga (Promise to Pay)",
            "Thoda discount milega kya?",
            "Paise kat gaye par order confirm nahi hua"
        ]
    elif language == "hindi":
        intro_text = (
            f"नमस्ते {first_name} जी!\n"
            f"आपका ₹{amount:,.2f} का भुगतान '{failure_reason}' के कारण असफल हो गया।\n"
            f"कृपया नीचे दिए गए सुरक्षित लिंक से भुगतान पूरा करें:\n"
            f"https://rzp.io/i/rcv_{transaction_id[:6]}"
        )
        quick_replies = ["अभी भुगतान करें", "कल करूँगा", "सहायता चाहिए"]
    else:
        intro_text = (
            f"Hi {first_name}! We noticed your payment of ₹{amount:,.2f} via {payment_method.upper()} "
            f"could not be completed due to {failure_reason}.\n\n"
            f"You can quickly complete it using your secure Razorpay link:\n"
            f"https://rzp.io/i/rcv_{transaction_id[:6]}"
        )
        quick_replies = ["Pay Now", "Pay Tomorrow", "Need Discount", "Amount Debited"]

    session = ChatSession(
        session_id=session_id,
        transaction_id=transaction_id,
        customer_name=customer_name,
        amount=amount,
        payment_method=payment_method,
        failure_reason=failure_reason,
        history=[
            ChatMessage(
                sender="agent",
                text=intro_text,
                quick_replies=quick_replies,
            )
        ]
    )
    chat_sessions[session_id] = session
    return session


def process_customer_message(session_id: str, user_text: str) -> ChatMessage:
    """Process customer message with intelligent Indian intent recognition & Hinglish response."""
    session = chat_sessions.get(session_id)
    if not session:
        # Create a fallback session
        session = start_chat_session(
            session_id=session_id,
            transaction_id="txn_sample_demo",
            customer_name="Customer",
            amount=2499.0,
            payment_method="UPI",
            failure_reason="Bank Timeout"
        )

    # Add customer message to history
    session.history.append(ChatMessage(sender="customer", text=user_text))

    text_lower = user_text.lower().strip()

    # 1. Intent: Already paid / Amount debited
    if any(w in text_lower for w in ["paise kat", "debited", "cut gaye", "already paid", "cut gaya"]):
        reply_text = (
            "Bilkul chinta mat kijiye! Agar aapke bank account se paise deduct ho gaye hain, "
            "to hamari automated reconciliation system 15 minute mein verify kar legi. "
            "Agar transaction settle nahi hua to bank 2-3 business days mein 100% refund kar deta hai.\n\n"
            "Main aapke transaction reference ko priority tracking par daal raha hoon. UTR number share kar sakte hain?"
        )
        replies = ["Maine UTR verify kar liya", "Dusre method se pay kar deta hoon"]
        session.status = "in_progress"

    # 2. Intent: Promise to Pay / Delay / Kal karunga / Salary
    elif any(w in text_lower for w in ["kal", "tomorrow", "baad mein", "later", "salary", "promise", "next week", "shaam ko"]):
        # Extract commitment date
        now = datetime.now()
        if "kal" in text_lower or "tomorrow" in text_lower:
            ptp_date = (now + timedelta(days=1)).strftime("%d %b %Y, 11:00 AM")
        elif "shaam" in text_lower or "evening" in text_lower:
            ptp_date = now.strftime("%d %b %Y, 06:00 PM")
        else:
            ptp_date = (now + timedelta(days=2)).strftime("%d %b %Y, 12:00 PM")

        session.ptp_date = ptp_date
        session.status = "ptp_logged"
        reply_text = (
            f"Done! Maine aapka Promise-to-Pay commitment note kar liya hai: **{ptp_date}**.\n"
            f"Hum aapko tab tak koi repetitive message ya call nahi karenge (TRAI Compliance Followed).\n\n"
            f"Scheduled time par hum aapko WhatsApp par gentle reminder aur active payment link bhej denge. Dhanyawaad!"
        )
        replies = ["Link abhi bhej do", "Theek hai, thank you!"]

    # 3. Intent: Discount / Offer request
    elif any(w in text_lower for w in ["discount", "offer", "kam karo", "chhoot", "price", "sasta"]):
        if session.discount_offered == 0.0:
            discount_pct = 5.0  # Max bounded policy
            discounted_amt = round(session.amount * (1 - discount_pct / 100), 2)
            session.discount_offered = discount_pct
            reply_text = (
                f"Kyunki aap hamare valued customer hain, humne aapke liye ek special **5% instant recovery discount** apply kiya hai!\n\n"
                f"Original Amount: ~~₹{session.amount:,.2f}~~\n"
                f"Discounted Amount: **₹{discounted_amt:,.2f}**\n\n"
                f"Ye limited-period link 30 minute ke liye active hai:\n"
                f"https://rzp.io/i/disc_{session.transaction_id[:6]}"
            )
            replies = ["Abhi pay karta hoon", "Split payment option do"]
        else:
            reply_text = (
                f"Aapke order par already maximum permissible 5% discount (₹{session.amount * 0.05:,.2f}) laga hua hai.\n"
                f"Aap bina kisi extra charges ke UPI, Credit Card EMI, ya Netbanking se pay kar sakte hain."
            )
            replies = ["Pay Now via UPI", "Pay Later"]

    # 4. Intent: Successful payment confirmation / Paid
    elif any(w in text_lower for w in ["pay karta hoon", "paid", "done", "complete", "ho gaya", "link se"]):
        session.status = "recovered"
        reply_text = (
            "Shandar! Payment successfully receive ho gaya hai. Aapka order confirm ho chuka hai.\n\n"
            "Invoice aur confirmation details aapke registered WhatsApp & Email par bhej di gayi hain. "
            "Recovery AI ke saath transact karne ke liye shukriya!"
        )
        replies = ["Receipt download karo", "Feedback do"]

    # 5. Fallback response
    else:
        reply_text = (
            "Ji main samajh gaya! Aap chahein to bina kisi hassle ke UPI Apps (GPay / PhonePe / Paytm), "
            "Card ya Netbanking se payment complete kar sakte hain:\n"
            f"https://rzp.io/i/rcv_{session.transaction_id[:6]}\n\n"
            "Agar koi technical issue aa raha hai to batayein, main madad karta hoon."
        )
        replies = ["Pay Now", "Kal pay karunga", "Customer support se baat karni hai"]

    agent_msg = ChatMessage(
        sender="agent",
        text=reply_text,
        quick_replies=replies
    )
    session.history.append(agent_msg)
    return agent_msg
