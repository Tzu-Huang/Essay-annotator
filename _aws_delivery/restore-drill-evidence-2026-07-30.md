# RDS restore drill evidence — 2026-07-30

## Result

- Drill reference: `ZAC-85-2026-07-30`
- Overall result: **PASS**
- Region: `us-east-1`
- Engine: Amazon RDS for PostgreSQL `17.10`
- Recovery class: `db.t4g.micro`, Single-AZ
- Restore target: isolated, private, encrypted, non-production
- Temporary restore instance and drill security group: deleted after validation

This record intentionally omits account numbers, resource identifiers, endpoint
hostnames, subnet/security-group identifiers, credentials, connection strings,
secret references, and raw production rows.

## Recovery objectives

| Check | Evidence | Result |
| --- | --- | --- |
| Selected recovery point UTC | `2026-07-30T03:54:42Z` | recorded |
| Drill start UTC | `2026-07-30T03:59:10.3935117Z` | recorded |
| Validation complete UTC | `2026-07-30T05:04:14.2338584Z` | recorded |
| RPO duration | approximately 4 minutes 28 seconds | PASS (`<= 24 hours`) |
| RTO duration | approximately 1 hour 5 minutes 4 seconds | PASS (`<= 4 hours`) |

## Validation

| Check | Evidence | Result |
| --- | --- | --- |
| Private placement | No public endpoint; drill-only PostgreSQL access from the EC2 validation host | PASS |
| Encryption | Restored RDS storage reported encrypted | PASS |
| Schema | All five expected application tables present | PASS |
| Row counts | users `3`, essays `219`, essay embeddings `0`, admin audit logs `1`, usage events `193` | PASS |
| Representative record | Essay identifier SHA-256 matched production: `a5ea7cd2a1b6cc065cc10d62614ea1a8a249cee9b30d212e56afa5254268d081` | PASS |
| Backend connectivity | Production backend virtual environment connected through SQLAlchemy from the EC2 validation host | PASS |
| Representative read | Ordered essay lookup completed against the restored database | PASS |
| Production isolation | Production service configuration was not pointed at the drill target | PASS |
| Cleanup | Drill env, scripts, RDS instance, and security group removed | PASS |

## Production cutover evidence

- Source PostgreSQL remained unchanged during the initial copy.
- Backend writes were stopped for the final synchronized copy.
- Source and target counts matched before cutover.
- An encrypted manual pre-cutover snapshot reached `available`.
- The systemd service consumes a root-owned mode `0600` environment file outside
  the release directory.
- A root-owned mode `0600` pre-RDS rollback environment file remains available.
- The release-directory `.env` was removed after successful readiness checks.
- Production `/health` reported ready with 219 essays and no startup error.
- Production `/ready` returned HTTP 200 with 219 essays.
- Production database schema, counts, and representative read validation passed.

## Follow-up

- Repeat the drill quarterly and retain the same secret-safe evidence fields.
- Review measured restore duration as data grows; begin a Multi-AZ review if two
  drills breach the four-hour RTO or the safety margin becomes insufficient.
- Keep the USD 18 monthly RDS budget alerts active and review forecasted
  overages before increasing instance or storage capacity.
