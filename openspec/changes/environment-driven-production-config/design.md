## Context

Frontend requests currently mix `VITE_API_URL`, direct route concatenation, and an admin-only fallback to `http://44.201.62.0:8000`. Vite proxies `/api` to local FastAPI without defining whether the prefix is preserved, while FastAPI exposes routes such as `/search`, `/admin/*`, `/health`, and `/ready` at the root. FastAPI CORS origins are also hard-coded. These choices make development and production routing disagree and make host changes source-code changes.

The deployment target needs one public origin, Nginx serving the frontend and proxying API traffic to FastAPI on loopback. Existing backend route paths should remain compatible so this change does not force an internal API migration.

## Goals / Non-Goals

**Goals:**

- Give every browser API call one shared base-path resolver with a production-safe same-origin default.
- Define identical `/api/*` behavior through the Vite development proxy and production Nginx proxy.
- Centralize backend runtime configuration, validation, and CORS parsing.
- Keep production commands distinct from reload-based development commands.
- Make configuration and health behavior testable without production credentials, paid APIs, or live data.

**Non-Goals:**

- Deploying Nginx, systemd, DNS, TLS, security-group, or EC2 changes.
- Rotating or committing credentials.
- Renaming FastAPI's internal root routes or versioning the API.
- Changing authentication, essay search, admin authorization, or persistent-data semantics.

## Decisions

### Use `/api` as the browser-facing base and strip it at the proxy boundary

Frontend code will use a shared API helper whose base is `VITE_API_BASE` when explicitly set and `/api` otherwise. Development Vite and production Nginx will both forward `/api/<path>` to FastAPI as `/<path>`.

This preserves existing FastAPI routes and gives browser traffic one coherent same-origin namespace. Keeping `/api` inside FastAPI was considered, but it would require broader route changes and compatibility handling for direct backend clients.

### Treat the proxy contract as a tested interface

The repository will contain a production Nginx example and tests or static assertions covering trailing-slash behavior for public, user, admin, health, and readiness routes. `/api/health` and `/api/ready` externally map to `/health` and `/ready` internally.

The configuration example is deployment documentation, not authorization to modify a live host.

### Centralize FastAPI environment parsing and fail at startup

A backend configuration module will normalize runtime mode, comma-separated CORS origins, and required production settings. Production startup will report missing required variable names without printing values. Development retains documented safe defaults where local execution can work without weakening production behavior.

Required production variables will reflect code paths needed for launch: database access, Google login verification, admin authorization, and OpenAI-backed search. Optional integrations such as CloudWatch and Drive sync remain optional and feature-local.

### Prefer no production CORS allowance for same-origin traffic

Same-origin requests do not require CORS. Production therefore defaults to an empty allowlist and accepts additional origins only through an explicit comma-separated variable. Wildcard origins are rejected in production. Development may default to the documented local Vite origins.

### Separate development and production execution

Development commands may use Vite and Uvicorn reload. Production documentation will build static frontend assets and start FastAPI without reload, bound to loopback behind Nginx. Commands will identify required configuration before startup and will not embed secret values.

### Keep health checks local and dependency-free

`/health` remains a liveness endpoint that returns without OpenAI, Google, AWS, or other paid/external calls. `/ready` continues to describe initialized application readiness and may return 503 after startup initialization failure.

## Risks / Trade-offs

- **[Proxy slash semantics can create 404s]** → Use matching Vite/Nginx rewrite rules and route-contract tests for representative endpoints.
- **[Build-time frontend variables can be mistaken for runtime variables]** → Document which values are injected by Vite at build time and keep the API base default relative.
- **[Strict startup validation can interrupt an incomplete production environment]** → List missing variable names in one actionable error and test development/production modes separately.
- **[Empty production CORS can surprise operators using a second origin]** → Document explicit `CORS_ORIGINS` configuration and reject permissive wildcard shortcuts.
- **[Configuration examples can drift]** → Validate command and proxy fragments with focused tests or static checks in the normal verification suite.

## Migration Plan

1. Introduce shared frontend and backend configuration helpers with focused tests.
2. Convert all user and admin API calls to the shared `/api` contract and remove host/IP fallbacks.
3. Align Vite proxy rewriting and add the production Nginx/systemd examples.
4. Run clean frontend and backend verification with both development defaults and production validation cases.
5. During a separately authorized deployment, set required variables, build the frontend, install the proxy/service configuration, and verify `/api/health`, `/api/ready`, and representative user/admin routes.
6. Roll back application and proxy configuration together if route or readiness checks fail; do not modify persistent data.

## Open Questions

None.
