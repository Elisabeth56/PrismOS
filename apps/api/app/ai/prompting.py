"""Loads prompt files and fills them, wrapping anything from the user or their repo as delimited data."""

from __future__ import annotations

import re
from functools import lru_cache
from pathlib import Path

PROMPTS_DIR = Path(__file__).parent / "prompts"
_PLACEHOLDER = re.compile(r"{{(\w+)}}")

# temperature per role (ADR-002): low everywhere, zero where the answer should be the same every time
TEMPERATURE = {
    "file_selector": 0.0,
    "planner": 0.3,
    "critic": 0.2,
    "resolver": 0.2,
    "builder": 0.2,
    "verifier": 0.0,
}


@lru_cache
def load(name: str) -> str:
    return (PROMPTS_DIR / f"{name}.md").read_text()


def render(name: str, **values: str) -> str:
    """Fills {{placeholders}}; the shared data rule is always available. A missing value is an error, not a gap."""
    values = {"data_rule": load("_data_rule").strip(), **values}

    def fill(match: re.Match[str]) -> str:
        key = match.group(1)
        if key not in values:
            raise KeyError(f"prompt {name!r} needs a value for {{{{{key}}}}}")
        return values[key]

    return _PLACEHOLDER.sub(fill, load(name))


def as_data(tag: str, content: str, **attrs: str) -> str:
    """Wraps untrusted text in a tag the prompts declare as data, so it can't close the tag early."""
    # neutralise a closing tag inside the content (e.g. a repo file containing "</repo_file>")
    safe = re.sub(rf"</\s*{tag}\s*>", f"<\\/{tag}>", content, flags=re.IGNORECASE)
    attributes = "".join(f' {key}="{value.replace(chr(34), "&quot;")}"' for key, value in attrs.items())
    return f"<{tag}{attributes}>\n{safe}\n</{tag}>"


def repo_files(files: dict[str, str]) -> str:
    """The selected repository files, each as its own data block."""
    return "\n\n".join(as_data("repo_file", content, path=path) for path, content in files.items())
