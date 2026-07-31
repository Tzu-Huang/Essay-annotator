# Runtime Provisioning Evidence

Recorded: 2026-07-31

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

- Production still runs source commit `abb78dd49770e29ce45017a29acdc4d461bb9b85`
  from the legacy checkout and legacy systemd unit.
- The exact Security Group rule inventory could not be queried through the EC2
  instance role. External checks show SSH, HTTP, HTTPS, and legacy port 8000
  reachable during migration.
- No release-directory rollback target has been installed and exercised yet.
- OpenAI and PostgreSQL credential rotation remains deferred by the operator.
