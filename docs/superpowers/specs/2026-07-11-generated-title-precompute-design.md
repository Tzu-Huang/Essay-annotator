# Design: Precompute `generated_title` at database-build time

Date: 2026-07-11
Status: Approved, ready for implementation planning

## Problem

`service/generate_topic.py` exposes `get_topic(topic, content, client)`, which calls
OpenAI (`gpt-4o-mini`) to produce a short, compelling title for an essay. Today it's
called **live, on every request**, from two places:

- `POST /search` (`BackEnd/service/search_service.py:66-72`) — once per search result,
  on every search.
- `GET /essays/{essay_id}` (`BackEnd/app/main.py:223-238`) — once per request, with
  its own OpenAI usage tracking via `record_openai_usage`.

This means the same essay's title gets regenerated repeatedly, at cost, instead of
being computed once. Separately, `BackEnd/scripts/add_to_database.py` is the single
place where essays from all three sources (online essays, collected essays, new_input
essays) are assembled into `database.jsonl` — this is the natural point to generate
the title once, at ingestion, and store it for reuse.

Note: in this codebase's schema, the existing `"topic"` field on an essay holds the
**essay prompt/question** (e.g. "Reflect on something that..."), not a title. `get_topic`
actually generates a short title summarizing the essay's content — hence the new field
is named `generated_title`, matching the key already used at the `search_service.py`
call site, not `generated_topic`.

## Goal

Generate `generated_title` once, when an essay is added to the database, and store it
as an **additional field** (never replacing `topic`) — consistently for essays loaded
from online sources, collected sources, and new_input `.txt` files. Then have both
consumer endpoints read the stored value instead of calling OpenAI live.

## Non-goals

- No Postgres schema migration. `generated_title` is stored inside the existing
  `metadata_json` JSON column on the `essays` table, not a new dedicated column.
- No backfill code path. The current 219 essays in `database.jsonl` lack this field;
  they'll get it by manually forcing a full rebuild (emptying/deleting
  `database.jsonl` so `add_to_database.py`'s "first build" path regenerates
  everything). This is a manual, one-time operator action outside this change.
- `app/admin.py`'s essay create/update endpoints do **not** auto-generate
  `generated_title`. That's a separate essay-creation path (the admin console) from
  `add_to_database.py`'s ingestion pipeline, and is out of scope here.
- No change to `add_to_database.py`'s existing logic: dedup via essay signatures, ID
  counter assignment, first-build-vs-incremental-append branching, or moving
  processed `.txt` files to `new_input/processed/`. Title generation is added as a
  separate pass over an already-assembled essay list, not woven into the loaders.

## Design

### 1. `BackEnd/scripts/add_to_database.py`

- Add a `get_client()` helper: `OpenAI(api_key=os.environ["OPENAI_API_KEY"])`
  (mirrors `service/search_service.py`'s `get_client()`; kept local to this script
  rather than imported from `search_service.py`, to avoid pulling in that module's
  FastAPI/embedding/search dependencies into a standalone script).
- Import `get_topic` from `service.generate_topic`.
- Add:

  ```python
  def add_generated_titles(essays: list[dict], client) -> None:
      """Mutates each essay in place, adding a 'generated_title' field."""
      for essay in essays:
          try:
              essay["generated_title"] = get_topic(
                  topic=essay.get("topic", ""),
                  content=essay.get("content", ""),
                  client=client,
              )
          except Exception as e:
              print(f"  [warn] Failed to generate title for {essay.get('id')}: {e}")
              essay["generated_title"] = None
  ```

- Wire into `update_database()`:
  - First-build path (`if_database` true): call
    `add_generated_titles(all_essays, get_client())` after
    `all_essays = online_essays + collected_essays + new_essays` and before the
    file is written.
  - Incremental-append path (`if_database` false): call
    `add_generated_titles(new_essays, get_client())` after
    `load_new_input_essays(...)` and before essays are appended to the file.
- Applies uniformly to all three sources because it operates on the assembled list,
  not inside any individual loader (`load_online_essays`, `load_collected_essays`,
  `load_new_input_essays` are untouched).
- Essays already skipped as duplicates (via `existing_signatures`) never reach this
  step, so no wasted API calls on essays that won't be added.
