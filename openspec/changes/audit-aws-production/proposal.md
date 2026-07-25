## Why

The production EC2 environment and its deployment process are not documented well enough to update the application without risking service interruption, runtime-data loss, or ambiguity about which branch represents production. Before launch, the project needs an evidence-based infrastructure baseline and one release source of truth.

## What Changes

- Inventory the production EC2 host, networking, storage, processes, ports, service manager, web server, installed runtimes, repository checkout, and startup commands without recording secret values.
- Record the locations and persistence expectations for relational data, JSONL datasets, embeddings, uploads, and logs.
- Confirm whether the current public IPv4 address is elastic or ephemeral and document the repository visibility and deployment authentication category.
- Replace the permanent `frontend-base` promotion workflow with `main` as the sole production and feature-branch baseline.
- Define required pull-request checks, manual deployment authority, deployment verification, and an emergency hotfix path.
- Treat domain and HTTPS setup as follow-up work; permit IP-based HTTP only as a temporary internal validation route, not the intended public launch endpoint.

## Capabilities

### New Capabilities

- `production-environment-baseline`: Defines the required, secret-safe evidence for the AWS production environment, runtime services, data locations, and deployment readiness.

### Modified Capabilities

- `development-release-branch-workflow`: Changes the development baseline and release source of truth from `frontend-base` promotion to pull requests directly into production branch `main`.

## Impact

- Adds operational inventory and release-policy documentation; no application behavior or API is changed by this proposal.
- Affects the AWS EC2 production host, GitHub branch policy, deployment procedure, service restart/verification procedure, and handling of persistent runtime data.
- Requires read-only AWS/EC2 inspection first; any later infrastructure or GitHub configuration mutation must be separately authorized and verified.
