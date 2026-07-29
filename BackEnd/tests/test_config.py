import unittest

from app.config import (
    ConfigurationError,
    DEVELOPMENT_CORS_ORIGINS,
    load_settings,
)


class RuntimeConfigurationTests(unittest.TestCase):
    def test_development_defaults_are_local_and_safe(self):
        settings = load_settings({})

        self.assertEqual(settings.environment, "development")
        self.assertEqual(settings.cors_origins, DEVELOPMENT_CORS_ORIGINS)

    def test_production_reports_all_missing_required_names(self):
        with self.assertRaises(ConfigurationError) as context:
            load_settings({"APP_ENV": "production"})

        message = str(context.exception)
        for name in ("POSTGRES_URL", "OPENAI_API_KEY", "GOOGLE_CLIENT_ID", "ADMIN_EMAILS"):
            self.assertIn(name, message)
        self.assertNotIn("password", message.lower())

    def test_production_defaults_to_no_cross_origin_allowance(self):
        settings = load_settings(
            {
                "APP_ENV": "production",
                "POSTGRES_URL": "postgresql://configured",
                "OPENAI_API_KEY": "configured",
                "GOOGLE_CLIENT_ID": "configured",
                "ADMIN_EMAILS": "owner@example.com",
            }
        )

        self.assertEqual(settings.cors_origins, ())

    def test_explicit_origins_are_normalized_and_deduplicated(self):
        settings = load_settings(
            {
                "APP_ENV": "test",
                "CORS_ORIGINS": "https://app.example.com/, https://admin.example.com,https://app.example.com",
            }
        )

        self.assertEqual(
            settings.cors_origins,
            ("https://app.example.com", "https://admin.example.com"),
        )

    def test_production_rejects_wildcard_origin(self):
        with self.assertRaisesRegex(ConfigurationError, "cannot contain"):
            load_settings(
                {
                    "APP_ENV": "production",
                    "POSTGRES_URL": "configured",
                    "OPENAI_API_KEY": "configured",
                    "GOOGLE_CLIENT_ID": "configured",
                    "ADMIN_EMAILS": "configured",
                    "CORS_ORIGINS": "*",
                }
            )


if __name__ == "__main__":
    unittest.main()
