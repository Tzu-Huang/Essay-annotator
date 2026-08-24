import importlib.util
import json
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[2] / "deploy" / "scripts" / "sync-production-secrets.py"
POLICY = SCRIPT.parents[1] / "iam" / "read-production-secrets.json"
REFRESH_SCRIPT = SCRIPT.with_name("refresh-production-secrets.sh")
INSTALL_SCRIPT = SCRIPT.with_name("install-host.sh")
SYSTEMD = SCRIPT.parents[1] / "systemd"
SPEC = importlib.util.spec_from_file_location("sync_production_secrets", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(MODULE)


class SyncProductionSecretsTests(unittest.TestCase):
    def test_periodic_refresh_is_installed_and_serialized_with_deployments(self):
        refresh = REFRESH_SCRIPT.read_text(encoding="utf-8")
        install = INSTALL_SCRIPT.read_text(encoding="utf-8")
        timer = (SYSTEMD / "essay-secrets-refresh.timer").read_text(encoding="utf-8")

        self.assertIn('flock -n 9', refresh)
        self.assertIn('sync-production-secrets.py', refresh)
        self.assertIn('if [[ "$before" == "$after" ]]', refresh)
        self.assertIn('systemctl restart essay-api', refresh)
        self.assertIn('/api/ready', refresh)
        self.assertIn('essay-annotator-refresh-secrets', install)
        self.assertIn('systemctl enable --now essay-secrets-refresh.timer', install)
        self.assertIn('OnUnitActiveSec=1h', timer)

    def test_iam_policy_covers_both_required_production_secrets(self):
        policy = json.loads(POLICY.read_text(encoding="utf-8"))
        statement = policy["Statement"][0]
        resources = set(statement["Resource"])

        self.assertIn("secretsmanager:DescribeSecret", statement["Action"])
        self.assertIn("secretsmanager:GetSecretValue", statement["Action"])
        self.assertTrue(any(":secret:essay-annotator/production/openai-api-key-" in arn for arn in resources))
        self.assertTrue(any(":secret:rds!db-aedefd5c-dc92-4450-8aac-8869769ddc82-" in arn for arn in resources))

    def test_replaces_existing_values_without_exposing_old_values(self):
        lines, values = MODULE.parse_env("OPENAI_API_KEY=old\nPOSTGRES_URL=postgresql://old@host/db\nKEEP=yes\n")
        rendered = MODULE.replace_env_values(
            lines,
            {"OPENAI_API_KEY": "new-key", "POSTGRES_URL": "postgresql://new@host/db"},
        )
        self.assertEqual(values["KEEP"], "yes")
        self.assertIn("OPENAI_API_KEY=new-key", rendered)
        self.assertIn("POSTGRES_URL=postgresql://new@host/db", rendered)
        self.assertIn("KEEP=yes", rendered)
        self.assertNotIn("old", rendered)

    def test_sync_avoids_rewriting_unchanged_credentials(self):
        source = SCRIPT.read_text(encoding="utf-8")
        self.assertIn('if any(current[key] != value for key, value in replacements.items())', source)
        self.assertIn('if current["OPENAI_API_KEY"] != openai_key', source)

    def test_builds_encoded_postgres_url_and_preserves_database_and_query(self):
        result = MODULE.build_postgres_url(
            "postgresql://old:old@old-host:5432/essays?sslmode=require",
            {"username": "essayadmin", "password": "p@ss/word", "host": "db.example", "port": 5432},
        )
        self.assertEqual(
            result,
            "postgresql://essayadmin:p%40ss%2Fword@db.example:5432/essays?sslmode=require",
        )

    def test_rejects_incomplete_rds_secret(self):
        with self.assertRaisesRegex(ValueError, "password"):
            MODULE.build_postgres_url(
                "postgresql://old:old@old-host:5432/essays",
                {"username": "essayadmin", "host": "db.example", "port": 5432},
            )

    def test_preserves_current_host_and_port_for_rds_managed_secret(self):
        result = MODULE.build_postgres_url(
            "postgresql://old:old@db.example:5433/essays",
            {"username": "essayadmin", "password": "new-password"},
        )
        self.assertEqual(result, "postgresql://essayadmin:new-password@db.example:5433/essays")


if __name__ == "__main__":
    unittest.main()
