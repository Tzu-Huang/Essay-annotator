# ZAC-83 Production Baseline Evidence

Evidence date: 2026-07-25 (Asia/Taipei)

This record contains paths, categories, and commit identifiers only. It does not contain credential values, private-key contents, tokens, passwords, database connection strings, or production data.

## Git baseline

| Item | Recorded value |
|---|---|
| Working branch base | local `main` at `1bd70583671b9d50c6ea1d1ae32cfca37406151b` |
| Recorded remote baseline | `origin/main` at `1d335dd2fd11f9a2d30bca24ffbf204ed8e8db76` |
| Broken merge | `1d335dd2fd11f9a2d30bca24ffbf204ed8e8db76` (`merge admin`) |
| Merge parent 1 | `99cfbb6c52497d2adf2aa980d7e427ae9c293ce2` |
| Merge parent 2 | `801c292b588418cd968fe6cf77028d11e6d16cf9` (`feature/admin`) |
| Production checkout | clean `main` at `1d335dd2fd11f9a2d30bca24ffbf204ed8e8db76` |
| Rollback code SHA | `1d335dd2fd11f9a2d30bca24ffbf204ed8e8db76`; known non-starting, retained only as the pre-change code reference |
| Candidate branch | `feature/ZAC-83_repair-production-baseline` |
| Candidate release source | reviewed and tested commit from the candidate branch, merged through a pull request to `main` |
| Approved candidate SHA | `928995c438981927c7b067c26c9792d5a2651515`; verification Round 3 passed and closure review Round 3 approved |
| Merged `main` baseline | `71ad668065287a7eda713b7655bd5344c9aa6dba`; GitHub pull request #3 merge commit |

`frontend-base` is identical to the recorded remote baseline. `feature/admin` is already an ancestor of the broken merge and is used only for read-only comparison; neither branch is a promotion source for this change.

## Launch-v1 behavior inventory

Launch v1 retains these existing application areas unless verification forces an explicit deferral:

- Public frontend routes for home, login, FAQ, essay editor, essay detail, comparison, and not-found handling.
- Google sign-in UI and user login persistence through the existing backend user endpoint.
- Essay search, essay detail retrieval, and comparison feedback.
- Backend health and readiness endpoints with PostgreSQL-first essay loading and JSONL fallback.
- Administrative authentication, overview/usage reporting, essay listing and editing, soft-delete/restore/hard-delete, upload/import, generated-title processing, and embedding regeneration.
- Admin console overview, essays, upload, edit, audit-log, filtering, sorting, pagination, and unsaved-change flows represented by the merged admin work.

Out of scope for this code baseline: production deployment, DNS, HTTPS, reverse proxy, Elastic IP, Security Group changes, branch-protection configuration, credential rotation, and Git-history rewriting.

## Broken-tree inventory

The recorded remote baseline contains 156 merge-marker lines across 12 tracked backend files:

- `BackEnd/app/admin.py`
- `BackEnd/app/state.py`
- `BackEnd/database/essays.py`
- `BackEnd/embedding/make_embedding.py`
- `BackEnd/requirements.txt`
- `BackEnd/scripts/add_to_database.py`
- `BackEnd/scripts/docx_to_txt.py`
- `BackEnd/scripts/import_essays_to_postgres.py`
- `BackEnd/scripts/sync_drive.py`
- `BackEnd/scripts/sync_drive_aws.py`
- `BackEnd/scripts/txt_to_jsonl.py`
- `BackEnd/tests/test_admin_data.py`

The production `essay-api.service` imports this tree and currently fails on a merge marker in `BackEnd/embedding/make_embedding.py`. No code from this change is deployed by `/dev-apply`.

## Tracked artifact classification

| Category | Current tracked examples | Disposition |
|---|---|---|
| Root dependencies | `node_modules/react`, `node_modules/react-icons` (136 tracked files) | Remove from Git; reproduce from `frontend/package-lock.json`; ignore dependency directories |
| Delivery binaries | `_aws_delivery/essay-annotator-app-20260715.tar.gz`, `_aws_delivery/essay-annotator-data-20260715.tar.gz` | Remove from Git; preserve externally only if still required as a point-in-time backup |
| Delivery text evidence | `_aws_delivery/README.md`, `SHA256SUMS.txt`, `excluded-files.txt` | Keep only while accurate and secret-safe; update after binary removal |
| Graph analysis | `graphify-out/.graphify_*`, `GRAPH_REPORT.md`, `graph.html` | Remove from Git; reproducible development output |
| Frontend build/cache | `frontend/dist`, Vite/npm caches if present | Keep untracked and reproducible |
| Python cache/environment | `__pycache__`, `*.pyc`, `.venv` | Keep untracked and reproducible |
| Runtime configuration | `.env` files and credentials | Preserve locally/on host; never track or record values |
| Relational data | PostgreSQL selected by `POSTGRES_URL`; `BackEnd/app_data.db` absent in the audited host | Preserve on production; inventory and back up before later deployment |
| Canonical essay data | `BackEnd/drive_data/finalized_data_jsonl/database.jsonl` | Preserve on production and in a verified backup; keep untracked |
| Embeddings | `BackEnd/drive_data/embed_output/embed.jsonl` | Preserve on production; reproducible at external API cost; keep untracked |
| Import/upload state | `BackEnd/drive_data/new_input`, `essays_jsonl`, and processed inputs | Preserve according to operational ownership; keep untracked |
| Query/results | `query_input`, `query_embed`, `results` | Keep untracked; reproducible/transient unless separately retained |
| Operational logs | systemd journal | Host-managed; do not place in Git |

## Production preservation and deployment constraints

- Production persistent data is under the PostgreSQL configuration and `/home/ubuntu/Essay-annotator/BackEnd/drive_data`; repository cleanup does not authorize deleting either.
- The audited data archive from 2026-07-15 passed its recorded checksum, but it is only a point-in-time copy and not an automated backup policy. A later deployment must verify whether a newer backup is required.
- The host uses Python 3.12 and systemd unit `essay-api.service`; Node.js is not installed, so the frontend production build must be produced and verified before deployment.
- The host currently has no reverse proxy and no listeners on ports 80, 443, or 8000 because the backend fails during startup.
- A later deployment must record a current backup, select an exact merged `main` SHA, verify readiness, and roll code back without overwriting persistent data if readiness fails.
- This change does not modify the EC2 checkout, service, networking, database, runtime files, or production data.
