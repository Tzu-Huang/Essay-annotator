## 1. Deployment Configuration and AWS Trust

- [ ] 1.1 Record the production AWS account, region, release bucket/prefix, EC2 instance ID, hostname, GitHub Environment reviewers, and evidence-retention policy without recording secrets
- [x] 1.2 Add least-privilege GitHub OIDC trust and deployment-role policies for the repository, production environment, release prefix, and fixed Systems Manager command path
- [x] 1.3 Add EC2 role permissions and installation checks for Systems Manager management and read-only access to the release artifact prefix
- [ ] 1.4 Document and verify the protected GitHub `production` Environment, required-reviewer gate, and non-secret configuration contract

## 2. Retryable and Serialized Host Deployment

- [x] 2.1 Add one root-managed host entry point that validates deployment identifiers and acquires a non-blocking `flock` lock for deploy, rollback, retention, and drill operations
- [x] 2.2 Refactor artifact preparation to verify filename and SHA-256 digest, scan contents, build in a validated staging directory, promote atomically, and clean failed staging paths safely
- [x] 2.3 Make repeated deployment of a complete release SHA idempotent while rejecting partial or inconsistent release directories
- [x] 2.4 Refactor activation and rollback to use configured readiness paths, preserve the previous release, and report distinct preparation, activation, and rollback outcomes
- [x] 2.5 Add append-only secret-safe JSON-lines audit records with deployment identity, actor, SHA, digest, timestamps, releases, health results, final result, and rollback outcome

## 3. GitHub Production Workflow

- [ ] 3.1 Extend the workflow to retain the exact `main` artifact and checksum and reject manually selected commits not reachable from `main`
- [ ] 3.2 Add a protected production deployment job using GitHub OIDC, commit-addressed S3 upload, and Systems Manager invocation without SSH or long-lived cloud credentials
- [ ] 3.3 Configure one non-cancelling production concurrency group and propagate run ID, trigger, actor, commit SHA, and artifact digest to the host entry point
- [ ] 3.4 Add bounded public HTTPS smoke checks for the SPA and `/api/ready`, automatic rollback invocation on post-switch failure, and a deployment job summary with the host outcome

## 4. Rollback Drill and Automated Coverage

- [x] 4.1 Add a separately approved manual rollback-drill mode that requires two distinct retained known-good releases, exercises the real rollback path, restores the initial release, and verifies both transitions
- [x] 4.2 Add isolated host-script tests for unsafe identifiers and paths, checksum mismatch, lock contention, preparation cleanup, idempotent retry, health failure, successful rollback, and failed rollback
- [ ] 4.3 Add workflow/static tests for main-only selection, environment approval, OIDC permissions, concurrency, immutable artifact identity, SSM transport, public smoke checks, and secret-safe output
- [ ] 4.4 Run shell syntax/static checks, backend and frontend regression suites, clean artifact build/scan, and strict OpenSpec validation

## 5. Controlled Production Proof

- [ ] 5.1 Install and preflight the AWS trust, artifact transport, host lock, audit directory, and deployment command without changing the active release
- [ ] 5.2 Deploy one approved `main` SHA and retain evidence for artifact integrity, actor, timing, internal readiness, public HTTPS checks, active release, and previous release
- [ ] 5.3 Run the approved rollback drill, verify persistent data and secrets were not overwritten or exposed, and retain successful rollback and restoration evidence
- [ ] 5.4 Document operator recovery for failed rollback, confirm a manual rollback remains available when GitHub deployment is disabled, and record the final known-good releases
