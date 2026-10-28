import unittest
from datetime import datetime
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.admin import AdminActor, require_admin, router
from database.create import Base, User, get_db


class AdminUsersTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
        Base.metadata.create_all(self.engine)
        self.db = sessionmaker(bind=self.engine)()
        self.db.add_all([
            User(id="a", name="Alice", email="alice@example.com", last_login=datetime(2026, 10, 20)),
            User(id="b", name="Bob", email="bob@example.com", last_login=datetime(2026, 10, 21)),
            User(id="c", name="100% User", email="percent@example.com", last_login=datetime(2026, 10, 19)),
        ])
        self.db.commit()
        self.app = FastAPI()
        self.app.include_router(router)
        self.app.dependency_overrides[get_db] = lambda: self.db
        self.app.dependency_overrides[require_admin] = lambda: AdminActor(email="admin@example.com", can_write=False)
        self.client = TestClient(self.app)

    def tearDown(self):
        self.client.close()
        self.db.close()
        self.engine.dispose()

    def test_read_only_admin_pagination_and_fields(self):
        response = self.client.get("/api/admin/users?page_size=1&page=2")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["total"], 3)
        self.assertEqual(data["items"][0]["name"], "Alice")
        self.assertEqual(set(data["items"][0]), {"id", "name", "email", "created_at", "login_count", "last_login"})

    def test_search_case_insensitive_and_literal_wildcards(self):
        for term, expected in [("ALICE@", "Alice"), ("bob", "Bob"), ("%", "100% User")]:
            data = self.client.get("/api/admin/users", params={"search": term}).json()
            self.assertEqual(data["total"], 1)
            self.assertEqual(data["items"][0]["name"], expected)
        self.assertEqual(self.client.get("/api/admin/users?search=nobody").json()["items"], [])

    def test_validation(self):
        for params in ({"page": 0}, {"page_size": 101}, {"search": "x" * 201}):
            self.assertEqual(self.client.get("/api/admin/users", params=params).status_code, 422)

    def test_auth_required_and_non_admin_denied(self):
        del self.app.dependency_overrides[require_admin]
        self.assertEqual(self.client.get("/api/admin/users").status_code, 401)
        with patch("app.admin._verified_google_email", return_value="outsider@example.com"), patch("app.admin.admin_emails", return_value={"admin@example.com"}):
            self.assertEqual(self.client.get("/api/admin/users", headers={"Authorization": "Bearer test"}).status_code, 403)
