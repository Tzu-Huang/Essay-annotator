---
reviewer: codex
mode: closure
round: 2
branch: feature/ZAC-85_rds-persistence-backup-restore
base: main
reviewed_head: 4e5204acb321785677ec6d55338066717677ad56
previous_review: openspec/changes/rds-persistence-backup-restore/review/2026-07-30_feature-ZAC-85_rds-persistence-backup-restore_codex-review-r1.md
previous_reviewed_head: c8b821960d2baf472e9d0b7dce01506be64b9a09
verdict: changes-requested
---

# Codex Review

## Finding transitions

| ID | Priority | Status | Evidence |
|---|---|---|---|
| REV-001 | P1 | resolved | `ESSAY_DATA_ROOT` is mandatory and release-external in production; primary readers/writers use it; production metadata and Verification Round 2 prove the `/var/lib` target, compatibility symlink, `0750` directories, `0640` files, clean deployed worktree, and passing API readiness. |
| REV-002 | P1 | still-open | The encrypted daily backup, retention, timer, checksum, extraction, counts, permissions, operator, and timing are now proven, but failure monitoring/alerting and a representative application read from the isolated restored files are still absent. |

## New blocking findings

None.

## Follow-up findings

### [P3][REV-003] Evidence storage contradicts the runbook

Still a non-blocking follow-up. The runbook says the drill record belongs
outside Git while the redacted evidence artifact remains committed. No secret
exposure was found in the artifact.

## Verification and residual risk

- Reviewed only the prior blockers and
  `git diff c8b821960d2baf472e9d0b7dce01506be64b9a09..4e5204acb321785677ec6d55338066717677ad56`.
- Verification Round 2 passed backend 84/84, frontend 35/35 plus lint/build,
  OpenSpec strict validation, production path/permission/timer checks, AWS
  storage controls, API readiness, and isolated archive checksum/extraction.
- `verify-authoritative-backup.sh:25-37` verifies non-empty files, permissions,
  byte/file counts, and line counts, but never parses the restored JSONL through
  `load_essays`/`load_db_embeddings` or performs another representative
  application read. A checksum proves transport integrity, not application
  usability.
- `backup-authoritative-files.sh`, the service, and the timer contain no failure
  notification, health metric, or external alarm. An enabled timer can fail
  every day without reaching the operations owner, so the required monitored
  24-hour RPO control is incomplete.
- No fix-introduced blocker or unrelated late blocker was found.

## Next Action

`/dev-fix --review "openspec/changes/rds-persistence-backup-restore/review/2026-07-30_feature-ZAC-85_rds-persistence-backup-restore_codex-review-r2.md"`

Reason: REV-002 remains blocking until backup failures alert an operator and an
isolated restore proves representative application reads.
