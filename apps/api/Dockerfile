FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:0.5.11 /uv /usr/local/bin/uv
WORKDIR /srv

# dependencies first so code changes don't bust the layer cache
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY app ./app

EXPOSE 8000
# one process: the run worker lives in it (ADR-004), so no multi-worker gunicorn.
# Hosts like Render pass the port in $PORT.
CMD ["sh", "-c", "exec uv run --no-dev uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
