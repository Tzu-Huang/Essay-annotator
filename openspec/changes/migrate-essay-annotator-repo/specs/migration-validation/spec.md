## ADDED Requirements

### Requirement: Repository validation gate

Before legacy cleanup, the target SHALL pass checks for remote identity, branch baseline, working-tree state, and absence of unintended staged secrets.

#### Scenario: Target is ready for application validation

- **WHEN** repository checks are run
- **THEN** the target SHALL have the expected Essay-Annotator remote, the expected local branch model, and no unintended staged local-only files

### Requirement: Application smoke validation

The target SHALL pass the available backend and frontend dependency, build, test, and startup smoke checks from the new project root.

#### Scenario: Run application checks

- **WHEN** the migration validation suite is executed
- **THEN** backend and frontend checks SHALL complete successfully or have documented, migration-specific exceptions

### Requirement: Path portability validation

Migration validation SHALL check for legacy `repo/` references, absolute ProjectVault paths, and case-sensitive path mismatches affecting Linux or AWS execution.

#### Scenario: Search migration-sensitive paths

- **WHEN** source and deployment configuration are scanned
- **THEN** each legacy or case-sensitive path reference SHALL be corrected or explicitly documented as intentionally retained

### Requirement: Cleanup safety gate

The legacy ProjectVault `repo/` SHALL remain intact until all repository, data, application, and path validation requirements pass.

#### Scenario: Validation failure

- **WHEN** any required validation check fails or data comparison is incomplete
- **THEN** cleanup SHALL be skipped and ProjectVault SHALL remain the rollback source

#### Scenario: Validation succeeds

- **WHEN** all validation evidence is complete and the user approves cleanup
- **THEN** the legacy `repo/` MAY be removed or archived as a separate operation without changing GitHub
