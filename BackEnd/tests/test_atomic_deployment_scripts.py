import json
import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = ROOT / "deploy" / "scripts"
BASH = shutil.which("bash")
HOST_TOOLS_AVAILABLE = os.name != "nt" and BASH is not None and shutil.which("flock") is not None


def run(script: str, *args: str, env=None):
    merged = os.environ.copy()
    if env:
        merged.update(env)
    return subprocess.run(
        [BASH, str(SCRIPTS / script), *args],
        text=True,
        capture_output=True,
        env=merged,
    )


def host_env(tmp_path: Path):
    root = tmp_path / "opt"
    config = tmp_path / "deploy.conf"
    config.write_text("READINESS_PATH=/configured-ready\nREADINESS_ATTEMPTS=1\nREADINESS_DELAY_SECONDS=0\n", encoding="utf-8")
    audit = tmp_path / "audit.jsonl"
    return {
        "ESSAY_DEPLOY_ALLOW_NON_ROOT": "1",
        "ESSAY_DEPLOY_ROOT": str(root),
        "ESSAY_DEPLOY_CONFIG": str(config),
        "ESSAY_DEPLOY_LOCK": str(tmp_path / "deploy.lock"),
        "ESSAY_DEPLOY_AUDIT": str(audit),
        "ESSAY_DEPLOY_STATE_DIR": str(tmp_path / "state"),
    }, root, audit


def fake_commands(tmp_path: Path, curl_exit=0):
    bindir = tmp_path / "bin"
    bindir.mkdir()
    for name, body in {
        "systemctl": "exit 0",
        "curl": f'printf "%s\\n" "$*" >>"$CURL_LOG"; exit {curl_exit}',
    }.items():
        path = bindir / name
        path.write_text(f"#!/usr/bin/env bash\n{body}\n", encoding="utf-8")
        path.chmod(0o755)
    return bindir


def complete_release(root: Path, sha: str, known_good=True):
    release = root / "releases" / sha
    release.mkdir(parents=True)
    (release / ".essay-release-complete").write_text("0" * 64, encoding="ascii")
    if known_good:
        (release / ".essay-release-known-good").touch()
    return release


def metadata():
    return ["--deployment-id", "run-123", "--actor", "ci-user", "--trigger", "workflow_dispatch"]


class DeploymentScriptContractTests(unittest.TestCase):
    def test_preparation_has_checksum_cleanup_and_idempotency(self):
        source = (SCRIPTS / "activate-release.sh").read_text(encoding="utf-8")
        self.assertIn('actual_digest=$(sha256sum "$artifact"', source)
        self.assertIn('[[ "$actual_digest" == "$expected_digest" ]]', source)
        self.assertIn("trap cleanup_staging EXIT", source)
        self.assertIn('mv "$staging" "$release"', source)
        self.assertIn("preparation=idempotent", source)
        self.assertIn("inconsistent partial release", source)

    def test_deploy_digest_is_not_reset_after_parsing(self):
        source = (SCRIPTS / "deployctl.sh").read_text(encoding="utf-8")
        parsed = source.index("while [[ $# -gt 0 ]]")
        deploy = source.index('case "$action" in', parsed)
        self.assertNotIn('digest=""', source[parsed:deploy])

    def test_rollback_resolves_previous_sha_from_safe_deployment_state(self):
        source = (SCRIPTS / "deployctl.sh").read_text(encoding="utf-8")
        self.assertIn('state_file="$state_dir/$deployment_id.previous-sha"', source)
        self.assertIn('requested_sha=$(cat "$state_file")', source)
        self.assertIn('[[ "$deployment_id" =~ $valid_id', source)

    def test_public_failure_reason_is_constrained_and_audited(self):
        source = (SCRIPTS / "deployctl.sh").read_text(encoding="utf-8")
        self.assertIn('[[ -z "$reason" || "$reason" =~ $valid_id ]]', source)
        self.assertIn('"reason": reason or None', source)


