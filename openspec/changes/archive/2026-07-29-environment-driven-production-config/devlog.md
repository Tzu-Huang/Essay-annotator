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

### Round 2 (2026-07-29 17:14 Asia/Taipei)

- Tested head: `6d01c0a90c93520a8fb0df95475ba45e582c863a`
- Status: `pass`
- Checks: clean `npm ci` pass (204 packages); `npm run lint` pass; `npm test` pass (46/46); `npm run build` pass (Vite 7.3.6, 2,410 modules); isolated backend requirements remain installed from the committed manifest; complete backend `unittest` pass (79/79); FastAPI development-mode import pass; real production-mode import with required variables cleared fails before downstream imports and lists `POSTGRES_URL`, `OPENAI_API_KEY`, `GOOGLE_CLIENT_ID`, and `ADMIN_EMAILS`; hard-coded deployment host/API fallback scan pass (0 matches); credential-pattern scan pass (0 matches); conflict-marker scan pass (0 matches); `openspec validate environment-driven-production-config --strict` pass; post-check product HEAD unchanged.
- Unresolved failures: none. Vite retains the known chunk larger than 500 kB warning.
- Next action: `/dev-review`

## Code Review

### Round 1 (2026-07-29 17:19 Asia/Taipei)

- Source: `openspec/changes/environment-driven-production-config/review/2026-07-29_feature-ZAC-84_environment-driven-production-config_codex-review-r1.md`
- Mode: `initial`
- Verdict: `approved`
- Reviewed head: `934e60a3525c7efc007326aca1c1c40f1942499d`
- Transitions: `none`
- Open blockers: `none`
- Follow-ups: existing Vite production chunk-size warning
- Next action: commit only the review and devlog workflow records, then run `/dev-done`
