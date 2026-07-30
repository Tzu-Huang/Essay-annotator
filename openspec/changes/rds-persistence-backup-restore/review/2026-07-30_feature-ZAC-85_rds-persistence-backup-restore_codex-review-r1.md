---
reviewer: codex
mode: initial
round: 1
branch: feature/ZAC-85_rds-persistence-backup-restore
base: main
reviewed_head: c8b821960d2baf472e9d0b7dce01506be64b9a09
previous_review: null
previous_reviewed_head: null
verdict: changes-requested
---

# Codex Review

## Finding transitions

None.

## New blocking findings

### [P1][REV-001] Authoritative host files remain coupled to the release directory

- Evidence: `BackEnd/app/main.py:38-39`,
  `BackEnd/scripts/add_to_database.py:33`, and
  `BackEnd/embedding/make_embedding.py:29-30` still resolve authoritative
  `database.jsonl` and `embed.jsonl` beneath `BackEnd/drive_data`. The inventory
  itself acknowledges at `runtime-data-inventory.md:54-55` that configurable
  paths or mounts are still unimplemented.
- Production verification: both live files are regular `ubuntu:ubuntu` mode
  `0664` files below
  `/home/ubuntu/Essay-annotator/BackEnd/drive_data`; the documented stable
  `/var/lib/essay-annotator/...` targets do not exist.
- Impact: replacing or losing the checkout can remove authoritative source,
  provenance, and search-index data. Mode `0664` also does not meet the
  documented `0640` minimum. This violates the explicit stable-runtime-location
  and least-privilege acceptance requirements.
- Classification: initial blocking data-loss finding.
- Required resolution: make every required runtime path configurable or mount
  the stable protected paths at the code's expected locations, migrate the
  current files without data loss, enforce documented ownership/modes, and add
  tests plus deployment verification proving releases and rollbacks do not
  replace them.

### [P1][REV-002] Non-database authoritative backup and restore coverage is not proven

- Evidence: the inventory classifies `database.jsonl`, `embed.jsonl`, and
  ingestion/source artifacts as authoritative and requires encrypted daily
  backups. The production host has no Essay Annotator backup timer or cron job;
  only the unrelated OS `dpkg-db-backup.timer` is present.
- The committed drill evidence validates only RDS. It contains no
  non-database restore result or responsible operator, although
  `production-recovery-runbook.md:307` requires quarterly isolated file restore
  and line 371 says the drill passes only when required file recovery passes.
- Impact: the recorded RPO/RTO does not cover all authoritative production
  state, so EC2 loss can exceed the 24-hour RPO or make full application
  recovery impossible even though RDS restores successfully.
- Classification: initial blocking recovery-readiness finding.
- Required resolution: provision and monitor an encrypted daily backup with
  30-day retention for every authoritative host path, then perform an isolated
  file restore, validate manifests/permissions/application reads, record the
  responsible operator and timing, and update the overall drill result from
  that complete evidence.

## Follow-up findings

### [P3][REV-003] Evidence storage contradicts the runbook

`production-recovery-runbook.md:376` says the drill record must not be stored in
Git, while `_aws_delivery/restore-drill-evidence-2026-07-30.md` is committed.
The current artifact is intentionally redacted, so this is not evidence of a
secret leak, but the policy and implementation should name one consistent,
access-controlled evidence location.

## Verification and residual risk

- Reviewed `git diff main...c8b821960d2baf472e9d0b7dce01506be64b9a09`,
  the ZAC-85 commits, OpenSpec requirements/tasks, runtime inventory, recovery
  runbook, restore evidence, and relevant backend path/configuration code.
- `/dev-test` Round 1 passed backend 79/79, frontend 35/35 plus lint/build,
  OpenSpec strict validation, live RDS posture, and production API readiness.
- Production metadata was inspected read-only; no file contents or secret
  values were read.
- RDS posture and the production PostgreSQL startup guard are sound within the
  reviewed scope. Full recovery readiness remains blocked by REV-001 and
  REV-002.

## Next Action

`/dev-fix --review "openspec/changes/rds-persistence-backup-restore/review/2026-07-30_feature-ZAC-85_rds-persistence-backup-restore_codex-review-r1.md"`

Reason: blocking non-database persistence and recovery findings remain.
