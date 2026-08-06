## MODIFIED Requirements

### Requirement: Recorded production baseline
The release record SHALL identify the deployment ID, trigger, actor, tested source commit, merged `main` commit, artifact identity and digest, start and end timestamps, active release directory, previous production rollback release, internal and public health evidence, final result, rollback outcome and verification, and known limitations. Records SHALL remain outside immutable release directories and SHALL exclude secrets and signed credentials.

#### Scenario: Accept baseline on main
- **WHEN** the approved `main` artifact passes activation and every required health gate
- **THEN** the exact baseline, artifact, actor, timing, active and rollback releases, and verification results are recorded before deployment is declared successful

#### Scenario: Record a failed deployment
- **WHEN** preparation, activation, health checking, or rollback fails
- **THEN** the record identifies the failed phase, final active release, and rollback outcome without exposing secret material
