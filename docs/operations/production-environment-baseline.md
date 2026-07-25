# Production Environment Baseline

Audit date: 2026-07-25 (Asia/Taipei)

Linear issue: ZAC-82

Status: **Host audit complete; AWS control-plane details still required**

## Evidence labels

- **Observed**: verified directly during this audit.
- **Repository-derived**: inferred from tracked source or delivery documentation and still requires confirmation on the live host.
- **Owner-confirmed**: explicitly confirmed by the project owner.
- **Unresolved**: not verifiable with the currently available access.

No credential values, private-key contents, tokens, passwords, or environment-variable values are recorded here.

## Access result

The owner-confirmed target is `ubuntu@44.201.62.0` using the existing EC2 SSH private key. On 2026-07-25:

- **Observed:** the private-key file exists on the authorized audit workstation; its contents were not read.
- **Observed:** SSH access to `44.201.62.0:22` succeeded after an earlier local-network timeout.
- **Observed:** the host identifies itself as `ip-172-31-12-91`.
- **Observed:** no process listens on TCP 80, 443, or 8000; only SSH listens externally on TCP 22.
- **Observed:** EC2 instance metadata requests timed out, and AWS CLI is unavailable on both the audit workstation and the host.
- **Unresolved:** instance type, region/AZ, Elastic IP association, and complete Security Group rules require AWS Console evidence.

## Repository and deployment access

| Item | Result | Evidence |
|---|---|---|
| Repository | `Tzu-Huang/Essay-annotator` | Observed via Git remote and public GitHub API |
| Visibility | Public | Observed via public GitHub API |
| Default branch | `main` | Observed via public GitHub API |
| Git remote | `https://github.com/Tzu-Huang/Essay-annotator.git` | Observed locally |
| Audited remote `main` | `1d335dd` (`merge admin`) | Observed through read-only `git ls-remote` from production |
| Local `main` | `1bd7058`, one commit ahead of the recorded `origin/main` | Observed locally |
| `frontend-base` | `1d335dd`, matching the recorded `origin/main` | Observed locally |
| Production checkout | `/home/ubuntu/Essay-annotator` | Repository-derived from `_aws_delivery/README.md` |
| Deployment authentication | SSH to EC2 using the owner-controlled PEM key; production accesses GitHub using SSH | Owner-confirmed / observed |
| Deployment authority | Project owner | Owner-confirmed |
| Branch protection | Unresolved: the public protection endpoint requires authenticated GitHub access, and the configured local GitHub credential is invalid | Observed |
| GitHub Actions/workflows | No tracked `.github` workflow was found | Observed locally |

The production checkout is `/home/ubuntu/Essay-annotator` on clean branch `main` at `1d335dd`. It has zero ahead/behind divergence from the recorded `origin/main`, and read-only `git ls-remote` confirmed both remote `main` and `frontend-base` at the same commit. A stale local `frontend-base` branch is 13 commits ahead and 434 behind its remote; it is not the active production branch and must not be treated as a release source.

## AWS infrastructure inventory

| Required attribute | Current result | Required evidence after access is restored |
|---|---|---|
| Instance ID/name | Hostname `ip-172-31-12-91`; EC2 instance ID unresolved | AWS Console/CLI instance record |
| Instance state | Online and reachable by SSH | AWS Console state remains desirable evidence |
| Instance type | Unresolved | EC2 instance details |
| Region / availability zone | Unresolved | EC2 details |
| Operating system | Ubuntu 24.04.4 LTS, kernel `6.17.0-1009-aws`, x86_64 | Observed by SSH |
| CPU / memory | 2 vCPU, 911 MiB RAM, no swap | Observed by SSH; not sufficient to assert instance type |
| Public IPv4 | `44.201.62.0`, reachable by SSH | Owner-confirmed / observed |
| Elastic vs ephemeral IP | Unresolved | Elastic IP association record |
| Storage | One 8 GB NVMe disk; 6.8 GB ext4 root, 3.9 GB used (58%), 2.9 GB available | Observed by SSH; EBS volume identity unresolved |
| Security Group ingress | Unresolved | Rules including protocol, port, and source category |
| Security Group egress | Unresolved | Rules including protocol, port, and destination category |

Security Group evidence must describe rules without copying credentials or unrelated sensitive configuration.

## Runtime service inventory

