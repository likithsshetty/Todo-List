import datetime
from flask import Blueprint, request, jsonify, g
from bson import ObjectId
from db import todos_collection
from middleware import token_required

todos_bp = Blueprint("todos", __name__)

def serialize_todo(todo):
    todo["id"] = str(todo["_id"])
    del todo["_id"]
    todo["user_id"] = str(todo["user_id"])
    return todo

@todos_bp.route("", methods=["GET"])
@token_required
def get_todos():
    user_id = g.user["_id"]
    todos_cursor = todos_collection.find({"user_id": ObjectId(user_id)}).sort("created_at", -1)
    todos = [serialize_todo(todo) for todo in todos_cursor]
    return jsonify(todos), 200

@todos_bp.route("", methods=["POST"])
@token_required
def create_todo():
    user_id = g.user["_id"]
    data = request.get_json() or {}
    title = data.get("title")

    if not title or not isinstance(title, str) or not title.strip():
        return jsonify({"message": "Todo title is required and cannot be empty!"}), 400

    new_todo = {
        "user_id": ObjectId(user_id),
        "title": title.strip(),
        "completed": bool(data.get("completed", False)),
        "created_at": datetime.datetime.now(datetime.timezone.utc),
        "updated_at": datetime.datetime.now(datetime.timezone.utc)
    }

    result = todos_collection.insert_one(new_todo)
    new_todo["_id"] = result.inserted_id

    return jsonify(serialize_todo(new_todo)), 201

@todos_bp.route("/<todo_id>", methods=["PUT"])
@token_required
def update_todo(todo_id):
    user_id = g.user["_id"]
    data = request.get_json() or {}

    try:
        todo_oid = ObjectId(todo_id)
    except Exception:
        return jsonify({"message": "Invalid todo ID format!"}), 400

    todo = todos_collection.find_one({"_id": todo_oid})
    if not todo:
        return jsonify({"message": "Todo not found!"}), 404

    # Ensure user owns the todo
    if str(todo["user_id"]) != user_id:
        return jsonify({"message": "Access denied! You do not own this todo."}), 403

    update_fields = {}
    if "title" in data:
        title = data["title"]
        if not title or not isinstance(title, str) or not title.strip():
            return jsonify({"message": "Todo title cannot be empty!"}), 400
        update_fields["title"] = title.strip()

    if "completed" in data:
        update_fields["completed"] = bool(data["completed"])

    if not update_fields:
        return jsonify({"message": "No update fields provided."}), 400

    update_fields["updated_at"] = datetime.datetime.now(datetime.timezone.utc)

    todos_collection.update_one({"_id": todo_oid}, {"$set": update_fields})
    
    updated_todo = todos_collection.find_one({"_id": todo_oid})
    return jsonify(serialize_todo(updated_todo)), 200

@todos_bp.route("/<todo_id>", methods=["DELETE"])
@token_required
def delete_todo(todo_id):
    user_id = g.user["_id"]

    try:
        todo_oid = ObjectId(todo_id)
    except Exception:
        return jsonify({"message": "Invalid todo ID format!"}), 400

    todo = todos_collection.find_one({"_id": todo_oid})
    if not todo:
        return jsonify({"message": "Todo not found!"}), 404

    # Ensure user owns the todo
    if str(todo["user_id"]) != user_id:
        return jsonify({"message": "Access denied! You do not own this todo."}), 403

    todos_collection.delete_one({"_id": todo_oid})
    return jsonify({"message": "Todo deleted successfully!"}), 200
