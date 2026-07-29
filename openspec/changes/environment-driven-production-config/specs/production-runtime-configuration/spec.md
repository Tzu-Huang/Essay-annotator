## ADDED Requirements

### Requirement: Shared browser API base

All frontend user and admin API requests SHALL resolve through one shared API-base contract. The production-safe default SHALL be the same-origin `/api` path, and application code SHALL NOT contain fallback deployment hosts or IP addresses.

#### Scenario: Production build has no API-base override

- **WHEN** the frontend is built without an explicit API-base override
- **THEN** browser requests SHALL target same-origin paths beneath `/api`

#### Scenario: Deployment host changes

- **WHEN** the public host or domain changes
- **THEN** user and admin API requests SHALL continue to work without source-code edits

### Requirement: Consistent proxy path contract

Development and production proxies SHALL expose `/api/<path>` to the browser and SHALL forward the request to the existing FastAPI `/<path>` route while preserving query strings, methods, headers, and request bodies.

#### Scenario: Public route is proxied

- **WHEN** the browser requests `/api/search`
- **THEN** FastAPI SHALL receive the request at `/search`

#### Scenario: Admin route is proxied

- **WHEN** the browser requests `/api/admin/essays`
- **THEN** FastAPI SHALL receive the request at `/admin/essays` with its authorization header preserved

#### Scenario: Health route is proxied

- **WHEN** an operator requests `/api/health` or `/api/ready`
- **THEN** the proxy SHALL route the request to `/health` or `/ready` respectively

### Requirement: Environment-driven backend configuration

FastAPI SHALL load runtime mode, required production settings, optional integration settings, and CORS origins from a centralized environment contract. Missing required production variables SHALL stop startup with an error that names missing variables without exposing values.

#### Scenario: Required production configuration is missing

- **WHEN** FastAPI starts in production mode without one or more required launch settings
- **THEN** startup SHALL fail before serving traffic and SHALL identify every missing variable by name

#### Scenario: Optional integration is not configured

- **WHEN** an optional integration variable is absent
- **THEN** FastAPI SHALL start if all required launch settings are valid and SHALL report that integration as unconfigured where applicable

### Requirement: Minimal production CORS

FastAPI SHALL parse allowed cross-origin browser origins from configuration. Production SHALL default to no cross-origin allowance for same-origin operation, SHALL allow only explicitly configured origins, and SHALL reject wildcard origins.

#### Scenario: Same-origin production deployment

- **WHEN** production starts without configured cross-origin origins
- **THEN** the CORS allowlist SHALL be empty while same-origin proxy traffic remains functional

#### Scenario: Explicit production origin

- **WHEN** production starts with a comma-separated set of valid origins
- **THEN** only the normalized configured origins SHALL receive CORS permission

#### Scenario: Wildcard production origin

- **WHEN** production configuration contains `*` as a CORS origin
- **THEN** startup SHALL fail with a clear configuration error

### Requirement: Separate development and production commands

The repository SHALL document and expose distinct development and production execution paths. Production SHALL serve built frontend assets and SHALL start FastAPI without reload mode behind the documented reverse proxy.

#### Scenario: Developer runs the local stack

- **WHEN** a developer selects the documented development commands
- **THEN** the Vite development proxy and reload-enabled backend MAY be used with local-safe defaults

#### Scenario: Operator starts production

- **WHEN** an operator follows the documented production commands
- **THEN** the frontend SHALL be built as static assets and FastAPI SHALL start without Vite dev serving or Uvicorn reload

### Requirement: Secret-safe configuration documentation

Configuration documentation SHALL distinguish required and optional variables, build-time and runtime variables, and development and production defaults without containing credential values.

#### Scenario: Operator prepares an environment

- **WHEN** an operator reads the configuration documentation
- **THEN** each variable SHALL identify its purpose, requirement level, evaluation time, and safe example shape without revealing a secret

### Requirement: Dependency-free health checks

FastAPI SHALL expose liveness and readiness checks that do not invoke OpenAI, Google, AWS, or other paid/external services during the request.

#### Scenario: Liveness is checked

- **WHEN** `/health` is requested after the application process starts
- **THEN** it SHALL return HTTP 200 with local application state and SHALL make no paid or external service call

#### Scenario: Initialization is not ready

- **WHEN** startup initialization has failed or not completed and `/ready` is requested
- **THEN** it SHALL return HTTP 503 with a local diagnostic status and SHALL make no paid or external service call
