## MODIFIED Requirements

### Requirement: Clean frontend verification

The frontend baseline SHALL install from its committed lockfile in a clean CI
environment, SHALL pass lint and automated tests, and SHALL produce a
commit-addressed Vite production artifact that does not embed a public backend
host or port.

#### Scenario: Verify frontend candidate

- **WHEN** a candidate commit is proposed as the production baseline
- **THEN** clean install, lint, test, and build commands SHALL all succeed and the resulting artifact SHALL use same-origin `/api` requests

### Requirement: Recorded production baseline

The release record SHALL identify the tested source commit, merged `main`
commit, deployed artifact identity, active release directory, previous
production rollback commit/release, activation and readiness evidence, rollback
verification, and known limitations.

#### Scenario: Accept baseline on main

- **WHEN** the approved change is merged into `main` and prepared for production activation
- **THEN** the exact baseline, artifact, active and rollback releases, and associated verification results SHALL be recorded before the deployment is declared successful

### Requirement: Secret-safe release tree

The production baseline and generated release artifact SHALL NOT add credentials,
private keys, tokens, passwords, plaintext connection strings, local runtime
data, or environment-specific secret files to Git or artifact storage.

#### Scenario: Inspect candidate repository and artifact state

- **WHEN** staged content, tracked release content, and the generated artifact are inspected
- **THEN** they SHALL contain no credential material or local runtime data
