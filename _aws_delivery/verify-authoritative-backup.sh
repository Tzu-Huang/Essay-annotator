#!/usr/bin/env bash
set -euo pipefail

bucket=${ESSAY_BACKUP_BUCKET:?ESSAY_BACKUP_BUCKET is required}
archive_key=${1:?archive key is required}
digest_key=${2:-${archive_key}.sha256}
region=${AWS_REGION:-us-east-1}
work_dir=$(mktemp -d)
trap 'rm -rf -- "${work_dir}"' EXIT

archive="${work_dir}/$(basename "${archive_key}")"
digest="${archive}.sha256"
restore_root="${work_dir}/restore"

aws s3 cp "s3://${bucket}/${archive_key}" "${archive}" \
  --region "${region}" --only-show-errors
aws s3 cp "s3://${bucket}/${digest_key}" "${digest}" \
  --region "${region}" --only-show-errors

(
  cd "${work_dir}"
  sha256sum --check "$(basename "${digest}")"
)
tar --list --file "${archive}" >/dev/null
mkdir -m 0700 "${restore_root}"
tar --extract --gzip --file "${archive}" --directory "${restore_root}"

test -s "${restore_root}/finalized_data_jsonl/database.jsonl"
test -s "${restore_root}/embed_output/embed.jsonl"
find "${restore_root}" -type d -exec chmod 0750 {} +
find "${restore_root}" -type f -exec chmod 0640 {} +

file_count=$(find "${restore_root}" -type f | wc -l)
total_bytes=$(du -sb "${restore_root}" | awk '{print $1}')
database_rows=$(wc -l < "${restore_root}/finalized_data_jsonl/database.jsonl")
embedding_rows=$(wc -l < "${restore_root}/embed_output/embed.jsonl")
printf 'restore_validation=pass files=%s bytes=%s database_rows=%s embedding_rows=%s\n' \
  "${file_count}" "${total_bytes}" "${database_rows}" "${embedding_rows}"
