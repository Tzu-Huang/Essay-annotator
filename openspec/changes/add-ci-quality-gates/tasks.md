## 1. CI Contract and Runtime Setup

- [ ] 1.1 Define stable workflow and job names, pull-request and `main` triggers, concurrency behavior, and read-only default permissions
- [ ] 1.2 Pin the supported Node.js 22 and Python 3.12 CI runtimes and document the required-check names

## 2. Frontend Quality Gate

- [ ] 2.1 Add a clean frontend job that runs `npm ci`, lint, Node tests, and the Vite production build
- [ ] 2.2 Verify the frontend job succeeds on the healthy baseline and records a diagnosable failure for a deliberately broken frontend candidate

## 3. Backend Quality Gate

- [ ] 3.1 Add an isolated backend job that installs committed requirements and runs the complete unittest suite plus FastAPI import validation
- [ ] 3.2 Add a bounded local startup/readiness smoke check with explicit timeout and cleanup, without production credentials or data
- [ ] 3.3 Verify the backend job succeeds on the healthy baseline and records a diagnosable failure for a deliberately broken backend candidate

## 4. Security Quality Gate

- [ ] 4.1 Select and pin credential, frontend dependency, backend dependency, and pull-request dependency-review tooling with an explicit blocking severity policy
- [ ] 4.2 Add the security job with least-privilege permissions, secret-safe output, and documented handling for reviewed exceptions
- [ ] 4.3 Validate that representative credential and blocking dependency findings fail CI without exposing complete credential values

## 5. Protection and End-to-End Verification

- [ ] 5.1 Validate workflow configuration and prove all required jobs run on pull requests without production secrets
- [ ] 5.2 Configure `main` branch protection or a repository ruleset to require pull requests and the stable frontend, backend, and security checks
- [ ] 5.3 Record healthy, deliberately broken frontend, deliberately broken backend, and protected-merge evidence with the exact tested commit
