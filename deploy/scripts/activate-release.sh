#!/usr/bin/env bash
set -euo pipefail

if [[ ${EUID} -ne 0 ]]; then echo "run as root" >&2; exit 1; fi
artifact=${1:?usage: activate-release.sh ARTIFACT.tgz}
config=${2:-/etc/essay-annotator/deploy.conf}
[[ -f "$artifact" && -f "$config" ]] || { echo "artifact or config missing" >&2; exit 1; }
# shellcheck disable=SC1090
source "$config"
sha=$(basename "$artifact" | sed -nE 's/^essay-annotator-([0-9a-f]{7,40})\.tgz$/\1/p')
[[ -n "$sha" ]] || { echo "artifact name must be essay-annotator-<git-sha>.tgz" >&2; exit 1; }
release="/opt/essay-annotator/releases/$sha"
[[ ! -e "$release" ]] || { echo "release already exists: $release" >&2; exit 1; }
previous=$(readlink -f /opt/essay-annotator/current 2>/dev/null || true)

cleanup_failure() {
  if [[ -n "$previous" && -d "$previous" ]]; then
    ln -sfn "$previous" /opt/essay-annotator/current
    systemctl restart essay-api
  fi
}
trap cleanup_failure ERR

install -d -o root -g root -m 0755 "$release"
if tar -tzf "$artifact" | grep -Eq '(^/|(^|/)\.\.(/|$))'; then
  echo "unsafe path in artifact" >&2; exit 1
fi
tar -xzf "$artifact" -C "$release" --no-same-owner
bash "$release/deploy/scripts/scan-artifact.sh" "$release"
python3 -m venv "$release/.venv"
"$release/.venv/bin/pip" install --disable-pip-version-check --no-cache-dir -r "$release/BackEnd/requirements.txt"
chown -R root:root "$release"
find "$release" -type d -exec chmod 0755 {} +
find "$release" -type f -exec chmod 0644 {} +
chmod 0755 "$release/deploy/scripts/"*.sh "$release/deploy/certbot/"*.sh
ln -sfn "$release" /opt/essay-annotator/current
systemctl restart essay-api

ready_path=${READINESS_PATH:-/api/ready}
for _ in $(seq 1 30); do
  curl --fail --silent --show-error "http://127.0.0.1:8000${ready_path}" >/dev/null && break
  sleep 2
done
curl --fail --silent --show-error "http://127.0.0.1:8000${ready_path}" >/dev/null
trap - ERR

retention=${RELEASE_RETENTION:-2}
mapfile -t old < <(find /opt/essay-annotator/releases -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' | sort -rn | tail -n "+$((retention + 1))" | cut -d' ' -f2-)
for path in "${old[@]}"; do [[ "$path" == "$release" || "$path" == "$previous" ]] || rm -rf -- "$path"; done
echo "activated $sha"
