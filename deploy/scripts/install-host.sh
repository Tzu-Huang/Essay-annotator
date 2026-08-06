#!/usr/bin/env bash
set -euo pipefail

if [[ ${EUID} -ne 0 ]]; then echo "run as root" >&2; exit 1; fi
config=${1:-/etc/essay-annotator/deploy.conf}
[[ -f "$config" ]] || { echo "missing $config" >&2; exit 1; }
# shellcheck disable=SC1090
source "$config"
for name in PRODUCTION_HOSTNAME ADMIN_EMAIL MAX_UPLOAD_SIZE PROXY_TIMEOUT_SECONDS; do
  value=${!name:-}
  [[ -n "$value" && "$value" != CHANGE_ME ]] || { echo "$name is not configured" >&2; exit 1; }
done
[[ "$PRODUCTION_HOSTNAME" =~ ^[A-Za-z0-9.-]+$ ]] || { echo "invalid hostname" >&2; exit 1; }
[[ "$MAX_UPLOAD_SIZE" =~ ^[1-9][0-9]*[kKmMgG]$ ]] || { echo "invalid upload size" >&2; exit 1; }
[[ "$PROXY_TIMEOUT_SECONDS" =~ ^[1-9][0-9]*$ ]] || { echo "invalid timeout" >&2; exit 1; }

getent passwd essay-api >/dev/null || useradd --system --home-dir /nonexistent --no-create-home --shell /usr/sbin/nologin essay-api
install -d -o root -g root -m 0755 /opt/essay-annotator/releases /etc/essay-annotator
install -d -o essay-api -g essay-api -m 0750 /var/lib/essay-annotator
install -d -o www-data -g www-data -m 0755 /var/www/letsencrypt
install -d -o root -g root -m 0755 /etc/letsencrypt/renewal-hooks/deploy
[[ -f /etc/essay-annotator/production.env ]] || install -o root -g root -m 0600 /dev/null /etc/essay-annotator/production.env

install -o root -g root -m 0644 deploy/systemd/essay-api.service /etc/systemd/system/essay-api.service
sed -e "s/\${PRODUCTION_HOSTNAME}/$PRODUCTION_HOSTNAME/g" \
    deploy/nginx/essay-annotator-bootstrap.conf.template >/etc/nginx/sites-available/essay-annotator.conf
ln -sfn /etc/nginx/sites-available/essay-annotator.conf /etc/nginx/sites-enabled/essay-annotator.conf
install -o root -g root -m 0755 deploy/certbot/renewal-deploy-hook.sh /etc/letsencrypt/renewal-hooks/deploy/essay-annotator-nginx
systemctl daemon-reload
nginx -t

echo "Host manifests installed. Obtain the certificate, then run deploy/scripts/enable-tls.sh:"
echo "certbot certonly --webroot -w /var/www/letsencrypt -d $PRODUCTION_HOSTNAME -m $ADMIN_EMAIL --agree-tos"
