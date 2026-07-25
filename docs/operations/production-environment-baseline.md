# Production Environment Baseline

Audit date: 2026-07-25 (Asia/Taipei)

Linear issue: ZAC-82

Status: **Blocked — the recorded production address is not reachable from the audit workstation**

## Evidence labels

- **Observed**: verified directly during this audit.
- **Repository-derived**: inferred from tracked source or delivery documentation and still requires confirmation on the live host.
- **Owner-confirmed**: explicitly confirmed by the project owner.
- **Unresolved**: not verifiable with the currently available access.

No credential values, private-key contents, tokens, passwords, or environment-variable values are recorded here.

## Current blocker

The owner-confirmed target is `ubuntu@44.201.62.0` using the existing EC2 SSH private key. On 2026-07-25:

- **Observed:** the private-key file exists on the authorized audit workstation; its contents were not read.
- **Observed:** TCP connection to `44.201.62.0:22` timed out.
- **Observed:** TCP connection to `44.201.62.0:80` timed out.
- **Observed:** the address resolves to an EC2 hostname in `compute-1.amazonaws.com`.
- **Observed:** AWS CLI is not installed on the audit workstation.
- **Unresolved:** whether the instance is running, whether its public IP changed, or whether Security Group/network rules reject the current source address.

The audit MUST NOT proceed to deployment until AWS Console access or restored SSH connectivity establishes the live instance identity and network state.

## Repository and deployment access

| Item | Result | Evidence |
|---|---|---|
| Repository | `Tzu-Huang/Essay-annotator` | Observed via Git remote and public GitHub API |
| Visibility | Public | Observed via public GitHub API |
| Default branch | `main` | Observed via public GitHub API |
| Git remote | `https://github.com/Tzu-Huang/Essay-annotator.git` | Observed locally |
| Audited `origin/main` | `1d335dd` (`merge admin`) | Observed locally; remote fetch was not performed in this audit |
| Local `main` | `1bd7058`, one commit ahead of the recorded `origin/main` | Observed locally |
| `frontend-base` | `1d335dd`, matching the recorded `origin/main` | Observed locally |
| Production checkout | `/home/ubuntu/Essay-annotator` | Repository-derived from `_aws_delivery/README.md` |
| Deployment authentication | SSH to EC2 using the owner-controlled PEM key; GitHub checkout authentication on EC2 remains unresolved | Owner-confirmed / unresolved |
| Deployment authority | Project owner | Owner-confirmed |
| Branch protection | Unresolved: the public protection endpoint requires authenticated GitHub access, and the configured local GitHub credential is invalid | Observed |
| GitHub Actions/workflows | No tracked `.github` workflow was found | Observed locally |

The production checkout's branch, commit, remote, working tree, and divergence from `origin/main` remain unresolved. Existing delivery notes warn that the remote checkout previously had commits ahead of the deployment baseline; this is a hard stop for any update until rechecked.

## AWS infrastructure inventory

| Required attribute | Current result | Required evidence after access is restored |
|---|---|---|
| Instance ID/name | Unresolved | AWS Console/CLI instance record or IMDS identity document |
| Instance state | Unresolved | Running/stopped state and latest transition |
| Instance type | Unresolved | EC2 instance details |
| Region / availability zone | Unresolved; hostname suggests an AWS public EC2 address but is not sufficient evidence | EC2 details or IMDS |
| Operating system | Ubuntu expected | `/etc/os-release` and kernel version |
| Public IPv4 | `44.201.62.0` owner-confirmed as the intended target, but unreachable | Current EC2 network details |
| Elastic vs ephemeral IP | Unresolved | Elastic IP association record |
| Storage | Unresolved | EBS volume details, `lsblk`, and `df` |
| Security Group ingress | Unresolved | Rules including protocol, port, and source category |
| Security Group egress | Unresolved | Rules including protocol, port, and destination category |

Security Group evidence must describe rules without copying credentials or unrelated sensitive configuration.

## Runtime service inventory

