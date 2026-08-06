---
reviewer: codex
mode: initial
round: 1
branch: feature/ZAC-86_provision-ec2-production-runtime
base: main
reviewed_head: c5e67b3b36b0d7f1c7f5c181243ff715daf5bf7d
previous_review: null
previous_reviewed_head: null
verdict: changes-requested
---

# Codex Review

## Finding transitions

| ID | Priority | Status | Evidence |
|---|---|---|---|
| REV-001 | P2 | open | The committed IAM policy permits only the OpenAI secret, while the synchronization command always reads both OpenAI and RDS secrets. |
| REV-002 | P2 | open | The embedding output uses the shared data root, but its input still points into the immutable release tree. |

## New blocking findings

### [P2][REV-001] The production secret-reader policy cannot run the committed synchronization command

`deploy/iam/read-production-secrets.json:6-12` grants
`secretsmanager:GetSecretValue` only for the OpenAI secret ARN. However,
`deploy/scripts/sync-production-secrets.py:75-76` requires an RDS secret and
`deploy/scripts/sync-production-secrets.py:90-93` unconditionally fetches both
secrets. An EC2 role using the committed least-privilege policy therefore gets
`AccessDenied` before it can synchronize the PostgreSQL credential. This makes
the checked-in runtime procedure inconsistent with the completed secret-rotation
and root-managed-secret contract.

Classification: initial-review blocker; P2 because it violates the explicit
managed production-secret acceptance boundary.

Required resolution: grant `DescribeSecret` and `GetSecretValue` for the exact
RDS managed-secret ARN in the production policy (and any required customer-KMS
permission if applicable), and add a policy-level regression assertion that both
required secret resources are covered.

### [P2][REV-002] The production embedding job reads from the immutable release instead of shared data

`BackEnd/embedding/make_embedding.py:25-32` adopts `EMBED_JSONL` for output but
continues to define `Input_file` as
`BACKEND_ROOT/drive_data/finalized_data_jsonl/database.jsonl`. CI deliberately
excludes JSONL files from the release artifact, while production config places
mutable data under `ESSAY_DATA_ROOT`. Calling `update_embeddings()` in the
deployed release therefore opens the shared output and then fails when it tries
to read the absent release-local input. This violates the explicit design that
mutable data remains under `/var/lib/essay-annotator` and is independent of a
release switch.

Classification: initial-review blocker; P2 because it violates the explicit
shared mutable-data and rollback acceptance boundary.

Required resolution: source the input from `DATABASE_JSONL` in `app.paths` and
add regression coverage proving both embedding input and output follow
`ESSAY_DATA_ROOT`.

## Follow-up findings

None.

## Verification and residual risk

- Verification Round 5 passed at product head
  `1342d064ec199ea691318fe95478602083b2ea70`: 84 backend tests, 37 frontend
  tests, lint, build, deployment/static checks, and live production checks.
- The review inspected `main...c5e67b3b36b0d7f1c7f5c181243ff715daf5bf7d`
  against the OpenSpec requirements and deployment design.
- `.worktrees/ZAC-87` is unrelated, untracked work and was excluded without
  modification.
- The previously exposed OpenAI key remains an operator-accepted residual risk;
  this review does not describe it as revoked.

## Next Action

`/dev-fix --review "openspec/changes/provision-ec2-production-runtime/review/2026-08-03_feature-ZAC-86_provision-ec2-production-runtime_codex-review-r1.md"`

Reason: blocking findings `REV-001` and `REV-002` remain.
