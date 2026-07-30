# production-secret-management Specification

## Purpose
TBD - created by archiving change rds-persistence-backup-restore. Update Purpose after archive.
## Requirements
### Requirement: Secrets remain outside release content
Production credentials, tokens, private keys, database passwords, and OAuth secret material SHALL remain outside Git, build artifacts, release archives, command output, logs, and recovery evidence.

#### Scenario: Prepare a production release
- **WHEN** source and artifacts are inspected before deployment
- **THEN** no production secret value or credential file SHALL be present

### Requirement: Protected runtime secret storage
Production services SHALL receive required secrets from a protected EC2 environment file or an approved AWS managed secret service, and secret storage SHALL be independent from versioned release directories.

#### Scenario: Deploy new application code
- **WHEN** the versioned application release is replaced or rolled back
- **THEN** protected runtime secrets SHALL remain available without being copied into the release directory

### Requirement: Least-privilege secret access
Each production secret SHALL have a documented owner and consumer, and filesystem or AWS permissions SHALL grant access only to the identities required to operate the associated service.

#### Scenario: Inspect host environment-file permissions
- **WHEN** the protected EC2 environment file is used
- **THEN** ownership and permissions SHALL prevent access by unrelated users and services

### Requirement: Secret-safe operational behavior
Deployment, backup, restore, diagnostics, and rotation procedures SHALL avoid printing or persisting secret values.

#### Scenario: Capture restore evidence
- **WHEN** commands and validation results are recorded for a restore drill
- **THEN** connection strings, passwords, tokens, private keys, and OAuth secret values SHALL be redacted or omitted

