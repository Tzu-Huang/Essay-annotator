## 1. Source and target inventory

- [x] 1.1 Record source and target commit IDs, branches, remotes, and working-tree status.
- [x] 1.2 Inventory tracked changes, untracked files, ignored files, runtime configuration, generated data, dependencies, and deployment artifacts without printing secret contents.
- [x] 1.3 Create a local preservation manifest with relative paths, categories, sizes, and hashes where practical.
- [x] 1.4 Create a recoverable local backup of all required ProjectVault-only files before changing the target.

## 2. Repository and branch setup

- [ ] 2.1 Verify the target clone points to the Essay-Annotator GitHub remote and is based on `frontend-base`.
- [ ] 2.2 Keep `feature/ZAC-66_migrate-essay-annotator-repo` local and verify that no push is configured or attempted during migration.
- [ ] 2.3 Preserve the target's full Git history and avoid importing ProjectVault outer-repository history.

## 3. Local state preservation

- [ ] 3.1 Preserve the pending local frontend change as a reviewed patch or local commit without pushing it.
- [ ] 3.2 Copy required `.env`, credentials, datasets, embeddings, generated files, dependencies, and deployment artifacts to the target or documented local backup.
- [ ] 3.3 Confirm copied secrets and sensitive data remain ignored and are not staged or included in OpenSpec, Cortex, or Linear documentation.
- [ ] 3.4 Compare the post-copy manifest with the source and record any intentional exceptions.

## 4. Path and runtime compatibility

- [ ] 4.1 Search code, scripts, Makefiles, frontend configuration, and deployment material for `repo/`, ProjectVault absolute paths, and case-sensitive path assumptions.
- [ ] 4.2 Correct migration-specific path references while preserving application behavior.
- [ ] 4.3 Recreate or verify backend and frontend dependencies from the new project root.

## 5. Validation and release workflow

- [ ] 5.1 Run backend tests and startup smoke checks from the target root.
- [ ] 5.2 Run frontend tests, build checks, and startup smoke checks from the target root.
- [ ] 5.3 Verify the feature-to-`frontend-base` workflow and the validated promotion path to `main`.
- [ ] 5.4 Confirm no unintended secrets or local-only files are staged and no GitHub mutation occurred.

## 6. Legacy cleanup gate

- [ ] 6.1 Record validation evidence and confirm the target is usable as the rollback replacement.
- [ ] 6.2 Obtain explicit cleanup confirmation after validation passes.
- [ ] 6.3 Archive or remove the legacy ProjectVault `repo/` only as a separate final operation.
