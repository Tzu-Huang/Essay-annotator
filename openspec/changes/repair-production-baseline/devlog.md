---
change: repair-production-baseline
date: 2026-07-25
---

# Devlog: Repair Production Baseline

## Context

ZAC-83 repairs the broken `main` application baseline created by merge commit `1d335dd`, removes generated/runtime artifacts from release scope, preserves production data boundaries, and establishes a reproducible launch-v1 candidate without deploying it.

## Implementation

- Recorded the merge parents, launch-v1 scope, production data locations, artifact disposition, rollback reference, and deployment constraints.
- Reconciled 12 backend files against the tested admin parent while retaining the ZAC-66 path normalization.
- Restored the complete admin-console implementation and responsive styles.
- Removed root dependencies, graph output, and delivery tarballs from Git while preserving ignored local copies.
- Updated repository ignore rules and compatible frontend lockfile dependencies.
- Added secret-safe verification evidence and a separately authorized deployment/rollback checklist.

## Decisions

- Treat `main` as the production source and use legacy refs only as comparison evidence.
- Reconcile the already-merged admin parent rather than merge `feature/admin` again.
- Keep repository cleanup separate from production data cleanup and deployment authorization.
- Do not apply breaking `npm audit fix --force` changes during baseline repair; record the remaining contextual advisories for dedicated dependency work.

## Validation Plan

- Rebuild frontend dependencies from the committed lockfile, then run lint, tests, and production build.
- Install backend requirements into a clean temporary Python environment, then run all tests, import the FastAPI app, and perform a bounded startup check without lifespan or production data.
- Scan tracked release content for conflict markers, runtime/generated artifacts, and credential patterns.
- Run OpenSpec strict validation and confirm the post-check product worktree still matches the captured tested head.

## Follow-ups

- Review the tested candidate before any merge.
- Address the remaining npm advisories through dedicated dependency analysis rather than an unreviewed breaking force-fix.
- Consider route-level code splitting for the current production bundle-size warning.
- Perform production backup, deployment, readiness, and rollback checks only under separately authorized launch work.

## Verification

### Round 1 (2026-07-25 16:41 Asia/Taipei)

- Tested head: `f4f05313dbd1e22237b081d73af07e2d266f9da9`
- Status: `pass`
- Checks: `npm ci` pass; `npm run lint` pass; `npm test` pass (35/35); `npm run build` pass (Vite 7.3.6); clean Python requirements install pass; backend `unittest` pass (67/67); FastAPI import pass; bounded HTTP startup pass; tracked conflict-marker scan pass; tracked generated/runtime scan pass; tracked credential-pattern scan pass; `openspec validate repair-production-baseline --strict` pass; post-check product worktree clean and still at tested head.
- Unresolved failures: none. Non-blocking follow-ups are seven npm high advisories requiring breaking force-fix analysis and a Vite bundle-size warning.
- Next action: `/dev-review`

### Round 2 (2026-07-25 16:55 Asia/Taipei)

- Tested head: `c65e321b54a01083fe254c53f4b167b732b9dfc5`
- Status: `pass`
- Checks: clean `npm ci` pass; `npm run lint` pass; `npm test` pass (35/35); `npm run build` pass (Vite 7.3.6); clean temporary Python 3.11 environment requirements install pass; complete backend `unittest` pass (73/73), including server-verified admin credentials, Drive sync import/CLI smoke, and actual ASGI lifespan success/failure readiness checks; FastAPI import pass; tracked conflict-marker scan pass (0 matches); tracked generated/runtime scan pass (0 matches); tracked credential-pattern scan pass (0 matches); `openspec validate repair-production-baseline --strict` pass; post-check product worktree clean and HEAD unchanged.
- Unresolved failures: none. Non-blocking follow-ups remain seven npm high advisories requiring breaking force-fix analysis and a Vite bundle-size warning.
- Next action: `/dev-review`

### Round 3 (2026-07-25 17:02 Asia/Taipei)

- Tested head: `928995c438981927c7b067c26c9792d5a2651515`
- Status: `pass`
- Checks: clean `npm ci` pass; `npm run lint` pass; `npm test` pass (35/35); `npm run build` pass (Vite 7.3.6); clean temporary Python 3.11 environment requirements install pass; complete backend `unittest` pass (73/73), including actual FastAPI lifespan with temporary SQLite tables, real ORM essay loading, temporary embedding JSONL parsing, readiness success, and startup-failure semantics; FastAPI import pass; tracked conflict-marker scan pass (0 matches); tracked generated/runtime scan pass (0 matches); tracked credential-pattern scan pass (0 matches); `openspec validate repair-production-baseline --strict` pass; post-check product worktree clean and HEAD unchanged.
- Unresolved failures: none. Non-blocking follow-ups remain seven npm high advisories requiring breaking force-fix analysis and a Vite bundle-size warning.
- Next action: `/dev-review`

