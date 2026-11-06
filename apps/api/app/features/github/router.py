from __future__ import annotations

import httpx
from fastapi import APIRouter, Depends, Header

from app.auth import User, current_user
from app.errors import AppError
from app.github.app import InstalledRepo, repos_for_user

router = APIRouter(prefix="/github", tags=["github"])


def github_transport() -> httpx.AsyncBaseTransport | None:
    """Overridden in tests with a mock transport."""
    return None


async def github_user_token(x_github_token: str | None = Header(default=None)) -> str:
    """The user's GitHub token from their Supabase session (provider_token). Used once per request, never stored."""
    if not x_github_token:
        raise AppError(400, "github_token_missing", "Sign in with GitHub again so PrismOS can see your repositories.")
    return x_github_token


@router.get("/repositories", response_model=list[InstalledRepo])
async def list_repositories(
    _: User = Depends(current_user),
    token: str = Depends(github_user_token),
    transport: httpx.AsyncBaseTransport | None = Depends(github_transport),
):
    """Repositories the user can attach: covered by a PrismOS installation they can access."""
    return await repos_for_user(token, transport)
