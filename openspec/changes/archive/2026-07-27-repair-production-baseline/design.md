## Context

`origin/main` and `frontend-base` currently point to merge commit `1d335dd`, whose tree contains committed conflict markers across backend source, requirements, scripts, and tests. The live EC2 checkout runs that commit and its systemd backend service fails during import. The merged `feature/admin` ref is an ancestor of `main`, so merging it again cannot repair the result; the two merge parents and the intended launch behavior must be reconciled semantically.

The same baseline tracks root dependencies, delivery archives, and graph-analysis output. Those repository artifacts must be separated from persistent production PostgreSQL, JSONL, embedding, upload/import, and operational data. The production host has no Node.js runtime or reverse proxy, so clean build verification occurs before deployment and serving/deployment changes remain separately scoped.

## Goals / Non-Goals

**Goals:**

- Produce a complete launch-v1 application tree on a branch based on `main`.
- Remove all committed conflict markers and restore backend import/startup.
- Establish deterministic frontend and backend validation from clean environments.
- Remove accidental generated/runtime artifacts from Git without deleting production data.
- Merge through a reviewed pull request and record the accepted baseline and rollback commit.

**Non-Goals:**

- Deploying to or modifying the production EC2 host.
- Configuring DNS, HTTPS, a reverse proxy, Elastic IP, Security Groups, or GitHub branch protection.
- Redesigning admin functionality beyond reconciling the intended merged behavior.
- Rotating credentials or rewriting Git history for previously committed sensitive archives.
- Deleting `frontend-base` before dependency checks authorize its retirement.

## Decisions

### Reconcile the merge instead of re-merging a branch

Implementation will start from `main` and compare merge commit `1d335dd` with both parents, including `feature/admin`, on every conflicted application file. Each resolution must preserve intended admin functionality and current baseline behavior, with targeted tests added or restored where ambiguity exists.

Re-merging `feature/admin` was rejected because it is already an ancestor of `main`. Reverting the whole merge was rejected because it would also discard launch-relevant admin and ingestion work.

### Define launch v1 by verified behavior

Launch v1 includes the existing public essay workflow and the admin/ingestion behavior represented by the merge, provided it passes the defined frontend and backend gates. Material functionality that cannot be reconciled and verified within this change must be explicitly deferred in the baseline limitations rather than silently removed.

Treating the current merge tree as authoritative was rejected because its conflict markers make it neither executable nor reproducible.

### Separate repository cleanup from host-data cleanup

Generated dependencies, build products, delivery tarballs, graph reports, caches, and local runtime outputs will be removed from Git and covered by ignore rules. Text documentation or manifests may remain only when they contain no secrets and are useful operational records. Implementation must inventory production-persistent paths and record a backup/restore check before any later deployment; repository deletion must not be translated into deletion of host data.

Keeping binary archives in Git was rejected because they obscure release scope and are not a durable backup policy. Deleting matching production paths was rejected because Git hygiene does not authorize data destruction.

### Validate clean, pinned inputs

Frontend validation will use the committed lockfile with a clean install followed by lint, tests, and production build. Backend validation will use a clean Python environment, install committed requirements, run the complete test suite, verify application imports, and perform a bounded startup/readiness check without production credentials or data mutation.

Validation against an existing dependency directory was rejected because tracked root `node_modules` can hide undeclared or incompatible dependencies.

### Promote one reviewed commit to `main`

The feature branch will be reviewed and merged through the agreed pull-request flow. The merged `main` SHA, tested source SHA, known limitations, and previous production SHA will be recorded. Deployment remains a later explicitly authorized action using that exact selected commit.

## Risks / Trade-offs

- **[Merge intent is ambiguous]** → Compare both merge parents, require targeted behavioral tests, and explicitly defer unresolved functionality.
- **[Clean environments reveal undeclared dependencies]** → Treat dependency failures as baseline defects and update only committed manifests/lockfiles.
- **[Artifact cleanup removes useful operational evidence]** → Keep secret-safe text manifests where justified and move binary/runtime backups to an external preservation location.
- **[Repository cleanup is mistaken for production cleanup]** → Require separate production inventory and backup evidence; do not run host deletion or deployment in this change.
- **[ZAC-82 policy artifacts are not yet on `main`]** → Make this change self-contained against current `main`; reconcile overlapping specs during later PR integration if necessary.
- **[Local `main` differs from `origin/main`]** → Record the branch base and ensure the final PR shows only intended repository instructions, proposal, and repair commits.

## Migration Plan

1. Record the source branch, merge parents, current production SHA, and persistent-data inventory.
2. Reconcile conflicted source and dependency files with targeted tests.
3. Remove generated/runtime artifacts from tracking and add precise ignore rules.
4. Run clean frontend and backend verification; record the tested SHA and limitations.
5. Complete review and merge the approved commit through a pull request to `main`.
6. Record the merged baseline SHA and previous production SHA as the rollback point.
7. In a separately authorized deployment step, back up persistent data, deploy only the recorded baseline, verify readiness, and roll back code without overwriting data if checks fail.

## Open Questions

- Whether secret-safe `_aws_delivery` text documentation remains useful after its binary archives are removed.
- Which admin behaviors, if any, must be explicitly deferred after semantic reconciliation and clean validation.
