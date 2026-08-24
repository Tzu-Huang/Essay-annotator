from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[2]
WORKFLOW = (ROOT / ".github/workflows/production-release.yml").read_text(encoding="utf-8")
SELECTOR = (ROOT / ".github/scripts/select-production-sha.sh").read_text(encoding="utf-8")
SMOKE = (ROOT / ".github/scripts/smoke-production.sh").read_text(encoding="utf-8")


class ProductionDeploymentWorkflowTests(unittest.TestCase):
    def test_manual_selection_is_main_only_and_exact(self):
        self.assertIn("git merge-base --is-ancestor", SELECTOR)
        self.assertIn("^[0-9a-f]{40}$", SELECTOR)
        self.assertIn("ref: ${{ needs.select.outputs.sha }}", WORKFLOW)
        self.assertIn("essay-annotator-${RELEASE_SHA}.tgz.sha256", WORKFLOW)

    def test_production_is_approved_oidc_and_serialized(self):
        self.assertIn("environment: production", WORKFLOW)
        self.assertIn("id-token: write", WORKFLOW)
        self.assertIn("aws-actions/configure-aws-credentials", WORKFLOW)
        self.assertIn("group: essay-annotator-production", WORKFLOW)
        self.assertIn("cancel-in-progress: false", WORKFLOW)

    def test_exact_release_runs_frontend_and_backend_quality_gates(self):
        self.assertIn("npm run lint", WORKFLOW)
        self.assertIn("npm test", WORKFLOW)
        self.assertIn("npm run build", WORKFLOW)
        self.assertIn("python -m pip install -r requirements.lock.txt", WORKFLOW)
        self.assertIn("python -m unittest discover -s tests -v", WORKFLOW)
        self.assertIn("from app.main import app", WORKFLOW)
        self.assertIn("test_startup_readiness.py", WORKFLOW)

    def test_artifact_excludes_generated_python_cache_from_deploy_tree(self):
        self.assertIn(
            "rsync -a --exclude='__pycache__/' --exclude='*.pyc' deploy/ \"$stage/deploy/\"",
            WORKFLOW,
        )
        self.assertNotIn('cp -a deploy "$stage/deploy"', WORKFLOW)

    def test_transport_is_immutable_and_uses_ssm(self):
        self.assertIn('key="${RELEASE_PREFIX%/}/${RELEASE_SHA}/', WORKFLOW)
        self.assertIn("aws s3api put-object", WORKFLOW)
        self.assertIn("--if-none-match '*'", WORKFLOW)
        self.assertIn("aws ssm send-command", WORKFLOW)
        self.assertIn("PRODUCTION_SSM_DOCUMENT_NAME", WORKFLOW)
        self.assertIn('--document-name "$SSM_DOCUMENT_NAME"', WORKFLOW)
        self.assertNotIn("AWS-RunShellScript", WORKFLOW)
        self.assertNotIn("presign", WORKFLOW.lower())
        self.assertNotIn("ssh ", WORKFLOW.lower())

    def test_immutable_artifact_retry_reuses_only_a_complete_verified_pair(self):
        self.assertIn("id: published", WORKFLOW)
        self.assertGreaterEqual(WORKFLOW.count("aws s3api head-object"), 2)
        self.assertIn("immutable release is partially published", WORKFLOW)
        self.assertIn("aws s3 cp \"s3://${RELEASE_BUCKET}/${key}.sha256\"", WORKFLOW)
        self.assertIn("aws s3 cp \"s3://${RELEASE_BUCKET}/${key}\" existing.tgz", WORKFLOW)
        self.assertIn("sha256sum --check --status", WORKFLOW)
        self.assertIn("steps.published.outputs.value", WORKFLOW)

    def test_metadata_and_rollback_are_propagated(self):
        for parameter in ("Operation", "CommitSha", "ArtifactDigest", "ReleaseBucket", "ReleaseKey", "DeploymentId", "Actor", "Trigger"):
            self.assertIn(parameter, WORKFLOW)
        self.assertIn("TargetSha", WORKFLOW)
        self.assertIn("Reason", WORKFLOW)
        self.assertIn("public_health_failed", WORKFLOW)

    def test_public_checks_are_https_and_bounded(self):
        self.assertIn("https://", SMOKE)
        self.assertIn("--connect-timeout", SMOKE)
        self.assertIn("--max-time", SMOKE)
        self.assertIn("probe /api/ready", SMOKE)
        self.assertIn("GITHUB_STEP_SUMMARY", WORKFLOW)

    def test_workflow_does_not_emit_ssm_output_or_signed_urls(self):
        self.assertNotIn("StandardOutputContent", WORKFLOW)
        self.assertNotIn("StandardErrorContent", WORKFLOW)


if __name__ == "__main__":
    unittest.main()
