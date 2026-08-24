# production-release-baseline Specification

## Purpose
TBD - created by archiving change repair-production-baseline. Update Purpose after archive.
## Requirements
### Requirement: Explicit launch-v1 scope

The production baseline SHALL define the frontend and backend behavior included in launch v1 and SHALL explicitly record any deferred behavior or known limitation.

#### Scenario: Reconcile ambiguous merged behavior

- **WHEN** the two parents of the broken admin merge express different behavior
- **THEN** the selected launch-v1 behavior SHALL be documented and covered by a targeted verification or listed as deferred

### Requirement: Conflict-free application source

The production baseline SHALL contain no unresolved merge-conflict markers in application source, dependency manifests, scripts, configuration, or tests.

#### Scenario: Scan the release tree

- **WHEN** the candidate baseline is prepared for verification
- **THEN** an automated scan SHALL find no unresolved merge-conflict markers in tracked release files

### Requirement: Clean frontend verification

The frontend baseline SHALL install from its committed lockfile in a clean CI
environment, SHALL pass lint and automated tests, and SHALL produce a
commit-addressed Vite production artifact that does not embed a public backend
host or port.

#### Scenario: Verify frontend candidate

- **WHEN** a candidate commit is proposed as the production baseline
- **THEN** clean install, lint, test, and build commands SHALL all succeed and the resulting artifact SHALL use same-origin `/api` requests

### Requirement: Clean backend verification

The backend baseline SHALL install from committed dependency declarations in a clean environment and SHALL pass its complete automated tests, application import check, and a bounded startup or readiness check without mutating production data.

#### Scenario: Verify backend candidate

- **WHEN** a candidate commit is proposed as the production baseline
- **THEN** dependency installation, tests, imports, and startup/readiness verification SHALL all succeed without production credentials or data mutation

### Requirement: Recorded production baseline

The release record SHALL identify the tested source commit, merged `main`
commit, deployed artifact identity, active release directory, previous
production rollback commit/release, successful required CI evidence, activation
and readiness evidence, rollback verification, and known limitations. A `main`
commit SHALL NOT be eligible for production deployment while any required CI
check is failing, incomplete, or absent.

#### Scenario: Accept baseline on main

- **WHEN** the approved change is merged into `main` and all required CI checks have succeeded for the production candidate
- **THEN** the exact baseline, artifact, active and rollback releases, required CI results, and associated verification results SHALL be recorded before the deployment is declared successful

#### Scenario: Reject unvalidated main commit

- **WHEN** a `main` commit lacks successful evidence for any required CI check
- **THEN** the commit SHALL NOT be selected as a production baseline

### Requirement: Secret-safe release tree

The production baseline and generated release artifact SHALL NOT add credentials,
private keys, tokens, passwords, plaintext connection strings, local runtime
data, or environment-specific secret files to Git or artifact storage.

#### Scenario: Inspect candidate repository and artifact state

- **WHEN** staged content, tracked release content, and the generated artifact are inspected
- **THEN** they SHALL contain no credential material or local runtime data
