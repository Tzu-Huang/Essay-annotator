## Why

The current EC2 delivery model does not yet prove that production data and credentials survive code deployment, rollback, or host failure. Launch requires a documented and tested recovery path with a maximum 24-hour data-loss window and restoration within four hours.

## What Changes

- Use Amazon RDS for PostgreSQL Single-AZ as the production system of record while retaining SQLite only for local development and tests.
- Separate all mutable runtime state from versioned release directories and classify each item as authoritative data, protected credential material, or reproducible output.
- Keep production secrets outside Git, build artifacts, release archives, and logs, with least-privilege access for required services.
- Configure automated database backups with 30-day retention and require a pre-migration snapshot.
- Define migration and rollback rules that prevent application rollback from silently reversing incompatible data changes.
- Add an isolated restore drill and evidence record demonstrating a recovery point objective (RPO) of 24 hours and recovery time objective (RTO) of four hours.
- Define backup treatment for non-database state, including uploaded files, OAuth files, JSONL data, and reproducible embeddings.

## Capabilities

### New Capabilities

- `production-database-recovery`: Production PostgreSQL selection, backup retention, pre-migration snapshots, restore drills, recovery objectives, and rollback-safe schema migration requirements.
- `production-secret-management`: Secret storage, exclusion, permissions, rotation-safe deployment, and leak-prevention requirements for production credentials.

### Modified Capabilities

- `local-runtime-data-preservation`: Extend the existing inventory and deployment-preservation contract with authoritative/reproducible classification, release-independent persistent paths, non-database backup ownership, and restore evidence.

## Impact

- Affects EC2 deployment configuration, the backend `POSTGRES_URL` runtime configuration, database migration procedures, backup/restore operations, secret provisioning, and release/rollback documentation.
- Introduces an Amazon RDS for PostgreSQL Single-AZ dependency and associated AWS networking, encryption, monitoring, backup, and access-control configuration.
- Requires operational documentation and evidence but does not place production data or secret values in the repository.
