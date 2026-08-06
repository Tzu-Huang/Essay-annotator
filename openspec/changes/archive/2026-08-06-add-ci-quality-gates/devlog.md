---
change: add-ci-quality-gates
date: 2026-08-03
---

## Context

ZAC-87 adds repository-enforced frontend, backend, and security quality gates for production-bound changes. The implementation is committed on `feature/ZAC-87_add-ci-quality-gates` and must be verified locally and through GitHub-hosted pull-request checks before branch protection can be enabled.

## Implementation

- Added stable GitHub Actions jobs for frontend, backend, and security validation.
- Pinned Node.js 22.12, Python 3.12, and third-party actions to immutable commit SHAs.
- Added credential and dependency scanning, a narrow expiring npm advisory exception, CI security policy, and evidence template.
- Updated the frontend lockfile to remove the fixable `brace-expansion` advisory.

## Decisions

- Required pull-request checks run without production credentials and use read-only repository permissions.
- Backend validation uses a synthetic OpenAI key and isolated SQLite configuration.
- Unexcepted high/critical npm advisories and every unexcepted Python advisory block CI.
- `GHSA-qwww-vcr4-c8h2` is temporarily excepted through 2026-08-17 because npm offers only a breaking forced downgrade.

## Validation Plan

- Run local frontend lint, tests, and production build.
- Run backend tests, FastAPI import, and bounded readiness checks with isolated configuration.
- Validate workflow syntax, OpenSpec, audit wrapper syntax, dependency audits, and diff hygiene.
- Run healthy and deliberately failing GitHub pull-request checks, then configure and verify `main` protection.

## Follow-ups

- Restore GitHub CLI authentication before hosted verification.
- Reevaluate the React Router advisory before 2026-08-17.
- Capture check URLs, exact SHAs, redaction evidence, and branch-protection evidence in `.github/ci-evidence/ZAC-87.md`.

## Verification

### Round 1 (2026-08-03 22:04:20 +08:00)

- Tested head: `eb8d1edbd617572194a232e7b4a67060365c645b`
- Status: `incomplete`
- Checks:
  - `npm run lint` — pass.
  - `npm test` — pass, 35/35 tests.
  - `npm run build` — pass, 2,409 modules transformed; non-blocking bundle-size warning.
  - `python -m unittest discover -s BackEnd/tests -v` with synthetic configuration — pass, 73/73 tests.
  - FastAPI import check — pass.
  - Focused startup/readiness suite — pass, 2/2 tests without a network port.
  - `openspec validate add-ci-quality-gates --strict` — pass.
  - `node --check .github/scripts/audit-npm.mjs` — pass.
  - `rhysd/actionlint` against `.github/workflows/ci.yml` — pass.
  - npm audit wrapper — pass; only the exact expiring React Router exception was accepted.
  - `pip-audit==2.10.1` against `BackEnd/requirements.txt` — pass, no known vulnerabilities.
  - `git diff --check` and post-check `git status --porcelain` — pass; tested product state remained clean.
  - GitHub healthy PR, deliberate frontend/backend/security failures, redaction evidence, and protected-merge evidence — skipped and required; `gh auth status` reports an invalid token and no feature branch was pushed.
- Unresolved failures: Required GitHub-hosted checks, deliberate-failure evidence, and `main` branch-protection verification cannot run until GitHub authentication is restored.
- Next action: `/dev-fix "GitHub authentication is invalid; PR checks and branch protection evidence are unavailable"`

### Round 2 (2026-08-03 22:11:49 +08:00)

- Tested head: `eb8d1edbd617572194a232e7b4a67060365c645b`
- Status: `incomplete`
- Checks:
  - Captured HEAD and pre-check `git status --porcelain` — pass; product state is unchanged and clean.
  - Round 1 local frontend, backend, OpenSpec, actionlint, npm-audit, and pip-audit evidence — pass and still attributable to the identical full HEAD.
  - `gh auth status` — fail; the active `Tzu-Huang` token remains invalid.
  - GitHub healthy PR, deliberate frontend/backend/security failures, redaction evidence, and protected-merge evidence — skipped and required because authenticated GitHub access is unavailable.
