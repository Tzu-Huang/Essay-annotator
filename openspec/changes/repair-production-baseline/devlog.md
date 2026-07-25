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
