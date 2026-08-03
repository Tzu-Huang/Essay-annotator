## Why

Production candidates can currently reach `main` without repository-enforced evidence that the frontend builds, the backend starts, the test suites pass, or the change is free of obvious credential and dependency risks. Automated, required CI gates are needed before deployment automation can safely treat `main` as the release source.

## What Changes

- Add CI for pull requests targeting `main` and relevant pushes to `main`.
- Validate the frontend from its lockfile with lint, tests, and a production build.
- Validate the backend in an isolated environment with the complete test suite, application import, and bounded startup/readiness checks.
- Run credential and dependency/security checks without requiring production secrets or accessing production data.
- Publish stable, diagnosable check results that can be required by `main` branch protection.
- Document and verify the repository's required-check and protected-branch policy, including deliberately broken frontend and backend cases.

## Capabilities

### New Capabilities

- `continuous-integration-quality-gates`: Defines automated validation, isolation, security scanning, failure diagnostics, and protected-branch requirements for production-bound changes.

### Modified Capabilities

- `production-release-baseline`: Requires a production candidate from `main` to carry successful required CI evidence before it is eligible for deployment.

## Impact

- Adds GitHub Actions workflow configuration and supporting repository scripts or configuration.
- Exercises `frontend/package-lock.json`, frontend npm scripts, `BackEnd/requirements.txt`, backend tests, and FastAPI startup/readiness behavior.
- Introduces selected credential and dependency scanning tools and may add dependency-policy configuration.
- Requires a GitHub repository administrator to configure `main` branch protection after stable check names exist.
- Does not require production credentials, mutate production data, or change application APIs.
