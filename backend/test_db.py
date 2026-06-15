import sys
from db import users_collection, todos_collection

print("Attempting to connect to MongoDB cluster...")
try:
    user_count = users_collection.count_documents({})
    todo_count = todos_collection.count_documents({})
    print("---------------------------------------------")
    print("SUCCESS: MongoDB Connection is fully active!")
    print(f"Total Users: {user_count}")
    print(f"Total Todos: {todo_count}")
    print("---------------------------------------------")
except Exception as e:
    print("---------------------------------------------")
    print(f"ERROR: Failed to connect to MongoDB: {e}")
    print("---------------------------------------------")
    sys.exit(1)
sys.exit(0)
