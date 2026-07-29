---
reviewer: codex
mode: closure
round: 2
branch: feature/ZAC-83_repair-production-baseline
base: main
reviewed_head: c65e321b54a01083fe254c53f4b167b732b9dfc5
previous_review: openspec/changes/repair-production-baseline/review/2026-07-25_feature-ZAC-83_repair-production-baseline_codex-review-r1.md
previous_reviewed_head: d0345272ab41767cb50e360657911c611dbed66d
verdict: changes-requested
---

# Codex Review

## Finding transitions

| ID | Priority | Status | Evidence |
|---|---|---|---|
| REV-001 | P1 | resolved | `BackEnd/app/admin.py` now derives the actor from a Google bearer credential checked through Google's token-info endpoint for audience, positive remaining lifetime, verified email, and email presence. The frontend sends the in-memory access token rather than `X-Admin-Email`; endpoint tests cover missing, invalid/wrong-audience, expired, unverified, non-allowlisted, read-only, and write-authorized cases. |
| REV-002 | P1 | resolved | `Makefile` now invokes `scripts/sync_drive.py` after entering `BackEnd`; `BackEnd/requirements.txt` declares the Google API/auth distributions; the clean-environment suite imports the module and passes the credential-free CLI/path smoke tests. |
| REV-003 | P2 | still-open | `BackEnd/tests/test_startup_readiness.py:29-34` enters the real FastAPI lifespan, but mocks `create_tables`, `SessionLocal`, `load_essays_from_db`, and `load_db_embeddings`. It therefore bypasses the isolated SQLite table/session path and temporary essay/embedding fixture loading required by the Round 1 resolution. |

## New blocking findings

None.

## Follow-up findings

- The compatible lockfile still reports seven high-severity npm advisories and the production bundle still triggers Vite's 500 kB warning. These remain non-blocking dependency and performance follow-ups.
- Temporary clean-verification environments remain outside Git under Windows Temp and contain no production data or credentials.

## Verification and residual risk

- Reviewed `git diff d0345272ab41767cb50e360657911c611dbed66d..c65e321b54a01083fe254c53f4b167b732b9dfc5` and the code/tests directly relevant to REV-001 through REV-003.
- Re-ran the focused admin suite (44/44), Drive sync smoke suite (2/2), and startup/readiness suite (2/2); all pass.
- Verification Round 2 records the clean frontend build/test, clean Python install and complete backend suite (73/73), repository scans, and OpenSpec strict validation against the reviewed head.
- REV-003 remains an explicit acceptance-criterion blocker because the passing test proves lifespan orchestration and readiness responses but not the real isolated database and fixture initialization path at `BackEnd/app/main.py:45-55`.
- Production was not modified during review.

## Next Action

`/dev-fix --review "openspec/changes/repair-production-baseline/review/2026-07-25_feature-ZAC-83_repair-production-baseline_codex-review-r2.md"`

Reason: REV-003 remains blocking until lifespan runs against isolated SQLite and temporary essay/embedding fixtures without mocking the initialization path.
