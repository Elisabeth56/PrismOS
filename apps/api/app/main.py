"""PrismOS API entry point. Run locally with `pnpm dev` (uvicorn app.main:app --reload)."""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import benchmark, runs, sessions
from app.config import get_settings
from app.database import create_pool
from app.errors import register_error_handlers
from app.features.projects.router import router as projects_router

settings = get_settings()
logging.basicConfig(level=settings.LOG_LEVEL, format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s")
logger = logging.getLogger("prismos")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # the pool opens lazily so /health answers even while the database is unreachable
    app.state.pool = create_pool(settings.DATABASE_URL.get_secret_value())
    await app.state.pool.open(wait=False)
    logger.info("PrismOS API starting, env=%s", settings.APP_ENV)
    yield
    await app.state.pool.close()


app = FastAPI(title="PrismOS API", version="0.2.0", lifespan=lifespan)
register_error_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects_router, prefix="/api/v1")
# pre-remodel routes on the old tables; replaced in #9 (runs, sessions) and #22 (benchmark)
app.include_router(runs.router, prefix="/api/v1", tags=["runs"])
app.include_router(sessions.router, prefix="/api/v1", tags=["sessions"])
app.include_router(benchmark.router, prefix="/api/v1", tags=["benchmark"])


@app.get("/health", tags=["system"])
async def health_check():
    """Liveness probe for the host."""
    return {"status": "ok", "version": "0.2.0"}