- Unresolved failures: GitHub authentication remains invalid, so required hosted checks and `main` branch-protection verification cannot run.
- Next action: `/dev-fix "Restore GitHub CLI authentication for ZAC-87 hosted verification"`

### Round 3 (2026-08-03 22:19:58 +08:00)

- Tested head: `eb8d1edbd617572194a232e7b4a67060365c645b`
- Status: `fail`
- Checks:
  - GitHub authentication with network access — pass for account `Tzu-Huang`; prior sandbox-only failures were false negatives.
  - Push `feature/ZAC-87_add-ci-quality-gates` and create draft PR #6 — pass; `main` was not modified.
  - Hosted `Frontend quality gate` — pass at the tested HEAD.
  - Hosted `Backend quality gate` — pass at the tested HEAD.
  - Hosted `Security quality gate` — fail in `actions/dependency-review-action`; GitHub reports that dependency review is unsupported because the repository Dependency Graph is not enabled.
  - Read `main` branch protection — fail with GitHub HTTP 404 `Branch not protected`.
  - Deliberate frontend/backend/security failure and redaction proofs — skipped and required; the healthy security gate must be fixed first.
  - Post-check `git status --porcelain` — pass; local product state remained clean.
- Unresolved failures: Enable repository Dependency Graph so the required security check can run, configure `main` protection, and complete deliberate-failure/redaction proofs.
- Next action: `/dev-fix "Enable GitHub Dependency Graph and configure main branch protection for ZAC-87"`

### Round 4 (2026-08-05 14:21:12 +08:00)

- Tested head: `2f822307618f1c04b9f024513ce2bd9279532452`
- Status: `incomplete`
- Checks:
  - Pre/post-check `git status --porcelain` and `git diff --check` — pass; product state remained clean and attributable to the tested HEAD.
  - `npm ci --ignore-scripts`, `npm run lint`, `npm test`, and `npm run build` in `frontend` — pass; 35/35 tests passed and the production build completed with only the known non-blocking chunk-size warning.
  - Backend unittest discovery, FastAPI import, and focused startup/readiness tests with synthetic configuration — pass; 73/73 full-suite tests and 2/2 readiness tests passed.
  - `openspec validate add-ci-quality-gates --strict`, `node --check .github/scripts/audit-npm.mjs`, and `rhysd/actionlint:1.7.7` — pass.
  - npm audit policy wrapper and `pip-audit==2.10.1` — pass; no unexcepted high/critical npm advisory and no known Python dependency vulnerability.
  - GitHub PR #6 hosted `Frontend quality gate`, `Backend quality gate`, and `Security quality gate` at the tested HEAD — pass; however, PR #6 targeted `backend_base`, not `main`.
  - Deliberately broken frontend, backend, and credential/redaction hosted evidence — skipped and required; `.github/ci-evidence/ZAC-87.md` remains unpopulated.
  - `main` branch-protection verification — fail; GitHub returns HTTP 404 `Branch not protected`.
- Unresolved failures: Required deliberate-failure/redaction evidence is absent, the healthy hosted run did not target `main`, and `main` does not enforce the required checks.
- Next action: `/dev-fix "Complete ZAC-87 deliberate hosted failure proofs and protect main with the required CI checks"`

### Round 5 (2026-08-05 14:58:21 +08:00)

- Tested head: `18baec987603ad51d8efc40c04ec445c31e3e846`
- Status: `pass`
- Checks:
  - Pre/post-check `git status --porcelain` and `git diff --check` — pass; the committed product state remained clean and attributable to the tested HEAD.
  - `npm ci --ignore-scripts`, `npm run lint`, `npm test`, and `npm run build` in `frontend` — pass; 35/35 tests passed and the production build completed with only the known non-blocking chunk-size warning.
  - Backend unittest discovery, FastAPI import, and focused startup/readiness tests with synthetic configuration — pass; 73/73 full-suite tests and 2/2 readiness tests passed.
  - `openspec validate add-ci-quality-gates --strict`, `node --check .github/scripts/audit-npm.mjs`, and `rhysd/actionlint:1.7.7` — pass.
  - npm audit policy wrapper and `pip-audit==2.10.1` — pass; no unexcepted high/critical npm advisory and no known Python dependency vulnerability.
  - GitHub PR #9 targets `main` at the tested HEAD — pass; hosted Frontend, Backend, and Security quality gates all succeeded without production credentials.
  - Closed proof PR #10 — pass; frontend, backend, and credential checks failed diagnostically, credential values were redacted, and branch protection reported the merge blocked.
  - Closed proof PR #11 — pass; frontend and backend succeeded while the security gate rejected the unexcepted high-severity npm advisory.
  - `main` branch protection — pass; strict required checks match the three stable job names, protection applies to administrators, conversation resolution is required, and force pushes/deletion are disabled.
