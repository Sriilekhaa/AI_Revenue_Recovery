"""B2B Receivables & Promise-to-Pay (PTP) Sequencer.

Tracks enterprise invoices, aging buckets, commitment promises, broken promise SLAs,
and dispute classifications.
"""

from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime, timedelta
import uuid


class B2BInvoice(BaseModel):
    invoice_id: str
    company_name: str
    contact_person: str
    contact_email: str
    contact_phone: str
    amount: float
    due_date: datetime
    issued_date: datetime
    status: Literal["current", "overdue_1_15", "overdue_16_30", "overdue_30_60", "overdue_60_plus", "paid", "disputed"]
    promise_to_pay_date: Optional[datetime] = None
    promise_status: Literal["none", "committed", "kept", "broken", "escalated"] = "none"
    last_contact_date: Optional[datetime] = None
    notes: list[str] = Field(default_factory=list)
    recovery_link: str = ""


# In-memory store for B2B Invoices
b2b_invoices_db: dict[str, B2BInvoice] = {}


def init_sample_b2b_invoices():
    """Seed sample enterprise invoices representing diverse aging buckets and PTP statuses."""
    if b2b_invoices_db:
        return

    now = datetime.utcnow()
    samples = [
        {
            "invoice_id": "INV-2026-8812",
            "company_name": "Bharat Logistics & Supply Corp",
            "contact_person": "Virendra Sharma (CFO)",
            "contact_email": "v.sharma@bharatlogistics.in",
            "contact_phone": "+919820112233",
            "amount": 485000.0,
            "issued_date": now - timedelta(days=45),
            "due_date": now - timedelta(days=15),
            "status": "overdue_1_15",
            "promise_to_pay_date": now + timedelta(days=2),
            "promise_status": "committed",
            "notes": ["AI Agent followed up on 22 Aug. CFO committed payment by 26 Aug after board disbursement."],
        },
        {
            "invoice_id": "INV-2026-8904",
            "company_name": "Zenith Cloud Solutions Pvt Ltd",
            "contact_person": "Priya Nair (Finance Head)",
            "contact_email": "finance@zenithcloud.io",
            "contact_phone": "+919845009988",
            "amount": 1250000.0,
            "issued_date": now - timedelta(days=60),
            "due_date": now - timedelta(days=30),
            "status": "overdue_16_30",
            "promise_to_pay_date": now - timedelta(days=1),
            "promise_status": "broken",
            "notes": ["PTP date 23 Aug passed without settlement. Auto-escalated to Key Account Manager."],
        },
        {
            "invoice_id": "INV-2026-9041",
            "company_name": "Kaveri Agro Exports",
            "contact_person": "Anand Rao (Director)",
            "contact_email": "anand@kaveriagro.com",
            "contact_phone": "+919448123456",
            "amount": 890000.0,
            "issued_date": now - timedelta(days=80),
            "due_date": now - timedelta(days=50),
            "status": "overdue_30_60",
            "promise_status": "none",
            "notes": ["Gentle nudge sent via WhatsApp Business. Awaiting finance response."],
        },
        {
            "invoice_id": "INV-2026-9120",
            "company_name": "Apex Fintech Infrastructure",
            "contact_person": "Rohan Deshmukh",
            "contact_email": "billing@apexfintech.in",
            "contact_phone": "+919811002233",
            "amount": 275000.0,
            "issued_date": now - timedelta(days=20),
            "due_date": now + timedelta(days=10),
            "status": "current",
            "promise_status": "none",
            "notes": ["Early payment discount of 2% sent on 21 Aug."],
        },
        {
            "invoice_id": "INV-2026-8750",
            "company_name": "Metro Retail Hypermarkets",
            "contact_person": "Sunil Gupta",
            "contact_email": "accounts@metroretail.co.in",
            "contact_phone": "+919930445566",
            "amount": 620000.0,
            "issued_date": now - timedelta(days=40),
            "due_date": now - timedelta(days=10),
            "status": "paid",
            "promise_status": "kept",
            "notes": ["Recovered ₹6,20,000 via Razorpay Virtual Account on PTP date."],
        },
    ]

    for s in samples:
        inv = B2BInvoice(
            invoice_id=s["invoice_id"],
            company_name=s["company_name"],
            contact_person=s["contact_person"],
            contact_email=s["contact_email"],
            contact_phone=s["contact_phone"],
            amount=s["amount"],
            issued_date=s["issued_date"],
            due_date=s["due_date"],
            status=s["status"],
            promise_to_pay_date=s.get("promise_to_pay_date"),
            promise_status=s["promise_status"],
            notes=s["notes"],
            recovery_link=f"https://rzp.io/i/{s['invoice_id'].lower().replace('-', '_')}",
        )
        b2b_invoices_db[inv.invoice_id] = inv


def get_all_b2b_invoices() -> list[B2BInvoice]:
    init_sample_b2b_invoices()
    return list(b2b_invoices_db.values())


def record_promise_to_pay(invoice_id: str, ptp_date_str: str, note: str = "") -> Optional[B2BInvoice]:
    """Register a new Promise-to-Pay date for an invoice."""
    init_sample_b2b_invoices()
    inv = b2b_invoices_db.get(invoice_id)
    if not inv:
        return None

    try:
        ptp_dt = datetime.fromisoformat(ptp_date_str.replace("Z", "+00:00"))
    except Exception:
        ptp_dt = datetime.utcnow() + timedelta(days=3)

    inv.promise_to_pay_date = ptp_dt
    inv.promise_status = "committed"
    inv.notes.append(f"PTP logged for {ptp_dt.strftime('%d %b %Y')}. {note}")
    return inv


def get_b2b_analytics() -> dict:
    """Calculate aging buckets, promise tracking metrics, and at-risk enterprise revenue."""
    init_sample_b2b_invoices()
    invoices = list(b2b_invoices_db.values())

    total_receivables = sum(i.amount for i in invoices if i.status != "paid")
    total_recovered = sum(i.amount for i in invoices if i.status == "paid")
    
    buckets = {
        "current": sum(i.amount for i in invoices if i.status == "current"),
        "overdue_1_15": sum(i.amount for i in invoices if i.status == "overdue_1_15"),
        "overdue_16_30": sum(i.amount for i in invoices if i.status == "overdue_16_30"),
        "overdue_30_60": sum(i.amount for i in invoices if i.status == "overdue_30_60"),
        "overdue_60_plus": sum(i.amount for i in invoices if i.status == "overdue_60_plus"),
    }

    promises = {
        "committed": len([i for i in invoices if i.promise_status == "committed"]),
        "kept": len([i for i in invoices if i.promise_status == "kept"]),
        "broken": len([i for i in invoices if i.promise_status == "broken"]),
    }

    return {
        "total_receivables": round(total_receivables, 2),
        "total_recovered": round(total_recovered, 2),
        "buckets": {k: round(v, 2) for k, v in buckets.items()},
        "promises": promises,
        "invoices_count": len(invoices),
    }
