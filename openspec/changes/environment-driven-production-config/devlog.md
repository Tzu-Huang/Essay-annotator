---
change: environment-driven-production-config
date: 2026-07-29
---

# Devlog: Environment-Driven Production Configuration

## Context

ZAC-84 replaces deployment-specific frontend API URLs and FastAPI CORS origins with a single environment-driven contract. Browser traffic defaults to same-origin `/api`, while Vite and Nginx strip the prefix before forwarding to existing FastAPI routes.

## Implementation

- Added a shared frontend `apiUrl()` helper and migrated all user/admin API requests.
- Added centralized backend environment validation and production-minimal CORS configuration.
- Aligned the Vite proxy, documented Nginx/systemd production configuration, and separated development from production commands.
- Added frontend/backend tests covering API routing, configuration failures, proxy behavior, CORS, health/readiness, and operations examples.

## Decisions

- Keep existing FastAPI route paths and strip `/api` at both development and production proxy boundaries.
- Default production CORS to an empty allowlist because same-origin traffic does not require CORS; reject wildcard production origins.
- Require production database, OpenAI, Google client, and admin allowlist configuration at startup while leaving feature-local integrations optional.
- Keep `/health` and `/ready` free of paid or external calls.

## Validation Plan

- Reinstall frontend dependencies from the lockfile, then run lint, tests, and production build.
- Install backend dependencies in an isolated Python environment, then run the complete suite and application import.
- Scan tracked application and operations files for hard-coded deployment hosts, credentials, and conflict markers.
- Run strict OpenSpec validation and confirm the captured product HEAD remains unchanged.

## Follow-ups

- The existing Vite production bundle warning remains separate performance work.
- Live Nginx/systemd installation, TLS, DNS, production credentials, and deployment remain separately authorized launch work.
- A failed later deployment must roll back the application and proxy configuration together without modifying PostgreSQL or runtime essay/embedding data.

## Verification

### Round 1 (2026-07-29 17:04 Asia/Taipei)

- Tested head: `ddae72af211e10086cd3ebaaa1b9cb43bec20b6a`
- Status: `pass`
- Checks: clean `npm ci` pass (204 packages); `npm run lint` pass; `npm test` pass (46/46); `npm run build` pass (Vite 7.3.6, 2,410 modules); isolated Python 3.11 requirements install pass; complete backend `unittest` pass (79/79); FastAPI development-mode import pass; production configuration validation tests pass; hard-coded deployment host/API fallback scan pass (0 matches); credential-pattern scan pass (0 matches); conflict-marker scan pass (0 matches); `openspec validate environment-driven-production-config --strict` pass; captured product HEAD unchanged.
- Unresolved failures: none. Vite retains the known chunk larger than 500 kB warning.
- Next action: `/dev-review`
