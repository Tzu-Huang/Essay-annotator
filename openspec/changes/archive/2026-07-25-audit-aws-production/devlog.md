---
change: audit-aws-production
date: 2026-07-25
---

## Context

ZAC-82 establishes a secret-safe production environment baseline and replaces the ambiguous `frontend-base` promotion model with `main` as the sole production source of truth.

## Implementation

- Audited the public GitHub repository, production EC2 host, systemd service, ports, runtimes, repository checkout, persistent data, backups, and logging configuration.
- Added `docs/operations/production-environment-baseline.md`.
- Added `docs/operations/release-and-deployment-policy.md`.
- Recorded AWS Console evidence supplied by the owner for instance identity, region/AZ, public-IP assignment, and Security Group rules.

## Decisions

- Production deployments are owner-authorized and select an exact commit already on `main`.
- `frontend-base` is frozen and may be removed only after dependency checks.
- Direct HTTP by IP is internal validation only; stable addressing, domain, and HTTPS are follow-up work.
- The committed merge-conflict markers and failed production backend belong to ZAC-83, not an ad-hoc server edit under this audit change.

## Validation Plan

- Strict OpenSpec validation and artifact/task completeness.
- Acceptance-criterion traceability against the production baseline.
- Secret-pattern and Git whitespace scans.
- Confirmation that verification does not mutate product code, tests, specs, generated artifacts, or runtime configuration.

## Follow-ups

- ZAC-83: repair the production baseline on `main`, remove committed conflict markers, and restore backend startup.
- Harden the Security Group, add stable addressing, and configure domain/HTTPS in the appropriate launch issues.
- Configure and enforce GitHub checks/branch protection.

## Verification

### Round 1 (2026-07-25 16:02 Asia/Taipei)

- Tested head: `02500a17c2407e2e39f5aee1378c4d797dbd4874`
- Status: `pass`
- Checks:
  - PASS — `openspec validate audit-aws-production --strict`: change is valid.
  - PASS — `openspec status --change audit-aws-production --json`: proposal, design, specs, and tasks are done.
  - PASS — task checklist inspection: 15/15 tasks checked with no open checkbox.
  - PASS — acceptance traceability inspection: all six ZAC-82 criteria are recorded as satisfied; current GitHub enforcement is explicitly distinguished from the documented policy.
  - PASS — secret-pattern scan across operational docs and change artifacts: no private-key, credential, token, or connection-string pattern found.
  - PASS — `git diff HEAD --check`: no committed-state whitespace error.
  - PASS — pre/post verification worktree inspection: no product code, test, spec, generated artifact, or runtime-configuration mutation.
  - SKIP (not required for this operational-documentation change) — frontend/backend application test suites; the known pre-existing production baseline failure is assigned to ZAC-83.
- Unresolved failures: none for ZAC-82.
- Next action: `/dev-review`

## Code Review

### Round 1 (2026-07-25 16:08 Asia/Taipei)

- Source: `openspec/changes/audit-aws-production/review/2026-07-25_feature-ZAC-82_audit-aws-production_codex-review-r1.md`
- Mode: `initial`
- Verdict: `approved`
- Reviewed head: `9f47199a3b655de68992b5aaee8b563bc325fdfb`
- Transitions: none
- Open blockers: none
- Follow-ups: existing ZAC-83 production-baseline repair and launch hardening work only
- Next action: commit review records, then `/dev-done`
