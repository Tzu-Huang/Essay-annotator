# production-environment-baseline Specification

## Purpose
TBD - created by archiving change audit-aws-production. Update Purpose after archive.
## Requirements
### Requirement: Secret-safe AWS infrastructure inventory
The production baseline SHALL record the EC2 instance type, operating system, AWS region and availability zone, storage, current public IPv4 address, Elastic IP association status, and Security Group ingress and egress rules without recording credentials or secret values.

#### Scenario: Capture AWS infrastructure evidence
- **WHEN** the production audit is performed
- **THEN** the inventory SHALL contain dated evidence for every required infrastructure attribute and SHALL mark unavailable attributes as unresolved

### Requirement: Runtime service inventory
The production baseline SHALL identify active application processes, listening ports, repository path, service manager units, web server or reverse proxy, installed Python and Node.js runtimes, and the commands used to start, stop, restart, and inspect the application.

#### Scenario: Reconstruct the production startup path
- **WHEN** a maintainer reads the completed inventory
- **THEN** the maintainer SHALL be able to trace each externally reachable application endpoint to its process and managed startup command

### Requirement: Persistent data inventory
The production baseline SHALL identify the active relational database configuration category and the locations, ownership, persistence expectations, and backup status of SQLite data, PostgreSQL data references, JSONL datasets, embeddings, uploaded files, and logs.

#### Scenario: Classify production data before deployment
- **WHEN** a production update is prepared
- **THEN** every known data location SHALL be classified as persistent, reproducible, or unresolved before files are replaced or services restarted

### Requirement: Repository and deployment-access inventory
The production baseline SHALL record repository visibility, checkout remote, current branch and commit, working-tree state, divergence from `origin/main`, and the deployment authentication mechanism category without recording authentication material.

#### Scenario: Production checkout differs from main
- **WHEN** the live checkout has local changes, unique commits, or unexpected branch state
- **THEN** the inventory SHALL flag deployment as blocked pending explicit reconciliation

### Requirement: Evidence and secret handling
Audit documentation SHALL distinguish observed facts, repository-derived expectations, owner-confirmed decisions, and unresolved questions, and MUST NOT contain passwords, tokens, private keys, credential contents, or secret environment-variable values.

#### Scenario: Configuration contains sensitive values
- **WHEN** audit evidence depends on a sensitive configuration source
- **THEN** the documentation SHALL record only the setting name, location category, and configured/not-configured state

### Requirement: Launch endpoint classification
The production baseline SHALL classify direct HTTP access by IP as temporary internal validation and SHALL track domain plus HTTPS readiness as separate follow-up work before intended public launch.

#### Scenario: Validate service before domain setup
- **WHEN** the application is tested through the EC2 public IP
- **THEN** the result SHALL NOT be recorded as domain or HTTPS launch readiness
