## Context

ZAC-86 established a single-instance EC2 runtime with immutable commit-addressed releases, a `current` symlink, systemd, Nginx, loopback readiness, persistent data under `/var/lib/essay-annotator`, and secrets under `/etc/essay-annotator`. The existing GitHub Actions workflow validates the frontend and uploads a release artifact, but it stops before production. The activation script has no cross-process lock, leaves failed preparation directories behind, and restores a previous symlink after a failed health check without proving the restored service is healthy.

This change connects validated `main` artifacts to that runtime. Production remains one EC2 instance and one private Single-AZ RDS database, so the design targets safe in-place release switching rather than zero-downtime multi-instance rollout.

## Goals / Non-Goals

**Goals:**

- Require an explicit production approval before deploying a `main` artifact.
- Authenticate GitHub to AWS without long-lived AWS or SSH credentials.
- Ensure only one workflow and one host process can deploy at a time.
- Make preparation retryable and activation automatically reversible.
- Verify both internal readiness and the public HTTPS path.
- Retain secret-safe, commit-addressed deployment and rollback evidence.
- Demonstrate rollback through a separately approved drill.

**Non-Goals:**

- Blue/green infrastructure, multiple EC2 instances, containers, or an application load balancer.
- Database schema migration orchestration or database rollback.
- Replacing the existing RDS, backup, secret, Nginx, or systemd architecture.
- Continuous delivery from feature branches or mutable server checkouts.
- Guaranteeing zero dropped requests during the bounded systemd restart.

## Decisions

### A protected GitHub environment gates production

The build job continues to run on each push to `main`. A separate deployment job targets a protected `production` GitHub Environment and begins only after build success and required-reviewer approval. `workflow_dispatch` supports an explicit SHA and a rollback-drill mode, but it uses the same environment gate and accepts only commits reachable from `main`.

This initial manual gate is preferred over unattended deployment because the service has one production instance and the rollback path has not yet accumulated operational history. Removing required approval later is a repository-setting change, not an application-code change.

### GitHub OIDC, S3, and Systems Manager provide transport

GitHub Actions exchanges its OIDC identity for a narrowly scoped AWS role. The job uploads the artifact and SHA-256 checksum to a commit-addressed S3 key, then invokes a fixed host-side deployment entry point through AWS Systems Manager Run Command. The EC2 instance role receives read access only to the release prefix and the permissions required for Systems Manager management.

This avoids long-lived AWS keys, private SSH keys, dynamic GitHub-hosted-runner IP allowlists, and a privileged self-hosted runner. Direct SSH and pulling from Git on the host are not deployment mechanisms.

### Two independent locks serialize releases

GitHub Actions uses one production concurrency group with cancellation disabled so separate workflow runs cannot overlap. The host entry point also acquires a non-blocking `flock` lock before download, preparation, activation, rollback, retention, or drill work. The workflow lock improves operator behavior; the host lock remains authoritative for manual or retried commands.

### Preparation uses a temporary directory and verified promotion

The host downloads the artifact to a temporary path, verifies its SHA-256 digest and commit-addressed filename, scans its contents, and prepares dependencies beneath `/opt/essay-annotator/releases/.staging-<sha>-<run>`. Only successful preparation is renamed to `/opt/essay-annotator/releases/<sha>`. A failed preparation removes only its validated staging directory and never changes `current`. An already complete release with the same SHA is treated as an idempotent deployment candidate after validation.

### Activation has internal and external health gates

After switching `current` and restarting systemd, the host polls the configured loopback readiness endpoint. The workflow then checks public HTTPS for the SPA entry point and `/api/ready`. Deployment succeeds only when both gates pass.

If either post-switch gate fails, the host restores the recorded previous symlink, restarts the service, and polls readiness for that rollback target. The workflow reports the deployment as failed even when rollback succeeds; failed rollback receives a distinct result and requires operator intervention. Persistent data, RDS, and secrets are never copied, deleted, or restored as part of code rollback.

### Each attempt writes one structured audit record

The deployment entry point writes an append-only JSON-lines record to a root-managed host path outside release directories. It records deployment/run ID, trigger and actor supplied by GitHub, requested SHA, artifact digest, start/end timestamps, previous and resulting release, internal and public health outcomes, final result, and rollback outcome. It excludes command output, environment values, signed URLs, and secret material.

The GitHub job summary records the same identifiers and retrieves the final record as workflow evidence. GitHub Actions logs plus the host record provide independent audit surfaces without introducing a new application database table.

### Rollback is demonstrated by an approved production drill

A manual, production-approved drill invokes the real rollback path against retained known-good releases. It records the active release, switches to the previous known-good release, verifies loopback and public HTTPS health, restores the originally active release, verifies it again, and records both transitions. The drill refuses to run without two distinct healthy retained releases and never changes persistent data.

This is preferred over merely unit-testing symlink commands because ZAC-88 requires demonstrated recovery. It is separated from every normal deployment to avoid intentionally switching healthy production traffic on each release.

## Risks / Trade-offs

- [Systems Manager or OIDC configuration is incomplete] → Add preflight identity, instance-online, bucket-access, and fixed-command checks before any activation.
- [Single-instance restart causes a short interruption] → Keep readiness time bounded, use the existing Nginx boundary, and defer zero-downtime rollout until a multi-instance architecture exists.
- [Public smoke checks fail for an external-network issue after a healthy activation] → Retry within a short bound, then favor safety by rolling back and recording the distinct external-check failure.
- [A malformed identifier targets an unsafe filesystem path] → Accept only full lowercase hexadecimal SHAs and generated deployment IDs; resolve and validate every destructive cleanup target beneath the release staging directory.
- [Audit storage grows indefinitely] → Rotate host audit logs without deleting GitHub run evidence; never apply release-retention cleanup to audit records.
- [Rollback release is incompatible with a future database migration] → Keep database migrations out of this change and require forward/backward compatibility before adding them to this deployment system.

## Migration Plan

1. Configure the protected GitHub `production` Environment, OIDC trust, least-privilege deploy role, S3 release prefix, EC2 Systems Manager management, and host audit directory.
2. Install the locked deployment entry point while retaining the existing manual activation and current known-good release.
3. Validate artifact transfer, checksum rejection, lock contention, failed preparation, and audit output without switching `current`.
4. Deploy one approved `main` SHA, verify loopback and public HTTPS checks, and confirm the release record.
5. Retain two known-good releases and run the separately approved rollback drill; preserve its GitHub and host evidence.

If workflow rollout fails before activation, continue using the current release. If it fails after activation, the entry point restores and verifies the previous release. Disabling the GitHub deployment job does not remove the host-side manual rollback command.

## Open Questions

- Which AWS account, region, S3 bucket, EC2 instance ID, and public hostname should be stored as non-secret production environment configuration?
- Which GitHub users or team should be required reviewers for the `production` Environment?
- What retention period is required for host audit records and GitHub deployment artifacts?
