## 1. Cutover Inputs and Safety Gates

- [ ] 1.1 Record the approved production hostname, DNS zone/provider, administrator SSH CIDR, upload-size limit, and proxy timeout values without recording secrets
- [ ] 1.2 Rotate the exposed OpenAI API key and PostgreSQL password, verify `/health` and `/ready`, and capture secret-safe evidence
- [ ] 1.3 Record the current production commit/release, Security Group rules, service state, and tested rollback target

## 2. Same-Origin Application Contract

- [x] 2.1 Move public backend endpoints under `/api`, including health, readiness, search, compare, essays, users, and admin routes
- [x] 2.2 Replace frontend backend-host configuration and hard-coded IP fallbacks with same-origin `/api` requests
- [x] 2.3 Restrict production CORS to the approved HTTPS origin while preserving explicit local development origins
- [x] 2.4 Add backend and frontend tests covering the migrated routes and absence of the legacy public `:8000` endpoint

## 3. Reproducible Release Artifact

- [x] 3.1 Add production deployment manifests for release directories, shared paths, service ownership, systemd, Nginx, and certificate renewal
- [x] 3.2 Add a GitHub Actions workflow that installs from lockfiles, runs frontend checks, builds `frontend/dist`, and packages a commit-addressed release artifact
- [x] 3.3 Add artifact checks that reject secrets, runtime data, Git metadata, dependencies, and environment-specific credential files
- [x] 3.4 Add bounded activation and rollback tooling with preflight, loopback readiness, previous-release retention, and failure restoration

## 4. EC2 Runtime Provisioning

- [ ] 4.1 Provision the non-login `essay-api` account and the `/opt`, `/etc`, `/var/lib`, and log ownership/permission boundaries
- [ ] 4.2 Install the first release artifact and its release-local Python environment without installing Node on EC2
- [ ] 4.3 Install and enable systemd so Uvicorn runs as `essay-api` on `127.0.0.1:8000` without `--reload`
- [ ] 4.4 Install and enable Nginx with SPA fallback, `/api` proxying, forwarded headers, body limits, timeouts, and bounded logs

## 5. Secure Cutover and Verification

- [ ] 5.1 Point the production hostname to the stable EC2 address, obtain the TLS certificate, and verify automatic renewal
- [ ] 5.2 Verify HTTPS redirect, direct SPA refresh, API proxying, allowed and oversized uploads, timeout behavior, health, and readiness through Nginx
- [ ] 5.3 Remove public Security Group ingress for port 8000, restrict SSH to the approved CIDR, and confirm only required ports remain reachable
- [ ] 5.4 Exercise process-failure restart, release rollback, and an authorized EC2 reboot; record recovery evidence and the active/previous release identities
