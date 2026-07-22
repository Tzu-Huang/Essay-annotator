# Admin Console — Upcoming Changes

Working list from the brainstorm on `feature/admin`. Ordered by sequencing decision: fix the usage-tracking bug first, then the visual redesign, then the smaller UX fixes.

## 1. Fix missing OpenAI usage logging (done)

**Root cause:** `record_openai_usage()` (`BackEnd/app/usage.py`) is only called from `BackEnd/app/main.py` for the `search` and `compare` features. It is never called from `BackEnd/app/admin.py`, so three admin endpoints that make real OpenAI calls log nothing:

- `POST /admin/essays/{id}/regenerate-embedding` (`admin.py:371`)
- `POST /admin/essays/regenerate-stale-embeddings` (`admin.py:451`)
- `POST /admin/import-new-essays` (`admin.py:539`, both the embedding calls and the title-generation call inside `scan_and_title_new_essays`)

Effect: the "Feature Attribution" table and the daily-request chart on the Usage/Overview tabs undercount — real spend from admin-triggered embedding regeneration is invisible.

**Done:**
- Added `record_openai_usage(db, feature="embedding_regen", ...)` calls (success + failure) to `trigger_embedding_regeneration`, `regenerate_stale_embeddings` (per-essay, inside the loop), and `import_new_essays` (per-essay embedding loop).
- Added `record_openai_usage(db, feature="title_generation", ...)` per essay in `import_new_essays`, read off `essay.get("generated_title")` since `add_generated_titles()` already marks failures as `None` — done at the call site rather than reaching into `scripts/add_to_database.py` / `service/ingest_service.py`, which are shared with the standalone CLI import path that has no db session.
- Deduped the repeated `os.getenv("OPENAI_EMBEDDING_MODEL", ...)` literal into a local `embedding_model` var per function.
- Still open: `embedding()` in `BackEnd/embedding/make_embedding.py:113` discards `response.usage`, so these new events log with `input_tokens=None`/`output_tokens=None` (token counts, not just request counts) — same as the existing `search`/`compare` calls. Threading real token counts through is a separate, larger change if wanted later.
- Verified: `BackEnd/tests` full suite (47 tests) and `frontend` test suite (29 tests) pass; `eslint` clean.

## 2. Refresh-after-regenerate on single-essay regenerate (done)

`regenerateEmbeddingFor()` (`frontend/src/pages/AdminConsole.jsx:281`) didn't call `loadOverview()` afterward, unlike `saveEssay`, `deleteEssay`, `importNewEssays`, and `regenerateAllStale`, which all do. Added the missing `await loadOverview();` call after the API response, matching the existing pattern.

## 3. Redesign Usage and Logs tabs

Finish the visual pass that already covered Overview, Essays, and Audit. `Usage` and `Logs` (`AdminConsole.jsx:524-618`) are still inline functions in the monolith file, not extracted into `admin/` components, and don't match the dashboard/panel visual language the other three tabs now have.

- Extract `Usage` → `frontend/src/pages/admin/UsageTab.jsx`
- Extract `Logs` → `frontend/src/pages/admin/LogsTab.jsx`
- Usage: card-grid + panel treatment like Overview; consider a spend trend line.
- Logs: consider the expandable typewriter-style treatment used for Audit.

## 4. Clarify the essay editor's two-step save

On `EssayEditorPage.jsx`, clicking "✎ Edit" → typing → "✓ Save" only commits the draft into local `editor.content` state — it does **not** persist to the backend. Persisting only happens via the page-level "Save" button in the header. The unsaved-changes guard prevents actual data loss on navigation, but the inner "✓ Save" label reads as if it saved. Relabel (e.g. "Done" / "Apply") to remove the ambiguity.

## 5. Soft-deleted essays have no dedicated home

Soft delete just sets `deleted_at`; the essay disappears from the default list and only reappears if "include deleted" is checked in filters. Restore and hard-delete are fully wired on the backend but have no dedicated Trash view. Candidate: a filtered view or dedicated tab listing only soft-deleted essays, with restore/hard-delete actions surfaced directly.

## 6. Google Analytics setup guide

No GA integration exists anywhere in the frontend currently — clean slate. To be written up as a setup walkthrough (not code) once the above items are settled, if still wanted.

## 7. Daily requests chart should stay current, not just on admin-triggered actions

**Already covered:** every admin-console action that itself logs an `OpenAIUsageEvent` (`regenerateEmbeddingFor`, `importNewEssays`, `regenerateAllStale` — see item 2) already calls `loadOverview()` right after, so the Overview tab's daily-request chart (`usage.local_daily`, from `daily_request_counts()`) reflects the admin's own actions immediately.

**Remaining gap:** `record_openai_usage()` is also called from the *public-facing* app (`BackEnd/app/main.py`'s `/search` and `/compare` endpoints — real students using the essay search/comparison features). Those requests have no way to push an update into an admin's already-open Overview tab — the chart only picks them up on the next manual tab switch or refresh-icon click. If an admin sits on the Overview tab watching live usage, the daily-request count silently goes stale.

**Candidate fix:** light polling while the Overview tab is active — e.g. re-run `loadOverview()` on an interval (a minute or so) only when `tab === "overview"`, clearing the interval on tab change/unmount. Keep it simple: no websockets, no push infra, just a `setInterval` guarded by the current tab, mirroring the existing `useEffect`/cleanup pattern already used for the 10s auto-dismissing status message.
