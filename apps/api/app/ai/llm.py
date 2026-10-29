"""The only module that talks to LLM providers (ADR-002).

Gemini handles large calls, Groq handles small fast ones. Both speak the OpenAI-compatible API, so one
client type covers them. Each call has a timeout and one bounded retry, falls back to the next model
on rate limits or outages, and logs model, tokens and latency. Structured calls are validated with
Pydantic: on invalid output the model gets one retry with the error, then the call fails.
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
from collections.abc import AsyncIterator, Sequence
from dataclasses import dataclass
from functools import lru_cache
from typing import Literal

import openai
from openai import AsyncOpenAI
from openai.types.chat import ChatCompletionMessageParam
from pydantic import BaseModel, ValidationError

from app.config import get_settings

logger = logging.getLogger("prismos.llm")

Provider = Literal["gemini", "groq"]
Size = Literal["large", "small"]
Message = ChatCompletionMessageParam

BASE_URLS: dict[Provider, str] = {
    "gemini": "https://generativelanguage.googleapis.com/v1beta/openai/",
    "groq": "https://api.groq.com/openai/v1",
}

# errors worth retrying or falling back on; anything else (bad request, auth) fails straight away
TRANSIENT = (openai.RateLimitError, openai.APITimeoutError, openai.APIConnectionError, openai.InternalServerError)
RETRY_DELAY_SECONDS = 2.0


@dataclass(frozen=True)
class Model:
    provider: Provider
    name: str


@dataclass(frozen=True)
class Usage:
    model: str
    tokens_in: int
    tokens_out: int
    latency_ms: int


class LLMUnavailable(Exception):
    """Every model in the chain failed with a transient error (rate limits, outages, timeouts)."""


class LLMOutputInvalid(Exception):
    """The model's output didn't match the schema, even after one corrective retry."""


def model_chain(size: Size) -> list[Model]:
    """Which models a call tries, in order. Groq only serves small calls: its free tier caps tokens per minute."""
    s = get_settings()
    large = [Model("gemini", s.GEMINI_MODEL), Model("gemini", s.GEMINI_FALLBACK_MODEL)]
    return large if size == "large" else [Model("groq", s.GROQ_MODEL), *large[1:]]


@lru_cache
def client(provider: Provider) -> AsyncOpenAI:
    s = get_settings()
    key = s.GEMINI_API_KEY if provider == "gemini" else s.GROQ_API_KEY
    # retries are ours (bounded, then fallback), so the SDK's own are off
    return AsyncOpenAI(
        api_key=key.get_secret_value(), base_url=BASE_URLS[provider], timeout=s.LLM_TIMEOUT_SECONDS, max_retries=0
    )


async def _complete(
    model: Model, messages: Sequence[Message], temperature: float, json_mode: bool
) -> tuple[str, Usage]:
    """One completion with one bounded retry on transient errors."""
    for attempt in (1, 2):
        started = time.monotonic()
        try:
            response = await client(model.provider).chat.completions.create(
                model=model.name,
                messages=list(messages),
                temperature=temperature,
                response_format={"type": "json_object"} if json_mode else openai.omit,
            )
        except TRANSIENT as error:
            if attempt == 2:
                raise
            logger.warning("llm transient error, retrying: model=%s error=%s", model.name, type(error).__name__)
            await asyncio.sleep(RETRY_DELAY_SECONDS)
            continue
        usage = Usage(
            model=model.name,
            tokens_in=response.usage.prompt_tokens if response.usage else 0,
            tokens_out=response.usage.completion_tokens if response.usage else 0,
            latency_ms=int((time.monotonic() - started) * 1000),
        )
        logger.info("llm call: model=%s in=%d out=%d ms=%d", usage.model, usage.tokens_in, usage.tokens_out,
                    usage.latency_ms)
        return response.choices[0].message.content or "", usage
    raise AssertionError("unreachable")


async def _with_fallback(size: Size, messages: Sequence[Message], temperature: float, json_mode: bool):
    errors: list[str] = []
    for model in model_chain(size):
        try:
            return await _complete(model, messages, temperature, json_mode)
        except TRANSIENT as error:
            errors.append(f"{model.name}: {type(error).__name__}")
            logger.warning("llm falling back: %s", errors[-1])
    raise LLMUnavailable("All models failed: " + "; ".join(errors))


async def generate[T: BaseModel](
    messages: Sequence[Message], schema: type[T], *, size: Size = "large", temperature: float = 0.2
) -> tuple[T, list[Usage]]:
    """A structured call: returns the validated object and the usage of every call it took."""
    # the schema goes in the prompt because json_object mode is the structured mode both providers share
    instruction: Message = {
        "role": "system",
        "content": "Respond with one JSON object matching this JSON Schema, and nothing else:\n"
        + json.dumps(schema.model_json_schema()),
    }
    conversation: list[Message] = [*messages, instruction]
    usages: list[Usage] = []
    for attempt in (1, 2):
        text, usage = await _with_fallback(size, conversation, temperature, json_mode=True)
        usages.append(usage)
        try:
            return schema.model_validate_json(text), usages
        except ValidationError as error:
            if attempt == 2:
                raise LLMOutputInvalid(f"{schema.__name__}: {error.error_count()} validation errors") from error
            # show the model exactly what was wrong, once
            reply: Message = {"role": "assistant", "content": text}
            correction: Message = {
                "role": "user",
                "content": f"That JSON was invalid:\n{error}\nReturn the corrected JSON only.",
            }
            conversation += [reply, correction]
    raise AssertionError("unreachable")


async def stream_text(
    messages: Sequence[Message], *, size: Size = "large", temperature: float = 0.4
) -> AsyncIterator[str]:
    """Plain-text streaming for prose output. No mid-stream fallback: a failure after the first token is raised."""
    model = model_chain(size)[0]
    stream = await client(model.provider).chat.completions.create(
        model=model.name, messages=list(messages), temperature=temperature, stream=True
    )
    async for chunk in stream:
        if chunk.choices and chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content
