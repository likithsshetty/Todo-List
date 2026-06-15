from flask import Blueprint, request, jsonify, g
from bson import ObjectId
from db import users_collection, todos_collection
from middleware import admin_required

admin_bp = Blueprint("admin", __name__)

@admin_bp.route("/users", methods=["GET"])
@admin_required
def list_users():
    users = []
    users_cursor = users_collection.find({}).sort("created_at", -1)
    
    for u in users_cursor:
        u_id = str(u["_id"])
        # Count todos for this user
        todo_count = todos_collection.count_documents({"user_id": ObjectId(u_id)})
        
        users.append({
            "id": u_id,
            "username": u.get("username"),
            "email": u.get("email"),
            "is_admin": u.get("is_admin", False),
            "created_at": u.get("created_at"),
            "todo_count": todo_count
        })
        
    return jsonify(users), 200

@admin_bp.route("/users/<user_id>", methods=["DELETE"])
@admin_required
def delete_user(user_id):
    current_admin_id = g.user["_id"]
    
    if current_admin_id == user_id:
        return jsonify({"message": "You cannot delete your own admin account!"}), 400

    try:
        user_oid = ObjectId(user_id)
    except Exception:
        return jsonify({"message": "Invalid user ID format!"}), 400

    user = users_collection.find_one({"_id": user_oid})
    if not user:
        return jsonify({"message": "User not found!"}), 404

    # 1. Delete all todos for this user
    todos_collection.delete_many({"user_id": user_oid})
    
    # 2. Delete the user
    users_collection.delete_one({"_id": user_oid})
    
    return jsonify({"message": f"User {user.get('username')} and all their todos have been deleted successfully."}), 200
