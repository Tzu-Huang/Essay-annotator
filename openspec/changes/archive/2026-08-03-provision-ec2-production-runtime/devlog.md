---
change: provision-ec2-production-runtime
date: 2026-07-31
---

# Development Log

## Context

ZAC-86 provisions a reproducible EC2 production runtime for `essayannotator.com`,
migrates the application to same-origin `/api` routes, and defines a secure,
rollback-capable cutover.

## Implementation

- Migrated backend and frontend traffic to the same-origin `/api` contract.
- Added immutable release packaging, artifact scanning, activation, and rollback tooling.
- Added systemd, Nginx, TLS renewal, and GitHub Actions deployment assets.
- Provisioned the EC2 filesystem and service account, obtained the TLS certificate,
  and staged release `4208db0` without activating it.

## Decisions

- Keep the current production service active until credential rotation and all
  cutover safety gates are complete.
- Serve the apex hostname `essayannotator.com`.
- Keep Node.js out of the EC2 runtime and deploy a prebuilt frontend artifact.

## Validation Plan

- Run backend tests and frontend test, lint, and build checks.
- Validate shell scripts, artifact rejection, OpenSpec, and repository whitespace.
- Inspect the live host services, account, certificate, staged release, and listeners.
- Verify external DNS and reachability before authorizing cutover.

## Follow-ups

- Rotate the exposed OpenAI and PostgreSQL credentials.
- Capture the Security Group baseline and tested rollback target.
- Activate the staged release and complete the production acceptance matrix.

## Verification

### Round 1 (2026-07-31T11:52:32+08:00)

**Tested head:** `3ab157332b967b5e3b4dce0851d49ed2d40d70e6`

**Status:** incomplete

**Checks**

- PASS — Backend unit suite: 77 tests.
- PASS — Frontend tests: 37 tests; lint and production build also passed.
- PASS — Deployment shell syntax, artifact scan, forbidden `.env` rejection,
  `openspec validate provision-ec2-production-runtime`, and `git diff --check`.
- PASS — Host-local inspection: Nginx configuration valid; Nginx and the legacy API
  are listening; loopback HTTP redirects to HTTPS; HTTPS returns the intentional
  pre-cutover 503; loopback API health is healthy; certificate renewal simulation
  succeeded.
- PASS — Candidate release assets and release-local virtual environment exist;
  import validation passed as `essay-api`; Node.js and the `current` symlink are absent.
- SKIP — Credential rotation and post-rotation health/readiness evidence were
  explicitly deferred.
- SKIP — New systemd activation, full Nginx SPA/API proxy behavior, upload and
  timeout checks, restart, rollback, and reboot exercises await the authorized cutover.
- FAIL — DNS resolves `essayannotator.com` to `3.81.244.70`, but external TCP
  connections to ports 80, 443, and 8000 failed while host-local listeners remained healthy.
- SKIP — Final Security Group and SSH-source restrictions could not be verified
  with the EC2 role's current permissions.

**Unresolved failures**

- Public HTTP and HTTPS are unreachable from the external verification client.
- Required credential rotation, live activation, and cutover acceptance checks remain incomplete.

**Next action:** `/dev-fix "restore public 80/443 reachability and complete the remaining production cutover safety gates"`

### Round 2 (2026-08-03T20:55:01+08:00)

- Tested head: `932e49c7e0d6d170b74e45a30b8b52a85552a42d`
- Status: `incomplete`
- Checks:
  - PASS — Backend unit suite: 77 tests.
  - PASS — Frontend suite: 37 tests; lint and production build passed with only
    the existing non-blocking chunk-size warning.
  - PASS — Deployment shell syntax and artifact scan passed under Git Bash;
    `openspec validate provision-ec2-production-runtime` and `git diff --check` passed.
  - PASS — EC2 instance/system status are `ok`; Security Group permits public
    80/443, limits SSH to `36.228.96.187/32`, and exposes no public port 8000.
  - PASS — Public HTTP returns 301 to `https://essayannotator.com/`; external
    TCP 8000 is unreachable.
  - SKIP (required) — HTTPS still returns the intentional pre-cutover 503, so
    SPA refresh, `/api` proxy, upload-size, timeout, health, and readiness checks
    through Nginx cannot pass yet.
  - SKIP (required) — Credential rotation, new loopback systemd activation,
    rollback, process restart, and authorized reboot exercises remain incomplete.
- Unresolved failures: required credential rotation and live production cutover
  acceptance criteria are incomplete.
- Next action: `/dev-fix "complete credential rotation and activate and verify the production release"`

### Round 3 (2026-08-03T21:21:23+08:00)

- Tested head: `0bb310c83d31e60ec4056403841a8ddfe6e90743`
- Status: `incomplete`
- Checks:
  - PASS — Backend unit suite: 80 tests, including shared production data-root regression coverage.
  - PASS — Frontend suite: 37 tests; lint and production build passed with only
    the existing non-blocking chunk-size warning.
  - PASS — Deployment shell syntax and artifact scan, OpenSpec validation, and
    `git diff --check` passed.
  - PASS — Public HTTP redirects to HTTPS; root and direct SPA refresh return
    200; health/readiness return 200 with 219 essays.
  - PASS — Small multipart input reaches API authentication (401), while a
    26 MiB request is rejected by Nginx (413).
  - PASS — EC2 instance/system checks are `ok`; ingress contains only public
    80/443 and SSH from `36.228.96.187/32`.
  - PASS — Persisted cutover evidence records process restart, reboot recovery,
    and healthy `2ba2bee` to `6aa05dd` rollback and forward recovery.
  - SKIP (required) — OpenAI API key and PostgreSQL password rotation was
    explicitly deferred by the operator.