| Item | Current result | Classification |
|---|---|---|
| Backend service | `essay-api.service`, enabled with `Restart=always` | Observed |
| Service manager | systemd | Observed |
| Backend command | `.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000` | Observed from systemd |
| Working directory / user | `/home/ubuntu/Essay-annotator/BackEnd`, user `ubuntu` | Observed from systemd |
| Backend status | Failing and repeatedly auto-restarting; nothing listens on port 8000 | Observed |
| Failure cause | Committed merge-conflict marker in `BackEnd/embedding/make_embedding.py` causes `SyntaxError` | Observed in journald and tracked production source |
| Web server / reverse proxy | No nginx, Apache, or Caddy executable; no listener on 80/443 | Observed |
| Frontend serving process/path | No active frontend server; pre-built `frontend/dist` is included in the application delivery archive | Observed / repository-derived |
| Python runtime | Python 3.12.3 | Observed |
| Node.js runtime | Node.js and npm are not installed | Observed |
| Firewall | UFW inactive | Observed; AWS Security Group remains the network control |
| Logs | systemd journal, approximately 271.8 MB total journal usage | Observed |
| CloudWatch | Agent not installed; `AWS_REGION` and `AWS_CLOUDWATCH_LOG_GROUP` are not configured in `BackEnd/.env` | Observed by names/configured-state only |

Repository-documented service commands:

```text
sudo systemctl start essay-api
sudo systemctl stop essay-api
sudo systemctl restart essay-api
sudo systemctl status essay-api
journalctl -u essay-api -f
```

The first four commands are confirmed management commands for the live unit. The application is not launch-ready: restarting without correcting the committed conflict marker would only continue the failure loop.

## Persistent data inventory

| Data category | Repository-expected location/configuration | Classification | Live status |
|---|---|---|---|
| Relational database | `POSTGRES_URL` is configured with a PostgreSQL scheme; `BackEnd/app_data.db` is absent | Persistent | Configuration category confirmed; endpoint/value intentionally not recorded |
| Canonical essay JSONL | `BackEnd/drive_data/finalized_data_jsonl/database.jsonl`, 617 KB, owner `ubuntu:ubuntu` | Persistent source data | Present; modified 2026-07-15 |
| Embeddings | `BackEnd/drive_data/embed_output/embed.jsonl`, 35 MB, owner `ubuntu:ubuntu` | Persistent but reproducible at API cost | Present; modified 2026-04-23 |
| New inputs/uploads | Upload API extracts browser uploads in memory; scripts use `BackEnd/drive_data/new_input` (4.7 MB, currently under `processed`) and organized paths | Mixed persistent/import state | Present |
| Essay JSONL inputs | `BackEnd/drive_data/essays_jsonl/`, approximately 696 KB | Persistent/import source | Present |
| Query/results data | `BackEnd/drive_data/query_input`, `query_embed`, and `results` | Reproducible/transient | Present |
| Exports | `BackEnd/drive_data/exports/` | Generated backup/export | Directory absent in current inventory |
| Logs | systemd journal; no CloudWatch agent/configuration | Operational evidence | Local journal only |

`BackEnd/drive_data` is approximately 42 MB and owned by `ubuntu:ubuntu`. The repository contains 2026-07-15 application and data archives under `_aws_delivery`; `sha256sum -c SHA256SUMS.txt` verified both archives. The data archive is a verified point-in-time copy, not evidence of an automated or current backup policy.

## Endpoint readiness

- Direct HTTP by IP is classified as temporary internal validation only.
- No service listens on port 80, 443, or 8000.
- The backend cannot start because production source contains committed merge-conflict markers.
- Domain registration, DNS, and HTTPS are follow-up work and are required before intended public launch, especially for Google sign-in and administrative functionality.

## Required read-only follow-up

Before ZAC-82 can close:

1. Supply AWS Console evidence for instance ID/type, region/AZ, Elastic IP association, and complete Security Group ingress/egress.
2. Create separate fix work for the committed conflict markers and verify the backend can reach readiness.
3. Decide whether the verified 2026-07-15 archive is sufficient for the next deployment or create a newer data backup.
4. Configure branch protection/automated checks in separately authorized GitHub work if desired.

## ZAC-82 acceptance status

| Acceptance criterion | Status |
|---|---|
| Current-state inventory attached or linked | Partial: live host complete; AWS control-plane details remain |
| Elastic vs ephemeral IP confirmed | Blocked |
| Data locations and current startup commands known | Satisfied |
| One release strategy explicitly chosen | Satisfied by `release-and-deployment-policy.md` |
| GitHub branch protection/check policy documented | Satisfied as policy; current GitHub enforcement remains unresolved |
| No credentials or secret values stored | Satisfied for committed audit artifacts |
