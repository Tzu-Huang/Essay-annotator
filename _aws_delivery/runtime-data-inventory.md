# Runtime data inventory and production placement

This inventory defines the mutable-state boundary for production releases. Release
directories are immutable and replaceable; no item below may rely on a path inside
the checked-out application tree.

Baseline decisions: RDS PostgreSQL Single-AZ is the production database, recovery
point objective (RPO) is 24 hours, recovery time objective (RTO) is 4 hours, and
recoverable backups are retained for 30 days. Suggested filesystem paths assume
the service account is `essay-api`, group `essay-ops`, and the persistent root is
`/var/lib/essay-annotator`. Directories should be `0750` unless noted.

## Inventory

| Data class and current evidence | Authority / production treatment | Stable production location | Owner and minimum permissions | Backup / retention | Recovery action |
|---|---|---|---|---|---|
| PostgreSQL (`POSTGRES_URL`; users, essays, essay embeddings, admin audit records, usage events) | **Authoritative production system of record.** The application loads essays from it first. Audit records can include essay snapshots and require the same protection as essay content. | AWS RDS PostgreSQL in private subnets; no local database files. Connection material belongs in the secret location below. | RDS resource owned by platform/AWS account; application role gets only required schema DML, migration role is separate. No public access. | RDS automated backups/PITR, 30-day retention; manual snapshot before migration; quarterly isolated restore drill. | Restore to a new isolated RDS instance, validate schema and representative counts/reads, then change the application secret/endpoint through the documented cutover. Do not overwrite the damaged instance in place. |
| SQLite fallback (`BackEnd/app_data.db`) | **Non-production only.** Code selects it whenever `POSTGRES_URL` is absent, so production startup must fail rather than silently use it. If a production instance ever writes it, treat that file as authoritative incident data until reconciled into RDS. | Development: outside releases, for example `/var/lib/essay-annotator/dev/app_data.db`. Production: prohibited. | `essay-api:essay-ops`, file `0640`; parent `0750`. | No planned production backup. During an accidental fallback incident, immediately take an encrypted copy and retain 30 days after reconciliation. | Stop writes, copy the database consistently, import/reconcile rows into RDS, verify counts and timestamps, then remove the fallback from service use. |
| `database.jsonl` (`BackEnd/drive_data/finalized_data_jsonl/database.jsonl`) | **Authoritative compatibility/source artifact until the fallback and append/import paths are retired.** Startup reads it when the database has no essays, and admin import appends new records before importing them into SQL. Therefore it is not currently proven disposable even though RDS is the intended system of record. | `/var/lib/essay-annotator/source-data/finalized/database.jsonl` | `essay-api:essay-ops`, `0640`; atomic/locked writes required. | Encrypted daily filesystem/object backup, 30 days; also preserve a pre-import copy. | Restore the matching file version, validate JSONL parsing and IDs, reconcile against restored RDS, then reload application runtime state. Never blindly append a backup to a newer file. |
| `embed.jsonl` (`BackEnd/drive_data/embed_output/embed.jsonl`) | **Operationally authoritative search index for now.** Runtime startup reads vectors from this file even though SQL also contains `essay_embeddings`. Regeneration code exists, but full rebuild fidelity is not proven: it needs complete essay inputs, the configured embedding model/API, successful calls, and consistent chunking; generated vectors can also change across model revisions. Do not classify it as a disposable cache yet. | `/var/lib/essay-annotator/reproducible/embed.jsonl` | `essay-api:essay-ops`, `0640`; atomic replacement and a single writer. | Encrypted daily backup, 30 days; preserve with the corresponding RDS/`database.jsonl` recovery point. | Restore the version paired with the database, load it in isolation, verify parent IDs and embedding coverage, then reload runtime state. Regenerate only as a controlled repair and compare coverage before cutover. |
| Ingestion source/archive files (`drive_data/new_input`, `organized_data`, `essays_jsonl`, including processed DOCX/TXT) and export checkpoint JSON | **Authoritative provenance until a complete external source and deterministic replay are proven.** Some material may originate in Google Drive, but local transforms, processed moves, generated text, and checkpoint state mean the repository alone does not prove lossless reconstruction. | `/var/lib/essay-annotator/source-data/ingest/{incoming,processed,organized,checkpoints}`; object storage is preferred for durable originals. | Ingest worker/`essay-api:essay-ops`; files `0640`; directories `0750`; write access limited to ingest workers. | Encrypted daily incremental backup/object versioning, 30 days minimum. Retain original source objects per the product's privacy/retention policy; checkpoints may use 30 days after a successful verified import. | Restore originals and checkpoints, reconcile filenames/source IDs with RDS, replay only missing items into an isolated target, then promote after duplicate and count checks. |
| Admin HTTP uploads (`/admin/essays/upload-drafts`) | **Ephemeral input by current design.** The server reads bytes in memory, extracts drafts, returns them to the browser, and writes no essay row until a reviewed draft is saved. There is no proven server-side upload directory to recover. The saved essay row in RDS is authoritative. | No persistent local path. If future requirements retain originals, use a private encrypted object-store prefix, not a release directory. | Process memory only; future object access restricted to `essay-api` and operators. | None for current transient bytes. RDS backup covers saved reviewed content. Future original retention needs an explicit privacy policy. | User re-uploads an unsaved draft. For saved drafts, restore RDS. Do not claim the original binary is recoverable. |
| OAuth client file and refresh token (`BackEnd/client_secret.json`, `BackEnd/token.json`) | **Secret configuration, not business data.** `token.json` is mutable and can grant Drive access; both must be excluded from builds, logs, and ordinary backups. | `/etc/essay-annotator/google/client_secret.json` and `token.json`, or preferably AWS Secrets Manager. Secret directory `0700`. Code/config must explicitly reference the stable location. | `essay-api:essay-api`, files `0600`; platform administrators manage rotation. | Prefer no general filesystem backup: keep client configuration in the secret manager and re-authorize/reissue the token. If encrypted secret backup is mandated, use a separate restricted vault with audited access and rotation-aware retention. | Revoke a suspected token, restore client configuration from the secret manager, perform authorized OAuth consent again, write the new token with `0600`, and verify least-privilege Drive access. |
| Application environment secrets (`POSTGRES_URL`, OpenAI key, OAuth/admin configuration, AWS settings) | **Secret configuration.** Values must never be copied into this inventory, a release archive, Git, command output, or application logs. | Prefer AWS Secrets Manager/SSM Parameter Store via instance role. Transitional file: `/etc/essay-annotator/production.env`. | `root:root`, file `0600` read by the root-owned service manager; secret-manager IAM grants only named secret reads. | Secret-manager version history according to rotation policy; do not include plaintext in general backups. | Rotate/reissue, update the managed secret, restart the service through the normal deployment procedure, and verify logs contain no values. |
| Technical logs (service stdout/stderr, deployment logs, CloudWatch log group) | **Operational evidence, not a data recovery source.** Logs may contain identifiers, essay fragments, URLs, or error context; minimize and redact. Business audit history remains in PostgreSQL. | CloudWatch Logs; short local spool only at `/var/log/essay-annotator` when required. | `essay-api:essay-ops`, local files `0640`; CloudWatch write-only application role and restricted operator reads. | CloudWatch retention 30 days initially; local rotation daily with no more than 7 days. Do not back up local rotated logs separately. | Restore service from database/data backups; use retained CloudWatch events for diagnosis. Logs must not be used to reconstruct secrets or essay records. |
| Explicit exports and reports generated for operators/users | **Derived unless the export is the only delivered record.** Because no complete export lifecycle is proven, preserve requested exports through their delivery window and never use them as the system of record. | `/var/lib/essay-annotator/exports`, preferably private object storage with expiry. | Export worker/`essay-api:essay-ops`, files `0640`; per-object access control for recipients. | Default 7-day expiry, or the documented product retention requirement; no separate backup when reproducible from RDS. | Regenerate from the restored authoritative RDS snapshot. If exact historical output is legally required, retain the encrypted object and its source recovery-point metadata explicitly. |
| Query embeddings and result files (`drive_data/query_embed/query_embeddings.jsonl`, `drive_data/results/results.jsonl`) | **Disposable request artifacts/cache.** Standalone scripts overwrite them and production request search computes results in memory. They can contain user query text or derived previews, so persistence increases privacy risk. | Prefer memory or `/var/lib/essay-annotator/tmp` with `0700`; do not place in release or durable data paths. | `essay-api:essay-api`, files `0600`. | No backup; delete after the request/job, with a maximum 24-hour TTL for crash residue. | Recompute from the user's request and the restored essay/embedding stores. If unavailable, return a retryable result rather than restoring stale output. |
| Python/npm/test caches and other generated temporary state | **Disposable.** Excluded from delivery and never an authority. | OS/service private temporary directory or release-local build cache that can be deleted with the release. | Service/build user only; `0700` directories. | No backup; bounded TTL. | Recreate by installing/building/running the application. |