- Unresolved failures: required production credential rotation remains incomplete.
- Next action: `/dev-fix "rotate the exposed OpenAI API key and PostgreSQL password"`

### Round 4 (2026-08-03T21:38:02+08:00)

- Tested head: `202d0b14d452cf191b328529a8bf0983bfca29c6`
- Status: `incomplete`
- Checks:
  - PASS — Backend suite: 84 tests; focused Python syntax checks passed.
  - PASS — Frontend suite: 37 tests; lint and production build passed with only
    the existing non-blocking chunk-size warning.
  - PASS — Deployment shell syntax, OpenSpec validation, and `git diff --check` passed.
  - FAIL — Artifact scan rejected `deploy/scripts/__pycache__`, generated by the
    parallel Python syntax check during this verification round. The generated
    artifact was not deleted or absorbed during `/dev-test`.
  - PASS — Public root, health, and readiness return 200 with 219 essays; public
    TCP 8000 remains closed.
  - PASS — RDS is available, its managed secret is active and rotated, the new
    OpenAI secret metadata is present, and ingress contains only 80/443 plus
    operator-restricted SSH.
  - SKIP (required) — The operator explicitly skipped revoking the previously
    exposed OpenAI API key.
- Unresolved failures: generated forbidden `deploy/scripts/__pycache__` remains,
  and the previously exposed OpenAI key remains active.
- Next action: `/dev-fix "remove generated deploy __pycache__ and revoke the exposed OpenAI key"`

### Round 5 (2026-08-03T21:45:09+08:00)

- Tested head: `1342d064ec199ea691318fe95478602083b2ea70`
- Status: `pass`
- Checks:
  - PASS — Backend suite: 84 tests; in-memory Python syntax checks passed without
    creating repository artifacts.
  - PASS — Frontend suite: 37 tests; lint and production build passed with only
    the existing non-blocking chunk-size warning.
  - PASS — Deployment shell syntax, artifact scan, strict OpenSpec validation,
    and `git diff --check` passed; `deploy/scripts/__pycache__` is absent.
  - PASS — Public root, `/api/health`, and `/api/ready` return 200; readiness
    reports 219 essays, while external TCP port 8000 remains unreachable.
  - PASS — EC2 instance and system checks are `ok`; ingress contains only public
    80/443 and SSH from `36.228.96.187/32`.
  - PASS — RDS is available with its managed secret active, and the replacement
    OpenAI secret metadata remains present in Secrets Manager.
  - PASS — The operator's explicit acceptance that the prior exposed OpenAI key
    remains active is recorded under the completed task 1.2 contract.
- Unresolved failures: `none`; the prior OpenAI key is an explicitly accepted
  residual risk and is not represented as technically revoked.
- Next action: `/dev-review`

## Code Review

### Round 1 (2026-08-03T21:52:00+08:00)

- Source: `openspec/changes/provision-ec2-production-runtime/review/2026-08-03_feature-ZAC-86_provision-ec2-production-runtime_codex-review-r1.md`
- Mode: `initial`
- Verdict: `changes-requested`
- Reviewed head: `c5e67b3b36b0d7f1c7f5c181243ff715daf5bf7d`
- Transitions: `REV-001 open; REV-002 open`
- Open blockers: `REV-001, REV-002`
- Follow-ups: `none`
- Next action: `/dev-fix --review "openspec/changes/provision-ec2-production-runtime/review/2026-08-03_feature-ZAC-86_provision-ec2-production-runtime_codex-review-r1.md"`

## Verification

### Round 6 (2026-08-03T21:54:30+08:00)

- Tested head: `b5871232f81cc118582cd94970dd0ddf3d78943b`
- Status: `pass`
- Checks:
  - PASS — Backend suite: 86 tests, including IAM resource coverage and shared
    embedding input/output path regressions.
  - PASS — Frontend suite: 37 tests; lint and production build passed with only
    the existing non-blocking chunk-size warning.
  - PASS — All tracked deployment shell scripts passed syntax checks; the
    artifact scanner, strict OpenSpec validation, and `git diff --check` passed.
  - PASS — Public root, `/api/health`, and `/api/ready` return 200; readiness
    reports 219 essays and no startup error.
  - PASS — Post-check worktree contains only the pre-existing workflow devlog
    modification and unrelated `.worktrees/ZAC-87`; no product files changed
    and `deploy/scripts/__pycache__` is absent.
- Unresolved failures: `none`.
- Next action: `/dev-review`

## Code Review

### Round 2 (2026-08-03T21:58:00+08:00)

- Source: `openspec/changes/provision-ec2-production-runtime/review/2026-08-03_feature-ZAC-86_provision-ec2-production-runtime_codex-review-r2.md`
- Mode: `closure`
- Verdict: `approved`
- Reviewed head: `b5871232f81cc118582cd94970dd0ddf3d78943b`
- Transitions: `REV-001 resolved; REV-002 resolved`
- Open blockers: `none`
- Follow-ups: `none`
- Next action: `/dev-done`
