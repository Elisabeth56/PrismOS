"""The shared error contract: every failure leaves the API as {"error": {"code", "message", "details"}}."""

from __future__ import annotations

import logging
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("prismos.errors")

HTTP_CODES = {
    400: "bad_request",
    401: "not_signed_in",
    403: "forbidden",
    404: "not_found",
    405: "method_not_allowed",
    409: "conflict",
    429: "rate_limited",
}


class AppError(Exception):
    """An expected failure with a stable code the frontend can act on and a message safe to show."""

    def __init__(self, status: int, code: str, message: str, details: dict[str, Any] | None = None):
        super().__init__(message)
        self.status = status
        self.code = code
        self.message = message
        self.details = details or {}


def error_response(status: int, code: str, message: str, details: dict[str, Any] | None = None) -> JSONResponse:
    body = {"error": {"code": code, "message": message, "details": details or {}}}
    return JSONResponse(status_code=status, content=body)


def register_error_handlers(app: FastAPI) -> None:
    """Routes every exception through the shared shape; unexpected ones are logged, never shown."""

    @app.exception_handler(AppError)
    async def app_error(_: Request, exc: AppError) -> JSONResponse:
        return error_response(exc.status, exc.code, exc.message, exc.details)

    @app.exception_handler(StarletteHTTPException)
    async def http_error(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        message = exc.detail if isinstance(exc.detail, str) else "Request failed."
        return error_response(exc.status_code, HTTP_CODES.get(exc.status_code, "http_error"), message)

    @app.exception_handler(RequestValidationError)
    async def validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
        # drop the "body"/"path"/"query" prefix so keys match the field names the client sent
        fields = {".".join(str(p) for p in e["loc"][1:]) or str(e["loc"][0]): e["msg"] for e in exc.errors()}
        return error_response(422, "validation_failed", "Some fields need fixing.", {"fields": fields})

    @app.exception_handler(Exception)
    async def unexpected_error(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled error on %s %s", request.method, request.url.path, exc_info=exc)
        return error_response(500, "internal_error", "Something went wrong on our side. Try again.")
