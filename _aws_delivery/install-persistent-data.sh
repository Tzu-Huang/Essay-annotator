#!/usr/bin/env bash
set -euo pipefail

if [[ ${EUID} -ne 0 ]]; then
  echo "run as root" >&2
  exit 1
fi

checkout_root=${1:-/home/ubuntu/Essay-annotator}
service_name=${2:-essay-api.service}
service_user=${3:-ubuntu}
service_group=${4:-ubuntu}
source_path="${checkout_root}/BackEnd/drive_data"
stable_root=/var/lib/essay-annotator
stable_path="${stable_root}/drive_data"

systemctl stop "${service_name}"
install -d -o "${service_user}" -g "${service_group}" -m 0750 "${stable_root}"

if [[ -L "${source_path}" ]]; then
  [[ $(readlink -f "${source_path}") == "${stable_path}" ]] || {
    echo "existing drive_data symlink targets an unexpected path" >&2
    exit 1
  }
elif [[ -e "${stable_path}" ]]; then
  echo "both release and stable data paths exist; reconcile them manually" >&2
  exit 1
else
  mv "${source_path}" "${stable_path}"
  ln -s "${stable_path}" "${source_path}"
fi

chown -R "${service_user}:${service_group}" "${stable_path}"
find "${stable_path}" -type d -exec chmod 0750 {} +
find "${stable_path}" -type f -exec chmod 0640 {} +

grep -q '^ESSAY_DATA_ROOT=' /etc/essay-annotator/production.env ||
  printf '%s\n' 'ESSAY_DATA_ROOT=/var/lib/essay-annotator/drive_data' \
    >> /etc/essay-annotator/production.env

systemctl start "${service_name}"
curl --fail --silent --show-error http://127.0.0.1:8000/ready >/dev/null