| Item | Current result | Classification |
|---|---|---|
| Backend service | `essay-api.service` | Repository-derived from delivery notes and `BackEnd/command` |
| Service manager | systemd expected | Repository-derived |
| Backend process | Uvicorn/FastAPI expected | Repository-derived from `Makefile`, README, and dependencies |
| Backend bind | `0.0.0.0:8000` in the repository development/deployment command | Repository-derived; live listener unresolved |
| Web server / reverse proxy | Unresolved | Live inspection required |
| Frontend serving process/path | Pre-built `frontend/dist` was included in the 2026-07-15 delivery archive | Repository-derived; live serving path unresolved |
| Python runtime | Python 3.10+ expected | Repository-derived; installed version unresolved |
| Node.js runtime | Required for frontend build | Repository-derived; installed version unresolved |
| Logs | `journalctl -u essay-api` expected | Repository-derived; live availability unresolved |
| CloudWatch | Application supports `AWS_REGION` plus `AWS_CLOUDWATCH_LOG_GROUP` | Repository-derived; production configuration unresolved |

Repository-documented service commands:

```text
sudo systemctl start essay-api
sudo systemctl stop essay-api
sudo systemctl restart essay-api
sudo systemctl status essay-api
journalctl -u essay-api -f
```

These commands are expectations, not confirmed live startup commands. The systemd unit's actual `ExecStart`, working directory, user, environment-file locations, restart policy, and enablement state must be captured after access is restored.

## Persistent data inventory

| Data category | Repository-expected location/configuration | Classification | Live status |
|---|---|---|---|
| Relational database | `POSTGRES_URL` selects PostgreSQL; otherwise `BackEnd/app_data.db` is SQLite | Persistent | Active choice, ownership, size, and backup unresolved |
| Canonical essay JSONL | `BackEnd/drive_data/finalized_data_jsonl/database.jsonl` | Persistent source data | Existence, ownership, size, and backup unresolved |
| Embeddings | `BackEnd/drive_data/embed_output/embed.jsonl` | Persistent but reproducible at API cost | Existence, ownership, size, and backup unresolved |
| New inputs/uploads | Upload API extracts files in memory; scripts also use `BackEnd/drive_data/new_input` and organized input paths | Mixed; live workflow unresolved | Unresolved |
| Essay JSONL inputs | `BackEnd/drive_data/essays_jsonl/` | Persistent/import source | Unresolved |
| Query/results data | `BackEnd/drive_data/query_input`, `query_embed`, and `results` | Reproducible/transient unless production process says otherwise | Unresolved |
| Exports | `BackEnd/drive_data/exports/` | Generated backup/export | Unresolved |
| Logs | systemd journal; optional CloudWatch log group | Operational evidence | Retention and shipping unresolved |

The 2026-07-15 delivery package contains a data archive described as the complete `BackEnd/drive_data` tree at that time. It is historical delivery evidence, **not proof of a current production backup**.

## Endpoint readiness

- Direct HTTP by IP is classified as temporary internal validation only.
- The recorded IP did not respond on port 80 during this audit.
- The repository contains references to backend port 8000, but the live listener was not confirmed.
- Domain registration, DNS, and HTTPS are follow-up work and are required before intended public launch, especially for Google sign-in and administrative functionality.

## Required read-only follow-up

After AWS access is restored:

1. Confirm the instance identity, state, current IP, Elastic IP association, region/AZ, type, volumes, and Security Groups in AWS.
2. Connect by SSH and capture OS, mounts, disk utilization, runtimes, processes, listeners, systemd units, reverse proxy, and firewall status.
3. Inspect `/home/ubuntu/Essay-annotator` for remote, branch, commit, working-tree state, and divergence without pulling or modifying it.
4. Record data-path existence, owner/group, size, mount, and backup status without reading sensitive content.
5. Record environment variable **names and configured/not-configured state only** for PostgreSQL and CloudWatch.
6. Replace unresolved entries in this document with dated observed evidence before any deployment.

## ZAC-82 acceptance status

| Acceptance criterion | Status |
|---|---|
| Current-state inventory attached or linked | Partial: this document records repository evidence and the connectivity blocker |
| Elastic vs ephemeral IP confirmed | Blocked |
| Data locations and current startup commands known | Partial: repository expectations known; live state blocked |
| One release strategy explicitly chosen | Satisfied by `release-and-deployment-policy.md` |
| GitHub branch protection/check policy documented | Satisfied as policy; current GitHub enforcement remains unresolved |
| No credentials or secret values stored | Satisfied for committed audit artifacts |
