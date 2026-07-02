# backend/main.py
"""
PrismOS API — FastAPI entry point.

Run locally:
    uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from api.routes import runs, sessions, benchmark, projects

# ── Logging ──────────────────────────────────────────────────────────────────
settings = get_settings()
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger("prismos")

# ── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="PrismOS API",
    version="0.1.0",
    description="Context-aware, multi-agent software delivery platform.",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────────────
app.include_router(runs.router, prefix="/api/v1", tags=["runs"])
app.include_router(sessions.router, prefix="/api/v1", tags=["sessions"])
app.include_router(benchmark.router, prefix="/api/v1", tags=["benchmark"])
app.include_router(projects.router, prefix="/api/v1", tags=["projects"])


# ── Health ───────────────────────────────────────────────────────────────────
@app.get("/health", tags=["system"])
async def health_check():
    """Liveness probe for ECS / load balancer."""
    return {
        "status": "ok",
        "version": "0.1.0",
        "service": "prismos-api",
    }


@app.on_event("startup")
async def on_startup():
    logger.info("PrismOS API starting — env=%s", settings.APP_ENV)


@app.on_event("shutdown")
async def on_shutdown():
    logger.info("PrismOS API shutting down")
