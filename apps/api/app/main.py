"""PrismOS API entry point. Run locally with `pnpm dev` (uvicorn app.main:app --reload)."""

from __future__ import annotations

import asyncio
import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import create_pool
from app.errors import register_error_handlers
from app.features.github.router import router as github_router
from app.features.projects.router import router as projects_router
from app.features.runs.router import router as runs_router
from app.github.app import GitHubApp
from app.github.repo import GitHubRepo, static_token
from app.pipeline.graph import build_pipeline
from app.worker import Worker

settings = get_settings()
logging.basicConfig(level=settings.LOG_LEVEL, format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s")
logger = logging.getLogger("prismos")


github_app = (
    GitHubApp(settings.GITHUB_APP_ID, settings.GITHUB_APP_PRIVATE_KEY.get_secret_value().replace("\\n", "\n"))
    if settings.GITHUB_APP_ID and settings.GITHUB_APP_PRIVATE_KEY
    else None
)


def repo_for(project: dict) -> GitHubRepo:
    """Installation token when the project is attached through the App; otherwise public access."""
    repo, installation = project["repo_full_name"], project["github_installation_id"]
    if (gh := github_app) and installation:

        async def token() -> str | None:
            return await gh.installation_token(installation, repo)

        return GitHubRepo(repo, token, settings.MAX_FILE_SIZE_BYTES)
    fallback = settings.GITHUB_TOKEN.get_secret_value() if settings.GITHUB_TOKEN else None
    return GitHubRepo(repo, static_token(fallback), settings.MAX_FILE_SIZE_BYTES)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # the pool opens lazily so /health answers even while the database is unreachable
    app.state.pool = create_pool(settings.DATABASE_URL.get_secret_value())
    await app.state.pool.open(wait=False)
    stop = asyncio.Event()
    worker_task = None
    if settings.RUN_WORKER:
        worker = Worker(
            pool=app.state.pool,
            pipeline=build_pipeline(repo_for),
            poll_seconds=settings.WORKER_POLL_SECONDS,
            heartbeat_seconds=settings.HEARTBEAT_SECONDS,
            stale_seconds=settings.STALE_RUN_SECONDS,
            max_attempts=settings.MAX_RUN_ATTEMPTS,
        )
        worker_task = asyncio.create_task(worker.run_forever(stop))
    logger.info("PrismOS API starting, env=%s, worker=%s", settings.APP_ENV, settings.RUN_WORKER)
    yield
    # finish the current step boundary cleanly; a run cut off mid-step is reaped and resumed
    stop.set()
    if worker_task:
        worker_task.cancel()
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
app.include_router(runs_router, prefix="/api/v1")
app.include_router(github_router, prefix="/api/v1")


@app.get("/health", tags=["system"])
async def health_check():
    """Liveness probe for the host."""
    return {"status": "ok", "version": "0.2.0"}
