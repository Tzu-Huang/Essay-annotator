# Local Runtime Data Preservation Specification

## Purpose

Define how local-only runtime state is inventoried, preserved, protected, and verified during migration.
## Requirements
### Requirement: Complete local-state inventory

The migration SHALL inventory tracked changes, untracked files, ignored files, runtime configuration, generated data, dependencies, and deployment artifacts without exposing secret contents.

#### Scenario: Inventory before copy

- **WHEN** migration preparation begins
- **THEN** a local manifest SHALL identify each preservation item, its relative path, category, size, and verification status

### Requirement: Preserve ignored and untracked state

All required local and production runtime files SHALL remain at their runtime locations or in a documented backup while remaining untracked by Git, and repository cleanup SHALL NOT delete corresponding host data.

#### Scenario: Remove runtime artifact from Git

- **WHEN** a generated, dependency, delivery, or runtime artifact is removed from repository tracking
- **THEN** any required local or production copy SHALL remain available at its documented location or in a verified backup without being recommitted

### Requirement: Keep secrets out of commits and durable context

Secrets, tokens, private credentials, and sensitive data SHALL NOT be staged, committed, pushed, or copied into Cortex or Linear documentation.

#### Scenario: Secret file is present locally

- **WHEN** a secret file is copied into the target for runtime use
- **THEN** it SHALL remain ignored and local-only, and the migration record SHALL refer only to its category and verification status, not its value

### Requirement: Verify preservation integrity

Required data SHALL be compared before and after migration using file existence, size, and hashes where practical.

#### Scenario: Post-copy comparison

- **WHEN** local-state copying completes
- **THEN** the target or backup manifest SHALL match the source manifest for all required preservation items, with exceptions explicitly recorded

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
