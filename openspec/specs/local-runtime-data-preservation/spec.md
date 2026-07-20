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

All required local-only files SHALL be preserved at their target relative paths or in a documented local migration backup, while remaining untracked by Git.

#### Scenario: Restore runtime configuration and data

- **WHEN** the target project is prepared for local execution
- **THEN** required `.env`, credential, dataset, embedding, generated, dependency, and deployment files SHALL be available locally without requiring a GitHub clone to contain them

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
