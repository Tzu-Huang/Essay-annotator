## Context

Essay Annotator currently runs its backend on a single EC2 host. The backend selects PostgreSQL when `POSTGRES_URL` is present and otherwise creates SQLite at `BackEnd/app_data.db`. Mutable JSONL and embedding files live under `BackEnd/drive_data`, and OAuth tooling may depend on local credential files. Existing delivery archives preserve snapshots of some ignored data, but they are not a scheduled backup policy and are coupled to manual release handling.

The launch decision is Amazon RDS for PostgreSQL Single-AZ, a maximum 24-hour data-loss window (RPO), restoration within four hours (RTO), 30-day automated-backup retention, and a quarterly restore drill.

## Goals / Non-Goals

**Goals:**

- Make RDS PostgreSQL the authoritative production database and fail production startup when it is not configured.
- Keep mutable state and credentials independent from versioned application releases.
- Document ownership, permissions, backup destination, schedule, retention, migration gates, and recovery steps.
- Prove recovery by restoring into an isolated target and recording secret-safe evidence.
- Preserve application rollback without attempting unsafe automatic schema reversal.

**Non-Goals:**

- Multi-AZ failover or near-zero-downtime recovery.
- Replacing local SQLite development and test workflows.
- Backing up reproducible dependencies, build output, caches, or embeddings that can be regenerated from authoritative data.
- Committing infrastructure credentials, production data, snapshots, or secret values.

## Decisions

### RDS PostgreSQL Single-AZ is the production system of record

Production receives `POSTGRES_URL` through protected runtime configuration and does not fall back to repository-local SQLite. RDS is preferred over PostgreSQL installed on EC2 because managed snapshots, point-in-time recovery, storage isolation, maintenance controls, and restore-to-new-instance behavior reduce the operational work required to meet the selected RPO and RTO. Single-AZ matches the four-hour recovery objective; Multi-AZ can be added later if the availability target becomes measured in minutes.

### RDS-native recovery plus pre-migration snapshots

RDS automated backups retain 30 days of recovery history. A manual snapshot is required before any schema migration that changes production structures or data. Backup health must be checked before deployment, and quarterly drills restore to a separate, non-production DB instance before application-level validation. The original database remains untouched during the drill.

### Forward-only, expand-and-contract schema changes

Application rollback changes code only. Migrations use forward-compatible expand-and-contract phases so the previous application version can continue operating during the rollback window. Destructive contraction occurs only after compatibility verification and an explicit later release. Automatic downgrade migrations are not part of rollback.

### Runtime state is classified before storage and backup are assigned

Each mutable item is recorded as:

- **Authoritative:** cannot be regenerated and requires protected persistent storage plus backup.
- **Credential:** stored outside Git and release directories with least-privilege access; recovery follows the owning secret system.
- **Reproducible:** rebuilt from authoritative data and documented without mandatory backup.

PostgreSQL rows are authoritative. `embed.jsonl` is reproducible only after verification that PostgreSQL contains the essay content and embedding state needed to rebuild it. Uploaded source files and other JSONL files remain authoritative until the inventory proves that the database fully and durably represents them.

### Host files use a release-independent persistent root

Required non-database runtime files use a stable host path outside the Git checkout and versioned release directories. The backend receives explicit paths through runtime configuration. The application service account receives only the minimum read or write permissions needed for each path. Authoritative host files are backed up to an encrypted, access-controlled AWS destination with a documented retention policy.

### Secrets use protected host configuration initially

The initial deployment uses a root-owned EC2 environment file readable by the application service account through the service manager, with file mode equivalent to owner read/write only. Secret values are excluded from Git, artifacts, commands, logs, and evidence. AWS Secrets Manager remains a future option if rotation, audit, or multi-host requirements justify it.

## Risks / Trade-offs

- **Single-AZ does not provide automatic cross-AZ failover** → Accept the availability trade-off under the four-hour RTO; monitor restore duration and upgrade to Multi-AZ if the objective tightens.
- **RDS backup success does not protect host files** → Maintain a separate inventory and encrypted backup policy for authoritative non-database files.
- **JSONL and PostgreSQL can diverge** → Declare one authority per data class and validate reconstruction before classifying JSONL or embeddings as reproducible.
- **A snapshot can be restorable but the application can still fail** → Validate schema, row counts, backend connectivity, and representative read operations during each restore drill.
- **Protected environment files still require host security** → Restrict ownership and permissions, prevent logging, document rotation, and migrate to a managed secret service if operational scope grows.
- **Four-hour recovery depends on current data volume and runbook accuracy** → Time every quarterly drill and treat an over-four-hour result as a failed acceptance gate.

## Migration Plan

1. Inventory database, JSONL, embeddings, uploads, OAuth material, logs, and other mutable files; assign authority, runtime path, owner, permissions, backup method, retention, and recovery action.
2. Provision encrypted private RDS PostgreSQL Single-AZ with 30-day automated backups and restricted network access from the backend host.
3. Create a protected EC2 runtime environment file and stable persistent paths; update service configuration without placing values in repository files.
4. Take source backups, import authoritative data into RDS, validate counts and representative records, then switch the backend to RDS.
5. Create a pre-migration snapshot, apply forward-compatible schema changes, and run readiness checks.
6. Restore the selected recovery point to an isolated instance, validate the application recovery procedure, measure elapsed time, and record secret-safe evidence.
7. Roll back application code only if validation fails; keep the compatible schema and persistent data intact. Restore data from the pre-migration snapshot only through an explicit recovery decision.

## Open Questions

- Which AWS Region, RDS instance class, encrypted backup bucket, and operational owner will be recorded in the runbook?
- Which uploaded or JSONL artifacts remain authoritative after the production database import?
- Where will restore evidence and quarterly drill ownership be tracked without exposing production identifiers or secret values?
