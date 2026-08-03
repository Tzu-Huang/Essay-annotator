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
