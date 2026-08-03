## Why

Production currently exposes FastAPI directly on public port 8000, has no
Nginx or deployed frontend build, and runs from a mutable checkout without a
documented rollback boundary. ZAC-86 closes that launch gap with a reboot-safe,
least-privilege EC2 web runtime.

## What Changes

- Install and configure Nginx as the only public application entry point.
- Serve the Vite production build at `/` with SPA fallback and proxy application
  APIs through `/api`.
- Run FastAPI under systemd as a dedicated service account, bound only to
  `127.0.0.1`.
- Introduce immutable release directories plus a `current` symlink, shared
  configuration/data paths, readiness-gated activation, and rollback.
- Build frontend artifacts in GitHub Actions rather than on the production host.
- Restrict the EC2 Security Group to SSH administration and public HTTP/HTTPS;
  port 8000 will no longer be public.
- Configure a production hostname, TLS certificate renewal, request/upload
  limits, proxy timeouts, logging, and reboot/failure recovery verification.
- **BREAKING**: frontend and external consumers will use same-origin `/api/*`
  URLs instead of the public `http://44.201.62.0:8000` endpoint.

## Capabilities

### New Capabilities

- `ec2-production-web-runtime`: Defines the public Nginx frontend, private
  FastAPI service, release activation/rollback, TLS, network exposure, and
  restart/reboot behavior for the EC2 production host.

### Modified Capabilities

- `production-release-baseline`: Extends release acceptance so a production
  candidate includes a deployable frontend artifact and passes activation,
  readiness, and rollback gates on the target runtime.

## Impact

- Frontend API URL handling and backend route prefixes/CORS policy.
- GitHub Actions build and release artifact packaging.
- EC2 packages, filesystem layout, users/groups, systemd units, Nginx, and logs.
- EC2 Security Group, DNS, TLS certificate issuance, and renewal.
- Deployment and rollback operations; existing RDS, persistent data paths, and
  backup/recovery controls remain in place.
