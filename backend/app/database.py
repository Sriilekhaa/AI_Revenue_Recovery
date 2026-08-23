"""SQLite database setup with in-memory event/audit stores.

Uses simple dict-based stores for the demo. In production, swap for
SQLAlchemy + async Postgres.
"""

from typing import Optional
from datetime import datetime
from app.models.events import RevenueEvent, BatchRun
from app.models.audit import AuditEntry
import json
import csv
import io


class Database:
    """In-memory event store + audit log for the demo."""

    def __init__(self):
        self.events: dict[str, RevenueEvent] = {}
        self.batches: dict[str, BatchRun] = {}
        self.audit_log: list[AuditEntry] = []
        self.idempotency_keys: set[str] = set()

    # ─── Events ─────────────────────────────────────────────────

    def store_event(self, event: RevenueEvent):
        self.events[event.transaction_id] = event

    def store_events(self, events: list[RevenueEvent]):
        for e in events:
            self.store_event(e)

    def get_event(self, transaction_id: str) -> Optional[RevenueEvent]:
        return self.events.get(transaction_id)

    def get_events_by_batch(self, batch_id: str) -> list[RevenueEvent]:
        return [e for e in self.events.values() if e.batch_id == batch_id]

    def get_events_by_status(self, status: str) -> list[RevenueEvent]:
        return [e for e in self.events.values() if e.status == status]

    def update_event(self, transaction_id: str, **kwargs):
        event = self.events.get(transaction_id)
        if event:
            for k, v in kwargs.items():
                setattr(event, k, v)

    # ─── Batches ────────────────────────────────────────────────

    def store_batch(self, batch: BatchRun):
        self.batches[batch.batch_id] = batch

    def get_batch(self, batch_id: str) -> Optional[BatchRun]:
        return self.batches.get(batch_id)

    def get_all_batches(self) -> list[BatchRun]:
        return sorted(self.batches.values(), key=lambda b: b.created_at, reverse=True)

    def update_batch(self, batch_id: str, **kwargs):
        batch = self.batches.get(batch_id)
        if batch:
            for k, v in kwargs.items():
                setattr(batch, k, v)

    # ─── Audit Log ──────────────────────────────────────────────

    def log_audit(self, entry: AuditEntry):
        self.audit_log.append(entry)

    def get_audit_by_batch(self, batch_id: str) -> list[AuditEntry]:
        return [a for a in self.audit_log if a.batch_id == batch_id]

    def get_audit_by_transaction(self, transaction_id: str) -> list[AuditEntry]:
        return [a for a in self.audit_log if a.transaction_id == transaction_id]

    def get_all_audit_entries(self) -> list[AuditEntry]:
        return sorted(self.audit_log, key=lambda a: a.timestamp, reverse=True)

    # ─── Idempotency ────────────────────────────────────────────

    def check_idempotency(self, key: str) -> bool:
        """Returns True if key already exists (action already taken)."""
        return key in self.idempotency_keys

    def set_idempotency(self, key: str):
        self.idempotency_keys.add(key)

    # ─── Export ─────────────────────────────────────────────────

    def export_audit_json(self, batch_id: Optional[str] = None) -> str:
        entries = self.get_audit_by_batch(batch_id) if batch_id else self.audit_log
        return json.dumps([e.model_dump(mode="json") for e in entries], indent=2, default=str)

    def export_audit_csv(self, batch_id: Optional[str] = None) -> str:
        entries = self.get_audit_by_batch(batch_id) if batch_id else self.audit_log
        if not entries:
            return ""

        output = io.StringIO()
        fields = list(entries[0].model_dump().keys())
        writer = csv.DictWriter(output, fieldnames=fields)
        writer.writeheader()
        for entry in entries:
            writer.writerow({k: str(v) for k, v in entry.model_dump().items()})
        return output.getvalue()

    # ─── Analytics ──────────────────────────────────────────────

    def get_batch_analytics(self, batch_id: str) -> dict:
        events = self.get_events_by_batch(batch_id)
        batch = self.get_batch(batch_id)

        if not events or not batch:
            return {}

        total_at_risk = sum(e.amount for e in events)
        recovered = [e for e in events if e.status == "recovered"]
        total_recovered = sum(e.recovered_amount or 0 for e in recovered)
        fraud_flagged = [e for e in events if e.status == "fraud_flagged"]
        exceptions = [e for e in events if e.status == "exception"]
        contacted = [e for e in events if e.status in ("contacted", "retry_scheduled", "recovered")]
        diagnosed = [e for e in events if e.root_cause is not None]

        # Breakdown by failure type
        failure_breakdown = {}
        for e in events:
            rc = e.root_cause or "undiagnosed"
            failure_breakdown[rc] = failure_breakdown.get(rc, 0) + 1

        # Breakdown by intervention type
        intervention_breakdown = {}
        for e in events:
            act = e.assigned_action or "none"
            intervention_breakdown[act] = intervention_breakdown.get(act, 0) + 1

        # Breakdown by payment method
        method_breakdown = {}
        for e in events:
            method_breakdown[e.payment_method] = method_breakdown.get(e.payment_method, 0) + 1

        # Average time to recovery
        recovery_times = []
        for e in recovered:
            if e.recovered_at and e.timestamp:
                delta = (e.recovered_at - e.timestamp).total_seconds() / 60
                recovery_times.append(delta)
        avg_recovery_time = sum(recovery_times) / len(recovery_times) if recovery_times else None

        # Amount breakdown by status
        amount_by_status = {}
        for e in events:
            amount_by_status[e.status] = amount_by_status.get(e.status, 0) + e.amount

        recovery_rate = (total_recovered / total_at_risk * 100) if total_at_risk > 0 else 0

        return {
            "batch_id": batch_id,
            "total_events": len(events),
            "total_at_risk": round(total_at_risk, 2),
            "total_recovered": round(total_recovered, 2),
            "recovery_rate": round(recovery_rate, 2),
            "events_diagnosed": len(diagnosed),
            "events_contacted": len(contacted),
            "events_recovered": len(recovered),
            "events_exception": len(exceptions),
            "events_fraud_flagged": len(fraud_flagged),
            "avg_time_to_recovery_mins": round(avg_recovery_time, 1) if avg_recovery_time else None,
            "failure_breakdown": failure_breakdown,
            "intervention_breakdown": intervention_breakdown,
            "method_breakdown": method_breakdown,
            "amount_by_status": {k: round(v, 2) for k, v in amount_by_status.items()},
            "funnel": {
                "ingested": len(events),
                "diagnosed": len(diagnosed),
                "contacted": len(contacted),
                "recovered": len(recovered),
                "exception": len(exceptions),
                "fraud_flagged": len(fraud_flagged),
            },
            "exception_list": [
                {
                    "transaction_id": e.transaction_id,
                    "amount": e.amount,
                    "root_cause": e.root_cause,
                    "reason": e.exception_reason or "Unknown",
                    "status": e.status,
                }
                for e in exceptions
            ],
        }


# Singleton database instance
db = Database()
