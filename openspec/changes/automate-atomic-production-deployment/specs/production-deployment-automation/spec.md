## ADDED Requirements

### Requirement: Approved main-only deployment
The production workflow SHALL deploy only a validated commit reachable from `main` and SHALL pass through the protected production approval policy before invoking the host.

#### Scenario: Main build is approved
- **WHEN** a `main` commit passes the required build and verification jobs and an authorized reviewer approves production
- **THEN** the workflow deploys the artifact identified by that exact commit SHA

#### Scenario: Unapproved or non-main commit is selected
- **WHEN** a deployment lacks production approval or the requested commit is not reachable from `main`
- **THEN** the workflow refuses to invoke production deployment

### Requirement: Credential-safe deployment transport
The production workflow SHALL use short-lived GitHub OIDC credentials, a commit-addressed artifact with an integrity digest, and AWS-managed transport without storing a long-lived AWS access key or SSH private key.

#### Scenario: Transfer a release artifact
- **WHEN** an approved deployment transfers its candidate to production
- **THEN** the host receives the exact commit-addressed artifact and verifies its SHA-256 digest before preparation

#### Scenario: Artifact integrity fails
- **WHEN** the downloaded artifact does not match its expected digest or commit identity
- **THEN** deployment fails before release preparation or activation

### Requirement: End-to-end deployment serialization
The deployment system SHALL prevent overlapping production deployment, rollback, retention, and rollback-drill operations at both workflow and host levels.

#### Scenario: A second workflow starts during deployment
- **WHEN** another production workflow is queued while one deployment holds the production concurrency group
- **THEN** it waits without cancelling or overlapping the active deployment

#### Scenario: Another host operation holds the deployment lock
- **WHEN** a deployment or rollback command begins while the host lock is held
- **THEN** it exits without modifying a release, the active symlink, or retention state

### Requirement: Internal and public health gates
The deployment workflow SHALL require bounded loopback API readiness and public HTTPS smoke checks for the SPA and readiness API before declaring an activated release successful.

#### Scenario: All health gates pass
- **WHEN** the activated release becomes ready on loopback and its public SPA and `/api/ready` endpoints pass within their timeouts
- **THEN** the workflow records the deployment as successful

#### Scenario: A post-switch health gate fails
- **WHEN** loopback readiness or a public HTTPS smoke check fails after activation
- **THEN** the workflow invokes rollback and reports the deployment as failed

### Requirement: Verified automatic rollback
The deployment system SHALL restore the recorded previous known-good release after a post-switch failure and SHALL independently verify that the restored release becomes healthy.

#### Scenario: Rollback target recovers
- **WHEN** a post-switch failure occurs and the previous release passes bounded readiness after restoration
- **THEN** production points to the previous release and the attempt records a successful rollback with an overall failed deployment result

#### Scenario: Rollback target does not recover
- **WHEN** the restored previous release fails bounded readiness
- **THEN** the attempt records rollback failure distinctly and emits an operator-action failure

### Requirement: Secret-safe deployment audit trail
Every production deployment and rollback drill SHALL record the actor, trigger, requested commit SHA, artifact digest, timestamps, prior and resulting releases, health results, final result, and rollback outcome without recording secrets or signed credentials.

#### Scenario: Inspect a completed deployment record
- **WHEN** an operator inspects GitHub evidence and the host audit record
- **THEN** the attempt can be traced end to end by deployment ID and commit SHA with all required outcomes present

#### Scenario: Scan deployment evidence
- **WHEN** workflow logs, summaries, and host records are scanned
- **THEN** they contain no environment secret values, private keys, access tokens, database credentials, or signed artifact URLs

### Requirement: Demonstrated rollback drill
The system SHALL provide a separately approved drill that exercises the production rollback path between two retained known-good releases, verifies public and internal health after each transition, restores the initially active release, and retains evidence.

#### Scenario: Run an eligible rollback drill
- **WHEN** an authorized operator starts the drill with two distinct retained healthy releases
- **THEN** the system verifies rollback and restoration and records both transitions without modifying persistent application data

#### Scenario: Drill prerequisites are absent
- **WHEN** fewer than two distinct known-good releases are available or either candidate is unhealthy
- **THEN** the drill exits without changing the active release
