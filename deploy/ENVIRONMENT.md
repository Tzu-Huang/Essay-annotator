# Production environment contract

Production uses one public origin. Nginx serves `frontend/dist` and forwards
browser requests under `/api/` to FastAPI on `127.0.0.1:8000`, stripping the
public `/api` prefix. Do not put secret values in this repository.

## Frontend build-time variables

| Variable | Requirement | Default | Purpose |
|---|---|---|---|
| `VITE_API_BASE` | Optional | `/api` | Browser-facing API base. Keep the default for same-origin production. |
| `VITE_GOOGLE_LOGIN_ID` | Required for login | None | Public Google OAuth client ID injected by Vite at build time. |
| `VITE_ADMIN_EMAILS` | Optional | Project development allowlist | Client-side admin navigation gate; backend authorization remains authoritative. |

Vite variables are embedded into static assets. They are public and must never
contain secrets.

## FastAPI runtime variables

Set `APP_ENV=production`. Startup fails and lists missing variable names when
any required launch variable is absent.

| Variable | Requirement | Safe example shape | Purpose |
|---|---|---|---|
| `APP_ENV` | Required | `production` | Enables production validation and CORS policy. |
| `POSTGRES_URL` | Required | `<set-in-secret-store>` | PostgreSQL connection URL. |
| `OPENAI_API_KEY` | Required | `<set-in-secret-store>` | Search, comparison, title, and embedding API access. |
| `GOOGLE_CLIENT_ID` | Required | `<configured-client-id>` | Server-side Google credential audience validation. |
| `ADMIN_EMAILS` | Required | `admin@example.com` | Comma-separated admin read allowlist. |
| `ADMIN_WRITE_EMAILS` | Optional | `owner@example.com` | Comma-separated admin mutation allowlist. |
| `CORS_ORIGINS` | Optional | `https://admin.example.com` | Extra cross-origin browser origins. Same-origin production needs none; `*` is rejected. |
| `OPENAI_ADMIN_API_KEY` | Optional | `<set-in-secret-store>` | Official usage/cost API access. |
| `AWS_REGION` | Optional | `us-east-1` | CloudWatch integration region. |
| `AWS_CLOUDWATCH_LOG_GROUP` | Optional | `/service/example` | CloudWatch log group. |

Drive synchronization variables are optional for API startup and are required
only when their corresponding operational scripts run.

## Commands

Development:

```bash
make api-dev
make web-dev
```

Production build and backend process:

```bash
make web-build
make api-prod
```

Production must not use `npm run dev`, Vite preview as a public server, or
Uvicorn `--reload`.

## Health checks

- Public liveness: `GET /api/health` → FastAPI `GET /health`
- Public readiness: `GET /api/ready` → FastAPI `GET /ready`

These requests inspect local process/application state and do not call OpenAI,
Google, AWS, or another paid/external service. Readiness returns HTTP 503 when
startup initialization is incomplete or failed.
