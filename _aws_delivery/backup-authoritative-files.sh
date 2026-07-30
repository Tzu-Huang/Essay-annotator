#!/usr/bin/env bash
set -euo pipefail

source_root=/var/lib/essay-annotator
data_root="${source_root}/drive_data"
bucket=${ESSAY_BACKUP_BUCKET:?ESSAY_BACKUP_BUCKET is required}
region=${AWS_REGION:-us-east-1}
timestamp=$(date -u +%Y%m%dT%H%M%SZ)
day=$(date -u +%Y-%m-%d)
work_dir=$(mktemp -d)

finish() {
  exit_code=$?
  trap - EXIT
  metric_value=0
  [[ ${exit_code} -eq 0 ]] && metric_value=1
  if ! aws cloudwatch put-metric-data \
    --namespace EssayAnnotator/Backups \
    --metric-data "MetricName=AuthoritativeBackupSuccess,Dimensions=[{Name=BackupName,Value=authoritative-files}],Value=${metric_value},Unit=Count" \
    --region "${region}"; then
    [[ ${exit_code} -ne 0 ]] || exit_code=1
  fi
  rm -rf -- "${work_dir}"
  exit "${exit_code}"
}
trap finish EXIT

archive="${work_dir}/authoritative-files-${timestamp}.tar.gz"
digest="${archive}.sha256"

required_paths=(
  finalized_data_jsonl/database.jsonl
  embed_output/embed.jsonl
)
backup_paths=(
  finalized_data_jsonl
  embed_output
  new_input
  organized_data
  essays_jsonl
)

for required_path in "${required_paths[@]}"; do
  [[ -f "${data_root}/${required_path}" ]] || {
    echo "required authoritative file missing: ${required_path}" >&2
    exit 1
  }
done

present_paths=()
for backup_path in "${backup_paths[@]}"; do
  [[ -e "${data_root}/${backup_path}" ]] && present_paths+=("${backup_path}")
done

tar --create --gzip --file "${archive}" --directory "${data_root}" "${present_paths[@]}"
(
  cd "${work_dir}"
  sha256sum "$(basename "${archive}")" > "$(basename "${digest}")"
)
aws s3 cp "${archive}" "s3://${bucket}/daily/${day}/$(basename "${archive}")" \
  --region "${region}" --sse AES256 --only-show-errors
aws s3 cp "${digest}" "s3://${bucket}/daily/${day}/$(basename "${digest}")" \
  --region "${region}" --sse AES256 --only-show-errors
