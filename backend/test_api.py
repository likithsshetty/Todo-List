import os
import json
import unittest
from unittest.mock import patch, MagicMock
from bson import ObjectId
import bcrypt
import jwt

# Set dummy environment variables before importing anything
os.environ["MONGO_URI"] = "mongodb://localhost:27017/dummy"
os.environ["JWT_SECRET"] = "testsecretkey123"
os.environ["FLASK_DEBUG"] = "False"

from app import app

class BackendAPITestCase(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True
        self.jwt_secret = "testsecretkey123"

    def get_auth_headers(self, user_id, role="user"):
        import datetime
        expiration = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1)
        token = jwt.encode(
            {"user_id": str(user_id), "exp": expiration},
            self.jwt_secret,
            algorithm="HS256"
        )
        return {"Authorization": f"Bearer {token}"}

    @patch("routes.auth.users_collection")
    def test_register_first_user_is_admin(self, mock_users):
        mock_users.find_one.return_value = None
        mock_users.count_documents.return_value = 0
        mock_users.insert_one.return_value = MagicMock(inserted_id=ObjectId("60d5ecb5b487c8172c3d5e3f"))

        payload = {
            "username": "admin_user",
            "email": "admin@example.com",
            "password": "password123"
        }
        response = self.app.post("/api/auth/register",
                                 data=json.dumps(payload),
                                 content_type="application/json")
        
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data.decode())
        self.assertIn("token", data)
        self.assertTrue(data["user"]["is_admin"])
        self.assertEqual(data["user"]["username"], "admin_user")

    @patch("routes.auth.users_collection")
    def test_register_subsequent_user_is_regular(self, mock_users):
        mock_users.find_one.return_value = None
        mock_users.count_documents.return_value = 1
        mock_users.insert_one.return_value = MagicMock(inserted_id=ObjectId("60d5ecb5b487c8172c3d5e4a"))

        payload = {
            "username": "regular_user",
            "email": "user@example.com",
            "password": "password123"
        }
        response = self.app.post("/api/auth/register",
                                 data=json.dumps(payload),
                                 content_type="application/json")
        
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data.decode())
        self.assertFalse(data["user"]["is_admin"])

    @patch("routes.auth.users_collection")
    def test_login_success(self, mock_users):
        hashed = bcrypt.hashpw("password123".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        mock_users.find_one.return_value = {
            "_id": ObjectId("60d5ecb5b487c8172c3d5e3f"),
            "username": "test_user",
            "email": "test@example.com",
            "password_hash": hashed,
            "is_admin": False
        }

        payload = {
            "email": "test@example.com",
            "password": "password123"
        }
        response = self.app.post("/api/auth/login",
                                 data=json.dumps(payload),
                                 content_type="application/json")
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data.decode())
        self.assertIn("token", data)
        self.assertEqual(data["user"]["username"], "test_user")

    @patch("routes.auth.users_collection")
    def test_login_invalid_password(self, mock_users):
        hashed = bcrypt.hashpw("password123".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        mock_users.find_one.return_value = {
            "_id": ObjectId("60d5ecb5b487c8172c3d5e3f"),
            "username": "test_user",
            "email": "test@example.com",
            "password_hash": hashed,
            "is_admin": False
        }

        payload = {
            "email": "test@example.com",
            "password": "wrongpassword"
        }
        response = self.app.post("/api/auth/login",
                                 data=json.dumps(payload),
                                 content_type="application/json")
        
        self.assertEqual(response.status_code, 401)

    @patch("middleware.users_collection")
    @patch("routes.todos.todos_collection")
    def test_get_todos_requires_auth(self, mock_todos, mock_users):
        user_id = ObjectId("60d5ecb5b487c8172c3d5e3f")
        mock_users.find_one.return_value = {
            "_id": user_id,
            "username": "test_user",
            "email": "test@example.com",
            "is_admin": False
        }
        mock_todos.find.return_value.sort.return_value = [
            {
                "_id": ObjectId("60d5ecb5b487c8172c3d5e4b"),
                "user_id": user_id,
                "title": "Test Todo 1",
                "completed": False,
                "created_at": None,
                "updated_at": None
            }
        ]

        headers = self.get_auth_headers(user_id)
        response = self.app.get("/api/todos", headers=headers)
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data.decode())
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["title"], "Test Todo 1")

    @patch("middleware.users_collection")
    @patch("routes.admin.users_collection")
    @patch("routes.admin.todos_collection")
    def test_admin_route_forbidden_for_user(self, mock_admin_todos, mock_admin_users, mock_users):
        user_id = ObjectId("60d5ecb5b487c8172c3d5e3f")
        # Middleware user fetch
        mock_users.find_one.return_value = {
            "_id": user_id,
            "username": "regular_user",
            "email": "user@example.com",
            "is_admin": False # Regular user!
        }

        headers = self.get_auth_headers(user_id, role="user")
        response = self.app.get("/api/admin/users", headers=headers)
        self.assertEqual(response.status_code, 403)

if __name__ == "__main__":
    unittest.main()
