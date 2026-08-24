#!/usr/bin/env bash
set -euo pipefail

base_url="${1:?usage: smoke-production.sh https://hostname}"
[[ "$base_url" == https://* ]] || { echo 'Production smoke checks require HTTPS' >&2; exit 1; }
base_url="${base_url%/}"
attempts="${ATTEMPTS:-10}"
connect_timeout="${CONNECT_TIMEOUT_SECONDS:-5}"
max_time="${MAX_TIME_SECONDS:-10}"
probe() {
  curl --fail --silent --show-error --location \
    --connect-timeout "$connect_timeout" --max-time "$max_time" \
    --output /dev/null "${base_url}$1"
}
for ((attempt = 1; attempt <= attempts; attempt++)); do
  if probe / && probe /api/ready; then
    echo "Public SPA and API readiness checks passed on attempt $attempt."
    exit 0
  fi
  (( attempt == attempts )) || sleep 3
done
echo "Public SPA or API readiness failed after ${attempts} attempts." >&2
exit 1
