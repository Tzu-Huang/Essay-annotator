# Development Release Branch Workflow Specification

## Purpose

Define the branch baseline, promotion gate, and publication safeguards for development and migration work.
## Requirements
### Requirement: Development baseline

Development and integration work SHALL use `main` as the baseline branch and SHALL use short-lived feature or fix branches for changes.

#### Scenario: Create feature or fix work

- **WHEN** development work begins
- **THEN** the working branch SHALL be based on `main` and SHALL return through the agreed pull-request flow

### Requirement: Controlled release promotion

Production changes SHALL merge into `main` only after the candidate source commit passes the agreed validation and review gates.

#### Scenario: Release promotion

- **WHEN** a change is considered release-ready
- **THEN** its tested and approved source SHALL be merged through a pull request to `main` before it can become the production baseline

### Requirement: Local migration branch safety

The migration branch SHALL remain local and unpushed until the user explicitly authorizes publication.

#### Scenario: Proposal or migration commit

- **WHEN** OpenSpec artifacts or migration changes are committed during this workflow
- **THEN** the commit SHALL remain local and no automatic push SHALL occur

### Requirement: Legacy branch exclusion

The release process SHALL NOT promote from or re-merge the stale `frontend-base` or already-merged `feature/admin` refs when establishing the repaired production baseline.

#### Scenario: Select production source

- **WHEN** the repaired baseline is prepared
- **THEN** it SHALL originate from a short-lived branch based on `main`, with legacy refs used only as read-only comparison evidence
