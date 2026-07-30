# Essay Annotator AWS delivery (2026-07-15)

Target host: `ubuntu@44.201.62.0`

Target directory: `/home/ubuntu/Essay-annotator`

Backend service: `essay-api.service`

Production persistence and recovery controls:

- `runtime-data-inventory.md` classifies mutable data, credentials, and
  reproducible outputs and assigns release-independent runtime paths.
- `production-recovery-runbook.md` defines the RDS, secret provisioning,
  migration, backup, rollback, and quarterly restore-drill gates.
- `restore-drill-evidence-2026-07-30.md` records the first secret-safe production
  cutover and isolated PITR restore result.

## Local-only delivery files

- `essay-annotator-app-20260715.tar.gz`
  - Application source and configuration files.
  - Includes the ignored, pre-built `frontend/dist` directory.
  - Does not contain Git metadata, dependencies, caches, runtime data, or secrets.
  - Preserved outside Git and ignored by `_aws_delivery/*.tar.gz`.
- `essay-annotator-data-20260715.tar.gz`
  - Contains the complete ignored `BackEnd/drive_data` tree, including the runtime database and embeddings.
  - Preserved outside Git and ignored by `_aws_delivery/*.tar.gz`.
- `SHA256SUMS.txt`
  - SHA-256 hashes for verifying the application and data archives after transfer.
- `excluded-files.txt`
  - Local-only or reproducible content intentionally omitted.

The archive binaries are not release-source artifacts and are no longer tracked. `SHA256SUMS.txt` remains as secret-safe verification evidence for an authorized local or external copy. The data archive is a dated point-in-time copy, not a current backup policy; verify or create a newer backup before deployment.

## Intentionally excluded

- `.git`: the AWS checkout already has its own Git metadata and GitHub remote.
- `.venv`: the local environment is Windows-specific; AWS already has a Linux virtual environment.
- `node_modules` and `frontend/node_modules`: reproducible from lock files and platform-dependent.
- Python caches, test caches, logs, editor metadata, `.codex`, `.agents`, and OpenSpec working files.
- Root `template` design prototypes and the local proposal-feedback note; these are not runtime inputs.
- Runtime secrets and credential archives are supplied from an approved secure secret store and are never repository payloads.
- `C:\aws\Fb021451.pem`: SSH private keys are never deployment payloads.

## Suggested transfer

Run from `C:\Personal_repo\Projects\essay-annotator` in PowerShell:

```powershell
scp -i "C:\aws\Fb021451.pem" `
  ".\_aws_delivery\essay-annotator-app-20260715.tar.gz" `
  ".\_aws_delivery\essay-annotator-data-20260715.tar.gz" `
  ".\_aws_delivery\SHA256SUMS.txt" `
  ubuntu@44.201.62.0:/home/ubuntu/incoming-essay-annotator/
```

Do not extract directly over production. A production update requires a current persistent-data backup, an explicitly selected commit from `main`, and a data-preserving rollback plan.