@unittest.skipUnless(HOST_TOOLS_AVAILABLE, "Linux bash and flock are required")
class DeploymentScriptLinuxTests(unittest.TestCase):
    def setUp(self):
        self.tempdir = tempfile.TemporaryDirectory()
        self.tmp_path = Path(self.tempdir.name)

    def tearDown(self):
        self.tempdir.cleanup()

    def test_rejects_unsafe_identifier_before_state_change(self):
        env, root, _ = host_env(self.tmp_path)
        result = run("deployctl.sh", "rollback", "--sha", "../../etc", *metadata(), env=env)
        self.assertEqual(result.returncode, 64)
        self.assertFalse((root / "current").exists())

    def test_direct_activation_is_rejected_without_lock(self):
        result = run("activate-release.sh", "missing.tgz", "0" * 64)
        self.assertEqual(result.returncode, 64)
        self.assertIn("deployctl.sh", result.stderr)

    def test_lock_contention_does_not_switch_release(self):
        env, root, _ = host_env(self.tmp_path)
        lock = env["ESSAY_DEPLOY_LOCK"]
        holder = subprocess.Popen([BASH, "-c", f'exec 9>"{lock}"; flock 9; sleep 3'])
        try:
            result = run("deployctl.sh", "rollback", "--sha", "a" * 40, *metadata(), env=env)
            self.assertEqual(result.returncode, 75)
            self.assertFalse((root / "current").exists())
        finally:
            holder.terminate()
            holder.wait(timeout=2)

    def assert_rollback_outcome(self, curl_exit, expected, audit_outcome):
        env, root, audit = host_env(self.tmp_path)
        release = complete_release(root, "a" * 40)
        bindir = fake_commands(self.tmp_path, curl_exit)
        curl_log = self.tmp_path / "curl.log"
        env.update({"PATH": f"{bindir}{os.pathsep}{os.environ['PATH']}", "CURL_LOG": str(curl_log)})
        result = run("deployctl.sh", "rollback", "--sha", "a" * 40, *metadata(), env=env)
        self.assertEqual(result.returncode, expected, result.stderr)
        self.assertEqual(os.path.realpath(root / "current"), str(release))
        self.assertIn("/configured-ready", curl_log.read_text(encoding="utf-8"))
        record = json.loads(audit.read_text(encoding="utf-8").splitlines()[-1])
        self.assertEqual(record["rollback_outcome"], audit_outcome)
        self.assertEqual(record["actor"], "ci-user")
        self.assertNotIn("token", record)
        self.assertNotIn("secret", record)

    def test_successful_rollback(self):
        self.assert_rollback_outcome(0, 0, "verified")

    def test_rollback_resolves_saved_previous_release(self):
        env, root, audit = host_env(self.tmp_path)
        release = complete_release(root, "a" * 40)
        state_dir = Path(env["ESSAY_DEPLOY_STATE_DIR"])
        state_dir.mkdir()
        (state_dir / "run-123.previous-sha").write_text("a" * 40 + "\n", encoding="ascii")
        bindir = fake_commands(self.tmp_path)
        env.update({"PATH": f"{bindir}{os.pathsep}{os.environ['PATH']}", "CURL_LOG": str(self.tmp_path / "curl.log")})
        result = run("deployctl.sh", "rollback", *metadata(), "--reason", "public_health_failed", env=env)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(os.path.realpath(root / "current"), str(release))
        record = json.loads(audit.read_text(encoding="utf-8").splitlines()[-1])
        self.assertEqual(record["requested_sha"], "a" * 40)
        self.assertEqual(record["reason"], "public_health_failed")

    def test_failed_rollback(self):
        self.assert_rollback_outcome(22, 5, "verification_failed")

    def test_drill_requires_two_known_good_releases_without_switching(self):
        env, root, _ = host_env(self.tmp_path)
        initial = complete_release(root, "a" * 40)
        complete_release(root, "b" * 40, known_good=False)
        (root / "current").symlink_to(initial, target_is_directory=True)
        result = run("deployctl.sh", "rollback-drill", "--sha", "a" * 40,
                     "--target-sha", "b" * 40, *metadata(), env=env)
        self.assertEqual(result.returncode, 3)
        self.assertEqual(os.path.realpath(root / "current"), str(initial))

    def test_successful_drill_restores_initial_release(self):
        env, root, audit = host_env(self.tmp_path)
        initial = complete_release(root, "a" * 40)
        complete_release(root, "b" * 40)
        (root / "current").symlink_to(initial, target_is_directory=True)
        bindir = fake_commands(self.tmp_path)
        env.update({"PATH": f"{bindir}{os.pathsep}{os.environ['PATH']}", "CURL_LOG": str(self.tmp_path / "curl.log")})
        result = run("deployctl.sh", "rollback-drill", "--sha", "a" * 40,
                     "--target-sha", "b" * 40, *metadata(), env=env)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(os.path.realpath(root / "current"), str(initial))
        record = json.loads(audit.read_text(encoding="utf-8").splitlines()[-1])
        self.assertEqual(record["rollback_outcome"], "drill_verified_and_restored")


if __name__ == "__main__":
    unittest.main()
