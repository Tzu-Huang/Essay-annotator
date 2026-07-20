# Migration validation evidence

Recorded: 2026-07-20

## Repository and preservation gates

- Target: `C:\Personal_repo\Projects\essay-annotator`
- Legacy source: `C:\Personal_repo\ProjectVault\10-active\essay-annotator\repo`
- Local backup: `C:\Personal_repo\Projects\essay-annotator-migration-backup-20260720`
- Remote: `https://github.com/Tzu-Huang/Essay-annotator.git`
- Validation branch: `feature/ZAC-66_migrate-essay-annotator-repo`
- Baseline: `frontend-base`; `origin/main` is an ancestor of `frontend-base`, and `frontend-base` is an ancestor of the validation branch.
- Source and target preservation manifests were compared with zero recorded differences; the backup contains the source and target manifests and SHA256 records.
- The target working tree is clean before cleanup. Local-only `.env`, dependency, and build-output paths remain ignored and unstaged.
- No GitHub push or branch mutation was performed during migration.

## Application checks

- Backend: 18 tests passed; `/health` smoke check passed; 219 essays loaded.
- Frontend lint: passed.
- Frontend tests: 12 passed.
- Frontend production build: passed (`vite`, 1,826 modules transformed).
- Frontend startup smoke: passed with HTTP 200 from the Vite entry page.

## Cleanup decision

The legacy source is archived, not deleted, at
`C:\Personal_repo\ProjectVault\30-archived\essay-annotator-repo-20260720` so rollback remains recoverable.

No secret values or private runtime data are included in this record.
