## Why

The production branch contains committed merge-conflict markers, generated delivery artifacts, and a backend state that cannot start on the live host. Before the remaining launch work can proceed, `main` needs one reproducible, validated application baseline that preserves production data and records exactly what is safe to deploy.

## What Changes

- Reconcile the incorrectly resolved admin merge so the intended launch-v1 frontend and backend are complete and contain no conflict markers.
- Remove generated, dependency, delivery, and runtime artifacts from release scope while preserving required production data outside Git.
- Make `main` the sole production baseline and require the agreed pull-request validation path instead of another merge from the stale `feature/admin` or `frontend-base` refs.
- Define clean-environment frontend and backend verification gates, including frontend install/lint/test/build and backend test/import/startup checks.
- Record the accepted baseline commit, known limitations, rollback point, and deployment-data safeguards.

## Capabilities

### New Capabilities

- `production-release-baseline`: Defines launch-v1 scope reconciliation, clean-environment verification, baseline recording, and deployability requirements for `main`.

### Modified Capabilities

- `development-release-branch-workflow`: Replaces the legacy `frontend-base` promotion path with feature/fix branches and validated pull requests directly into `main`.
- `local-runtime-data-preservation`: Extends preservation requirements to production cleanup and deployment so tracked artifacts can be removed without deleting or overwriting persistent host data.

## Impact

- Affected application areas include the frontend admin console and the backend admin, state, essay database, embedding, ingestion, file-extraction, import, and test modules involved in the broken merge.
- Repository hygiene changes affect root dependencies, `_aws_delivery`, graph-analysis output, generated build output, ignore rules, and any tracked runtime data.
- Verification affects frontend Node/npm dependencies and scripts, backend Python dependencies and tests, FastAPI import/startup behavior, and the production systemd service contract.
- Release operations will use an explicitly recorded commit from `main`; production data backup and rollback evidence are required before deployment.
