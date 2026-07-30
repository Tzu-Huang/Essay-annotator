---
change: rds-persistence-backup-restore
date: 2026-07-30
---

# Development log

## Context

ZAC-85 separates production data and secrets from application releases, moves
the production system of record to private encrypted RDS PostgreSQL, and proves
the selected 24-hour RPO and four-hour RTO.

## Implementation

- Added production database startup guards and tests that prevent SQLite
  fallback outside local development and tests.
- Added secret-safe persistence, migration, rollback, backup, and restore
  runbooks and inventory records.
- Provisioned and cut production over to private encrypted RDS PostgreSQL with
  30-day point-in-time recovery, a pre-cutover snapshot, and deletion
  protection.
- Completed an isolated restore drill and retained secret-safe evidence.

## Decisions

- Amazon RDS for PostgreSQL Single-AZ is the production system of record.
- The accepted objectives are an RPO of at most 24 hours and an RTO of at most
  four hours.
- Application rollback is code-only; database changes follow forward-only
  expand-and-contract compatibility.

## Validation Plan

- Run the complete backend and frontend automated checks.
- Strictly validate the OpenSpec change and repository hygiene.
- Confirm the committed restore evidence meets the selected RPO and RTO.
- Verify the live production RDS posture and API readiness without mutation.

## Follow-ups

- Repeat the isolated restore drill quarterly.
- Review Multi-AZ when recovery objectives tighten or drill results lose safety
  margin.

## Verification

### Round 1 (2026-07-30 13:21:11 +08:00)

- Tested head: `c8b821960d2baf472e9d0b7dce01506be64b9a09`
- Status: `pass`
- Checks: `unittest discover` pass (79/79); clean frontend `npm ci`, lint, tests
  (35/35), and production build pass; `openspec validate
  rds-persistence-backup-restore --strict` pass; all 18 OpenSpec tasks complete;
  `git diff --check` pass; tracked conflict and credential scan reviewed with
  no actual conflict markers or committed secrets; restore evidence pass (RPO
  about 4m28s, RTO about 1h5m4s); live RDS pass (`available`, private,
  encrypted, PostgreSQL 17.10, 30-day backups, deletion protection,
  `us-east-1a`); production `/health` and `/ready` pass with PostgreSQL and 219
  essays; product HEAD remained unchanged after checks.
- Unresolved failures: none
- Next action: `/dev-review`

### Round 2 (2026-07-30 13:43:12 +08:00)

- Tested head: `4e5204acb321785677ec6d55338066717677ad56`
- Status: `pass`
- Checks: complete backend `unittest` pass (84/84); clean frontend `npm ci`,
  lint, tests (35/35), and production build pass; changed Python modules compile;
  `openspec validate rds-persistence-backup-restore --strict` pass; all 18 tasks
  complete; `git diff --check` pass; production deployed HEAD and worktree pass;
  release-external data symlink, `0750` directory, `0640` authoritative files,
  `0600` root backup configuration, and single `ESSAY_DATA_ROOT` setting pass;
  backup timer enabled and active; private encrypted versioned S3 backup with
  public access blocked and 30-day current/noncurrent retention pass; isolated
  restore verifier pass (SHA-256, 194 files, 42,449,309 bytes,
  `database.jsonl` 219 rows, `embed.jsonl` 514 rows); RDS remains available,
  private, encrypted, PostgreSQL 17.10, 30-day backups, and deletion-protected;
  production `/health` and `/ready` pass with PostgreSQL and 219 essays; product
  HEAD remained unchanged after checks.
- Unresolved failures: none
- Next action: `/dev-review`

### Round 3 (2026-07-30 14:20:21 +08:00)

- Tested head: `abb78dd49770e29ce45017a29acdc4d461bb9b85`
- Status: `pass`
- Checks: complete backend `unittest` pass (87/87); clean frontend `npm ci`,
  lint, tests (35/35), and production build pass; changed Python modules compile;
  `openspec validate rds-persistence-backup-restore --strict` pass; all 18 tasks
  complete; `git diff --check` pass; production deployed HEAD and worktree pass;
  backup timer enabled/active with last result success; isolated restore
  checksum/extraction pass (194 files, 42,449,309 bytes, `database.jsonl` 219
  rows, `embed.jsonl` 514 rows); production application loaders pass against the
  isolated restore (219 essays, 514 embeddings, 1,536 dimensions); CloudWatch
  success metric value `1` present; missing-or-failed alarm pass (`OK`, actions
  enabled, threshold below `1`, missing data breaching); SNS operations-owner
  subscription pass (`PendingConfirmation=false`,
  `ConfirmationWasAuthenticated=true`); RDS remains available, private,
  encrypted, 30-day retained, and deletion-protected; production `/health` and
  `/ready` pass with PostgreSQL and 219 essays; product HEAD remained unchanged
  after checks.
- Unresolved failures: none
- Next action: `/dev-review`

## Code Review

### Round 1 (2026-07-30)

- Source: `openspec/changes/rds-persistence-backup-restore/review/2026-07-30_feature-ZAC-85_rds-persistence-backup-restore_codex-review-r1.md`
- Mode: `initial`
- Verdict: `changes-requested`
- Reviewed head: `c8b821960d2baf472e9d0b7dce01506be64b9a09`
- Transitions: `REV-001 open; REV-002 open; REV-003 follow-up`
- Open blockers: `REV-001, REV-002`
- Follow-ups: `REV-003`
- Next action: `/dev-fix --review "openspec/changes/rds-persistence-backup-restore/review/2026-07-30_feature-ZAC-85_rds-persistence-backup-restore_codex-review-r1.md"`

### Round 2 (2026-07-30)

- Source: `openspec/changes/rds-persistence-backup-restore/review/2026-07-30_feature-ZAC-85_rds-persistence-backup-restore_codex-review-r2.md`
- Mode: `closure`
- Verdict: `changes-requested`
- Reviewed head: `4e5204acb321785677ec6d55338066717677ad56`
- Transitions: `REV-001 resolved; REV-002 still-open`
- Open blockers: `REV-002`
- Follow-ups: `REV-003`
- Next action: `/dev-fix --review "openspec/changes/rds-persistence-backup-restore/review/2026-07-30_feature-ZAC-85_rds-persistence-backup-restore_codex-review-r2.md"`

### Round 3 (2026-07-30)

- Source: `openspec/changes/rds-persistence-backup-restore/review/2026-07-30_feature-ZAC-85_rds-persistence-backup-restore_codex-review-r3.md`
- Mode: `closure`
- Verdict: `approved`
- Reviewed head: `abb78dd49770e29ce45017a29acdc4d461bb9b85`
- Transitions: `REV-001 remains-resolved; REV-002 resolved`
- Open blockers: `none`
- Follow-ups: `REV-003`
- Next action: commit only the review workflow records, then run `/dev-done`
