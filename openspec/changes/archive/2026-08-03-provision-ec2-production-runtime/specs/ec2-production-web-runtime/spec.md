## ADDED Requirements

### Requirement: Single secure public entry point
The production runtime SHALL expose application traffic only through Nginx on
HTTP/HTTPS, SHALL redirect HTTP to HTTPS, and SHALL NOT expose the FastAPI
listener publicly.

#### Scenario: Inspect public network exposure
- **WHEN** the production Security Group and host listeners are inspected
- **THEN** ports 80 and 443 are the only public application ports and port 8000 has no public ingress

#### Scenario: Request the plaintext endpoint
- **WHEN** a client requests the configured production hostname over HTTP
- **THEN** Nginx redirects the client to the equivalent HTTPS URL

### Requirement: SPA and same-origin API routing
Nginx SHALL serve the versioned Vite artifact at `/`, SHALL fall back to
`index.html` for client-side routes, and SHALL proxy `/api/*` to FastAPI on
`127.0.0.1:8000`.

#### Scenario: Refresh a frontend route
- **WHEN** a user directly requests a valid client-side route
- **THEN** Nginx returns the SPA entry point without a 404 response

#### Scenario: Call the API through Nginx
- **WHEN** a client sends a valid request to `/api/ready`
- **THEN** Nginx proxies it to FastAPI and returns the backend response

### Requirement: Bounded proxy behavior
The production Nginx configuration SHALL define and verify request-body limits,
proxy timeouts, forwarded headers, and upload behavior.

#### Scenario: Upload an allowed document
- **WHEN** an authenticated administrator uploads a document within the configured size and timeout limits
- **THEN** the request reaches FastAPI and completes without proxy truncation

#### Scenario: Exceed the request-size limit
- **WHEN** a client submits a body larger than the configured maximum
- **THEN** Nginx rejects it with a deterministic client error without forwarding it to FastAPI

### Requirement: Least-privilege managed backend
FastAPI SHALL run under a dedicated non-login service account, load secrets from
a root-managed source, bind only to loopback, and be managed by an enabled
systemd unit without development reload mode.

#### Scenario: Inspect the backend process
- **WHEN** the production process and systemd unit are inspected
- **THEN** the dedicated account runs Uvicorn on `127.0.0.1:8000` without `--reload`

#### Scenario: Backend process fails
- **WHEN** the FastAPI process exits unexpectedly
- **THEN** systemd restarts it and readiness returns successfully

### Requirement: Atomic release activation and rollback
Each production artifact SHALL be installed into a commit-addressed immutable
release directory, and activation SHALL switch a `current` symlink only after
preflight checks while retaining the prior release for rollback.

#### Scenario: Activate a healthy release
- **WHEN** a release passes dependency, configuration, and loopback readiness checks
- **THEN** deployment activates that exact commit and records the previous release

#### Scenario: New release fails readiness
- **WHEN** the activated release does not become ready within the bounded timeout
- **THEN** deployment restores the previous symlink, restarts the service, and reports failure

### Requirement: Reboot-safe production runtime
Nginx, FastAPI, certificate renewal, and required monitoring/backup units SHALL
remain enabled and recover after an EC2 reboot.

#### Scenario: Reboot the production instance
- **WHEN** an authorized reboot test is performed
- **THEN** HTTPS frontend routes and `/api/ready` recover without manual process startup

### Requirement: Secret-safe runtime migration
Production deployment artifacts and logs SHALL NOT contain secret values, and
credentials exposed before this change SHALL be rotated before cutover.

#### Scenario: Inspect the release artifact and deployment output
- **WHEN** the candidate artifact and logs are scanned
- **THEN** no API key, database password, private key, token, or plaintext connection string is present
