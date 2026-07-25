## Context

The project is already running on an Ubuntu EC2 host reached as `ubuntu@44.201.62.0`, with the repository expected at `/home/ubuntu/Essay-annotator` and the backend managed by `essay-api.service`. Repository evidence also indicates persistent state in `BackEnd/drive_data`, a PostgreSQL-or-SQLite database choice, and journald with optional CloudWatch integration. These details have not yet been verified against the live host.

The existing release specification makes `frontend-base` the permanent development baseline. Today `main` and `frontend-base` point to the same commit, so the workflow can be simplified before they diverge again. The project owner is the deployment authority and the GitHub repository is public.

## Goals / Non-Goals

**Goals:**

- Produce a dated, secret-safe current-state inventory backed by read-only evidence from AWS and the EC2 host.
- Identify every production data location and the commands that start, stop, restart, and inspect the application.
- Establish `main` as the only production source of truth and document PR checks, manual deployment, verification, and hotfix handling.
- Separate confirmed facts from unknowns and follow-up work.

**Non-Goals:**

- Change EC2, Security Group, service, DNS, TLS, GitHub, or application configuration during the audit.
- Deploy application code or migrate production data.
- Store credentials, tokens, private-key contents, environment-variable values, or other secrets in Git, OpenSpec, or Linear.
- Purchase a domain or configure HTTPS; that work will be tracked separately.

## Decisions

### Store two operational documents

Implementation will create a production inventory and a release/deployment policy under `docs/operations/`. Keeping observed infrastructure facts separate from governance makes future inventory refreshes possible without reopening branch-policy decisions.

Alternative considered: keep all evidence only in Linear. Rejected because the repository is the durable context needed by future maintainers and deployments.

### Audit before mutation

AWS and host inspection will use read-only commands first. Evidence will cover instance metadata, network addressing, volumes, Security Group rules, processes, listeners, service definitions, web-server configuration, runtimes, repository state, startup commands, and data paths. Secret values will be redacted or represented only as configured/not configured.

Alternative considered: repair configuration while auditing. Rejected because it would blur the baseline and make rollback harder.

### Make `main` the sole release truth

New work branches from `main` and returns through pull requests to `main`. `frontend-base` will be frozen and can be deleted only after confirming that no automation or deployment procedure references it. Production deployments use an explicitly selected commit from `main`.

Alternative considered: retain `frontend-base` as an integration branch. Rejected because the current team size and manual deployment model do not justify a second long-lived source of truth.

### Use owner-authorized manual deployments initially

The project owner authorizes and performs production deployments. The policy will record the selected commit, protect runtime data, update the checkout, build/install as required, restart the managed service, and run post-deployment checks. Automation can be introduced later without changing the source-of-truth rule.

### Treat HTTP by IP as internal validation only

The current IP can be used temporarily to verify connectivity. Public launch should use a separately planned domain and HTTPS, particularly because the application includes Google sign-in and administrative functions.

## Risks / Trade-offs

- **[Remote checkout contains unique commits or local changes]** → Stop before updating production, preserve evidence, and reconcile the history in a separate reviewed step.
- **[Persistent data is mistaken for reproducible application content]** → Inventory paths, ownership, size, backup status, and Git-ignore status before documenting any deployment command.
- **[Public IP is ephemeral]** → Record whether an Elastic IP is associated and create follow-up work before relying on the address.
- **[Inspection exposes secrets]** → Avoid dumping environment files or credential stores; capture variable names and configured/not-configured status only.
- **[Freezing `frontend-base` disrupts hidden automation]** → Search repository, GitHub, and production deployment references before deletion; freeze first and delete later.
- **[HTTP validation is mistaken for launch readiness]** → Label it explicitly as temporary/internal and track domain plus HTTPS separately.

## Migration Plan

1. Capture local repository and GitHub baseline evidence.
2. Inspect AWS and EC2 using read-only commands and write the dated production inventory.
3. Reconcile observed startup commands and data locations with repository expectations.
4. Write the release/deployment policy with `main` as the sole source, required checks, owner authorization, verification, rollback, and hotfix flow.
5. Validate that no known workflow depends on `frontend-base`; document freeze/removal prerequisites.
6. Review both documents for secrets and unresolved claims before completing the change.

Rollback is documentation-only: revert the documentation commit if evidence is incorrect. No production mutation or branch deletion is part of this change.

## Open Questions

- Is `44.201.62.0` associated with an Elastic IP or currently ephemeral?
- What web server or reverse proxy, if any, fronts the backend and frontend?
- Does the live checkout contain commits, modifications, or runtime files not represented by `origin/main`?
- Which required GitHub checks can be enforced immediately given the repository's current test and build setup?
