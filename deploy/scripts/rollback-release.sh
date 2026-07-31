#!/usr/bin/env bash
set -euo pipefail

if [[ ${EUID} -ne 0 ]]; then echo "run as root" >&2; exit 1; fi
target=${1:?usage: rollback-release.sh RELEASE_SHA}
[[ "$target" =~ ^[0-9a-f]{7,40}$ ]] || { echo "invalid release SHA" >&2; exit 1; }
release="/opt/essay-annotator/releases/$target"
[[ -d "$release" ]] || { echo "release not found: $target" >&2; exit 1; }
ln -sfn "$release" /opt/essay-annotator/current
systemctl restart essay-api
for _ in $(seq 1 30); do
  curl --fail --silent "http://127.0.0.1:8000/api/ready" >/dev/null && { echo "rolled back to $target"; exit 0; }
  sleep 2
done
echo "rollback target did not become ready" >&2
exit 1
