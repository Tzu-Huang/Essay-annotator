# Runtime Provisioning Evidence

Recorded: 2026-07-31; network baseline refreshed 2026-08-03

## Stable address and DNS

- Elastic IP `3.81.244.70` is associated with production instance
  `i-02872a5190a894a64`.
- Route 53 apex A record `essayannotator.com` resolves to `3.81.244.70` with
  TTL 300.
- The existing FastAPI service remained healthy after the address change and
  reported 219 essays loaded from PostgreSQL.

## Host capacity and prerequisites

- Root EBS volume `vol-0c44b475e45bccf49` was expanded from 8 GiB to 16 GiB.
- Partition `/dev/nvme0n1p1` and its ext4 filesystem were extended online.
- Root filesystem capacity is 15 GiB with 9.1 GiB available after expansion.
- Nginx 1.24, Certbot 2.9, and Python 3 venv support are installed.
- Non-login account `essay-api` exists with runtime directories under
  `/opt/essay-annotator`, `/etc/essay-annotator`, and
  `/var/lib/essay-annotator`.

## DNS and TLS bootstrap

- HTTP requests to `essayannotator.com` redirect to HTTPS.
- Let's Encrypt issued the certificate for `essayannotator.com`; its initial
  expiry date is 2026-10-29.
- `certbot.timer` is enabled and active.
- `certbot renew --dry-run` completed successfully with no renewal failures.
- Nginx configuration validation passed before reload.
- HTTPS intentionally returns 503 until a readiness-gated release is activated.

## Remaining baseline gaps

- Release `6aa05dd` is active through `/opt/essay-annotator/current`. Its
  release-local virtual environment and built frontend artifact are installed;
  Node/npm is not installed on the EC2 host.
- Systemd runs the API as `essay-api` from the active release, without reload,
  on `127.0.0.1:8000`. The shared data tree is owned by `essay-api` and the
  readiness endpoint reports 219 essays.
- Nginx serves the SPA with direct-route fallback and proxies `/api` with a
  25M body limit and 120-second send/read timeouts. Public root and SPA refresh
  returned 200; health and readiness returned 200; a small unauthenticated
  multipart request reached API authentication (401) and a 26 MiB request was
  rejected by Nginx (413).
- Security Group `sg-0000e0c75752cb6da` permits public TCP 80 and 443, permits
  TCP 22 only from the operator source `36.228.96.187/32`, and has no public
  ingress for legacy port 8000. The VPC main route table has an active default
  route through `igw-08b04da792eb7170f`, and the subnet network ACL allows
  inbound and outbound traffic.
- External regression checks returned HTTP 301 to HTTPS and the intentional
  pre-cutover HTTPS 503; external TCP 8000 was unreachable after hardening.
- Process-failure restart and EC2 reboot recovery succeeded. The legacy
  `abb78dd` service was not ready when exercised as a rollback target, so a
  release-directory rollback target still needs to be verified.
- OpenAI and PostgreSQL credential rotation remains deferred by the operator.
