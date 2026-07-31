#!/usr/bin/env bash
set -euo pipefail

if [[ ${EUID} -ne 0 ]]; then echo "run as root" >&2; exit 1; fi
config=${1:-/etc/essay-annotator/deploy.conf}
[[ -f "$config" ]] || { echo "missing $config" >&2; exit 1; }
# shellcheck disable=SC1090
source "$config"
[[ "${PRODUCTION_HOSTNAME:-}" =~ ^[A-Za-z0-9.-]+$ ]] || { echo "invalid hostname" >&2; exit 1; }
[[ "${MAX_UPLOAD_SIZE:-}" =~ ^[1-9][0-9]*[kKmMgG]$ ]] || { echo "invalid upload size" >&2; exit 1; }
[[ "${PROXY_TIMEOUT_SECONDS:-}" =~ ^[1-9][0-9]*$ ]] || { echo "invalid timeout" >&2; exit 1; }
[[ -f "/etc/letsencrypt/live/$PRODUCTION_HOSTNAME/fullchain.pem" ]] || {
  echo "certificate missing for $PRODUCTION_HOSTNAME" >&2; exit 1;
}
sed -e "s/\${PRODUCTION_HOSTNAME}/$PRODUCTION_HOSTNAME/g" \
    -e "s/\${MAX_UPLOAD_SIZE}/$MAX_UPLOAD_SIZE/g" \
    -e "s/\${PROXY_TIMEOUT_SECONDS}/$PROXY_TIMEOUT_SECONDS/g" \
    deploy/nginx/essay-annotator.conf.template >/etc/nginx/sites-available/essay-annotator.conf
nginx -t
systemctl reload nginx
