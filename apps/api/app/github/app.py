"""PrismOS as a GitHub App (ADR-001).

Two kinds of token, never stored:
  - installation tokens: minted per operation from the App's private key, scoped to the one repository the
    run works on, valid for an hour. These read code and open pull requests.
  - the user's own token (from signing in with GitHub through the App's OAuth credentials): used only to
    prove the user can access an installation before a project is attached to it. Installation ids are
    small integers, so trusting one from the browser would let anyone attach someone else's repo.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from datetime import datetime
from functools import lru_cache

import httpx
import jwt
from pydantic import BaseModel

from app.config import get_settings
from app.errors import AppError

API = "https://api.github.com"
HEADERS = {"Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}


@dataclass
class GitHubApp:
    app_id: str
    private_key: str
    transport: httpx.AsyncBaseTransport | None = None
    _tokens: dict[tuple[int, str], tuple[str, float]] = field(default_factory=dict, repr=False)

    def app_jwt(self) -> str:
        now = int(time.time())
        # backdated a minute for clock drift; GitHub allows at most ten minutes
        payload = {"iat": now - 60, "exp": now + 540, "iss": self.app_id}
        return jwt.encode(payload, self.private_key, algorithm="RS256")

    async def installation_token(self, installation_id: int, repo_full_name: str) -> str:
        """A token for one repository of the installation, reused until five minutes before it expires."""
        key = (installation_id, repo_full_name)
        cached = self._tokens.get(key)
        if cached and cached[1] - time.time() > 300:
            return cached[0]
        async with httpx.AsyncClient(base_url=API, headers=HEADERS, timeout=20, transport=self.transport) as http:
            response = await http.post(
                f"/app/installations/{installation_id}/access_tokens",
                headers={"Authorization": f"Bearer {self.app_jwt()}"},
                json={"repositories": [repo_full_name.split("/", 1)[1]]},
            )
        response.raise_for_status()
        body = response.json()
        expires = datetime.fromisoformat(body["expires_at"].replace("Z", "+00:00")).timestamp()
        self._tokens[key] = (body["token"], expires)
        return body["token"]


class InstalledRepo(BaseModel):
    installation_id: int
    full_name: str
    default_branch: str
    private: bool


async def repos_for_user(user_token: str, transport: httpx.AsyncBaseTransport | None = None) -> list[InstalledRepo]:
    """Every repository the user can reach through a PrismOS installation, as GitHub tells it with their token."""
    repos: list[InstalledRepo] = []
    headers = {**HEADERS, "Authorization": f"Bearer {user_token}"}
    async with httpx.AsyncClient(base_url=API, headers=headers, timeout=20, transport=transport) as http:
        installations = await _get(http, "/user/installations", {"per_page": "100"})
        for installation in installations["installations"]:
            page = 1
            while True:
                body = await _get(
                    http,
                    f"/user/installations/{installation['id']}/repositories",
                    {"per_page": "100", "page": str(page)},
                )
                repos += [
                    InstalledRepo(
                        installation_id=installation["id"],
                        full_name=r["full_name"],
                        default_branch=r["default_branch"],
                        private=r["private"],
                    )
                    for r in body["repositories"]
                ]
                if len(body["repositories"]) < 100:
                    break
                page += 1
    return repos


async def _get(http: httpx.AsyncClient, path: str, params: dict[str, str]) -> dict:
    response = await http.get(path, params=params)
    if response.status_code == 401:
        raise AppError(
            401, "github_token_expired", "Your GitHub sign-in has expired. Sign out and sign in again to continue."
        )
    response.raise_for_status()
    return response.json()


@lru_cache
def get_github_app() -> GitHubApp | None:
    """The configured App, or None when GITHUB_APP_ID / GITHUB_APP_PRIVATE_KEY aren't set."""
    settings = get_settings()
    if not (settings.GITHUB_APP_ID and settings.GITHUB_APP_PRIVATE_KEY):
        return None
    # the key usually arrives as one env line with \n escapes
    return GitHubApp(settings.GITHUB_APP_ID, settings.GITHUB_APP_PRIVATE_KEY.get_secret_value().replace("\\n", "\n"))
