## ADDED Requirements

### Requirement: Development baseline

Development and integration work SHALL use `frontend-base` as the baseline branch.

#### Scenario: Create migration or feature work

- **WHEN** migration or feature work begins
- **THEN** the working branch SHALL be based on `frontend-base` and SHALL not use `main` as the development workspace

### Requirement: Controlled release promotion

Changes SHALL merge into `frontend-base` and pass validation before they are promoted to `main`.

#### Scenario: Release promotion

- **WHEN** a change is considered release-ready
- **THEN** it SHALL have passed the agreed checks on `frontend-base` before being merged into `main`

### Requirement: Local migration branch safety

The migration branch SHALL remain local and unpushed until the user explicitly authorizes publication.

#### Scenario: Proposal or migration commit

- **WHEN** OpenSpec artifacts or migration changes are committed during this workflow
- **THEN** the commit SHALL remain local and no automatic push SHALL occur
