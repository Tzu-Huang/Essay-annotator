# Developer Admin Console

This change adds a developer-only operations console at `/admin`.

## Access Configuration

Backend environment variables:

```bash
ADMIN_EMAILS=zackeryliu98@gmail.com,zackery032895@gmail.com,tzuhuangliu@gmail.com
ADMIN_WRITE_EMAILS=zackeryliu98@gmail.com,zackery032895@gmail.com,tzuhuangliu@gmail.com
POSTGRES_URL=postgresql://...
OPENAI_API_KEY=...
OPENAI_ADMIN_API_KEY=... # optional; falls back to OPENAI_API_KEY for usage calls
AWS_REGION=us-east-1
AWS_CLOUDWATCH_LOG_GROUP=/aws/ec2/essay-annotator
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

Frontend environment variables:

```bash
VITE_API_URL=http://44.201.62.0:8000
VITE_ADMIN_EMAILS=zackeryliu98@gmail.com,zackery032895@gmail.com,tzuhuangliu@gmail.com
```

For local development only, the repo `.env` files can use wildcard access:

```bash
# BackEnd/.env
ADMIN_EMAILS=*
ADMIN_WRITE_EMAILS=*

# Frontend/.env
VITE_ADMIN_EMAILS=*
```

Do not deploy wildcard admin access to AWS. Replace `*` with the allowlisted developer email addresses before production deployment.

The current admin API contract uses the signed-in Google profile email from the frontend and sends it as `X-Admin-Email`. This is enough for the first internal deployment behind the allowlist, but production hardening should replace it with server-side Google ID token verification.

## Data Migration

Create tables:

```bash
cd BackEnd
python -c "from database.create import create_tables; create_tables()"
```

Import existing essay JSONL into PostgreSQL:

```bash
cd BackEnd
python scripts/import_essays_to_postgres.py
```

Export PostgreSQL essays back to JSONL for backup or rollback:

```bash
cd BackEnd
python scripts/export_essays_from_postgres.py
```

After import, call the protected reload endpoint or restart the backend so in-memory search state reads the migrated essay records.

## AWS Permissions

The admin log viewer requires EC2/backend logs to be shipped to CloudWatch first. If no log group exists yet, create one and configure the EC2 instance or service to send `essay-api` logs there before treating the Logs tab as production-ready.

Suggested production setup:

```bash
sudo yum install -y amazon-cloudwatch-agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard
sudo systemctl restart amazon-cloudwatch-agent
```

Configure the agent to collect the systemd journal for `essay-api` or the backend log file used by your service, and send it to `/aws/ec2/essay-annotator` in the selected AWS region.

The backend only needs read permissions for CloudWatch logs. Scope IAM to the configured log group where possible:

```text
logs:FilterLogEvents
logs:GetLogEvents
logs:DescribeLogStreams
```

The admin console does not expose AWS mutation actions.

If CloudWatch is not configured, the Logs tab shows setup status instead of attempting broad AWS discovery or SSH-style log access.

## Operational Notes

- Essay delete is soft delete only.
- Essay create and embedding-relevant edits mark `embedding_status` as `stale`.
- The embedding regeneration endpoint currently queues the record by setting `embedding_status` to `queued` and writing embedding metadata; the existing embedding pipeline still performs actual vector generation.
- Every successful essay create, update, soft delete, and embedding queue action writes an audit log entry.
- Usage data combines local app-side usage events with official OpenAI cost data when credentials are configured.
