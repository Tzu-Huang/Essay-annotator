#!/usr/bin/env bash
set -euo pipefail

[[ ${EUID} -eq 0 || ${ESSAY_DEPLOY_ALLOW_NON_ROOT:-} == 1 ]] || { echo "run as root" >&2; exit 1; }
action=${1:-}; shift || true
case "$action" in deploy|rollback|rollback-drill) ;; *) echo "usage: essay-annotator-deploy deploy|rollback|rollback-drill [options]" >&2; exit 64;; esac
root=${ESSAY_DEPLOY_ROOT:-/opt/essay-annotator}
config=${ESSAY_DEPLOY_CONFIG:-/etc/essay-annotator/deploy.conf}
lock=${ESSAY_DEPLOY_LOCK:-/run/lock/essay-annotator-deploy.lock}
audit=${ESSAY_DEPLOY_AUDIT:-/var/log/essay-annotator/deployments.jsonl}
state_dir=${ESSAY_DEPLOY_STATE_DIR:-/var/lib/essay-annotator/deploy-state}
script_dir=$(cd "$(dirname "$0")" && pwd)
mkdir -p "$(dirname "$lock")" "$(dirname "$audit")" "$state_dir"
chmod 0700 "$state_dir"
exec 9>"$lock"
flock -n 9 || { echo "another release operation is active" >&2; exit 75; }
export ESSAY_DEPLOY_LOCK_HELD=1

sha=""; target_sha=""; digest=""; bucket=""; key=""
deployment_id=""; actor=""; trigger=""; reason=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --sha) sha=${2:-}; shift 2;; --target-sha) target_sha=${2:-}; shift 2;;
    --digest) digest=${2:-}; shift 2;; --bucket) bucket=${2:-}; shift 2;; --key) key=${2:-}; shift 2;;
    --deployment-id) deployment_id=${2:-}; shift 2;; --actor) actor=${2:-}; shift 2;; --trigger) trigger=${2:-}; shift 2;;
    --reason) reason=${2:-}; shift 2;;
    *) echo "unknown option: $1" >&2; exit 64;;
  esac
done
valid_id='^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$'
deployment_id=${deployment_id:-manual-$(date -u +%Y%m%dT%H%M%SZ)}
actor=${actor:-manual}; trigger=${trigger:-manual}
[[ "$deployment_id" =~ $valid_id && "$actor" =~ $valid_id && "$trigger" =~ $valid_id ]] || { echo "invalid deployment metadata" >&2; exit 64; }
[[ -z "$reason" || "$reason" =~ $valid_id ]] || { echo "invalid deployment reason" >&2; exit 64; }
started=$(date -u +%Y-%m-%dT%H:%M:%SZ)
previous=$(basename "$(readlink -f "$root/current" 2>/dev/null || true)")
requested_sha=""; health=not_run; rollback_outcome=not_needed; result=failed; phase=$action

write_audit() {
  local ended active
  ended=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  active=$(basename "$(readlink -f "$root/current" 2>/dev/null || true)")
  python3 - "$audit" "$deployment_id" "$actor" "$trigger" "$requested_sha" "$digest" "$started" "$ended" "$previous" "$active" "$health" "$result" "$rollback_outcome" "$phase" "$reason" <<'PY'
import json, os, sys
path, deployment_id, actor, trigger, sha, digest, started, ended, previous, active, health, result, rollback, phase, reason = sys.argv[1:]
record = {"deployment_id": deployment_id, "actor": actor, "trigger": trigger,
          "requested_sha": sha, "artifact_digest": digest, "started_at": started,
          "ended_at": ended, "previous_release": previous, "resulting_release": active,
          "internal_health": health, "final_result": result,
          "rollback_outcome": rollback, "failed_phase": phase if result != "success" else None,
          "reason": reason or None}
fd=os.open(path, os.O_WRONLY|os.O_CREAT|os.O_APPEND, 0o600)
with os.fdopen(fd, "a", encoding="utf-8") as f: f.write(json.dumps(record, separators=(",", ":"))+"\n")
PY
}
trap write_audit EXIT

