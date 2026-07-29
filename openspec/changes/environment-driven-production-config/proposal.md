## Why

The frontend and FastAPI backend currently depend on inconsistent API URL conventions, a hard-coded AWS IP fallback, and hard-coded CORS origins. Production host or domain changes therefore require source edits and can leave public, admin, proxy, and health routes behaving differently.

## What Changes

- Define one environment-variable contract for development and production, including required values, optional values, safe defaults, and clear startup/build failures.
- Standardize browser requests on a documented API base path, defaulting production traffic to same-origin `/api`.
- Remove hard-coded AWS host/IP fallbacks from frontend and backend application code.
- Define and verify the Nginx-to-FastAPI path contract for public, user, admin, health, and readiness routes.
- Make FastAPI CORS origins environment-driven, with production permitting only explicitly required origins.
- Separate development commands from production build/start commands; production will not use the Vite development server or Uvicorn reload mode.
- Document configuration names and operational examples without committing secret values.
- Retain lightweight `/health` and `/ready` checks that do not invoke paid or external services.

## Capabilities

### New Capabilities

- `production-runtime-configuration`: Defines the frontend API base, reverse-proxy path behavior, backend environment validation, CORS policy, production commands, and health/readiness contract.

### Modified Capabilities

None.

## Impact

- Frontend API call sites, shared API-base handling, Vite development proxy configuration, and related tests.
- FastAPI application startup, CORS middleware configuration, route compatibility, and backend tests.
- Nginx/systemd or equivalent production configuration examples, Makefile/package commands, and environment-variable documentation.
- Deployment operators must provide the documented production variables, but no secret values will be added to Git.
