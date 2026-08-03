## Context

The current EC2 host runs `uvicorn` from `/home/ubuntu/Essay-annotator` as the
`ubuntu` user, binds `0.0.0.0:8000`, and exposes that port publicly. The service
is enabled and healthy against private RDS, while persistent essay data already
lives under `/var/lib/essay-annotator` and secrets are loaded from a root-owned
environment file. Nginx, Node/npm, and `frontend/dist` are absent.

This change must preserve the existing RDS and recovery controls while replacing
the public runtime boundary. Production secrets exposed during discovery must be
rotated before deployment.

## Goals / Non-Goals

**Goals:**

- Make Nginx the only public application endpoint with managed HTTPS.
- Serve a versioned frontend artifact and proxy same-origin `/api` traffic.
- Isolate FastAPI behind loopback and a dedicated service identity.
- Activate releases atomically, verify readiness, and roll back without moving
  mutable data or secrets.
- Prove restart-on-failure and reboot recovery.

**Non-Goals:**

- Adding an ALB, CloudFront, autoscaling, containers, or a second EC2 instance.
- Moving away from the existing private Single-AZ RDS deployment.
- Redesigning application authentication or the authoritative-data backup model.
- Building application assets on the production EC2 host.

## Decisions

### Nginx terminates TLS and owns the public interface

Nginx listens on ports 80 and 443, redirects HTTP to HTTPS, serves the Vite
artifact, applies `try_files ... /index.html` for SPA navigation, and proxies
`/api/` to `http://127.0.0.1:8000/`. Request body size and proxy timeouts are
explicitly configured and tested for admin uploads. A managed hostname and
Let's Encrypt/Certbot provide certificate issuance and renewal.

This is preferred over exposing Uvicorn because it gives one origin, static-file
delivery, TLS, bounded request handling, and a narrow Security Group. ALB and
CloudFront are deferred because the current single-instance workload does not
justify their cost and operational surface.

### Application routes have one external `/api` namespace

All browser API calls use relative `/api` URLs. Backend routes that currently
live at `/search`, `/compare`, `/essays`, `/admin`, `/health`, and `/ready` move
under `/api`; compatibility aliases are not retained after cutover. CORS is
restricted to the selected production origin plus explicit development origins.

This is a deliberate breaking change that removes the hard-coded public IP and
prevents environment-specific backend addresses from being embedded in the
frontend artifact.

### CI produces a commit-addressed release artifact

GitHub Actions installs frontend dependencies from the lockfile, runs lint/tests,
builds `frontend/dist`, and packages it with the backend source and deployment
manifests. The artifact is identified by commit SHA and excludes dependencies,
secrets, runtime data, and Git metadata. EC2 installs Python dependencies into a
release-local virtual environment but never requires Node.

Building on EC2 was rejected because it expands production dependencies and can
make the same source produce different artifacts during rollback.

### Releases are atomic and mutable state remains shared

Releases live at `/opt/essay-annotator/releases/<commit>/`; the active release is
`/opt/essay-annotator/current`. Configuration remains under
`/etc/essay-annotator`, data under `/var/lib/essay-annotator`, and logs go to
journald/CloudWatch with only a bounded local spool if required.

Deployment unpacks a new directory, installs dependencies, validates
configuration, switches `current`, restarts the service, and waits for readiness.
Failure switches `current` back to the previous release and restarts it.
Arbitrary `git pull` in the active release is not a deployment mechanism.

### systemd runs one least-privilege FastAPI worker

A non-login `essay-api` account owns no release or secret content and receives
only the runtime access it needs. systemd uses the `current` symlink, the
root-owned `0600` environment file, `127.0.0.1:8000`, `Restart=on-failure`, and
startup ordering after network availability. One worker is retained because the
current JSONL embedding store uses only a process-local write lock.

### Network exposure is deny-by-default

The EC2 Security Group permits 80/443 publicly and SSH only from an explicitly
approved administrator source. Port 8000 has no ingress rule. RDS remains
private and accepts PostgreSQL only from the application Security Group.

## Risks / Trade-offs

- [A route is missed during the `/api` migration] → Inventory every frontend
  fetch and backend route, then run route-level smoke tests through Nginx.
- [TLS issuance blocks on missing DNS] → Require the final hostname and verified
  A/AAAA records before enabling the HTTPS-only cutover.
- [A bad release makes the host unavailable] → Keep the previous release,
  readiness-gate activation, and test the rollback command before cutover.
- [Single EC2/Single-AZ RDS remains a failure domain] → Accept current launch
  availability and retain the existing backup/restore objectives.
- [One Uvicorn worker limits throughput] → Monitor latency and queueing; move
  mutable embedding writes to a cross-process-safe design before scaling workers.
- [Secret rotation breaks connectivity] → Rotate and validate one credential at
  a time before runtime migration, without recording values in artifacts/logs.

## Migration Plan

1. Rotate the exposed OpenAI and PostgreSQL credentials and verify readiness.
2. Select the production hostname, configure DNS, and confirm administrator SSH
   source ranges.
3. Provision users, directories, Nginx, systemd, release tooling, and the first
   commit-addressed artifact while the existing service remains available.
4. Validate the new service on loopback, obtain TLS, switch Nginx traffic, and
   run frontend/API/upload/timeout smoke tests.
5. Remove public port 8000, verify failure restart and an EC2 reboot, then retain
   the previous release as the tested rollback target.

Rollback restores the prior `current` symlink and service, then verifies
readiness. Network rules are reopened only as an explicitly approved emergency
measure, not as the standard rollback.

## Open Questions

- What exact production hostname and DNS provider/hosted zone will be used?
- Which administrator CIDR(s) may access SSH?
- What upload-size and long-running API timeout limits reflect the product's
  largest expected document and operation?
