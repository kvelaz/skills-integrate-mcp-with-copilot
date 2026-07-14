import unittest
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from app import app
from fastapi.testclient import TestClient


class AdminModeTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_login_accepts_registered_teacher(self):
        response = self.client.post(
            "/auth/login",
            json={"username": "teacher", "password": "password"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["authenticated"])

    def test_signup_requires_admin_auth(self):
        response = self.client.post(
            "/activities/Chess%20Club/signup?email=student@example.com"
        )
        self.assertEqual(response.status_code, 401)

    def test_admin_can_signup_when_authenticated(self):
        login_response = self.client.post(
            "/auth/login",
            json={"username": "teacher", "password": "password"},
        )
        self.assertEqual(login_response.status_code, 200)

        response = self.client.post(
            "/activities/Chess%20Club/signup?email=student@example.com",
            headers={"X-Admin-Username": "teacher", "X-Admin-Password": "password"},
        )
        self.assertEqual(response.status_code, 200)


if __name__ == "__main__":
    unittest.main()
