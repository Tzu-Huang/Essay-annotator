## Context

Essay Annotator currently exists in two layers: the ProjectVault outer repository stores a legacy snapshot under `10-active/essay-annotator/repo/`, while the nested repository has its own Git history and remote at `https://github.com/Tzu-Huang/Essay-annotator.git`. The target project has now been cloned locally at `C:\Personal_repo\Projects\essay-annotator` from `frontend-base` on a proposal branch.

The source working tree contains local-only configuration, credentials, generated data, runtime directories, deployment artifacts, and one uncommitted frontend change. The migration must preserve these files locally while preventing accidental Git tracking or GitHub writes. The source must remain available until the target passes validation.

## Goals / Non-Goals

**Goals:**

- Establish the target project root as the standalone GitHub-linked repository.
- Preserve all identified local state, including ignored and untracked files, with a manifest and rollback path.
- Keep `frontend-base` as the development and integration baseline and `main` as the release branch.
- Remove assumptions that commands or deployment scripts run from a legacy `repo/` directory.
- Validate repository identity, data completeness, application startup, and case-sensitive path compatibility before cleanup.

**Non-Goals:**

- No GitHub push, force-push, mirror-push, history rewrite, release, or remote-branch mutation.
- No product feature redesign or unrelated refactoring.
- No automatic deletion or reset of ProjectVault source data.
- No publication of secrets, credentials, PHI, or private data in Git, Cortex memory, or Linear.
- No assumption that the existing secrets archive is safe; its credential-rotation review is a separate security action.

## Decisions

### 1. Use a fresh clone as the repository baseline

The target is based on a fresh, non-shallow clone of `frontend-base`. This preserves the Essay-Annotator repository history and remote without importing the ProjectVault outer repository history. Copying the nested `.git` directory is an acceptable recovery option but would preserve the shallow and potentially stale local repository state.

### 2. Preserve local state through inventory and selective placement

Before copying, enumerate tracked changes, untracked files, ignored files, file sizes, and hashes without printing secret contents. Every required local-only file will be preserved either at its target relative path or in a local migration backup. Secrets remain ignored and are never staged; generated dependencies may be rebuilt for validation but their original copies remain preserved.

### 3. Keep the branch workflow local and explicit

Development work starts from `frontend-base`. Feature branches merge into `frontend-base` and are tested there. Only a validated state is promoted to `main` as a release. The migration branch is local until the user explicitly authorizes publication.

### 4. Treat path and casing changes as compatibility work

Search source, scripts, Makefiles, frontend configuration, and deployment material for `repo/`, absolute legacy paths, and case-sensitive path assumptions. Apply only migration-required path corrections and verify the resulting commands from the new project root on Windows and in Linux/AWS-compatible checks where available.

### 5. Gate legacy cleanup on validation

ProjectVault remains the rollback source until repository, data, runtime, and smoke-test checks pass. Cleanup is a separate final task and must not run as part of the initial copy or validation failure path.

## Risks / Trade-offs

- [Secret exposure] The repository history contains an `essay-annotator-secrets` archive. Keep its contents out of new commits and perform credential rotation separately.
- [Ignored data is incomplete in a clone] A clone omits local-only files. Use an inventory, backup, and post-copy hash comparison.
- [Working-tree divergence] ProjectVault outer changes are not equivalent to the nested repository history. Use the nested Git repository and explicitly preserve its pending change.
- [Windows/Linux casing] `frontend` and `Frontend` may behave differently across environments. Use tracked path names consistently and verify deployment commands.
- [Large generated files] Runtime directories and deployment archives can make validation and backups expensive. Record them in the manifest and avoid creating duplicate tracked copies.
- [Accidental GitHub mutation] A local branch can still track `origin`. Keep the migration branch unpushed and verify remotes before any future push.

## Migration Plan

1. Capture source refs, working-tree state, tracked/untracked/ignored inventory, and a local backup manifest.
2. Verify the target clone, remote, `frontend-base` baseline, and local migration branch.
3. Preserve the pending code change and copy all required local-only files to the target or a documented local backup, keeping secrets untracked.
4. Search and repair legacy `repo/` and absolute-path assumptions; preserve application behavior.
5. Recreate or verify dependencies, run backend and frontend checks, compare data manifests, and verify branch/remote state.
6. Record verification evidence. Only after all gates pass, request and perform the separate ProjectVault cleanup.

Rollback is to stop using the target and continue from the untouched ProjectVault source. No source reset or deletion is required for rollback; any target-only changes remain local until explicitly reviewed.

## Open Questions

- Which local data should remain inside the target tree versus a separate local data/secrets directory after validation?
- Should the existing deployment archives remain in the working tree, or be preserved only in the migration backup?
- Which credential rotation and Git history remediation plan is approved for the existing secrets archive?
