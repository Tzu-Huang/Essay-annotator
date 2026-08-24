# continuous-integration-quality-gates Specification

## Purpose
TBD - created by archiving change add-ci-quality-gates. Update Purpose after archive.
## Requirements
### Requirement: Production-bound changes trigger continuous integration

The repository SHALL run its required continuous-integration checks for every pull request targeting `main` and every relevant push to `main`.

#### Scenario: Pull request targets main

- **WHEN** a contributor opens or updates a pull request targeting `main`
- **THEN** all required frontend, backend, and security checks SHALL run against the candidate commit

#### Scenario: Main receives a relevant push

- **WHEN** a relevant commit is pushed to `main`
- **THEN** the same required validation SHALL run and report results for that commit

### Requirement: Frontend gate validates a clean production candidate

The frontend gate SHALL install dependencies from the committed lockfile and SHALL run lint, automated tests, and the production build.

#### Scenario: Healthy frontend candidate

- **WHEN** the frontend lockfile, source, lint rules, tests, and production build are valid
- **THEN** the frontend gate SHALL succeed without using a development server

#### Scenario: Broken frontend candidate

- **WHEN** a candidate contains a deliberate frontend lint, test, or build failure
- **THEN** the frontend gate SHALL fail at the responsible command and expose diagnostic output

### Requirement: Backend gate validates an isolated production candidate

The backend gate SHALL install committed dependencies in a clean Python 3.12 environment and SHALL run the complete backend test suite, application import validation, and a bounded startup/readiness check.

#### Scenario: Healthy backend candidate

- **WHEN** the backend dependencies, tests, FastAPI import, and local readiness behavior are valid
- **THEN** the backend gate SHALL succeed without production credentials or production data access

#### Scenario: Broken backend candidate

- **WHEN** a candidate contains a deliberate backend test, import, or startup failure
- **THEN** the backend gate SHALL fail at the responsible command and expose diagnostic output

### Requirement: Security gate checks credentials and dependencies

The security gate SHALL scan committed content for credential material and SHALL evaluate frontend and backend dependencies against an explicitly documented blocking policy.

#### Scenario: Credential material is committed

- **WHEN** the candidate commit contains content matching the configured credential policy
- **THEN** the security gate SHALL fail without printing the complete credential value

#### Scenario: Blocking dependency vulnerability is detected

- **WHEN** a dependency scan reports a vulnerability at or above the configured blocking severity without an approved exception
- **THEN** the security gate SHALL fail and identify the affected package and advisory

### Requirement: Required CI is secretless and least-privileged

Required pull-request CI SHALL use read-only permissions unless a job has a documented narrower need and SHALL NOT depend on production secrets or mutate external production systems.

#### Scenario: Pull request runs without secrets

- **WHEN** required CI runs for a pull request with no production secrets available
- **THEN** every required job SHALL complete its intended validation using isolated fixtures, mocks, or local temporary state

### Requirement: Main requires successful quality gates

The repository's `main` protection policy SHALL require pull-request integration and successful stable CI checks before an ordinary contributor can merge or push a production candidate.

#### Scenario: A required check fails

- **WHEN** any required CI check on a proposed `main` change is failing or incomplete
- **THEN** repository protection SHALL prevent an ordinary contributor from merging that change

#### Scenario: All required checks pass

- **WHEN** all required checks and review conditions for a proposed `main` change succeed
- **THEN** repository protection SHALL allow an authorized contributor to merge it

