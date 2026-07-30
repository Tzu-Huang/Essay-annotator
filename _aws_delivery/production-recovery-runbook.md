# Production Persistence and Recovery Runbook

Status: operational template; **not evidence that AWS resources have been configured or tested**

This runbook defines the production persistence, migration, backup, rollback, and
quarterly recovery-drill procedure for Essay Annotator. The approved objectives
are:

- Database: Amazon RDS for PostgreSQL, Single-AZ
- Recovery point objective (RPO): no more than 24 hours of accepted data loss
- Recovery time objective (RTO): service restored within 4 hours
- RDS automated-backup retention: 30 days
- Recovery drill: quarterly, into an isolated non-production target

Never paste passwords, connection strings, tokens, private keys, production
records, public IP addresses, DB resource identifiers, snapshot identifiers, or
security-group identifiers into this document, tickets, command history, logs,
or recovery evidence.

## 1. Execution Gate and Required Values

An operator must resolve and record the following values in the approved
restricted operations system before provisioning, migration, or recovery.
Do not replace these placeholders in this repository file.

| Placeholder | Required decision |
| --- | --- |
| `<AWS_REGION>` | Approved AWS Region |
| `<PG_MAJOR_VERSION>` | PostgreSQL major version currently in standard RDS support and supported by the application |
| `<RDS_INSTANCE_CLASS>` | Instance class sized from measured production load |
| `<RDS_STORAGE_TYPE>` / `<RDS_STORAGE_GIB>` | Encrypted storage type and initial capacity |
| `<KMS_KEY_REFERENCE>` | Approved customer-managed or AWS-managed encryption key reference |
| `<DB_SUBNET_GROUP>` | Private DB subnet group spanning the approved VPC |
| `<DB_SECURITY_GROUP>` | Security group allowing PostgreSQL only from the application security group |
| `<APP_SECURITY_GROUP>` | EC2 application security group; never use a public CIDR |
| `<PRODUCTION_DB_ALIAS>` | Non-secret internal alias used by operations |
| `<BACKUP_BUCKET_ALIAS>` | Private encrypted destination for authoritative non-database backups |
| `<OPERATIONS_OWNER>` | Named role/team accountable for backup and recovery |
| `<APPLICATION_OWNER>` | Named role/team accountable for application validation |
| `<EVIDENCE_LOCATION>` | Restricted, access-controlled evidence system |
| `<SERVICE_ACCOUNT>` | Least-privilege Linux account running the backend |
| `<SERVICE_UNIT>` | Service-manager unit name |

Before execution, the operations owner must confirm:

- [ ] Every placeholder above is resolved in a restricted operations record.
- [ ] The selected PostgreSQL version is supported by RDS and the application.
- [ ] The instance class and storage are based on measured capacity needs.
- [ ] No resource has public access and no ingress rule uses a public CIDR.
- [ ] Operators have approved, audited access without sharing credentials.
- [ ] The source-of-truth inventory identifies each authoritative, credential,
      and reproducible data item.

If any item is unresolved, stop. Do not provision or migrate.

## 2. Required Production Architecture

### 2.1 RDS configuration

Provision through the approved infrastructure workflow, not an ad hoc console
change. The reviewed configuration must establish:

- RDS PostgreSQL `<PG_MAJOR_VERSION>` in `<AWS_REGION>`.
- Single-AZ deployment using `<RDS_INSTANCE_CLASS>`.
- Storage encryption enabled with `<KMS_KEY_REFERENCE>`.
- Private DB subnets only and `PubliclyAccessible` disabled.
- Inbound PostgreSQL access only from `<APP_SECURITY_GROUP>` through
  `<DB_SECURITY_GROUP>`.
- Automated backups enabled with `BackupRetentionPeriod = 30`.
- A reviewed backup window and maintenance window that do not overlap.
- Deletion protection enabled for production.
- Storage autoscaling or a documented capacity alarm and response threshold.
- RDS and application health alarms routed to `<OPERATIONS_OWNER>`.
- Database logs exported only where approved and configured to avoid statement
  or parameter logging that could expose credentials or sensitive content.

Record a redacted configuration report in `<EVIDENCE_LOCATION>`. The report may
show region, engine version, instance class, encryption state, retention days,
private-access state, and timestamps. It must not show endpoint hostnames,
resource identifiers, account numbers, network identifiers, tags containing
sensitive data, or credentials.

### 2.2 Release-independent EC2 paths

