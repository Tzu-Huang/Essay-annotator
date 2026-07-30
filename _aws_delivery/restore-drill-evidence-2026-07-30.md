# RDS restore drill evidence — 2026-07-30

## Result

- Drill reference: `ZAC-85-2026-07-30`
- Responsible operator: Zackery
- Overall result: **PASS**
- Region: `us-east-1`
- Engine: Amazon RDS for PostgreSQL `17.10`
- Recovery class: `db.t4g.micro`, Single-AZ
- Restore target: isolated, private, encrypted, non-production
- Temporary restore instance and drill security group: deleted after validation

This record intentionally omits account numbers, resource identifiers, endpoint
hostnames, subnet/security-group identifiers, credentials, connection strings,
secret references, and raw production rows.

## Recovery objectives

| Check | Evidence | Result |
| --- | --- | --- |
| Selected recovery point UTC | `2026-07-30T03:54:42Z` | recorded |
| Drill start UTC | `2026-07-30T03:59:10.3935117Z` | recorded |
| Validation complete UTC | `2026-07-30T05:04:14.2338584Z` | recorded |
| RPO duration | approximately 4 minutes 28 seconds | PASS (`<= 24 hours`) |
| RTO duration | approximately 1 hour 5 minutes 4 seconds | PASS (`<= 4 hours`) |

## Validation

| Check | Evidence | Result |
| --- | --- | --- |
| Private placement | No public endpoint; drill-only PostgreSQL access from the EC2 validation host | PASS |
| Encryption | Restored RDS storage reported encrypted | PASS |
| Schema | All five expected application tables present | PASS |
| Row counts | users `3`, essays `219`, essay embeddings `0`, admin audit logs `1`, usage events `193` | PASS |
| Representative record | Essay identifier SHA-256 matched production: `a5ea7cd2a1b6cc065cc10d62614ea1a8a249cee9b30d212e56afa5254268d081` | PASS |
| Backend connectivity | Production backend virtual environment connected through SQLAlchemy from the EC2 validation host | PASS |
| Representative read | Ordered essay lookup completed against the restored database | PASS |
| Production isolation | Production service configuration was not pointed at the drill target | PASS |
| Cleanup | Drill env, scripts, RDS instance, and security group removed | PASS |

## Authoritative host-file restore validation

The recovery drill was extended after review to cover the non-database state
that remains authoritative.

| Check | Evidence | Result |
| --- | --- | --- |
| Backup completed UTC | `2026-07-30T05:35:24Z` | recorded |
| Isolated restore start UTC | `2026-07-30T05:36:16Z` | recorded |
| Isolated validation complete UTC | `2026-07-30T05:36:19Z` | recorded |
| File RPO | approximately 52 seconds | PASS (`<= 24 hours`) |
| File restore duration | approximately 3 seconds | PASS (`<= 4 hours`) |
| Destination controls | Private S3, public access blocked, default AES-256 encryption, versioning enabled | PASS |
| Retention | Current and noncurrent daily backup versions expire after 30 days | PASS |
| Integrity | Downloaded SHA-256 sidecar verified the archive | PASS |
| Archive validation | Archive parsed and extracted into a mode `0700` isolated temporary directory | PASS |
| Restored inventory | 194 files, 42,449,309 bytes | PASS |
| Authoritative JSONL | `database.jsonl` 219 rows; `embed.jsonl` 514 rows | PASS |
| Restored permissions | Directories normalized to `0750`; files normalized to `0640` | PASS |
| Cleanup | Isolated restore directory removed automatically after validation | PASS |

The complete recovery objective remains governed by the slower RDS drill:
approximately 4 minutes 28 seconds RPO and 1 hour 5 minutes 4 seconds RTO.

## Production cutover evidence

- Source PostgreSQL remained unchanged during the initial copy.
- Backend writes were stopped for the final synchronized copy.
- Source and target counts matched before cutover.
- An encrypted manual pre-cutover snapshot reached `available`.
- The systemd service consumes a root-owned mode `0600` environment file outside
  the release directory.
- A root-owned mode `0600` pre-RDS rollback environment file remains available.
- The release-directory `.env` was removed after successful readiness checks.
- Production `/health` reported ready with 219 essays and no startup error.
- Production `/ready` returned HTTP 200 with 219 essays.
- Production database schema, counts, and representative read validation passed.
- Production `ESSAY_DATA_ROOT` points to
  `/var/lib/essay-annotator/drive_data`, outside the release checkout.
- The checkout `BackEnd/drive_data` path is a compatibility symlink to the
  stable root; stable directories are `0750` and files are `0640`.
- The authoritative-file backup timer is enabled and active, and its immediate
  first run plus isolated restore validation passed.

## Follow-up

- Repeat the drill quarterly and retain the same secret-safe evidence fields.
- Review measured restore duration as data grows; begin a Multi-AZ review if two
  drills breach the four-hour RTO or the safety margin becomes insufficient.
- Keep the USD 18 monthly RDS budget alerts active and review forecasted
  overages before increasing instance or storage capacity.
