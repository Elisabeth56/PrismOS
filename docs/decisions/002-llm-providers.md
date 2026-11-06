# 002 Gemini Flash for large calls, Groq for small ones, one llm.py

**Context.** Free tiers only. Groq's free tier caps tokens per minute (about 8K), too low for a build call;
Gemini Flash's free tier allows far more per minute.

**Decision.** `app/ai/llm.py` is the only module that talks to providers. `generate(messages, schema)` returns
a Pydantic-validated object: the JSON Schema goes in the prompt, JSON mode is on, and invalid output gets one
corrective retry with the validation error before the step fails. Large calls go to Gemini, small ones
(file selection) to Groq. Every call has a timeout, one retry on 429/5xx, and logs model, tokens and latency.
Prompts live in `app/ai/prompts/*.md`, with a temperature per role.

**Rejected.** Groq only (a build call alone exceeds its per-minute cap). Keeping Qwen on DashScope (paid).

**Consequences.** Google may use free-tier inputs to improve its models, and PrismOS sends code. The run form
and the landing page say so.

## As built

- **Refusals fall back too.** The first live runs stopped at plan with a generic error: Gemini answered 404
  because the configured model (`gemini-2.5-flash`) had been deprecated, and a 404 wasn't a transient error,
  so it skipped the fallback chain. Now any non-transient refusal skips that provider's other models and moves
  on; large calls end with Groq as a last resort. If every provider refuses, the run fails with
  `models_refused` and each provider's own explanation.
- **Models.** `gemini-3.5-flash`, falling back to `gemini-3.5-flash-lite`, then `openai/gpt-oss-120b` on Groq.
  All three are configurable per environment.
- **Measured cost.** The first successful run used 16,481 input and 5,495 output tokens across 8 model calls,
  well under the 40-50K estimated before the build. Model time was about 80 seconds, half of it the build step.
