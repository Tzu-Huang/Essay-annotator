## Why

The repository can build a commit-addressed release and the EC2 host can activate one, but no controlled path connects a validated `main` commit to production. ZAC-88 closes that gap so a failed deployment cannot leave the public site on an unhealthy or partially prepared release.

## What Changes

- Extend the production GitHub Actions workflow with an explicitly approved, serialized deployment job for artifacts built from `main`.
- Transfer and verify the exact commit-addressed artifact without updating an ad-hoc server working tree.
- Serialize host-side activation, prepare releases before switching traffic, and clean up failed partial preparations safely.
- Gate success on loopback readiness and public HTTPS smoke checks; automatically restore and verify the previous known-good release when post-switch checks fail.
- Produce a secret-safe audit record containing actor, commit SHA, timestamps, previous and active releases, health results, overall result, and rollback outcome.
- Add an executable rollback drill that demonstrates the recovery path without changing persistent application data.

## Capabilities

### New Capabilities

- `production-deployment-automation`: Defines the approved `main`-to-production workflow, serialization, artifact handoff, health gates, rollback verification, audit evidence, and rollback demonstration.

### Modified Capabilities

- `ec2-production-web-runtime`: Strengthens atomic activation so concurrent runs are excluded, partial preparation is recoverable, and automatic rollback is itself health-checked.
- `production-release-baseline`: Makes deployment actor, timing, health, result, and rollback outcome explicit parts of the release record.

## Impact

- Affects `.github/workflows/production-release.yml` and the host-side scripts and configuration under `deploy/`.
- Requires a protected GitHub production environment and a narrowly scoped, auditable transport from GitHub Actions to the existing EC2 host.
- Uses the existing Nginx, systemd, commit-addressed release layout, readiness endpoint, PostgreSQL connection, and `/var/lib/essay-annotator` data boundary.
- Does not introduce application API changes, database migrations, or deployment-time writes to persistent application data.
