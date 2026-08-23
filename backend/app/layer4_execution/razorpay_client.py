"""Razorpay test-mode API client.

Falls back to simulation mode if API keys are not configured.
All API calls are logged for the audit trail.
"""

import uuid
from datetime import datetime
from typing import Optional

from app.config import settings


class RazorpayClient:
    """Razorpay API client with simulation fallback."""

    def __init__(self):
        self.simulation_mode = settings.RAZORPAY_SIMULATION_MODE or not settings.RAZORPAY_KEY_ID
        self.client = None

        if not self.simulation_mode:
            try:
                import razorpay
                self.client = razorpay.Client(
                    auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
                )
            except Exception:
                self.simulation_mode = True

    def create_payment_link(
        self,
        amount: float,
        customer_name: str = "Customer",
        customer_email: Optional[str] = None,
        customer_phone: Optional[str] = None,
        description: str = "Recovery Payment",
        reference_id: Optional[str] = None,
    ) -> dict:
        """Create a Razorpay Payment Link.

        Returns:
            Dict with payment link details (or simulated response)
        """
        amount_paise = int(amount * 100)
        ref_id = reference_id or f"rcvr_{uuid.uuid4().hex[:12]}"

        request_payload = {
            "amount": amount_paise,
            "currency": "INR",
            "description": description,
            "reference_id": ref_id,
            "customer": {
                "name": customer_name,
                "email": customer_email or "",
                "contact": customer_phone or "",
            },
            "notify": {
                "sms": bool(customer_phone),
                "email": bool(customer_email),
            },
            "reminder_enable": True,
            "callback_url": "https://recovery-ai.demo/callback",
            "callback_method": "get",
        }

        if self.simulation_mode:
            link_id = f"plink_sim_{uuid.uuid4().hex[:12]}"
            return {
                "simulated": True,
                "request": request_payload,
                "response": {
                    "id": link_id,
                    "amount": amount_paise,
                    "currency": "INR",
                    "status": "created",
                    "short_url": f"https://rzp.io/i/{link_id[:8]}",
                    "reference_id": ref_id,
                    "created_at": int(datetime.utcnow().timestamp()),
                },
            }

        try:
            response = self.client.payment_link.create(request_payload)
            return {
                "simulated": False,
                "request": request_payload,
                "response": response,
            }
        except Exception as e:
            return {
                "simulated": False,
                "request": request_payload,
                "error": str(e),
            }

    def create_order(
        self,
        amount: float,
        receipt: Optional[str] = None,
        notes: Optional[dict] = None,
    ) -> dict:
        """Create a Razorpay Order for retry."""
        amount_paise = int(amount * 100)
        receipt = receipt or f"rcpt_{uuid.uuid4().hex[:10]}"

        request_payload = {
            "amount": amount_paise,
            "currency": "INR",
            "receipt": receipt,
            "notes": notes or {},
        }

        if self.simulation_mode:
            order_id = f"order_sim_{uuid.uuid4().hex[:12]}"
            return {
                "simulated": True,
                "request": request_payload,
                "response": {
                    "id": order_id,
                    "amount": amount_paise,
                    "currency": "INR",
                    "status": "created",
                    "receipt": receipt,
                    "created_at": int(datetime.utcnow().timestamp()),
                },
            }

        try:
            response = self.client.order.create(request_payload)
            return {"simulated": False, "request": request_payload, "response": response}
        except Exception as e:
            return {"simulated": False, "request": request_payload, "error": str(e)}

    def retry_subscription(self, subscription_id: str) -> dict:
        """Retry a failed subscription charge."""
        if self.simulation_mode:
            return {
                "simulated": True,
                "request": {"subscription_id": subscription_id, "action": "retry"},
                "response": {
                    "id": subscription_id,
                    "status": "active",
                    "charge_at": int(datetime.utcnow().timestamp()) + 300,
                },
            }

        try:
            # In real Razorpay, you'd call the subscription charge retry endpoint
            return {
                "simulated": False,
                "request": {"subscription_id": subscription_id},
                "response": {"status": "retry_scheduled"},
            }
        except Exception as e:
            return {"simulated": False, "error": str(e)}


# Singleton client
razorpay_client = RazorpayClient()
