"""Recovery AI — FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import batch, dashboard, audit, walkthrough, events, policies, agent_chat, b2b, sandbox

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "AI-powered revenue recovery system for Razorpay /buildathon 2026. "
        "Detects payment failures, diagnoses root causes, selects optimal interventions, "
        "executes recovery actions, and tracks every decision in an exportable audit trail."
    ),
)

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(batch.router)
app.include_router(dashboard.router)
app.include_router(audit.router)
app.include_router(walkthrough.router)
app.include_router(events.router)
app.include_router(policies.router)
app.include_router(agent_chat.router)
app.include_router(b2b.router)
app.include_router(sandbox.router)


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "simulation_mode": settings.RAZORPAY_SIMULATION_MODE,
        "endpoints": {
            "generate_batch": "POST /api/batch/generate",
            "dashboard": "GET /api/dashboard/",
            "audit_log": "GET /api/audit/",
            "export_json": "GET /api/audit/export/json",
            "export_csv": "GET /api/audit/export/csv",
            "walkthrough": "GET /api/walkthrough/{transaction_id}",
            "policies": "GET /api/policies/",
            "agent_chat": "POST /api/agent/message",
            "b2b_invoices": "GET /api/b2b/invoices",
            "bank_radar": "GET /api/sandbox/bank-radar",
            "sandbox_run": "POST /api/sandbox/run",
        },
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
