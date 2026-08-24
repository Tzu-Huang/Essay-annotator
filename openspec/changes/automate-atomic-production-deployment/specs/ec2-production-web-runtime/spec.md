## MODIFIED Requirements

### Requirement: Atomic release activation and rollback
Each production artifact SHALL be verified and prepared in a deployment-specific staging directory before promotion into a commit-addressed immutable release directory. Activation, rollback, retention, and drill operations SHALL hold one host deployment lock; activation SHALL switch the `current` symlink only after preparation succeeds while retaining the prior release for rollback.

#### Scenario: Activate a healthy release
- **WHEN** a locked release operation passes artifact integrity, dependency, configuration, loopback readiness, and public HTTPS checks
- **THEN** deployment activates that exact commit, records the previous release, and removes only its validated temporary files

#### Scenario: Release preparation fails
- **WHEN** artifact verification, extraction, dependency installation, scanning, or preflight fails before activation
- **THEN** the live symlink remains unchanged and the operation removes its incomplete staging directory so the same SHA can be retried

#### Scenario: New release fails after switching
- **WHEN** the activated release does not pass a bounded internal or public health gate
- **THEN** deployment restores the previous symlink, restarts the service, verifies the rollback target, and reports both deployment and rollback outcomes

#### Scenario: Concurrent host operation is attempted
- **WHEN** another activation, rollback, retention, or drill operation already holds the host deployment lock
- **THEN** the new operation fails without changing release or symlink state
