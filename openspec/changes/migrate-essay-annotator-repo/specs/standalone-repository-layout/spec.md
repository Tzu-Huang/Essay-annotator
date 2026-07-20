## ADDED Requirements

### Requirement: Standalone project root

The project SHALL run from `C:\Personal_repo\Projects\essay-annotator` without requiring a parent `repo/` directory.

#### Scenario: Start from target root

- **WHEN** a developer runs the documented backend, frontend, or test commands from the target project root
- **THEN** the commands SHALL resolve project files without referencing `ProjectVault/10-active/essay-annotator/repo/`

### Requirement: Direct GitHub repository identity

The target project SHALL retain the Essay-Annotator Git remote and repository history, with `frontend-base` as the migration baseline.

#### Scenario: Verify remote and baseline

- **WHEN** the target repository is inspected before migration validation
- **THEN** its `origin` remote SHALL point to `https://github.com/Tzu-Huang/Essay-annotator.git` and its baseline commit SHALL come from `frontend-base`

### Requirement: No implicit GitHub mutation

The migration SHALL NOT push, force-push, mirror-push, rewrite history, or modify GitHub branches as part of local relocation.

#### Scenario: Local-only migration

- **WHEN** the repository is cloned, copied, branched, committed locally, or tested during migration
- **THEN** GitHub remote state SHALL remain unchanged
