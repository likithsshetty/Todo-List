import datetime
import os
import jwt
import bcrypt
from flask import Blueprint, request, jsonify, g
from bson import ObjectId
from db import users_collection, todos_collection
from middleware import token_required

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not email or not password:
        return jsonify({"message": "Username, email, and password are required!"}), 400

    # Clean strings
    username = username.strip()
    email = email.strip().lower()

    # Check if user already exists
    if users_collection.find_one({"email": email}):
        return jsonify({"message": "User with this email already exists!"}), 400
    if users_collection.find_one({"username": username}):
        return jsonify({"message": "User with this username already exists!"}), 400

    # Hash password
    salt = bcrypt.gensalt()
    password_hash = bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

    # Set is_admin. First user registered is an admin, others are regular users.
    user_count = users_collection.count_documents({})
    is_admin = True if user_count == 0 else False

    new_user = {
        "username": username,
        "email": email,
        "password_hash": password_hash,
        "is_admin": is_admin,
        "created_at": datetime.datetime.now(datetime.timezone.utc)
    }

    result = users_collection.insert_one(new_user)
    
    # Generate token immediately after registration
    jwt_secret = os.getenv("JWT_SECRET")
    expiration = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)
    token = jwt.encode(
        {"user_id": str(result.inserted_id), "exp": expiration},
        jwt_secret,
        algorithm="HS256"
    )

    return jsonify({
        "message": "User registered successfully!",
        "token": token,
        "user": {
            "id": str(result.inserted_id),
            "username": username,
            "email": email,
            "is_admin": is_admin
        }
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Email and password are required!"}), 400

    email = email.strip().lower()
    user = users_collection.find_one({"email": email})

    if not user:
        return jsonify({"message": "Invalid email or password!"}), 401

    # Verify password
    if not bcrypt.checkpw(password.encode("utf-8"), user["password_hash"].encode("utf-8")):
        return jsonify({"message": "Invalid email or password!"}), 401

    # Generate JWT token
    jwt_secret = os.getenv("JWT_SECRET")
    expiration = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)
    token = jwt.encode(
        {"user_id": str(user["_id"]), "exp": expiration},
        jwt_secret,
        algorithm="HS256"
    )

    return jsonify({
        "message": "Logged in successfully!",
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "username": user["username"],
            "email": user["email"],
            "is_admin": user.get("is_admin", False)
        }
    }), 200


@auth_bp.route("/me", methods=["GET"])
@token_required
def me():
    # g.user is set by token_required middleware
    return jsonify({"user": g.user}), 200


@auth_bp.route("/delete-account", methods=["DELETE"])
@token_required
def delete_account():
    user_id = g.user["_id"]
    
    # 1. Delete all todos for this user
    todos_collection.delete_many({"user_id": ObjectId(user_id)})
    
    # 2. Delete user
    result = users_collection.delete_one({"_id": ObjectId(user_id)})
    
    if result.deleted_count == 0:
        return jsonify({"message": "Could not delete user account."}), 500
        
    return jsonify({"message": "Account and all associated todos have been deleted successfully."}), 200
