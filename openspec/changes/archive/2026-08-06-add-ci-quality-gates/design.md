## Context

The repository has repeatable frontend and backend verification commands but no GitHub Actions workflow or protected-branch enforcement. The frontend has a committed npm lockfile and scripts for lint, Node tests, and a Vite production build. The backend uses `requirements.txt` as its direct-dependency input and a Python 3.12-generated `requirements.lock.txt` as the deterministic CI/audit artifact; it also has a `unittest` suite, FastAPI import coverage, and readiness tests designed to use temporary state and mocks. Production uses Python 3.12, while earlier baseline evidence also used Python 3.11.

The CI contract must be stable enough for GitHub branch protection, safe to run on untrusted pull requests, and diagnosable without access to production credentials or data.

## Goals / Non-Goals

**Goals:**

- Produce stable required checks for frontend, backend, and security validation.
- Reuse the repository's existing clean-install, test, build, import, and readiness behaviors.
- Run with least privilege and no production secrets or external production data.
- Make a failing command and job visible in GitHub's check output.
- Establish and verify a `main` protection policy that requires successful CI.

**Non-Goals:**

- Deploying application releases or changing the production runtime.
- Replacing the existing frontend or backend test frameworks.
- Guaranteeing that dependency scans detect every vulnerability.
- Storing production credentials in GitHub or exercising production services from PR CI.

## Decisions

### Use one GitHub Actions workflow with stable, separate jobs

The workflow will run for pull requests targeting `main` and pushes to `main`, with explicit read-only permissions by default. It will expose stable frontend, backend, and security job names so branch protection can require them. Separate jobs preserve parallelism and make failures easy to locate.

An all-in-one job was rejected because it is slower and obscures which quality gate failed. Multiple workflow files were rejected for the initial implementation because duplicated triggers and permissions make the required-check contract harder to audit.

### Match CI runtimes to production and supported build tooling

Backend validation will use Python 3.12, matching the documented production host, and install the committed transitive lock compiled for that runtime. Frontend validation will use a pinned supported Node.js 22 release line and `npm ci`. Runtime versions will be declared in the workflow rather than inferred from a developer machine.

A Python 3.11/3.12 matrix was rejected for the required gate because the launch contract targets Python 3.12; broader compatibility can be added later as a non-blocking check. Floating Node versions were rejected because they make build results less reproducible.

### Reuse existing validation commands and add a bounded startup smoke check

Frontend CI will run `npm ci`, `npm run lint`, `npm test`, and `npm run build`. Backend CI will install `BackEnd/requirements.lock.txt`, run `python -m unittest discover -s BackEnd/tests -v`, import the FastAPI application, and start it only long enough to exercise local health/readiness behavior with isolated test configuration. `BackEnd/requirements.txt` remains the human-maintained direct-dependency input used to regenerate the lock under Python 3.12.

Regenerate the backend lock in a clean Python 3.12 environment with `pip-tools==7.5.1` and `pip-compile --strip-extras --resolver=backtracking --output-file=BackEnd/requirements.lock.txt BackEnd/requirements.txt`, then review the complete transitive-version diff before committing it.

The workflow will not run the development server or `--reload`. It will not call production databases, AWS, Google, or OpenAI.

### Layer credential and dependency checks

Security validation will combine a repository credential scan with dependency review for pull requests and ecosystem-appropriate dependency audits. Findings that represent committed credentials or vulnerabilities at the agreed blocking severity will fail the job; lower-severity advisory output can remain visible without blocking once explicitly configured.

Relying only on GitHub's default secret detection was rejected because it does not provide a repository-defined required check. Treating every advisory as blocking was rejected because transitive findings without an available fix can make `main` permanently unavailable; the chosen threshold and exceptions must be explicit and reviewable.

### Configure branch protection after check names exist

Implementation will first merge or otherwise run the workflow so GitHub registers its check names. A repository administrator will then require pull requests and the stable CI checks for `main`, disallow bypass for ordinary contributors, and verify the policy with deliberately failing frontend and backend changes.

Branch protection is an external repository setting and cannot be proven by workflow YAML alone, so the change will record settings and test evidence separately.

## Risks / Trade-offs

- [The backend lock can drift from its direct-dependency input] → Regenerate `BackEnd/requirements.lock.txt` under Python 3.12 whenever `BackEnd/requirements.txt` changes, and review the resulting transitive-version diff.
- [Security scanners can produce false positives or transient advisory failures] → Pin scanner/action versions, set an explicit blocking threshold, and document narrowly scoped exceptions with expiry or follow-up.
- [Fork pull requests do not receive secrets] → Design every required PR job to pass with no secrets and read-only token permissions.
- [Branch protection can reference stale job names] → Treat job names as a compatibility contract and update protection settings whenever names change.
- [A startup smoke test can hang] → Use a bounded local process, explicit timeout, health probe, and unconditional cleanup.

## Migration Plan

1. Add the workflow and any minimal scanner configuration, then validate its syntax and commands locally where practical.
2. Open a pull request and confirm all jobs run without production secrets.
3. Prove frontend and backend failures independently using temporary deliberately broken commits, then restore the valid commit.
4. Configure `main` branch protection to require the registered stable checks and pull-request review policy.
5. Record the required settings and successful/failed check evidence. Roll back by disabling the required checks first, then reverting the workflow commit if CI prevents legitimate merges.

## Open Questions

- Which dependency vulnerability severity should block the first release: high/critical only, or all actionable findings?
- Does the GitHub plan and repository visibility support the desired ruleset/branch-protection features without an upgrade?
