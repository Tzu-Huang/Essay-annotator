## MODIFIED Requirements

### Requirement: Complete local-state inventory

The migration SHALL inventory tracked changes, untracked files, ignored files, runtime configuration, generated data, dependencies, and deployment artifacts without exposing secret contents. Each mutable production item SHALL additionally identify whether it is authoritative data, credential material, or reproducible output, together with its stable runtime path, owner, required permissions, backup method, retention, and recovery action.

#### Scenario: Inventory before copy

- **WHEN** migration preparation begins
- **THEN** a local manifest SHALL identify each preservation item, its relative path, category, authority classification, size, owner, permissions, backup disposition, and verification status

### Requirement: Preserve ignored and untracked state

All required local and production runtime files SHALL remain at stable runtime locations outside versioned release directories or in a documented recoverable backup while remaining untracked by Git, and repository cleanup, deployment, and application rollback SHALL NOT delete, overwrite, or relocate corresponding host data.

#### Scenario: Remove runtime artifact from Git

- **WHEN** a generated, dependency, delivery, or runtime artifact is removed from repository tracking
- **THEN** any required local or production copy SHALL remain available at its documented stable location or in a verified backup without being recommitted

#### Scenario: Replace a versioned release

- **WHEN** a new application release replaces or rolls back the versioned source directory
- **THEN** authoritative runtime files and credential material SHALL remain intact at their release-independent locations

### Requirement: Preserve production data across deployment

A deployment of the repaired baseline SHALL require a current inventory and verified recoverable backup of authoritative production data and SHALL NOT overwrite or remove that data as part of deployment or code rollback. Reproducible outputs SHALL have a documented rebuild procedure, and non-database authoritative files SHALL have a documented encrypted backup destination, schedule, retention, and owner.

#### Scenario: Prepare later production deployment

- **WHEN** the recorded baseline is selected for deployment
- **THEN** persistent data inventory, database backup health, non-database backup evidence, and rebuild instructions for reproducible outputs SHALL be verified before code changes are applied

#### Scenario: Roll back failed deployment

- **WHEN** post-deployment readiness checks fail
- **THEN** application code SHALL be returned to the recorded rollback commit without overwriting persistent production data, credentials, or recovery evidence

#### Scenario: Classify embeddings as reproducible

- **WHEN** an embedding file is excluded from authoritative backups
- **THEN** a tested procedure SHALL demonstrate that it can be regenerated from backed-up authoritative data within the recovery objective or the file SHALL remain classified as authoritative
