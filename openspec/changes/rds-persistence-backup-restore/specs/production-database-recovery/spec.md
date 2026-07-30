## ADDED Requirements

### Requirement: Production database selection
Production SHALL use Amazon RDS for PostgreSQL Single-AZ as its authoritative relational database and SHALL NOT silently fall back to SQLite when production database configuration is absent or invalid.

#### Scenario: Production database configuration is missing
- **WHEN** the backend starts in the production environment without a valid PostgreSQL connection configuration
- **THEN** startup SHALL fail readiness without creating or using a repository-local SQLite database

### Requirement: Recovery objectives
The production database recovery design SHALL support a recovery point no more than 24 hours old and completion of the documented database recovery procedure within four hours.

#### Scenario: Measure an isolated recovery drill
- **WHEN** an operator performs the documented restore drill from an eligible recovery point
- **THEN** the restored database SHALL satisfy the 24-hour RPO and the validated recovery procedure SHALL finish within the four-hour RTO

### Requirement: Automated backup retention
The production RDS instance SHALL have automated backups and point-in-time recovery enabled with a 30-day retention period.

#### Scenario: Check backup configuration before release
- **WHEN** a production release preflight is performed
- **THEN** evidence SHALL show that automated backups are healthy and configured for 30-day retention

### Requirement: Pre-migration recovery point
A recoverable manual snapshot SHALL be completed before applying a production schema or data migration.

#### Scenario: Migration backup is unavailable
- **WHEN** a planned production migration lacks a completed and identifiable pre-migration snapshot
- **THEN** the migration SHALL NOT begin

### Requirement: Rollback-compatible migrations
Production migrations SHALL use forward-compatible expand-and-contract changes, and application rollback SHALL NOT automatically execute destructive or incompatible downgrade migrations.

#### Scenario: Application deployment fails after migration
- **WHEN** post-deployment readiness checks require application rollback
- **THEN** the previous compatible application version SHALL be restored without overwriting persistent data or automatically reversing the schema

### Requirement: Isolated restore verification
A restore drill SHALL run at least quarterly against an isolated non-production target and SHALL record the recovery point, elapsed time, validation results, responsible operator, and follow-up actions without recording secrets.

#### Scenario: Quarterly restore succeeds
- **WHEN** the restored database passes schema validation, representative data checks, and backend read validation within four hours
- **THEN** secret-safe evidence SHALL record the drill as successful

#### Scenario: Quarterly restore fails
- **WHEN** restoration or application validation fails, exceeds four hours, or uses a recovery point older than 24 hours
- **THEN** the drill SHALL be recorded as failed and production recovery readiness SHALL remain incomplete until corrective actions are verified
