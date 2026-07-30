---
reviewer: codex
mode: initial
round: 1
branch: feature/ZAC-83_repair-production-baseline
base: main
reviewed_head: d0345272ab41767cb50e360657911c611dbed66d
previous_review: null
previous_reviewed_head: null
verdict: changes-requested
---

# Codex Review

## Finding transitions

| ID | Priority | Status | Evidence |
|---|---|---|---|
| REV-001 | P1 | open | The backend trusts a caller-controlled `X-Admin-Email` value as the authenticated principal; a request containing an allowlisted email received HTTP 200 and `can_write=true` without a Google token. |
| REV-002 | P1 | open | The documented sync/deploy path cannot run from the clean committed baseline: its Makefile path is invalid after `cd BackEnd`, and clean requirements do not install the imported Google client packages. |
| REV-003 | P2 | open | The required backend startup/readiness gate is checked in tasks, but the recorded command disables FastAPI lifespan and never exercises initialization or `/ready`. |

## New blocking findings

### [P1][REV-001] Admin authorization is fully forgeable by the client

`BackEnd/app/admin.py:103-111` accepts the raw `X-Admin-Email` header, compares it with `ADMIN_EMAILS`, and constructs an `AdminActor` without verifying any credential or signed identity. `frontend/src/pages/AdminConsole.jsx:131-136` sends that header directly from browser state; it does not send the Google access token used during sign-in. The same dependency protects destructive operations including permanent essay deletion at `BackEnd/app/admin.py:351-352`.

Evidence: with `ADMIN_EMAILS` and `ADMIN_WRITE_EMAILS` set to `owner@example.com`, an unauthenticated `TestClient` request containing only `X-Admin-Email: owner@example.com` returned HTTP 200 from `/admin/me` with `can_write=true`.

Impact: anyone who can reach the backend and knows or guesses an allowlisted email can read administrative data, edit essays, upload/import content, regenerate embeddings, and permanently delete records. This is a production security and data-loss blocker.

Classification: late-blocker; the broken baseline already contained the header pattern, but ZAC-83 explicitly selects administrative functionality for launch v1 and makes the code deployable.

Required resolution: authenticate admin requests with a server-verified credential, such as verification of a Google-issued token with issuer, audience, expiry, and email checks. Derive the actor email only from verified claims, reject the caller-controlled identity header, update the frontend request flow, and add endpoint-level tests proving missing, invalid, expired/wrong-audience, non-allowlisted, read-only, and write-authorized behavior.

### [P1][REV-002] The declared clean backend cannot execute the release sync pipeline

`Makefile:16-17` changes into `BackEnd` and then invokes `python BackEnd/scripts/sync_drive.py`, which resolves to the nonexistent `BackEnd/BackEnd/scripts/sync_drive.py`. Even when the script is invoked by its actual path, `BackEnd/scripts/sync_drive.py:8-14` and `sync_drive_aws.py:8-10` import `googleapiclient` and `google_auth_oauthlib`, but `BackEnd/requirements.txt` does not declare their distributions.

Evidence: importing `scripts.sync_drive` from the verified project virtualenv fails with `ModuleNotFoundError: No module named 'googleapiclient'`. The current clean verification passes because no check imports or runs the sync path.

Impact: a clean checkout cannot run the documented `make sync`/`make deploy` path or reproduce the Drive-to-import input pipeline represented in the launch-v1 inventory. This violates the intended complete, reproducible baseline and can leave production data stale during release preparation.

Classification: late-blocker; it is a high-confidence pre-existing launch correctness defect exposed by reviewing the claimed clean baseline.

Required resolution: correct the Makefile path, declare the Google Drive dependencies used by tracked runtime scripts, and add a credential-free smoke check that imports the sync module and verifies CLI construction without contacting Google or mutating data.

### [P2][REV-003] Verification bypasses the required application startup/readiness behavior

The explicit task at `openspec/changes/repair-production-baseline/tasks.md:32` is checked as complete, but `validation-evidence.md:55` starts Uvicorn with `--lifespan off`; line 65 confirms initialization was intentionally disabled. This checks module import and socket binding only. It does not run `app.main.lifespan`, create/check database tables, load PostgreSQL/JSONL essays, load embeddings, populate `app.state.data`, or exercise `/ready`.

Impact: the same class of failure that broke production—a failure during application initialization—can still pass this gate. The evidence therefore does not establish the acceptance requirement recorded in the change specification and task list.

Classification: fix-introduced verification defect and an explicit acceptance-criterion violation, so P2 blocks approval.

Required resolution: replace the lifespan-disabled check with a bounded, credential-safe startup test that runs lifespan against isolated SQLite and temporary essay/embedding fixtures, asserts liveness and readiness semantics, and proves no production paths or credentials are used. Update immutable verification with a new round against the fixed commit.

## Follow-up findings

- The compatible lockfile refresh still reports seven high-severity npm advisories and the production bundle triggers Vite's 500 kB warning. The recorded BrowserRouter/build-tool context makes these non-blocking for this change, but they should remain tracked dependency and performance follow-ups.
- The two temporary verification virtual environments remain under Windows Temp because local policy blocked recursive cleanup. They are outside Git and contain no production data or credentials.

## Verification and residual risk

- Reviewed `git diff main...d0345272ab41767cb50e360657911c611dbed66d`, the OpenSpec requirements/tasks, backend admin and sync paths, frontend admin request construction, and persisted verification evidence.
- Existing automated results remain useful for merge-marker repair, frontend behavior, backend unit behavior, build reproducibility, and repository hygiene.
- Those results do not mitigate REV-001 or REV-002, and the current startup procedure is the evidence defect described by REV-003.
- Production was not modified during review.

## Next Action

`/dev-fix --review "openspec/changes/repair-production-baseline/review/2026-07-25_feature-ZAC-83_repair-production-baseline_codex-review-r1.md"`

Reason: blocking findings REV-001, REV-002, and REV-003 remain.
