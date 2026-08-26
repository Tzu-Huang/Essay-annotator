#!/usr/bin/env bash
set -euo pipefail

[[ ${EUID} -eq 0 || ${ESSAY_DEPLOY_ALLOW_NON_ROOT:-} == 1 ]] || { echo "run as root" >&2; exit 1; }
root=${ESSAY_DEPLOY_ROOT:-/opt/essay-annotator}
config=${ESSAY_DEPLOY_CONFIG:-/etc/essay-annotator/deploy.conf}
lock=${ESSAY_DEPLOY_LOCK:-/run/lock/essay-annotator-deploy.lock}
env_file=${ESSAY_PRODUCTION_ENV:-/etc/essay-annotator/production.env}
[[ -f "$config" ]] || { echo "missing deployment config" >&2; exit 2; }
# shellcheck disable=SC1090
source "$config"

for name in PRODUCTION_AWS_REGION OPENAI_SECRET_ARN RDS_SECRET_ARN; do
  value=${!name:-}
  [[ -n "$value" && "$value" != CHANGE_ME ]] || { echo "$name is not configured" >&2; exit 2; }
done
[[ "$PRODUCTION_AWS_REGION" =~ ^[a-z]{2}-[a-z]+-[0-9]+$ ]] || { echo "invalid AWS region" >&2; exit 2; }
[[ "$OPENAI_SECRET_ARN" =~ ^arn:aws:secretsmanager:[a-z0-9-]+:[0-9]{12}:secret:[A-Za-z0-9/_+=.@!-]+$ ]] || { echo "invalid OpenAI secret ARN" >&2; exit 2; }
[[ "$RDS_SECRET_ARN" =~ ^arn:aws:secretsmanager:[a-z0-9-]+:[0-9]{12}:secret:[A-Za-z0-9/_+=.@!-]+$ ]] || { echo "invalid RDS secret ARN" >&2; exit 2; }

mkdir -p "$(dirname "$lock")"
exec 9>"$lock"
flock -n 9 || { echo "secret refresh deferred: release operation is active"; exit 0; }

release=$(readlink -f "$root/current" 2>/dev/null || true)
python="$release/.venv/bin/python"
sync_script="$release/deploy/scripts/sync-production-secrets.py"
[[ -x "$python" && -f "$sync_script" ]] || { echo "active release cannot synchronize credentials" >&2; exit 3; }

before=$(sha256sum "$env_file" | awk '{print $1}')
"$python" "$sync_script" \
  --env-file "$env_file" \
  --openai-secret "$OPENAI_SECRET_ARN" \
  --rds-secret "$RDS_SECRET_ARN" \
  --region "$PRODUCTION_AWS_REGION"
after=$(sha256sum "$env_file" | awk '{print $1}')

if [[ "$before" == "$after" ]]; then
  echo "production credentials are current; restart not required"
  exit 0
fi

systemctl restart essay-api
ready_path=${READINESS_PATH:-/api/ready}
attempts=${READINESS_ATTEMPTS:-30}
delay=${READINESS_DELAY_SECONDS:-2}
for _ in $(seq 1 "$attempts"); do
  curl --fail --silent --show-error "http://127.0.0.1:8000${ready_path}" >/dev/null && {
    echo "production credentials refreshed and readiness verified"
    exit 0
  }
  sleep "$delay"
done
echo "credential refresh completed but readiness failed" >&2
exit 4