## Evidence and unresolved authority boundaries

- `BackEnd/database/create.py` selects PostgreSQL only when `POSTGRES_URL` is
  present and otherwise creates `BackEnd/app_data.db`. Production therefore needs
  a deployment guard; directory separation alone does not prevent silent SQLite
  fallback.
- `BackEnd/app/main.py` loads essays from SQL first, falls back to
  `database.jsonl` when SQL returns no essays, and always loads search vectors from
  `embed.jsonl`.
- `BackEnd/app/admin.py` appends imports to `database.jsonl`, imports those rows
  into SQL, writes embeddings to SQL, and also appends to `embed.jsonl`. These dual
  writes are why neither JSONL file is safely disposable today.
- `BackEnd/embedding/make_embedding.py` can generate `embed.jsonl` from
  `database.jsonl`, and admin regeneration can rebuild an essay's vectors. This
  proves a rebuild mechanism exists, but not that every production vector can be
  rebuilt within the four-hour RTO or reproduced exactly after model/API changes.
- `BackEnd/scripts/export_docs_to_txt.py` exports external documents, writes local
  text, and maintains checkpoint JSON. `BackEnd/scripts/add_to_database.py` also
  moves processed inputs. Until an isolated end-to-end replay is demonstrated,
  originals, transforms, and checkpoints remain recovery inputs.
- `BackEnd/app/admin.py`'s upload-drafts endpoint reads each upload into memory and
  explicitly writes no essay rows. It does not prove durable recovery of the
  uploaded binary.
- Legacy scripts contain repo-relative constants. Moving data physically without
  first making paths configurable or mounting the stable paths at those expected
  locations will break startup/import/search; that implementation work is outside
  this inventory.

## Release boundary acceptance check

Before a production deployment, verify that RDS connectivity succeeds, no
production SQLite file is opened, every required stable path resolves outside the
release directory, secrets have the permissions above, and the service account can
write only the mutable paths it owns. A release rollback must switch application
code without replacing, deleting, or rewinding any shared data path.
