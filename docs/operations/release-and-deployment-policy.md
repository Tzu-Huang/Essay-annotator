# Release and Deployment Policy

Effective date: 2026-07-25

Owner and production deployment authority: project owner

Related issue: ZAC-82

## Source of truth

`main` is the sole production source of truth.

```text
feature/* or fix/*
        |
        | pull request + required checks
        v
      main
        |
        | owner-authorized manual deployment of a recorded commit
        v
   production
```

- All feature, migration, maintenance, and fix branches start from current `main`.
- Changes return to `main` through a reviewed pull request.
- A production deployment selects and records an exact commit already on `main`.
- Production-only commits are prohibited.
- The EC2 working tree is not a development workspace.
- No other long-lived branch may act as a parallel production truth.

## Required pull-request checks

The following checks are required before merge:

| Check | Command | Current enforcement |
|---|---|---|
| Backend tests | From `BackEnd`: `python -m unittest discover -s tests` | Required by policy; GitHub enforcement not yet verified |
| Frontend tests | From `frontend`: `npm test` | Required by policy; GitHub enforcement not yet verified |
| Frontend lint | From `frontend`: `npm run lint` | Required by policy; GitHub enforcement not yet verified |
| Frontend production build | From `frontend`: `npm run build` | Required by policy; GitHub enforcement not yet verified |
| Deployable configuration review | Confirm required variable names and runtime paths are documented and no secret is committed | Manual owner check |
| Change-specific checks | Tests or validation named by the OpenSpec change | Required when applicable |

There is currently no tracked GitHub Actions workflow in the audited checkout, and authenticated branch-protection state could not be read. Until automated required checks and protection are configured, the owner must record manual check results on the pull request or linked development evidence.

Recommended GitHub protection for `main`:

- Require a pull request before merging.
- Require at least one approving review; for a single-maintainer emergency, record the owner exception explicitly.
- Require all available automated checks and require branches to be up to date.
- Dismiss stale approvals when new commits are pushed.
- Block force pushes and branch deletion.
- Apply the rule to administrators where the GitHub plan and repository settings support it.

## Normal deployment

Only the project owner authorizes production deployment. Another operator or automation may execute it later only through explicit owner delegation.

### Pre-deployment gate

1. Confirm the target commit is on `main` and all required checks passed.
2. Confirm `docs/operations/production-environment-baseline.md` has no blocking live-state unknown relevant to the deployment.
3. Confirm the production host is the expected EC2 instance and the current IP/hostname is correct.
4. Inspect the production checkout before any pull, reset, archive extraction, or file replacement:
   - remote URL;
   - branch and HEAD commit;
   - working-tree status;
   - commits ahead of or behind `origin/main`.
5. Stop if the host has local modifications, untracked application files of unknown purpose, or unique commits.
6. Identify and back up persistent runtime data separately from application source.
7. Record the current deploy commit and rollback target.

### Deployment execution

The exact commands must be finalized from the live service and web-server inventory. The deployment must:

1. Preserve persistent data and secret configuration outside any replaceable application bundle.
2. Update the application checkout to the selected `main` commit without destroying unexplained host state.
3. Install backend dependencies and build frontend assets only when required by the selected change.
4. Restart only the documented managed services.
5. Never run the Vite development server as a production service.

Repository examples such as `systemctl restart essay-api` are not authoritative until the live unit and working directory are confirmed.

### Post-deployment verification

Record:

- deployed commit;
- service active state and recent startup errors;
- expected listening ports;
- backend health or representative API response;
- frontend load and API connectivity;
- authentication flow when relevant;
- database and JSONL/embedding availability;
- a brief log check that does not copy secrets or sensitive essay content.

A successful service restart alone is not sufficient; the application must pass a functional readiness check.

## Rollback

Rollback uses the previously recorded production commit on `main` and the pre-deployment data backup when data changed.

1. Stop further rollout and record the failure.
2. Preserve logs and current state needed for diagnosis.
3. Return application code/assets to the recorded rollback commit through the same controlled deployment mechanism.
4. Restore data only when the deployment changed it and the restoration procedure has been verified.
5. Restart services and repeat the post-deployment verification.
6. Ensure any corrective code is committed and merged through `main`; do not leave a permanent host-only fix.

## Emergency hotfix

```text
production commit on main
          |
          v
   fix/<issue>-<summary>
          |
 focused tests + expedited review
          |
          v
         main
          |
 owner-authorized deployment
```

- Branch from the exact production commit on `main`.
- Keep the change narrowly scoped and add a regression check where practical.
- Run focused checks plus any affected required release checks.
- Use a pull request even when review is expedited.
- If an owner exception is unavoidable, record why, the commit, validation performed, and required follow-up.
- Merge the fix into `main` before or immediately as part of deployment; never make an untracked production-only change.

## `frontend-base` retirement

As of the audited local references, `frontend-base` and recorded `origin/main` both point to `1d335dd`. The local `main` contains one later instructions commit. The branch is no longer a development or release baseline.

Retirement sequence:

1. Freeze `frontend-base`; do not base new work on it.
2. Search tracked documentation, GitHub workflows/settings, external automation, and the production checkout for branch references.
3. Update any valid reference to use `main`.
4. Confirm no open work requires commits unique to `frontend-base`.
5. Delete the branch only after the owner approves the evidence.

Deletion is not part of ZAC-82 implementation and must not occur while production access is unresolved.

## Domain and HTTPS

- IP-based HTTP is permitted only for temporary internal validation.
- It is not the intended public launch endpoint.
- Domain registration, DNS, certificate issuance/renewal, HTTP-to-HTTPS redirect, and Google OAuth origin/redirect updates belong to separate follow-up work.
- Public launch should wait for HTTPS because the application includes authentication and administrative functions.
