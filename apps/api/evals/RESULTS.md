# Eval results

Run on 7 November 2026 ([workflow run](https://github.com/Elisabeth56/PrismOS/actions/runs/42308766958)).
Six cases against `fixtures/notes-api`, a 14-file FastAPI and SQLite API. Each case goes through the full
pipeline and through a single-prompt baseline that sees every file and writes the change in one call. Both
are scored by the same acceptance checks (`cases.json`): the change applied to a copy of the fixture, then
checked for the routes, columns, tests and behaviour the request asked for.

| | PrismOS pipeline | Single prompt |
|---|---|---|
| Acceptance checks passed | 17/18 (94%) | 17/18 (94%) |
| Runs that finished | 6/6 | 6/6 |
| Changed the files that must change | 100% | 100% |
| File selection recall | 92% | sees every file |
| Verified by the verifier | 6/6 | no verifier |
| Conflicts raised | 3 | none |
| Tokens per case | 22,758 | 6,437 |
| Median seconds per case | 311.5 | 67.9 |

| Case | Pipeline | Single prompt |
|---|---|---|
| login-rate-limit | 3/3 | 3/3 |
| login-same-error | 3/3 | 3/3 |
| notes-tag-filter | 2/2 | 2/2 |
| notes-pagination | 3/3 | 3/3 |
| notes-soft-delete | 4/4 | 4/4 |
| notes-export-markdown | 2/3 | 2/3 |

Both missed the same check: the Markdown export doesn't set a `text/markdown` content type.

## What it shows

On these cases the critics don't change the outcome. A single prompt that sees all 14 files already passes 17 of
18 checks, so there's no room for the pipeline to do better; the cases sit at a ceiling. What the pipeline adds
here is process: a spec, three settled conflicts, a verifier that agreed with the checks every time, and a
pull request it can open. It costs about 3.5 times the tokens.

Time is not a fair comparison in this run. Gemini's free tier allows a few requests a minute and the three
critics run at once, so most pipeline calls waited out a rate limit (up to 60 s) and then fell back from
`gemini-3.5-flash` to `gemini-3.5-flash-lite`. The baseline makes one call per case after a pause and rarely
hit the limit.

## Next

- Harder cases, where a single prompt plausibly fails: changes that touch auth and data together, a repo too
  large to paste whole, requests with a security trap the Security critic should catch.
- A paid-tier or self-hosted run, so both arms use the same model and the timing means something.

Run it yourself: add `GEMINI_API_KEY` and `GROQ_API_KEY` as repository secrets and start the `evals` workflow,
or locally `EVAL=1 uv run pytest evals/test_eval.py -s` from `apps/api`.
