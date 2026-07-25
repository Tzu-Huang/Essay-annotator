## MODIFIED Requirements

### Requirement: Preserve ignored and untracked state

All required local and production runtime files SHALL remain at their runtime locations or in a documented backup while remaining untracked by Git, and repository cleanup SHALL NOT delete corresponding host data.

#### Scenario: Remove runtime artifact from Git

- **WHEN** a generated, dependency, delivery, or runtime artifact is removed from repository tracking
- **THEN** any required local or production copy SHALL remain available at its documented location or in a verified backup without being recommitted

## ADDED Requirements

### Requirement: Classify release artifacts before cleanup

The baseline repair SHALL classify tracked generated dependencies, build products, delivery archives, graph output, datasets, embeddings, uploads, logs, and database files as removable, preservable outside Git, or secret-safe documentation before changing repository tracking.

#### Scenario: Prepare artifact cleanup

- **WHEN** tracked non-source artifacts are reviewed for removal
- **THEN** each affected category SHALL have a documented disposition and persistent production data SHALL be distinguished from reproducible output

### Requirement: Preserve production data across deployment

A deployment of the repaired baseline SHALL require a current inventory and recoverable backup of persistent production data and SHALL NOT overwrite or remove that data as part of code rollback.

#### Scenario: Prepare later production deployment

- **WHEN** the recorded baseline is selected for deployment
- **THEN** persistent data inventory and backup evidence SHALL be verified before code changes are applied

#### Scenario: Roll back failed deployment

- **WHEN** post-deployment readiness checks fail
- **THEN** application code SHALL be returned to the recorded rollback commit without overwriting persistent production data
