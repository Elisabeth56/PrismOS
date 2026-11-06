"""Verifies the Supabase access token on each request and exposes the signed-in user."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from functools import lru_cache
from typing import Any

import jwt
from fastapi import Header

from app.config import Settings, get_settings
from app.errors import AppError


@dataclass(frozen=True)
class User:
    id: str
    email: str | None


INVALID = AppError(401, "invalid_token", "Your session is invalid or has expired. Sign in again.")


@lru_cache
def _jwks_client(jwks_url: str) -> jwt.PyJWKClient:
    # keys are cached in the client, so the JWKS endpoint is hit once per key rotation, not per request
    return jwt.PyJWKClient(jwks_url, cache_keys=True)


def _signing_key(token: str, settings: Settings) -> tuple[Any, list[str]]:
    """Returns the key and allowed algorithms for this token: the legacy shared secret or a JWKS public key."""
    alg = jwt.get_unverified_header(token).get("alg")
    if alg == "HS256":
        if settings.SUPABASE_JWT_SECRET is None:
            raise INVALID
        return settings.SUPABASE_JWT_SECRET.get_secret_value(), ["HS256"]
    jwks_url = f"{str(settings.SUPABASE_URL).rstrip('/')}/auth/v1/.well-known/jwks.json"
    return _jwks_client(jwks_url).get_signing_key_from_jwt(token).key, ["ES256", "RS256"]


def verify_token(token: str, settings: Settings) -> User:
    """Checks signature, expiry and audience; anything wrong is the same 401 so nothing leaks."""
    try:
        key, algorithms = _signing_key(token, settings)
        claims = jwt.decode(
            token, key, algorithms=algorithms, audience="authenticated", options={"require": ["exp", "sub"]}
        )
    except (jwt.PyJWTError, ValueError) as error:
        raise INVALID from error
    return User(id=claims["sub"], email=claims.get("email"))


async def current_user(authorization: str | None = Header(default=None)) -> User:
    """FastAPI dependency for any route that needs a signed-in user."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise AppError(401, "not_signed_in", "Sign in to continue.")
    # the JWKS fetch on a cold cache is blocking network I/O
    return await asyncio.to_thread(verify_token, authorization[7:].strip(), get_settings())
