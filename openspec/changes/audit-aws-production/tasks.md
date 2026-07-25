## 1. Repository and Access Baseline

- [ ] 1.1 Record the public GitHub repository, default branch, remote URL, current `main` commit, and local/remote branch relationships.
- [ ] 1.2 Inspect GitHub branch rules and deployment references, recording unavailable evidence and authentication blockers without exposing credentials.
- [ ] 1.3 Confirm the production authentication mechanism category and deployment authority without recording keys, tokens, or secret values.

## 2. AWS and Host Inventory

- [ ] 2.1 Use read-only AWS and instance evidence to record EC2 type, OS, region/AZ, storage, public IPv4, Elastic IP status, and Security Group ingress/egress.
- [ ] 2.2 Use read-only host commands to inventory processes, listening ports, service units, web server or reverse proxy, installed runtimes, and startup/status commands.
- [ ] 2.3 Inspect the production repository path, branch, commit, remote, working tree, and divergence from `origin/main`; stop and flag any reconciliation requirement.

## 3. Data and Logging Baseline

- [ ] 3.1 Inventory the active PostgreSQL-or-SQLite configuration category and all production JSONL, embedding, upload, export, and other runtime-data paths.
- [ ] 3.2 Record ownership, persistence classification, size or existence evidence, and backup status for each production data location.
- [ ] 3.3 Record journald and optional CloudWatch logging configuration status without capturing log secrets or sensitive application content.

## 4. Operational Documentation

- [ ] 4.1 Create `docs/operations/production-environment-baseline.md` with dated evidence, sources, confirmed facts, repository expectations, and unresolved items.
- [ ] 4.2 Create `docs/operations/release-and-deployment-policy.md` defining `main` as the sole production truth, required checks, owner-authorized manual deployment, verification, rollback, and hotfix flow.
- [ ] 4.3 Document the `frontend-base` freeze/removal prerequisites and confirm that IP-based HTTP is internal validation while domain plus HTTPS remains follow-up launch work.

## 5. Verification

- [ ] 5.1 Cross-check documented startup commands, endpoints, repository state, and data paths against both live evidence and repository configuration.
- [ ] 5.2 Scan the new operational documents for credentials, tokens, private-key material, environment values, or other secrets and remove any sensitive content.
- [ ] 5.3 Verify every ZAC-82 acceptance criterion is either satisfied by linked evidence or explicitly recorded as unresolved follow-up.