- Unresolved failures: none.
- Next action: `/dev-review`

### Round 6 (2026-08-05 15:58:02 +08:00)

- Tested head: `0caa13f551b54762b9eecc57735e3e03ea3541f8`
- Status: `pass`
- Checks:
  - Pre/post-check `git status --porcelain` and `git diff --check` — pass; the committed product state remained clean and attributable to the tested HEAD.
  - `npm ci --ignore-scripts`, `npm run lint`, `npm test`, and `npm run build` in `frontend` — pass; 35/35 tests passed and the production build completed with only the known non-blocking chunk-size warning.
  - Clean Python 3.12 installation from `BackEnd/requirements.lock.txt` plus `pip check` — pass; every transitive dependency resolved to the committed pin and the environment had no broken requirements.
  - Locked Python 3.12 backend unittest discovery, FastAPI import, and focused startup/readiness tests — pass; 73/73 full-suite tests and 2/2 readiness tests passed.
  - Python 3.12 `pip-audit==2.10.1` against `BackEnd/requirements.lock.txt` — pass; no known vulnerabilities.
  - `openspec validate add-ci-quality-gates --strict`, `node --check .github/scripts/audit-npm.mjs`, npm audit policy, lock pin/reference checks, and `rhysd/actionlint:1.7.7` — pass.
  - GitHub PR #9 targets `main` at the tested HEAD — pass; hosted Frontend, Backend, and Security quality gates all succeeded.
  - Closed proof PRs #10 and #11 — pass; diagnosable frontend/backend/credential/dependency rejection evidence remains available and the credential output is redacted.
  - `main` branch protection — pass; one approval and stale-review dismissal are enabled, strict required checks match the three stable job names, protection applies to administrators, conversation resolution is required, and force pushes/deletion are disabled. PR #9 remains blocked pending its required approval despite successful checks.
- Unresolved failures: none.
- Next action: `/dev-review`

## Code Review

### Round 1 (2026-08-05 15:02:38 +08:00)

- Source: `openspec/changes/add-ci-quality-gates/review/2026-08-05_feature-ZAC-87_add-ci-quality-gates_codex-review-r1.md`
- Mode: `initial`
- Verdict: `changes-requested`
- Reviewed head: `18baec987603ad51d8efc40c04ec445c31e3e846`
- Transitions: `REV-001 opened; REV-002 opened`
- Open blockers: `REV-001, REV-002`
- Follow-ups: update pinned actions away from deprecated Node.js 20 runtimes; reevaluate the temporary npm exception before 2026-08-17.
- Next action: `/dev-fix --review "openspec/changes/add-ci-quality-gates/review/2026-08-05_feature-ZAC-87_add-ci-quality-gates_codex-review-r1.md"`

### Round 2 (2026-08-05 16:12:48 +08:00)

- Source: `openspec/changes/add-ci-quality-gates/review/2026-08-05_feature-ZAC-87_add-ci-quality-gates_codex-review-r2.md`
- Mode: `closure`
- Verdict: `approved`
- Reviewed head: `0caa13f551b54762b9eecc57735e3e03ea3541f8`
- Transitions: `REV-001 resolved; REV-002 resolved`
- Open blockers: none.
- Follow-ups: update pinned actions away from deprecated Node.js 20 runtimes; reevaluate the temporary npm exception before 2026-08-17.
- Next action: commit only the Round 2 review and devlog records, then run `/dev-done`.