Use stable paths outside the checkout and versioned release directories:

```text
/etc/essay-annotator/production.env
/var/lib/essay-annotator/uploads/
/var/lib/essay-annotator/source-data/
/var/lib/essay-annotator/reproducible/
/var/log/essay-annotator/
```

The environment file is credential material. It must be owned by `root`, mode
`0600`, and supplied to `<SERVICE_UNIT>` by the service manager. The backend
must not copy it into a release directory. If the service must run as
`<SERVICE_ACCOUNT>`, the service manager should read the root-owned environment
file and pass variables to that process; do not weaken file permissions merely
to make the service account read it directly.

Authoritative runtime directories must be owned by `<SERVICE_ACCOUNT>`, with
mode `0750` for directories and `0640` or stricter for files. Give write access
only where the application requires it. Credential files, including OAuth
material, remain outside these data directories and follow their owner system's
rotation and recovery process.

The protected environment file supplies explicit runtime settings, including
the PostgreSQL connection value and stable paths. Never print it, source it in
an interactive shell, pass its values on a command line, or include it in an
archive. Production startup must fail if PostgreSQL configuration is missing;
it must never silently create or use repository-local SQLite.

### 2.3 Secret-safe release gate

Before every release:

1. Scan Git-tracked files, the build artifact, and the release archive using the
   approved secret scanner.
2. Confirm the archive excludes `.env` files, credentials, private keys,
   database files, JSONL data, uploads, backups, and recovery evidence.
3. Inspect service and deployment logs for accidental environment dumps,
   connection strings, tokens, SQL parameter values, and production records.
4. Confirm deployment commands refer only to protected file paths or secret
   references, never secret values.
5. Store only the scanner name/version, timestamp, artifact digest, pass/fail
   result, reviewer, and redacted findings in evidence.

Any suspected exposure blocks release. Rotate the affected credential, remove
the value from all artifacts and logs, and repeat the gate.

## 3. Authoritative Data Export, Import, and Cutover

Use this procedure only after the inventory identifies the authority for every
database, JSONL, embedding, upload, and OAuth-related item. `embed.jsonl` or any
other file is reproducible only after a documented reconstruction test proves
that PostgreSQL contains everything required to regenerate it.

### 3.1 Prepare

1. Announce the maintenance window and start the recovery timer log.
2. Stop writes or place the application in an approved read-only state.
3. Record a secret-safe source baseline:
   - schema/migration version;
   - per-table row counts;
   - deterministic checks for representative records using non-sensitive
     internal record references or one-way hashes;
   - inventory counts and total bytes for authoritative host files.
4. Export the source database using the database-native consistent backup
   method. Put the dump in a restricted encrypted staging location outside the
   repository and release tree.
5. Generate a cryptographic digest for the dump and record only the digest,
   size, tool version, timestamp, and operator in evidence.
6. Back up authoritative host files as described in section 5 before cutover.

For PostgreSQL sources, use `pg_dump` in custom format with credentials supplied
through the approved non-interactive secret mechanism:

```text
pg_dump --format=custom --no-owner --no-acl --file=<ENCRYPTED_STAGING_DUMP> <SOURCE_CONNECTION_REFERENCE>
```

The placeholders represent protected paths/references, not literal command-line
secrets. For SQLite or application-managed source data, use the documented
consistent export procedure while writes are stopped; do not copy a live,
mutating database file.

### 3.2 Import into RDS

1. Confirm the target is private, encrypted, empty, and on the approved engine
   version.
2. Confirm connectivity from the application host through security groups,
   without opening public access.
3. Create the application database and least-privilege role using the approved
   credential channel.
4. Import the dump using the version-matched client:

```text
pg_restore --exit-on-error --no-owner --no-acl --dbname=<TARGET_CONNECTION_REFERENCE> <ENCRYPTED_STAGING_DUMP>
```

5. Apply only reviewed forward-compatible migrations.
6. Validate:
   - schema and migration version match the expected release;
   - every authoritative table's row count matches the baseline or has a
     documented transformation;
   - representative records match the baseline checks;
   - constraints and indexes are present;
   - the backend can connect using its least-privilege role;
   - representative read operations succeed;
   - any required write smoke test uses a designated test record and is cleaned
     up through the application.
7. Point the protected environment file at the RDS connection using the
   approved secret delivery mechanism, restart `<SERVICE_UNIT>`, and repeat the
   application checks.
