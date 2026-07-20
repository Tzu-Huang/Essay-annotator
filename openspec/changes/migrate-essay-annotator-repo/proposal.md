## Why

Essay Annotator is currently stored inside the legacy ProjectVault repository under a `repo/` container, while the actual project has its own GitHub repository and remote. This change establishes a standalone local project root that preserves the existing GitHub history, the required local runtime/data state, and the agreed development-to-release branch workflow without modifying GitHub during migration.

## What Changes

- **BREAKING**: Move the active project root from `10-active/essay-annotator/repo/` to `C:\Personal_repo\Projects\essay-annotator` so project commands no longer depend on the legacy `repo/` container.
- Preserve the GitHub-linked repository history and use `frontend-base` as the development and integration baseline.
- Reserve `main` for release-ready changes; feature branches merge into `frontend-base` before promotion to `main`.
- Inventory and preserve ignored, untracked, runtime, generated-data, and deployment files locally without adding secrets to Git or pushing migration changes automatically.
- Add migration validation for repository remote/branch state, local data presence, backend/frontend startup, and path compatibility on case-sensitive environments.
- Keep the ProjectVault source until validation passes, then perform the approved legacy cleanup as a separate final step.

## Capabilities

### New Capabilities

- `standalone-repository-layout`: Run Essay Annotator from its own project root with the existing GitHub remote and history.
- `local-runtime-data-preservation`: Preserve required ignored and untracked configuration, credentials, datasets, generated artifacts, and deployment files locally without tracking them.
- `development-release-branch-workflow`: Use `frontend-base` for development/integration and `main` for validated releases.
- `migration-validation`: Verify source preservation, repository identity, data completeness, application startup, and safe cleanup gates.

### Modified Capabilities

<!-- No existing OpenSpec capabilities are defined in this repository. -->

## Impact

- Repository layout under `C:\Personal_repo\Projects\essay-annotator` and the legacy ProjectVault source path.
- Git branch and remote configuration; no GitHub push, force-push, mirror-push, or history rewrite is part of this change.
- Backend and frontend startup commands, working-directory assumptions, relative paths, build/test commands, and AWS deployment scripts that may refer to `repo/` or case-sensitive paths.
- Local runtime configuration and data locations, including `.env`, credentials, datasets, embeddings, generated files, and deployment artifacts.
- Separate security follow-up for the existing secrets archive in Git history; secret values are not included in this proposal.
