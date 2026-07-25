# Development Release Branch Workflow Specification

## Purpose

Define the branch baseline, promotion gate, and publication safeguards for development and migration work.
## Requirements
### Requirement: Development baseline

Development and integration work SHALL use `main` as the baseline branch and SHALL use short-lived feature or fix branches for changes.

#### Scenario: Create migration or feature work

- **WHEN** migration, feature, or fix work begins
- **THEN** the working branch SHALL be based on the current `main` branch and SHALL return through a reviewed pull request

### Requirement: Controlled release promotion

`main` SHALL be the sole production source of truth, and changes SHALL pass the documented required checks before merge and owner-authorized manual deployment.

#### Scenario: Release promotion

- **WHEN** a change is considered release-ready
- **THEN** it SHALL have passed the required pull-request checks, merged into `main`, and been selected by the project owner for production deployment

### Requirement: Local migration branch safety

The migration branch SHALL remain local and unpushed until the user explicitly authorizes publication.

#### Scenario: Proposal or migration commit

- **WHEN** OpenSpec artifacts or migration changes are committed during this workflow
- **THEN** the commit SHALL remain local and no automatic push SHALL occur

### Requirement: Legacy baseline retirement

The long-lived `frontend-base` branch SHALL NOT receive new development after the `main` workflow is adopted and SHALL be deleted only after confirming that no automation or deployment procedure depends on it.

#### Scenario: Retire frontend-base

- **WHEN** repository and production references to `frontend-base` have been checked
- **THEN** the branch SHALL be frozen or removed without creating a second production source of truth

### Requirement: Required release checks

The release policy SHALL identify required backend tests, frontend tests, frontend lint, frontend production build, and deployable-configuration checks, including any temporarily unenforced check and its follow-up action.

#### Scenario: Pull request targets main

- **WHEN** a pull request is proposed for merge into `main`
- **THEN** every documented required check SHALL pass or an explicit owner-approved exception SHALL be recorded

### Requirement: Emergency hotfix path

Emergency production fixes SHALL branch from the production commit on `main`, receive focused validation and review, merge back into `main`, and be deployed only with project-owner authorization.

#### Scenario: Urgent production defect

- **WHEN** a defect requires an expedited production change
- **THEN** the fix SHALL preserve `main` as the source of truth and SHALL NOT be committed only on the production host