8. Resume writes only after both owners approve the validation record.

Keep the source read-only until the rollback window closes. Delete the staging
dump only under the approved retention and secure-cleanup process.

If counts or representative checks differ unexpectedly, stop cutover, preserve
the source, return the application to its previous configuration, and
investigate. Do not merge or manually edit production data during the incident.

## 4. Migration Snapshot Gate and Rollback

### 4.1 Mandatory pre-migration gate

Before every production schema or data migration:

1. Confirm automated backups are healthy and the latest restorable time is
   within 24 hours of the current time.
2. Create a manual RDS snapshot through the approved infrastructure/operations
   workflow, with encryption preserved.
3. Wait until the snapshot state is `available`; a submitted or pending
   snapshot does not satisfy the gate.
4. Record a redacted snapshot alias, creation/completion timestamps, encrypted
   state, migration identifier, release commit, operator, and reviewer in
   `<EVIDENCE_LOCATION>`.
5. Obtain explicit approval from `<OPERATIONS_OWNER>` and
   `<APPLICATION_OWNER>`.
6. Start the migration only after all checks pass.

If the snapshot does not become available, the latest restorable time is older
than 24 hours, encryption is absent, or evidence is incomplete, cancel the
migration.

### 4.2 Expand-and-contract rules

- **Expand:** add nullable columns, new tables, compatible indexes, or parallel
  structures that both old and new application versions can tolerate.
- Deploy code that can read old and new shapes and can safely populate the new
  shape.
- Backfill in bounded, observable batches with resumability and validation.
- Switch reads only after completeness and compatibility checks pass.
- **Contract:** remove old fields or behavior only in a later release after the
  rollback window closes and all consumers are verified.
- Never combine an irreversible destructive contraction with the release that
  first depends on the new structure.
- Never use an automatic downgrade migration as an application rollback.

### 4.3 Failure and application-only rollback

If post-migration validation fails:

1. Stop new writes if continued writes could worsen inconsistency.
2. Roll application code back to the last version compatible with the expanded
   schema.
3. Keep the database schema and persistent data in place.
4. Validate backend connectivity and representative reads on the prior code.
5. Record the failure and decide separately whether forward repair is safe.

Restoring the pre-migration snapshot replaces the recovery target with older
data and can lose accepted writes. It requires an explicit incident decision,
an assessed recovery point, a separate restored instance, validation, and a
controlled endpoint cutover. Never overwrite or delete the original production
instance as the first recovery action.

## 5. Authoritative Non-Database Backups

Back up only files classified as authoritative. Reproducible caches and
embeddings have a documented rebuild procedure instead. Credentials are
recovered or rotated through their owning secret system, not copied into data
backups.

For each authoritative path:

- Schedule at least daily encrypted backups so the oldest acceptable recovery
  point is no more than 24 hours old.
- Send backups to `<BACKUP_BUCKET_ALIAS>` with public access blocked, TLS in
  transit, encryption with `<KMS_KEY_REFERENCE>`, least-privilege IAM, and
  versioning or an approved immutability control.
- Retain recovery points for 30 days unless a stricter legal or operational
  policy applies.
- Monitor job completion, object age, and restore-test results; alert
  `<OPERATIONS_OWNER>` before the 24-hour RPO is breached.
- Record backup tool/version, source path alias, start/end time, file count,
  total bytes, digest/manifest reference, destination alias, encryption state,
  retention expiry, and result without recording filenames that reveal user
  data.

At least quarterly, restore these files to a new isolated directory, verify the
manifest/digests, counts, permissions, and representative application reads,
then securely remove the drill copy. A successful upload alone is not proof of
recoverability.

## 6. Quarterly Isolated RDS PITR Drill

The operations owner schedules one drill every calendar quarter. The
application owner participates in validation. The drill never points production
traffic at the restored target and never modifies the source instance.

### 6.1 Start and select the recovery point

1. Create an evidence record using section 7 and record the UTC start time.
2. Record the latest restorable time and select an eligible recovery timestamp.
3. Calculate recovery-point age as drill start minus selected recovery time.
   It must be 24 hours or less.
4. If no eligible recovery point exists, mark the drill failed, open an
   incident, and repair backup coverage before proceeding with any migration.

### 6.2 Restore to isolation

Restore through the approved infrastructure/operations workflow using:

- the selected point in time;
- a new non-production alias;
- `<RDS_INSTANCE_CLASS>` or a documented recovery-sized class;
- encryption with `<KMS_KEY_REFERENCE>`;
- private isolated subnets;
- a drill-only security group with no public ingress and no production
  application access;