- Failure handling: any single essay's OpenAI call failing does not stop the run;
  that essay gets `generated_title: None` and processing continues. This is a
  one-time cost per essay at ingestion (roughly 219 sequential calls on a full
  rebuild today); no concurrency is added, matching the script's existing
  sequential I/O style.

### 2. Postgres — `BackEnd/database/essays.py`

- `import_essays_from_jsonl(db, path)`: after `payload = validate_essay_payload(raw)`,
  if `raw.get("generated_title")` is present, merge it into
  `payload["metadata_json"]` (creating the dict if it's `None`) before constructing
  the `Essay(...)` row.
  - `validate_essay_payload()` itself is **not modified** — it's shared with
    `app/admin.py`'s create/update routes, which are unrelated to this feature and
    should keep their current behavior exactly.
- `essay_to_dict(essay, include_content)`: add
  `data["generated_title"] = (essay.metadata_json or {}).get("generated_title")`
  so the field is flattened to the top level in every dict this function produces
  (used by `load_essays_from_db`, and by `app/admin.py`'s list/detail/audit-log
  snapshots).
- No changes to `database/create.py` (`Essay` model) — reuses the existing
  `metadata_json` column, so no `ALTER TABLE` / migration is needed against the
  live Supabase-hosted Postgres instance.

### 3. Consumers switch from live generation to stored field

- `BackEnd/app/main.py`, `GET /essays/{essay_id}` (lines 223-238): replace the
  `client = OpenAI(...)` + `get_topic(...)` + `record_openai_usage(...)` block with:

  ```python
  result["generated_title"] = essay.get("generated_title")
  ```

  Remove the now-unused `from openai import OpenAI`, `from service.generate_topic
  import get_topic`, and `from service.generate_topic import MODEL as TOPIC_MODEL`
  imports (confirmed unused elsewhere in the file after this change).

- `BackEnd/service/search_service.py`, `run_search()` (lines 66-72): replace the
  per-result loop calling `get_topic(...)` with:

  ```python
  for result in results:
      essay = app_state.essays.get(result["parent_id"], {})
      result["generated_title"] = essay.get("generated_title")
  ```

  Remove the now-unused `from service.generate_topic import get_topic` import.
  `client` stays in this file — still needed for embedding calls.

### Data flow (end to end)

```
add_to_database.py:
  loaders → assembled essay list → add_generated_titles() → database.jsonl
    (top-level "generated_title" key per essay)

scripts/import_essays_to_postgres.py → import_essays_from_jsonl():
  reads database.jsonl → merges "generated_title" into Essay.metadata_json
    → Postgres `essays` table (no new column)

App startup (app/main.py lifespan):
  load_essays_from_db() → essay_to_dict() flattens
    metadata_json["generated_title"] → top-level "generated_title"
  (fallback) load_essays(database.jsonl) → already top-level, passes through as-is

Consumers read essay.get("generated_title") directly, no live OpenAI calls:
  GET /essays/{essay_id}, POST /search
```

## Error handling

- Per-essay OpenAI failures during ingestion: caught, logged, `generated_title` set
  to `None`, run continues (see `add_generated_titles` above).
- Consumers (`main.py`, `search_service.py`) use `essay.get("generated_title")`,
  which naturally returns `None` for essays that don't have it (pre-existing essays
  before a rebuild, or essays where generation failed) — no exception, no special
  casing needed on the read side.

## Verification plan

- Run `add_to_database.py` against a small test `new_input/` fixture and confirm
  appended `database.jsonl` rows include a non-null `generated_title` alongside the
  original `topic`.
- Run the existing `BackEnd/tests/test_admin_data.py` suite (`python -m unittest` from
  `BackEnd/`) to confirm `import_essays_from_jsonl` / `essay_to_dict` changes don't
  break current assertions.
- Start the dev server, hit `GET /essays/{id}` and `POST /search` with `curl`, and
  confirm `generated_title` is present in responses without a live OpenAI call
  (verify via `record_openai_usage` no longer firing with `feature="generated_title"`
  on those requests).

## Aside (not part of this change)

`BackEnd/tests/test_admin_data.py` is a real automated backend test suite, which
contradicts `CLAUDE.md`'s current statement that "there is no automated backend test
suite." Worth a documentation fix at some point; unrelated to this feature.
