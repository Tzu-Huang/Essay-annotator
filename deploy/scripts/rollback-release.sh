#!/usr/bin/env bash
set -euo pipefail

[[ ${ESSAY_DEPLOY_LOCK_HELD:-} == 1 ]] || { echo "use deployctl.sh" >&2; exit 64; }
target=${1:?usage: rollback-release.sh RELEASE_SHA [CONFIG]}
config=${2:-${ESSAY_DEPLOY_CONFIG:-/etc/essay-annotator/deploy.conf}}
[[ "$target" =~ ^[0-9a-f]{40}$ ]] || { echo "invalid release SHA" >&2; exit 2; }
[[ -f "$config" ]] || { echo "config missing" >&2; exit 2; }
# shellcheck disable=SC1090
source "$config"
root=${ESSAY_DEPLOY_ROOT:-/opt/essay-annotator}
release="$root/releases/$target"
[[ -f "$release/.essay-release-complete" ]] || { echo "complete release not found: $target" >&2; exit 3; }
ln -sfn "$release" "$root/current"
systemctl restart essay-api || { echo "rollback=restart_failed" >&2; exit 4; }
ready_path=${READINESS_PATH:-/api/ready}
attempts=${READINESS_ATTEMPTS:-30}
delay=${READINESS_DELAY_SECONDS:-2}
for _ in $(seq 1 "$attempts"); do
  curl --fail --silent --show-error "http://127.0.0.1:8000${ready_path}" >/dev/null && { echo "rollback=verified sha=$target"; exit 0; }
  sleep "$delay"
done
echo "rollback=verification_failed sha=$target" >&2
exit 5