- deletion protection appropriate for the drill lifecycle;
- no production DNS alias and no automatic application cutover.

Wait for RDS availability and required health checks. Record timestamps and
redacted state transitions, not resource identifiers or endpoints.

### 6.3 Validate recovery

From an approved isolated validation host:

1. Confirm engine version, expected database, schema, and migration version.
2. Compare per-table row counts against the production baseline captured at or
   after the selected recovery point, allowing only documented time-window
   differences.
3. Validate representative records with non-sensitive references or one-way
   hashes.
4. Confirm constraints and indexes required by the application.
5. Start an isolated backend using a drill-only protected environment file.
6. Confirm least-privilege backend connectivity.
7. Execute representative read operations and record pass/fail and timing.
8. Restore authoritative non-database files to an isolated path and validate
   the manifest if those files are required for the same recovery scenario.

Do not copy production secrets into evidence or use real customer content as
screenshots. Redact application output and use counts, hashes, or approved test
records.

### 6.4 Measure RPO and RTO

- RPO result = drill start UTC minus selected recovery-point UTC. Pass only if
  it is no more than 24 hours.
- RTO result = validation-complete UTC minus drill start UTC. Pass only if it is
  no more than 4 hours.
- The drill passes only if database validation, backend connectivity,
  representative reads, required file recovery, RPO, and RTO all pass.

## 7. Secret-Safe Evidence Template

Store this record in `<EVIDENCE_LOCATION>`, not in Git:

```text
Drill reference:
Quarter / date:
Operations owner:
Application owner:
Region:
Engine major version:
Instance class category:
Source alias (redacted):
Selected recovery point UTC:
Latest restorable time UTC:
Drill start UTC:
RDS available UTC:
Application validation complete UTC:
RPO duration:
RPO <= 24 hours: PASS / FAIL
RTO duration:
RTO <= 4 hours: PASS / FAIL
Encrypted restore: PASS / FAIL
Private/isolation review: PASS / FAIL
Schema and migration version: PASS / FAIL
Table-count comparison: PASS / FAIL
Representative-record checks: PASS / FAIL
Constraints/index checks: PASS / FAIL
Backend connectivity: PASS / FAIL
Representative reads: PASS / FAIL
Non-database restore (required / not required): PASS / FAIL / N/A
Evidence artifact digests:
Exceptions (secret-safe):
Overall result: PASS / FAIL
Reviewer approval:
Cleanup completed UTC:
Follow-up ticket references:
```

Evidence must not contain endpoints, account numbers, resource identifiers,
security-group/subnet identifiers, credentials, connection strings, commands
with secret values, raw production rows, or unredacted screenshots.

## 8. Cleanup, Failure Handling, and Escalation

### 8.1 Drill cleanup

After evidence review:

1. Stop the isolated backend and revoke drill-only credentials.
2. Securely remove isolated host-file restores and temporary dumps.
3. Delete the drill RDS instance through the approved workflow after verifying
   the target alias and receiving the required approval.
4. Remove drill-only network rules and temporary secret references.
5. Confirm production resources were not changed.
6. Record cleanup completion and reviewer approval.

Never use a wildcard or a production-derived identifier for deletion.

### 8.2 Failed drill or objective breach

A missing recovery point, failed restore, validation mismatch, RPO over 24
hours, or RTO over 4 hours is a failed drill:

1. Preserve secret-safe logs and evidence.
2. Notify both owners and open an incident/follow-up ticket.
3. Block production migrations until backup integrity is restored.
4. Identify whether failure came from backup coverage, capacity, networking,
   permissions, runbook accuracy, database integrity, host-file recovery, or
   application compatibility.
5. Assign an owner and due date, fix the cause, and rerun the failed drill
   portion or the full drill as risk requires.

### 8.3 Multi-AZ escalation

Single-AZ is acceptable only while the four-hour RTO remains valid. Start a
Multi-AZ architecture review if:

- the required RTO tightens toward minutes;
- two drills fail the four-hour RTO;
- measured restore growth leaves insufficient safety margin;
- business impact requires automatic failover or materially higher
  availability; or
- a Single-AZ incident exposes unacceptable recovery risk.

Multi-AZ reduces failover time but does not replace automated backups, manual
pre-migration snapshots, isolated PITR drills, or non-database backups.
