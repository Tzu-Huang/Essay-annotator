## MODIFIED Requirements

### Requirement: Recorded production baseline

The release record SHALL identify the tested source commit, merged `main` commit, previous production rollback commit, successful required CI evidence, verification evidence, and known limitations. A `main` commit SHALL NOT be eligible for production deployment while any required CI check is failing, incomplete, or absent.

#### Scenario: Accept baseline on main

- **WHEN** the approved change is merged into `main` and all required CI checks have succeeded for the production candidate
- **THEN** the exact baseline and rollback SHAs, required CI results, and associated verification results SHALL be recorded before deployment

#### Scenario: Reject unvalidated main commit

- **WHEN** a `main` commit lacks successful evidence for any required CI check
- **THEN** the commit SHALL NOT be selected as a production baseline
