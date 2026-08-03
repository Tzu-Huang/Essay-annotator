#!/usr/bin/env bash
set -euo pipefail

root=${1:?usage: scan-artifact.sh DIRECTORY}
[[ -d "$root" ]] || { echo "not a directory: $root" >&2; exit 1; }

for forbidden in .git node_modules .venv __pycache__ data uploads runtime; do
  if find "$root" -type d -name "$forbidden" -print -quit | grep -q .; then
    echo "forbidden directory in artifact: $forbidden" >&2; exit 1
  fi
done
if find "$root" -type f \( -name '.env' -o -name '.env.*' -o -name '*.pem' -o -name '*.key' -o -name '*.sqlite*' -o -name '*.db' -o -name '*.jsonl' \) -print -quit | grep -q .; then
  echo "forbidden credential or runtime-data file in artifact" >&2; exit 1
fi
if grep -RIlE --exclude='scan-artifact.sh' '(BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY|sk-[A-Za-z0-9_-]{20,}|postgres(ql)?://[^[:space:]]+:[^[:space:]@]+@)' "$root" | grep -q .; then
  echo "probable secret in artifact" >&2; exit 1
fi
