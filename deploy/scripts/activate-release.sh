#!/usr/bin/env bash
set -euo pipefail

[[ ${ESSAY_DEPLOY_LOCK_HELD:-} == 1 ]] || { echo "use deployctl.sh" >&2; exit 64; }
artifact=${1:?usage: activate-release.sh ARTIFACT SHA256 [CONFIG]}
expected_digest=${2:?missing SHA-256 digest}
config=${3:-${ESSAY_DEPLOY_CONFIG:-/etc/essay-annotator/deploy.conf}}
[[ -f "$artifact" && -f "$config" ]] || { echo "artifact or config missing" >&2; exit 2; }
# shellcheck disable=SC1090
source "$config"

sha=$(basename "$artifact" | sed -nE 's/^essay-annotator-([0-9a-f]{40})\.tgz$/\1/p')
[[ -n "$sha" ]] || { echo "artifact name must contain a full lowercase commit SHA" >&2; exit 2; }
[[ "$expected_digest" =~ ^[0-9a-f]{64}$ ]] || { echo "invalid SHA-256 digest" >&2; exit 2; }
actual_digest=$(sha256sum "$artifact" | awk '{print $1}')
[[ "$actual_digest" == "$expected_digest" ]] || { echo "artifact checksum mismatch" >&2; exit 3; }

root=${ESSAY_DEPLOY_ROOT:-/opt/essay-annotator}
releases="$root/releases"
release="$releases/$sha"
staging="$releases/.staging-$sha-${DEPLOYMENT_ID:-$$}"
current="$root/current"
complete=.essay-release-complete
previous=$(readlink -f "$current" 2>/dev/null || true)
install -d -o root -g root -m 0755 "$releases"

if [[ -d "$release" ]]; then
  [[ -f "$release/$complete" ]] || { echo "inconsistent partial release: $release" >&2; exit 4; }
  [[ "$(cat "$release/$complete")" == "$expected_digest" ]] || { echo "release digest differs from requested artifact" >&2; exit 4; }
  echo "preparation=idempotent"
else
  [[ ! -e "$staging" ]] || { echo "staging path already exists" >&2; exit 4; }
  cleanup_staging() { rm -rf -- "$staging"; }
  trap cleanup_staging EXIT
  install -d -o root -g root -m 0755 "$staging"
  if tar -tzf "$artifact" | grep -Eq '(^/|(^|/)\.\.(/|$))'; then
    echo "unsafe path in artifact" >&2; exit 3
  fi
  tar -xzf "$artifact" -C "$staging" --no-same-owner
  bash "$staging/deploy/scripts/scan-artifact.sh" "$staging"
  python3 -m venv "$staging/.venv"
  "$staging/.venv/bin/pip" install --disable-pip-version-check --no-cache-dir -r "$staging/BackEnd/requirements.lock.txt"
  chown -R root:root "$staging"
  find "$staging" -type d -exec chmod 0755 {} +
  find "$staging" -type f -exec chmod 0644 {} +
  chmod 0755 "$staging/deploy/scripts/"*.sh "$staging/deploy/certbot/"*.sh
  printf '%s\n' "$expected_digest" >"$staging/$complete"
  mv "$staging" "$release"
  trap - EXIT
  echo "preparation=complete"
fi

ln -sfn "$release" "$current"
if ! systemctl restart essay-api; then
  echo "activation=restart_failed" >&2
  exit 5
fi

ready_path=${READINESS_PATH:-/api/ready}
attempts=${READINESS_ATTEMPTS:-30}
delay=${READINESS_DELAY_SECONDS:-2}
healthy=false
for _ in $(seq 1 "$attempts"); do
  if curl --fail --silent --show-error "http://127.0.0.1:8000${ready_path}" >/dev/null; then healthy=true; break; fi
  sleep "$delay"
done
if [[ "$healthy" != true ]]; then
  echo "activation=health_failed previous=$previous" >&2
  exit 6
fi
touch "$release/.essay-release-known-good"
echo "activation=healthy sha=$sha previous=$previous"

retention=${RELEASE_RETENTION:-2}
[[ "$retention" =~ ^[1-9][0-9]*$ ]] || { echo "invalid release retention" >&2; exit 2; }
mapfile -t old < <(find "$releases" -mindepth 1 -maxdepth 1 -type d ! -name '.staging-*' -printf '%T@ %p\n' | sort -rn | tail -n "+$((retention + 1))" | cut -d' ' -f2-)
for path in "${old[@]}"; do [[ "$path" == "$release" || "$path" == "$previous" ]] || rm -rf -- "$path"; done
