# Migration validation evidence

Recorded: 2026-07-20

## Repository and preservation gates

- Target: `C:\Personal_repo\Projects\essay-annotator`
- Legacy source: `C:\Personal_repo\ProjectVault\10-active\essay-annotator\repo`
- Local backup: `C:\Personal_repo\Projects\essay-annotator-migration-backup-20260720`
- Remote: `https://github.com/Tzu-Huang/Essay-annotator.git`
- Validation branch: `feature/ZAC-66_migrate-essay-annotator-repo`
- Baseline: `frontend-base`; `origin/main` is an ancestor of `frontend-base`, and `frontend-base` is an ancestor of the validation branch.
- For the required runtime/data preservation set, source and target manifests had zero file-size or SHA256 differences; the backup contains the source and target manifests and SHA256 records.
- The source manifest has 12 intentional source-only workflow paths that were not copied into the standalone target: `.codex\skills\openspec-apply-change\SKILL.md`, `.codex\skills\openspec-archive-change\SKILL.md`, `.codex\skills\openspec-explore\SKILL.md`, `.codex\skills\openspec-propose\SKILL.md`, `openspec\changes\add-developer-admin-console\.openspec.yaml`, `openspec\changes\add-developer-admin-console\design.md`, `openspec\changes\add-developer-admin-console\proposal.md`, `openspec\changes\add-developer-admin-console\specs\admin-essay-management\spec.md`, `openspec\changes\add-developer-admin-console\specs\aws-log-observability\spec.md`, `openspec\changes\add-developer-admin-console\specs\developer-admin-access\spec.md`, `openspec\changes\add-developer-admin-console\specs\openai-usage-observability\spec.md`, and `openspec\changes\add-developer-admin-console\tasks.md`.
- The target working tree is clean before cleanup. Local-only `.env`, dependency, and build-output paths remain ignored and unstaged.
- No GitHub push or branch mutation was performed during migration.

## Application checks

- Backend: 18 tests passed; `/health` smoke check passed; 219 essays loaded.
- Frontend lint: passed.
- Frontend tests: 12 passed.
- Frontend production build: passed (`vite`, 1,826 modules transformed).
- Frontend startup smoke: passed with HTTP 200 from the Vite entry page.

## REV-001 security remediation

- On 2026-07-20, the Git history reachable from `main`, `frontend-base`, and
  `feature/ZAC-66_migrate-essay-annotator-repo` was rewritten to remove
  `_aws_delivery/essay-annotator-secrets-20260715.tar.gz` from every commit.
- The remote `main` and `frontend-base` refs were updated together with an
  atomic force-with-lease operation. Both remote refs now resolve to
  `4e167f42592a70afde0c483219b9eebb06b0d8dc`.
- Post-remediation checks found no path history for the archive on active refs,
  and the former archive blob is no longer present in the local object
  database after removal of temporary recovery refs, reflog expiration, and
  garbage collection.
- A filename/key-name-only audit identified credentials requiring rotation:
  an OpenAI API key, a PostgreSQL connection credential, a Google OAuth client
  secret, and Google OAuth access/refresh tokens. No credential values were
  printed or recorded. Provider-side rotation remains required before
  `REV-001` can be considered resolved.

### REV-001 risk acceptance

- On 2026-07-20, the user explicitly chose not to perform provider-side
  credential rotation as part of this migration and accepted the residual
  exposure risk.
- This decision does not establish that the credentials are safe, expired, or
  technically remediated. `REV-001` must not be described as `resolved` solely
  because of this acceptance; the next closure review may disposition it as
  `accepted-risk`.
- The migration backup remains local-only and must not be committed, uploaded,
  or used as evidence that credential exposure has been remediated.

## Cleanup decision

The legacy source is archived, not deleted, at
`C:\Personal_repo\ProjectVault\30-archived\essay-annotator-repo-20260720` so rollback remains recoverable.

No secret values or private runtime data are included in this record.
