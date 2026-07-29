## 1. Configuration Contracts

- [ ] 1.1 Add a shared frontend API-base helper with a same-origin `/api` default and no deployment host/IP fallback
- [ ] 1.2 Add centralized backend runtime configuration for environment mode, required launch variables, optional integrations, and normalized CORS origins
- [ ] 1.3 Add focused configuration tests for development defaults, production missing-variable errors, explicit origins, and wildcard rejection

## 2. Frontend Request Standardization

- [ ] 2.1 Migrate all public, login, essay, comparison, and readiness requests to the shared API-base helper
- [ ] 2.2 Migrate all admin requests and upload flows to the shared API-base helper while preserving authorization headers and request bodies
- [ ] 2.3 Update frontend tests to prove user and admin calls use same-origin `/api` without hard-coded AWS host/IP fallbacks

## 3. Proxy and Backend Runtime Behavior

- [ ] 3.1 Configure the Vite development proxy to strip `/api` consistently before forwarding to existing FastAPI routes
- [ ] 3.2 Replace hard-coded FastAPI CORS origins with the centralized environment-driven allowlist
- [ ] 3.3 Add route-contract tests for representative public, user, admin, health, and readiness proxy paths
- [ ] 3.4 Preserve dependency-free `/health` and `/ready` behavior with tests proving no paid or external request is invoked

## 4. Production Operations

- [ ] 4.1 Add secret-safe required/optional and build-time/runtime environment-variable documentation
- [ ] 4.2 Add a production Nginx configuration example that serves built frontend assets and proxies `/api/*` to loopback FastAPI with the prefix stripped
- [ ] 4.3 Separate documented development commands from production build/start commands and ensure production does not use Vite dev serving or Uvicorn reload

## 5. Verification

- [ ] 5.1 Pass clean frontend install, lint, tests, and production build
- [ ] 5.2 Pass isolated backend dependency install, complete tests, application import, configuration validation, and bounded health/readiness checks
- [ ] 5.3 Verify no hard-coded deployment host/IP fallback or secret value remains in tracked application and operations files
- [ ] 5.4 Run strict OpenSpec validation and record tested commands, results, limitations, and rollback considerations in the devlog
