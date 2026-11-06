"""LLM module behaviour with the providers mocked at the HTTP layer."""

import json

import httpx2 as httpx
import pytest
from openai import AsyncOpenAI, DefaultAsyncHttpxClient
from pydantic import BaseModel

from app.ai import llm


class Verdict(BaseModel):
    verdict: str
    items_checked: list[str]


def completion(content: str, model: str = "m") -> dict:
    return {
        "id": "c1",
        "object": "chat.completion",
        "created": 0,
        "model": model,
        "choices": [{"index": 0, "finish_reason": "stop", "message": {"role": "assistant", "content": content}}],
        "usage": {"prompt_tokens": 100, "completion_tokens": 20, "total_tokens": 120},
    }


@pytest.fixture
def provider(monkeypatch):
    """Routes every provider call to a handler the test controls; records which models were asked."""
    calls: list[str] = []
    responses: list[httpx.Response] = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(json.loads(request.content)["model"])
        return responses.pop(0)

    def fake_client(provider_name):
        return AsyncOpenAI(
            api_key="k",
            base_url=llm.BASE_URLS[provider_name],
            max_retries=0,
            http_client=DefaultAsyncHttpxClient(transport=httpx.MockTransport(handler)),
        )

    monkeypatch.setattr(llm, "client", fake_client)
    monkeypatch.setattr(llm, "RETRY_DELAY_SECONDS", 0)
    return calls, responses


def ok(content: dict | str) -> httpx.Response:
    return httpx.Response(200, json=completion(content if isinstance(content, str) else json.dumps(content)))


RATE_LIMITED = httpx.Response(429, json={"error": {"message": "slow down"}})
GOOD = {"verdict": "verified", "items_checked": ["1", "2"]}


async def test_valid_output_is_parsed_and_usage_returned(provider):
    calls, responses = provider
    responses.append(ok(GOOD))

    result, usage = await llm.generate([{"role": "user", "content": "check"}], Verdict)

    assert result == Verdict(**GOOD)
    assert calls == ["gemini-3.5-flash"]
    assert (usage[0].tokens_in, usage[0].tokens_out) == (100, 20)


async def test_rate_limit_retries_once_then_falls_back_to_the_next_model(provider):
    calls, responses = provider
    responses.extend([RATE_LIMITED, RATE_LIMITED, ok(GOOD)])

    result, _ = await llm.generate([{"role": "user", "content": "check"}], Verdict)

    assert result.verdict == "verified"
    assert calls == ["gemini-3.5-flash", "gemini-3.5-flash", "gemini-2.5-flash-lite"]


async def test_small_calls_go_to_groq_first(provider):
    calls, responses = provider
    responses.append(ok(GOOD))

    await llm.generate([{"role": "user", "content": "pick files"}], Verdict, size="small")

    assert calls == ["openai/gpt-oss-120b"]


async def test_every_model_rate_limited_raises_unavailable(provider):
    _, responses = provider
    responses.extend([RATE_LIMITED] * 6)  # two tries each for three models

    with pytest.raises(llm.LLMUnavailable):
        await llm.generate([{"role": "user", "content": "check"}], Verdict)


async def test_invalid_json_gets_one_corrective_retry(provider):
    calls, responses = provider
    responses.extend([ok({"verdict": "verified"}), ok(GOOD)])

    result, usage = await llm.generate([{"role": "user", "content": "check"}], Verdict)

    assert result.items_checked == ["1", "2"]
    assert len(usage) == 2


async def test_invalid_json_twice_raises(provider):
    _, responses = provider
    responses.extend([ok("not json"), ok({"verdict": 3})])

    with pytest.raises(llm.LLMOutputInvalid):
        await llm.generate([{"role": "user", "content": "check"}], Verdict)


async def test_a_refusal_skips_that_provider_and_tries_the_next(provider):
    calls, responses = provider
    responses.extend([httpx.Response(400, json={"error": {"message": "User location is not supported"}}), ok(GOOD)])

    result, _ = await llm.generate([{"role": "user", "content": "check"}], Verdict)

    assert result.verdict == "verified"
    # not retried, and the other Gemini model is skipped: the refusal is about the account, not the model
    assert calls == ["gemini-3.5-flash", "openai/gpt-oss-120b"]


async def test_when_every_provider_refuses_the_reasons_are_kept(provider):
    _, responses = provider
    responses.extend(
        [
            httpx.Response(400, json={"error": {"message": "User location is not supported"}}),
            httpx.Response(401, json={"error": {"message": "Invalid API Key"}}),
        ]
    )

    with pytest.raises(llm.LLMUnavailable) as raised:
        await llm.generate([{"role": "user", "content": "check"}], Verdict)

    assert raised.value.reasons == [
        "Gemini refused the request: 400 User location is not supported",
        "Groq refused the request: 401 Invalid API Key",
    ]
