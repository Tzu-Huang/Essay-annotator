import os
import unittest
from unittest.mock import patch

from app.main import app, cors_allowed_origins


class ApiRouteContractTests(unittest.TestCase):
    def test_public_routes_use_api_namespace_without_legacy_aliases(self):
        routes = list(app.routes)
        for route in app.routes:
            original_router = getattr(route, "original_router", None)
            if original_router is not None:
                routes.extend(original_router.routes)
        paths = {
            path
            for route in routes
            if (path := getattr(route, "path", None)) is not None
        }
        expected = {
            "/api",
            "/api/health",
            "/api/ready",
            "/api/users",
            "/api/essays/{essay_id}",
            "/api/search",
            "/api/compare/{essay_id}",
            "/api/admin/me",
            "/api/admin/reload-data",
        }
        self.assertTrue(expected.issubset(paths))

        legacy_paths = {
            "/",
            "/health",
            "/ready",
            "/essays/{essay_id}",
            "/search",
            "/compare/{essay_id}",
            "/admin/me",
            "/admin/reload-data",
        }
        self.assertTrue(legacy_paths.isdisjoint(paths))

    def test_cors_has_explicit_development_origins(self):
        with patch.dict(os.environ, {}, clear=True):
            origins = cors_allowed_origins()
        self.assertIn("http://localhost:5173", origins)
        self.assertIn("http://127.0.0.1:5173", origins)
        self.assertNotIn("http://44.201.62.0:8000", origins)

    def test_cors_adds_approved_https_production_origin(self):
        with patch.dict(
            os.environ,
            {"PRODUCTION_ORIGIN": "https://essays.example.com/"},
            clear=True,
        ):
            origins = cors_allowed_origins()
        self.assertIn("https://essays.example.com", origins)

    def test_cors_rejects_non_https_production_origin(self):
        with patch.dict(
            os.environ,
            {"PRODUCTION_ORIGIN": "http://essays.example.com"},
            clear=True,
        ):
            with self.assertRaisesRegex(ValueError, "must use https"):
                cors_allowed_origins()


if __name__ == "__main__":
    unittest.main()