### Round 4 (2026-07-25 17:12 Asia/Taipei)

- Tested head: `1940782d661723583ea9caee6ba3c3fdf2b7a87d`
- Status: `pass`
- Checks: clean `npm ci` pass; `npm run lint` pass; `npm test` pass (35/35); `npm run build` pass (Vite 7.3.6); clean temporary Python 3.11 environment requirements install pass; complete backend `unittest` pass (73/73); FastAPI import pass; PR #3 state `MERGED` pass; merged feature head ancestry in `main` merge commit `71ad668065287a7eda713b7655bd5344c9aa6dba` pass; OpenSpec unchecked tasks count 0; tracked conflict-marker scan pass (0 matches); tracked generated/runtime scan pass (0 matches); tracked credential-pattern scan pass (0 matches); `openspec validate repair-production-baseline --strict` pass; post-check product worktree clean and HEAD unchanged.
- Unresolved failures: none. Non-blocking follow-ups remain seven npm high advisories requiring breaking force-fix analysis and a Vite bundle-size warning.
- Next action: `/dev-review`

## Code Review

### Round 1 (2026-07-25 16:44 Asia/Taipei)

- Source: `openspec/changes/repair-production-baseline/review/2026-07-25_feature-ZAC-83_repair-production-baseline_codex-review-r1.md`
- Mode: `initial`
- Verdict: `changes-requested`
- Reviewed head: `d0345272ab41767cb50e360657911c611dbed66d`
- Transitions: `REV-001 open; REV-002 open; REV-003 open`
- Open blockers: `REV-001, REV-002, REV-003`
- Follow-ups: seven npm high advisories; Vite bundle-size warning; temporary verification virtual environments remain outside Git
- Next action: `/dev-fix --review "openspec/changes/repair-production-baseline/review/2026-07-25_feature-ZAC-83_repair-production-baseline_codex-review-r1.md"`

### Round 2 (2026-07-25 16:56 Asia/Taipei)

- Source: `openspec/changes/repair-production-baseline/review/2026-07-25_feature-ZAC-83_repair-production-baseline_codex-review-r2.md`
- Mode: `closure`
- Verdict: `changes-requested`
- Reviewed head: `c65e321b54a01083fe254c53f4b167b732b9dfc5`
- Transitions: `REV-001 resolved; REV-002 resolved; REV-003 still-open`
- Open blockers: `REV-003`
- Follow-ups: seven npm high advisories; Vite bundle-size warning; temporary verification environments remain outside Git
- Next action: `/dev-fix --review "openspec/changes/repair-production-baseline/review/2026-07-25_feature-ZAC-83_repair-production-baseline_codex-review-r2.md"`

### Round 3 (2026-07-25 17:03 Asia/Taipei)

- Source: `openspec/changes/repair-production-baseline/review/2026-07-25_feature-ZAC-83_repair-production-baseline_codex-review-r3.md`
- Mode: `closure`
- Verdict: `approved`
- Reviewed head: `928995c438981927c7b067c26c9792d5a2651515`
- Transitions: `REV-001 resolved; REV-002 resolved; REV-003 resolved`
- Open blockers: `none`
- Follow-ups: seven npm high advisories; Vite bundle-size warning; temporary verification environments remain outside Git
- Next action: commit only the review and devlog workflow records, then run `/dev-done`

### Round 4 (2026-07-25 17:13 Asia/Taipei)

- Source: `openspec/changes/repair-production-baseline/review/2026-07-25_feature-ZAC-83_repair-production-baseline_codex-review-r4.md`
- Mode: `closure`
- Verdict: `approved`
- Reviewed head: `1940782d661723583ea9caee6ba3c3fdf2b7a87d`
- Transitions: `REV-001 resolved; REV-002 resolved; REV-003 resolved`
- Open blockers: `none`
- Follow-ups: seven npm high advisories; Vite bundle-size warning; temporary verification environments remain outside Git
- Next action: commit only the Round 4 review and devlog workflow records, then run `/dev-done`
