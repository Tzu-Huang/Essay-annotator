## 1. Inventory and Recovery Ownership

- [ ] 1.1 Inventory PostgreSQL/SQLite data, JSONL, embeddings, uploads, OAuth files, logs, and other mutable runtime state without recording secret values
- [ ] 1.2 Classify every item as authoritative data, credential material, or reproducible output and record its owner, stable runtime path, permissions, backup method, retention, and recovery action
- [ ] 1.3 Verify whether `embed.jsonl` and each source JSONL or uploaded file can be rebuilt from PostgreSQL; retain authoritative classification where reconstruction is not proven

## 2. Production Database and Runtime Isolation

- [ ] 2.1 Record the AWS Region, supported PostgreSQL version, Single-AZ instance class, encrypted storage settings, networking rules, and operational owner
- [ ] 2.2 Provision or document the encrypted private RDS PostgreSQL Single-AZ configuration with automated backups and point-in-time recovery retained for 30 days
- [ ] 2.3 Add production startup configuration and tests that require PostgreSQL and prevent silent SQLite fallback while preserving SQLite for local development and tests
- [ ] 2.4 Define release-independent host paths and least-privilege service permissions for authoritative non-database runtime files

## 3. Secret Provisioning

- [ ] 3.1 Define the protected EC2 environment-file path, owner, service access, and restrictive permissions without committing secret values
- [ ] 3.2 Update deployment/service documentation so releases consume protected runtime configuration without copying it into source or release directories
- [ ] 3.3 Add secret-safe release checks covering Git content, build artifacts, release archives, logs, commands, and recovery evidence

## 4. Migration, Backup, and Rollback

- [ ] 4.1 Create the authoritative-data export/import and validation procedure for moving production state into RDS
- [ ] 4.2 Define and verify a mandatory completed manual RDS snapshot gate before production schema or data migrations
- [ ] 4.3 Document forward-only expand-and-contract migration rules and an application-only rollback procedure that preserves schema and data
- [ ] 4.4 Configure or document encrypted scheduled backups, retention, ownership, and recovery for authoritative non-database files

## 5. Restore Drill and Verification

- [ ] 5.1 Create a secret-safe runbook for restoring an eligible RDS recovery point into an isolated non-production instance
- [ ] 5.2 Validate restored schema, row counts, representative records, backend connectivity, and representative read operations
- [ ] 5.3 Time the complete recovery procedure and record evidence that the recovery point is no older than 24 hours and recovery completes within four hours
- [ ] 5.4 Document quarterly drill ownership, failure handling, cleanup of isolated resources, and escalation to Multi-AZ if recovery objectives tighten
- [ ] 5.5 Run repository tests and OpenSpec validation, recording any operational steps that require execution against the real AWS environment