case "$action" in
  deploy)
    requested_sha=$sha
    [[ "$requested_sha" =~ ^[0-9a-f]{40}$ && "$digest" =~ ^[0-9a-f]{64}$ ]] || { echo "invalid artifact identity" >&2; exit 64; }
    [[ "$bucket" =~ ^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$ && "$key" =~ ^[A-Za-z0-9][A-Za-z0-9._/-]{0,511}$ && "$key" != *..* ]] || { echo "invalid artifact location" >&2; exit 64; }
    artifact_dir=$(mktemp -d "${TMPDIR:-/tmp}/essay-deploy.XXXXXX")
    artifact="$artifact_dir/essay-annotator-$requested_sha.tgz"
    trap 'rm -rf -- "$artifact_dir"; write_audit' EXIT
    if ! aws s3 cp "s3://$bucket/$key" "$artifact" --only-show-errors; then phase=download; exit 2; fi
    if "$script_dir/activate-release.sh" "$artifact" "$digest" "$config"; then
      if [[ "$previous" =~ ^[0-9a-f]{40}$ ]]; then
        state_tmp="$state_dir/.$deployment_id.previous-sha.tmp.$$"
        printf '%s\n' "$previous" >"$state_tmp"
        chmod 0600 "$state_tmp"
        mv "$state_tmp" "$state_dir/$deployment_id.previous-sha"
      fi
      health=passed; result=success; phase=complete; exit 0
    else
      rc=$?
    fi
    health=failed
    if (( rc >= 2 && rc <= 4 )); then
      phase=preparation; rollback_outcome=not_needed; exit "$rc"
    fi
    phase=activation
    if [[ -n "$previous" && "$previous" =~ ^[0-9a-f]{40}$ ]]; then
      if "$script_dir/rollback-release.sh" "$previous" "$config"; then rollback_outcome=verified; else rollback_outcome=verification_failed; fi
    else rollback_outcome=no_previous_release; fi
    exit "$rc"
    ;;
  rollback)
    requested_sha=$sha
    if [[ -z "$requested_sha" ]]; then
      state_file="$state_dir/$deployment_id.previous-sha"
      [[ -f "$state_file" ]] || { echo "no saved previous release for deployment: $deployment_id" >&2; exit 3; }
      requested_sha=$(cat "$state_file")
    fi
    [[ "$requested_sha" =~ ^[0-9a-f]{40}$ ]] || { echo "invalid release SHA" >&2; exit 64; }
    if "$script_dir/rollback-release.sh" "$requested_sha" "$config"; then health=passed; result=success; rollback_outcome=verified; phase=complete; exit 0
    else rc=$?; fi
    rollback_outcome=verification_failed; health=failed; exit "$rc"
    ;;
  rollback-drill)
    first=$sha; second=$target_sha
    [[ "$first" =~ ^[0-9a-f]{40}$ && "$second" =~ ^[0-9a-f]{40}$ && "$first" != "$second" ]] || { echo "drill requires two distinct full SHAs" >&2; exit 64; }
    initial=$(basename "$(readlink -f "$root/current" 2>/dev/null || true)")
    [[ "$initial" == "$first" || "$initial" == "$second" ]] || { echo "one drill release must be initially active" >&2; exit 3; }
    other=$first; [[ "$initial" == "$first" ]] && other=$second
    [[ -f "$root/releases/$first/.essay-release-known-good" && -f "$root/releases/$second/.essay-release-known-good" ]] || { echo "drill releases must be retained known-good releases" >&2; exit 3; }
    requested_sha="$other"
    if ! "$script_dir/rollback-release.sh" "$other" "$config"; then
      health=failed
      if "$script_dir/rollback-release.sh" "$initial" "$config"; then rollback_outcome=transition_failed_restored; exit 5
      else rollback_outcome=transition_and_restoration_failed; exit 6; fi
    fi
    "$script_dir/rollback-release.sh" "$initial" "$config" || { health=failed; rollback_outcome=restoration_failed; exit 6; }
    health=passed; rollback_outcome=drill_verified_and_restored; result=success; phase=complete
    ;;
esac
