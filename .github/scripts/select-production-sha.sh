#!/usr/bin/env bash
set -euo pipefail

git fetch --no-tags origin '+refs/heads/main:refs/remotes/origin/main'
if [[ "${EVENT_NAME:?}" == workflow_dispatch ]]; then
  sha="${REQUESTED_SHA:-$(git rev-parse origin/main)}"
  mode="${REQUESTED_MODE:-deploy}"
else
  sha="${PUSH_SHA:?}"
  mode=deploy
fi
sha="$(git rev-parse --verify "${sha}^{commit}")"
[[ "$sha" =~ ^[0-9a-f]{40}$ ]] || { echo 'A full commit SHA is required' >&2; exit 1; }
git merge-base --is-ancestor "$sha" origin/main || { echo 'Selected commit is not reachable from main' >&2; exit 1; }
[[ "$mode" == deploy || "$mode" == rollback-drill ]] || { echo 'Unsupported production mode' >&2; exit 1; }
target_sha=''
if [[ "$mode" == rollback-drill ]]; then
  target_sha="$(git rev-parse --verify "${DRILL_TARGET_SHA:?rollback-drill requires drill_target_sha}^{commit}")"
  [[ "$target_sha" =~ ^[0-9a-f]{40}$ ]] || { echo 'A full drill target SHA is required' >&2; exit 1; }
  git merge-base --is-ancestor "$target_sha" origin/main || { echo 'Drill target is not reachable from main' >&2; exit 1; }
  [[ "$target_sha" != "$sha" ]] || { echo 'Rollback drill requires two distinct releases' >&2; exit 1; }
fi
echo "sha=$sha" >> "${GITHUB_OUTPUT:?}"
echo "mode=$mode" >> "$GITHUB_OUTPUT"
echo "drill_target_sha=$target_sha" >> "$GITHUB_OUTPUT"
