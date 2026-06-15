import jwt
import os
from functools import wraps
from flask import request, jsonify, g
from bson import ObjectId
from db import users_collection

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # Check Authorization header
        if "Authorization" in request.headers:
            auth_header = request.headers["Authorization"]
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({"message": "Token is missing!"}), 401
        
        try:
            # Decode the token
            jwt_secret = os.getenv("JWT_SECRET")
            if not jwt_secret:
                raise ValueError("JWT_SECRET is not set in environment variables")
                
            data = jwt.decode(token, jwt_secret, algorithms=["HS256"])
            
            # Fetch user from db
            user = users_collection.find_one({"_id": ObjectId(data["user_id"])})
            if not user:
                return jsonify({"message": "User not found or deleted!"}), 401
            
            # Save user details to Flask request-global variable `g`
            user["_id"] = str(user["_id"])
            if "password_hash" in user:
                del user["password_hash"]
            g.user = user
            
        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Token has expired!"}), 401
        except Exception as e:
            return jsonify({"message": "Token is invalid!", "error": str(e)}), 401
            
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        if getattr(g, "user", None) is None:
            return jsonify({"message": "Authentication required!"}), 401
        if not g.user.get("is_admin", False):
            return jsonify({"message": "Admin privileges required!"}), 403
        return f(*args, **kwargs)
    return decorated
