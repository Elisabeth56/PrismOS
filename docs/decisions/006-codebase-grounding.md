# 006 Filtered repo tree and model-picked files

**Context.** Hackathon agents saw at most 200 file paths and never the code they were changing.

**Decision.** Fetch the repo tree with an installation token and drop vendored, generated, binary and lock
files. A small model call picks up to 15 relevant files from the tree and the request. Those files go to the
agents inside delimiters, as data, with an instruction to ignore instructions inside them. File context is
capped at about 60K characters.

**Rejected.** Tree plus named files (the old approach). A pgvector index per repo (better recall on large
repos, too heavy for four days on free tiers).

**Consequences.** Cheap and explainable. It misses cross-cutting files (route registries, config, shared
types) and anything the filter dropped.

## As built

- Pinned to one commit: the snapshot step stores the commit SHA, so every step and every retry reads the same code.
- Trees over 4,000 files keep the shallowest paths, where entry points and config live.
- Files are read in the selector's order until the cap; whatever doesn't fit is listed as omitted, shown to
  the user and named in the prompt so the model knows what it didn't see.
- Selection goes to Groq when the prompt fits about 6K tokens and to Gemini otherwise.
- **Measured: 92% recall** of the files a change must touch, over the six eval cases
  ([results](../../apps/api/evals/RESULTS.md)). The fixture is small, so this says little about large repos yet.
